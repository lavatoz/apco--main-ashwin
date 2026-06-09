import React, { useState } from 'react';
import { Command, Layout } from 'lucide-react';
import { setAuthUser } from '../utils/storage';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'Client' | 'Staff' | 'Admin'>('Client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickAccess, setShowQuickAccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Cinematic delay
    await new Promise(r => setTimeout(r, 800));

    try {
      const storedUsers = localStorage.getItem('users');
      const users: any[] = storedUsers ? JSON.parse(storedUsers) : [];
      
      console.log("Login Email", email);
      console.log("Selected Role", role);
      
      const foundUser = users.find(u => 
        (u.email.toLowerCase() === email.toLowerCase() || u.id.toLowerCase() === email.toLowerCase()) && 
        u.password === password && 
        u.role === role &&
        u.isActive !== false
      );

      console.log("Found User", foundUser);
      console.log("Stored Role", foundUser?.role);

      if (foundUser) {
        const sessionUser = {
          id: foundUser.id,
          email: foundUser.email,
          role: foundUser.role,
          permissions: foundUser.permissions || []
        };
        setAuthUser(sessionUser);
        onLogin(sessionUser);
      } else {
        setError('Invalid credentials or unauthorized role access.');
      }
    } catch {
      setError('System verification failure. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

        <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-1 md:p-2 shadow-2xl overflow-hidden shadow-black/80">
          {/* Role Selector */}
          <div className="bg-black/40 p-1.5 rounded-[2rem] border border-white/5 flex gap-1 mb-6 backdrop-blur-md">
            {(['Client', 'Staff', 'Admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`touch-target flex-1 py-2 md:py-3 rounded-[1.8rem] text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
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
                className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 md:p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-xs md:text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10"
              />
              <input
                required
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="touch-target w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 md:p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-xs md:text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm focus:ring-1 focus:ring-white/10"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-mono uppercase tracking-widest animate-pulse text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10 mb-4">
                {error}
              </p>
            )}

            <div className="pt-4 pb-4">
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
        </div>
        
        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest text-center">
            Authorized personnel only. Sessions are being monitored.
          </p>
          
          <button 
            type="button"
            onClick={() => setShowQuickAccess(!showQuickAccess)}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {showQuickAccess ? 'Close Quick Access' : 'Developer Quick Access'}
          </button>

          {showQuickAccess && (
            <div className="w-full max-w-2xl glass-panel-dark border border-white/10 rounded-[2.5rem] p-6 animate-ios-slide-up mt-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">User Registry Management</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const id = `staff_${Date.now()}`;
                      const name = `Staff ${id.slice(-4)}`;
                      const newUser = { id, name, email: `${id}@artisans.os`, password: 'staff', role: 'Staff', permissions: ['dashboard', 'tasks'], isActive: true };
                      const updated = [...(JSON.parse(localStorage.getItem('users') || '[]')), newUser];
                      localStorage.setItem('users', JSON.stringify(updated));
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-primary/20"
                  >
                    + Add Staff
                  </button>
                  <button 
                    onClick={() => {
                      const id = `client_${Date.now()}`;
                      const name = `Client ${id.slice(-4)}`;
                      const newUser = { id, name, email: `${id}@artisans.os`, password: 'client', role: 'Client', permissions: [], isActive: true };
                      const updated = [...(JSON.parse(localStorage.getItem('users') || '[]')), newUser];
                      localStorage.setItem('users', JSON.stringify(updated));
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-primary/20"
                  >
                    + Add Client
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {JSON.parse(localStorage.getItem('users') || '[]').map((u: any) => (
                  <div key={u.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                    <button 
                      onClick={() => {
                        const sessionUser = { id: u.id, email: u.email, name: u.name, role: u.role, permissions: u.permissions || [] };
                        setAuthUser(sessionUser);
                        onLogin(sessionUser);
                      }}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${u.role === 'Admin' ? 'bg-white text-black' : u.role === 'Staff' ? 'bg-primary/20 text-primary' : 'bg-primary/20 text-primary'}`}>
                        {u.name?.charAt(0) || u.email.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white uppercase">{u.name || 'Unnamed User'}</p>
                        <p className="text-[8px] font-mono text-zinc-500 uppercase">{u.role} • {u.email.split('@')[0]}</p>
                      </div>
                    </button>
                    {u.id !== 'admin_root' && (
                      <button 
                        onClick={() => {
                          if (confirm(`Remove ${u.name || u.email} from registry?`)) {
                            const updated = JSON.parse(localStorage.getItem('users') || '[]').filter((usr: any) => usr.id !== u.id);
                            localStorage.setItem('users', JSON.stringify(updated));
                            window.location.reload();
                          }
                        }}
                        className="p-2 text-zinc-800 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Layout className="w-3.5 h-3.5 rotate-45" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            type="button"
            onClick={() => {
              if (confirm('EMERGENCY PROTOCOL: This will clear local user data and reset the admin password to "admin". Continue?')) {
                localStorage.removeItem('users');
                window.location.reload();
              }
            }}
            className="text-xs font-mono text-zinc-800 hover:text-white uppercase tracking-[0.4em] transition-colors mt-8"
          >
            Reset Access Logic
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

