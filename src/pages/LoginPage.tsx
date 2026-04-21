import React, { useState } from 'react';
import { Command, Layout } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'Client' | 'Staff' | 'Admin'>('Client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Cinematic delay
    await new Promise(r => setTimeout(r, 800));

    try {
      const storedUsers = localStorage.getItem('users');
      const users: any[] = storedUsers ? JSON.parse(storedUsers) : [];
      
      const foundUser = users.find(u => 
        (u.email.toLowerCase() === email.toLowerCase() || u.id.toLowerCase() === email.toLowerCase()) && 
        u.password === password && 
        u.role === role &&
        u.isActive !== false
      );

      if (foundUser) {
        const sessionUser = {
          id: foundUser.id,
          email: foundUser.email,
          role: foundUser.role,
          permissions: foundUser.permissions || []
        };
        localStorage.setItem('auth_user', JSON.stringify(sessionUser));
        onLogin(sessionUser);
      } else {
        setError('Invalid credentials or unauthorized role access.');
      }
    } catch (err) {
      setError('System verification failure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 selection:bg-white selection:text-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-ios-slide-up relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white mx-auto squircle-sm flex items-center justify-center text-black mb-6 shadow-[0_0_50px_rgba(255,255,255,0.15)]">
            <Layout className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">Artisans<span className="text-zinc-600">OS</span></h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">v5.5 Secure Identity Protocol</p>
        </div>

        <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-2 shadow-2xl overflow-hidden shadow-black/80">
          {/* Role Selector */}
          <div className="bg-black/40 p-1.5 rounded-[2rem] border border-white/5 flex gap-1 mb-6 backdrop-blur-md">
            {(['Client', 'Staff', 'Admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${
                  role === r ? 'bg-white text-black shadow-lg scale-100' : 'text-zinc-500 hover:text-white hover:bg-white/5 scale-95'
                }`}
              >
                {r === 'Client' ? 'Client' : r === 'Staff' ? 'Staff' : 'Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth} className="px-6 py-4 space-y-4">
            <div className="space-y-4">
              <input
                required
                type="email"
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10"
              />
              <input
                required
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10"
              />
            </div>

            {error && (
              <p className="text-red-500 text-[9px] font-mono uppercase tracking-widest animate-pulse text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10 mb-4">
                {error}
              </p>
            )}

            <div className="pt-4 pb-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-xl text-[10px] uppercase tracking-[0.3em]"
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
        </div>
        
        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest text-center">
            Authorized personnel only. Sessions are being monitored.
          </p>
          <button 
            type="button"
            onClick={() => {
              if (confirm('EMERGENCY PROTOCOL: This will clear local user data and reset the admin password to "admin". Continue?')) {
                localStorage.removeItem('users');
                localStorage.removeItem('invites');
                window.location.reload();
              }
            }}
            className="text-[8px] font-mono text-zinc-800 hover:text-white uppercase tracking-[0.4em] transition-colors"
          >
            Reset Access Logic
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
