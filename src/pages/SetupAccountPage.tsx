import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Layout, 
  KeyRound, 
  CheckCircle, 
  ShieldAlert, 
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../services/api';
import { removeAuthUser } from '../utils/storage';

const SetupAccountPage: React.FC = () => {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State variables
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Force clear existing sessions for client safety
    removeAuthUser();

    // Check path parameter first, then fallback to search param '?token=...'
    const initialToken = routeToken || searchParams.get('token') || '';
    setToken(initialToken);

    // Check search param for email fallback
    const initialEmail = searchParams.get('email') || '';
    setEmail(initialEmail);
  }, [routeToken, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tokenToSubmit = routeToken || searchParams.get('token') || token;

    if (!tokenToSubmit.trim()) {
      setError('Activation token is required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    // Subtle cinematic delay for transition feel
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      await api.activateClient({
        token: tokenToSubmit.trim(),
        password,
        confirmPassword
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error('[ACTIVATION ERROR]', err);
      // Handle known/unknown states from backend
      setError(err.message || 'Activation failed. Please check the token or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4 selection:bg-white selection:text-black relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md animate-ios-slide-up relative z-10 text-center">
          <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/80 space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-wider text-white">Activation Complete</h2>
              <p className="text-xs text-zinc-400 font-mono">Your client profile has been securely activated.</p>
            </div>

            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="touch-target w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98]"
              >
                Go to Login
              </button>
              
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                ArtisansOS v5.5 Secure Protocol
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl overflow-hidden shadow-black/80">
          <div className="mb-6 text-center space-y-1">
            <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider">Activate Client Portal</h2>
            <p className="text-[10px] md:text-xs text-zinc-500 font-mono">Complete the security configuration for your brand space</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="ENTER YOUR EMAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3 md:py-3.5 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-xs md:text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10"
                />
              </div>

              {!routeToken && !searchParams.get('token') && (
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">Activation Token</label>
                  <input
                    required
                    type="text"
                    placeholder="ENTER SECURE TOKEN"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3 md:py-3.5 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-xs md:text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10"
                  />
                </div>
              )}

              <div>
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">New Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="CHOOSE A STRONG PASSWORD"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3 md:py-3.5 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-xs md:text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors animate-fade-in"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">Confirm Password</label>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="RE-ENTER PASSWORD"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3 md:py-3.5 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-xs md:text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-3 text-red-500 text-[10px] font-mono leading-relaxed items-center justify-center">
                <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse text-red-500" />
                <span className="uppercase tracking-wider text-center">{error}</span>
              </div>
            )}

            <div className="pt-4 space-y-3">
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
                    <KeyRound className="w-4 h-4" />
                    Activate Client
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="touch-target w-full bg-transparent text-zinc-500 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:text-white transition-all text-xs uppercase tracking-wider border border-white/5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest text-center">
            Authorized portal activation protocol. Sessions are monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupAccountPage;
