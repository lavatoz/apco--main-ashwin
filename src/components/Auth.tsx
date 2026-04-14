import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Command, RefreshCw } from 'lucide-react';

const Auth: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Cinematic loading effect
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // Safe parsing
      const storedUsers = localStorage.getItem('users');
      const users: any[] = storedUsers ? JSON.parse(storedUsers) : [];

      if (!Array.isArray(users)) {
        throw new Error("Invalid users structure in localStorage");
      }

      if (isRegistering) {
        // Register Logic
        const exists = users.find((u) => u.email === email);
        if (exists) {
          setError('User with this email already exists.');
        } else {
          const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            role: 'owner', // Default role
          };
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));
          
          // Auto-login after successful registration
          localStorage.setItem('auth_user', JSON.stringify(newUser));
          navigate('/dashboard');
        }
      } else {
        // Login Logic
        const user = users.find((u) => u.email === email && u.password === password);
        if (user) {
          localStorage.setItem('auth_user', JSON.stringify(user));
          navigate('/dashboard');
        } else {
          setError('Invalid login credentials.');
        }
      }
    } catch (err) {
      setError('An error occurred while verifying information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-white overflow-hidden animate-ios-slide-up">
      {/* Background Noise for Matte Effect */}
      <div className="absolute inset-0 bg-noise pointer-events-none z-0" />

      {onBack && (
        <button onClick={onBack} className="absolute top-6 left-6 p-3 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-white flex items-center gap-2 z-20 shadow-xl">
          <ArrowLeft className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Back to Website</span>
        </button>
      )}

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        {/* Brand Identity */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 mx-auto bg-white/90 backdrop-blur-md text-black squircle-sm flex items-center justify-center font-serif text-4xl font-black shadow-[0_0_50px_rgba(255,255,255,0.2)] mb-6 border border-white/20">A</div>
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] mb-2">Artisans<span className="text-zinc-600">OS</span></h1>
          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Enterprise Resource Planning v5.5</p>
        </div>

        {/* Matte Glass Login Panel */}
        <div className="w-full glass-panel rounded-[2.5rem] p-2 shadow-2xl overflow-hidden relative">
          
          {/* Mode Toggle inside the panel */}
          <div className="bg-black/40 p-1.5 rounded-[2rem] border border-white/5 flex gap-1 mb-8 backdrop-blur-md">
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setError(null); }}
              className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!isRegistering ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(true); setError(null); }}
              className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isRegistering ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div className="space-y-4 text-center">
              <p className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest mb-3">
                {isRegistering ? 'Create New Identity' : 'Identity Verification'}
              </p>
              
              {isRegistering && (
                <input
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm"
                  placeholder="FULL NAME"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              
              <input
                required
                type="email"
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm"
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <input
                required
                type="password"
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-xl text-[10px] uppercase tracking-[0.2em]"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />}
                {isRegistering ? 'Create Account' : 'Authenticate'}
              </button>
            </div>

            {/* Error Message rendering */}
            {error && (
               <p className="text-red-500 text-[9px] font-mono uppercase tracking-widest animate-pulse text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10 mt-4">
                 {error}
               </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
