import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Command, Layout, CheckCircle } from 'lucide-react';
import type { Invite, User } from '../types';

interface InvitePageProps {
  onLogin: (user: any) => void;
}

const InvitePage: React.FC<InvitePageProps> = ({ onLogin }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Clear existing session for security
    localStorage.removeItem('auth_user');
    
    const invites: Invite[] = JSON.parse(localStorage.getItem('invites') || '[]');
    const found = invites.find(i => i.token === token);
    if (!found) {
      setError('Invalid or expired invitation link.');
    } else {
      setInvite(found);
    }
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    try {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const invites: Invite[] = JSON.parse(localStorage.getItem('invites') || '[]');
      
      const newUser: User = {
        id: invite!.email.split('@')[0] + '_' + Date.now().toString().slice(-4),
        email: invite!.email,
        password,
        role: invite!.role,
        permissions: invite!.permissions,
        isActive: true,
        name: invite!.email.split('@')[0],
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      const remainingInvites = invites.filter(i => i.token !== token);

      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('invites', JSON.stringify(remainingInvites));
      
      // Auto-Login
      const sessionUser = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions || []
      };
      localStorage.setItem('auth_user', JSON.stringify(sessionUser));
      onLogin(sessionUser);

      setIsSuccess(true);
      
      // Role-based redirection
      setTimeout(() => {
        if (newUser.role === 'Admin') navigate('/dashboard');
        else if (newUser.role === 'Staff') navigate('/staff-dashboard');
        else navigate('/client-dashboard');
      }, 2000);
    } catch (err) {
      setError('Onboarding failed. Please contact admin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="animate-ios-slide-up space-y-6">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Identity Created</h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Redirecting to terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 selection:bg-white selection:text-black relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      
      <div className="w-full max-w-md animate-ios-slide-up relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white mx-auto squircle-sm flex items-center justify-center text-black mb-6">
            <Layout className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">Initialize Account</h1>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-2">
            Secure Onboarding Protocol
          </p>
        </div>

        {invite ? (
          <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <p className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Invited Identity</p>
              <p className="text-sm font-bold text-white uppercase">{invite.email}</p>
              <div className="flex gap-2 pt-2">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-400">
                  {invite.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <input
                required
                type="password"
                placeholder="SET PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 outline-none text-sm font-bold font-mono"
              />
              <input
                required
                type="password"
                placeholder="CONFIRM PASSWORD"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 outline-none text-sm font-bold font-mono"
              />

              {error && (
                <p className="text-red-500 text-xs font-mono uppercase tracking-widest animate-pulse text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-xl text-xs uppercase tracking-[0.3em]"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Command className="w-4 h-4" />}
                Complete Setup
              </button>
            </form>
          </div>
        ) : (
          <div className="glass-panel-dark border border-white/10 rounded-[2.5rem] p-12 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 text-xs font-mono uppercase tracking-widest">{error || 'Access Denied'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const XCircle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default InvitePage;
