import React, { useState } from 'react';
import { 
  Command, 
  Layout, 
  ShieldAlert, 
  KeyRound, 
  Mail, 
  QrCode, 
  Clipboard, 
  Download, 
  Check, 
  RefreshCw, 
  ArrowLeft, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { setAuthUser } from '../utils/storage';
import { api } from '../services/api';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

type ViewType = 'LOGIN' | 'EMAIL_VERIFICATION' | 'MFA_SETUP' | 'MFA_VERIFY' | 'MFA_BACKUP_CODES';

const mapBackendUserToFrontend = (backendUser: any) => {
  let mappedRole: 'Admin' | 'Staff' | 'Client' = 'Staff';
  let permissions: string[] = [];
  
  if (backendUser.role === 'SystemAdmin' || backendUser.role === 'Manager') {
    mappedRole = 'Admin';
    permissions = ['dashboard', 'clients', 'tasks', 'finance', 'ai', 'analytics', 'system', 'workflow', 'operations', 'files', 'gallery', 'invoices', 'agreements', 'messages', 'timeline', 'deliverables', 'support', 'events'];
  } else if (backendUser.role === 'Client') {
    mappedRole = 'Client';
    permissions = ['dashboard', 'timeline', 'workflow', 'deliverables', 'invoices', 'agreements', 'messages', 'support'];
  } else {
    mappedRole = 'Staff';
    permissions = ['dashboard', 'tasks', 'workflow', 'timeline', 'deliverables', 'support', 'events'];
  }

  return {
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.firstName && backendUser.lastName ? `${backendUser.firstName} ${backendUser.lastName}` : backendUser.email.split('@')[0],
    role: mappedRole,
    permissions
  };
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'Client' | 'Staff' | 'Admin'>('Client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced Auth Flow State
  const [view, setView] = useState<ViewType>('LOGIN');
  const [tempToken, setTempToken] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const resetFlow = () => {
    setView('LOGIN');
    setTempToken('');
    setQrCodeDataUrl('');
    setMfaSecret('');
    setMfaCode('');
    setBackupCodes([]);
    setError(null);
    setIsLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Cinematic delay
    await new Promise(r => setTimeout(r, 600));

    sessionStorage.setItem('active_role', role);

    try {
      // 1. Try Backend Authentication
      const res = await api.login(email, password);
      console.log("[AUTH] Backend login response:", res);

      if (res.mfaRequired) {
        setTempToken(res.tempToken);
        setView('MFA_VERIFY');
        setIsLoading(false);
        return;
      }

      const mappedUser = mapBackendUserToFrontend(res.user);
      if (mappedUser.role !== role) {
        setError('Invalid credentials or unauthorized role access.');
        setIsLoading(false);
        return;
      }

      setAuthUser(mappedUser);
      onLogin(mappedUser);
    } catch (backendErr: any) {
      console.error("[AUTH] Backend auth failed:", backendErr);
      const data = backendErr.data || {};

      if (data.emailNotVerified) {
        setView('EMAIL_VERIFICATION');
        setIsLoading(false);
        return;
      }

      if (data.mfaSetupRequired) {
        const token = data.tempToken || backendErr.tempToken;
        setTempToken(token);
        // Temporarily set credentials for setup endpoint authorization
        api.setAccessToken(token);
        setView('MFA_SETUP');
        
        try {
          const setupData = await api.setupMfa();
          setQrCodeDataUrl(setupData.qrCodeDataUrl);
          setMfaSecret(setupData.secret);
        } catch (setupErr: any) {
          console.error("[MFA SETUP] Initializing setup failed:", setupErr);
          setError(setupErr.message || 'Failed to initialize MFA setup.');
        }
        setIsLoading(false);
        return;
      }

      setError(backendErr.message || 'Invalid credentials or unauthorized role access.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.verifyMfaLogin(tempToken, mfaCode);
      const mappedUser = mapBackendUserToFrontend(res.user);
      if (mappedUser.role !== role) {
        setError('Invalid credentials or unauthorized role access.');
        setIsLoading(false);
        return;
      }
      setAuthUser(mappedUser);
      onLogin(mappedUser);
    } catch (err: any) {
      setError(err.message || 'MFA verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const enableRes = await api.enableMfa(mfaCode);
      setBackupCodes(enableRes.backupCodes || []);
      setView('MFA_BACKUP_CODES');
      setMfaCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to verify and enable MFA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError(null);
    try {
      await api.resendVerificationEmailPublic(email);
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const text = `APCO ENTERPRISE SECURITY SYSTEM\nGenerated: ${new Date().toLocaleString()}\nUser: ${email}\n\nRECOVERY BACKUP CODES:\n\n` + backupCodes.map((c, i) => `[Code ${i + 1}]  ${c}`).join('\n') + `\n\nStore these safely. Each backup code resolves a single locked state and is destroyed post-use.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apco_backup_codes_${email.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 selection:bg-white selection:text-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-ios-slide-up relative z-10">
        <div className="text-center mb-6 md:mb-10">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-white mx-auto squircle-sm flex items-center justify-center text-black mb-4 md:mb-6 shadow-[0_0_50px_rgba(255,255,255,0.15)]">
            <Layout className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <h1 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-white">Artisans<span className="text-zinc-600">OS</span></h1>
          <p className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1 md:mt-2">v5.5 Secure Identity Protocol</p>
        </div>

        <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-4 md:p-6 shadow-2xl overflow-hidden shadow-black/80">
          
          {view === 'LOGIN' && (
            <>
              {/* Role Selector */}
              <div className="bg-black/40 p-1.5 rounded-[2rem] border border-white/5 flex gap-1 mb-6 backdrop-blur-md">
                {(['Client', 'Staff', 'Admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`touch-target flex-1 py-2 md:py-3 rounded-[1.8rem] text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                      role === r ? 'bg-white text-black shadow-lg scale-100' : 'text-zinc-500 hover:text-white hover:bg-white/5 scale-95'
                    }`}
                  >
                    {r === 'Client' ? 'Client' : r === 'Staff' ? 'Staff' : 'Admin'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-4">
                  <input
                    required
                    type="email"
                    placeholder="EMAIL ADDRESS"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 md:p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-xs md:text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10"
                  />
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="PASSWORD"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 px-12 md:p-4 md:px-12 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-xs md:text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-mono uppercase tracking-widest animate-pulse text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10 mb-4">
                    {error}
                  </p>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="touch-target w-full bg-white text-black font-bold py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-xl text-[10px] md:text-xs uppercase tracking-[0.3em]"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
                      </div>
                    ) : (
                      <>
                        <Command className="w-4 h-4" />
                        Authenticate
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {view === 'EMAIL_VERIFICATION' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                <Mail className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Verification Required</h2>
                <p className="text-xs text-zinc-400 font-mono max-w-sm mx-auto">
                  Your email address <span className="text-white font-bold">{email}</span> is not verified. Please verify it before logging in.
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-xs font-mono uppercase tracking-widest text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10">
                  {error}
                </p>
              )}

              {resendSuccess && (
                <p className="text-emerald-500 text-xs font-mono uppercase tracking-widest text-center bg-emerald-500/5 py-2 rounded-lg border border-emerald-500/10">
                  A fresh verification link has been sent!
                </p>
              )}

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="touch-target w-full bg-white text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all text-xs uppercase tracking-wider"
                >
                  {resendLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetFlow}
                  className="touch-target w-full bg-transparent text-zinc-500 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:text-white transition-all text-xs uppercase tracking-wider border border-white/5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {view === 'MFA_SETUP' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-white mb-3">
                  <QrCode className="w-6 h-6" />
                </div>
                <h2 className="text-md font-bold text-white uppercase tracking-wider">MFA Configuration</h2>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">Multi-factor security registration is mandatory for Admins & Managers.</p>
              </div>

              {qrCodeDataUrl ? (
                <div className="flex flex-col items-center gap-4 bg-black/20 p-4 rounded-3xl border border-white/5">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Scan QR" 
                    className="w-40 h-40 rounded-2xl border-4 border-white shadow-xl"
                  />
                  <div className="w-full text-center space-y-1">
                    <p className="text-[9px] font-mono text-zinc-500 uppercase">Secret Configuration Code</p>
                    <div className="flex items-center justify-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                      <span className="font-mono text-xs text-zinc-300 select-all tracking-wider break-all">{mfaSecret}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(mfaSecret);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
              )}

              <form onSubmit={handleMfaEnable} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block text-center">Enter Verification TOTP Code</label>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder="0 0 0 0 0 0"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-base font-bold font-mono tracking-[0.5em] transition-all backdrop-blur-sm"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-mono uppercase tracking-widest text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10">
                    {error}
                  </p>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !mfaCode}
                    className="touch-target w-full bg-white text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all text-xs uppercase tracking-wider"
                  >
                    Verify & Enable MFA
                  </button>

                  <button
                    type="button"
                    onClick={resetFlow}
                    className="touch-target w-full bg-transparent text-zinc-500 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:text-white transition-all text-xs uppercase tracking-wider border border-white/5"
                  >
                    Cancel Setup
                  </button>
                </div>
              </form>
            </div>
          )}

          {view === 'MFA_BACKUP_CODES' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-md font-bold text-white uppercase tracking-wider">MFA Setup Succeeded</h2>
                <p className="text-[11px] text-zinc-400 font-mono">Backup codes allow system restoration if device access is lost.</p>
              </div>

              <div className="bg-black/40 p-4 rounded-3xl border border-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-xs py-2 bg-black/50 border border-white/5 rounded-xl text-zinc-300">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={copyBackupCodes}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold font-mono text-[9px] uppercase tracking-wider text-zinc-300 flex items-center justify-center gap-2"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Codes'}
                  </button>
                  <button
                    type="button"
                    onClick={downloadBackupCodes}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold font-mono text-[9px] uppercase tracking-wider text-zinc-300 flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download (.txt)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3 text-amber-500 text-[10px] font-mono leading-relaxed">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>WARNING: Keep backup codes secure. They are only shown once and cannot be re-retrieved.</span>
                </div>

                <button
                  type="button"
                  onClick={resetFlow}
                  className="touch-target w-full bg-white text-black font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all"
                >
                  Return & Login
                </button>
              </div>
            </div>
          )}

          {view === 'MFA_VERIFY' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-white mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-md font-bold text-white uppercase tracking-wider">Two-Factor Authentication</h2>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">Enter your authenticator OTP or a recovery backup code.</p>
              </div>

              <form onSubmit={handleMfaVerify} className="space-y-4">
                <input
                  required
                  type="text"
                  placeholder="Verification Code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-sm font-bold font-mono tracking-widest placeholder:tracking-normal transition-all backdrop-blur-sm"
                />

                {error && (
                  <p className="text-red-500 text-xs font-mono uppercase tracking-widest text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10">
                    {error}
                  </p>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !mfaCode}
                    className="touch-target w-full bg-white text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all text-xs uppercase tracking-wider"
                  >
                    Verify Code
                  </button>

                  <button
                    type="button"
                    onClick={resetFlow}
                    className="touch-target w-full bg-transparent text-zinc-500 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:text-white transition-all text-xs uppercase tracking-wider border border-white/5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest text-center">
            Authorized personnel only. Sessions are being monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
