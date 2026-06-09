import { useState, useEffect } from 'react';
import { getAuthUser } from '../utils/storage';
import UserAccessManager from '../components/UserAccessManager';

export default function TeamPage() {
  const [user, setUser] = useState<any>(null);
  const [debugData, setDebugData] = useState<string>('');

  useEffect(() => {
    const sessionUser = getAuthUser();
    console.log("Team Page Loaded - Auth Session:", sessionUser);
    
    if (sessionUser) {
      try {
        setUser(sessionUser);
        setDebugData(JSON.stringify(sessionUser));
      } catch (e) {
        console.error("Auth Parsing Error", e);
      }
    }
  }, []);

  // SAFE GUARD 1: No user session
  if (!user) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-6" />
        <h1 className="text-lg font-semibold text-white uppercase tracking-widest">Verifying Identity</h1>
        <p className="text-zinc-400 text-xs uppercase mt-2">SECURE PROTOCOL ACTIVE</p>
      </div>
    );
  }

  // SAFE GUARD 2: Permission check
  const hasAccess = user?.role === 'Admin' || user?.permissions?.includes('system');
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
          <span className="text-red-500 text-4xl font-black">!</span>
        </div>
        <h1 className="text-lg font-semibold text-white uppercase tracking-tighter">Access Forbidden</h1>
        <p className="text-zinc-400 text-xs uppercase mt-4 tracking-[0.2em]">Profile Permissions Conflict</p>
        <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/5 max-w-xs overflow-hidden">
           <p className="text-sm text-zinc-300 break-all font-mono">{debugData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-ios-slide-up relative z-10">
      {/* Safe Component Injection */}
      <div className="bg-black/20 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-1 flex items-center justify-between mb-8 px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest leading-none mb-1">Authenticated As</p>
            <p className="text-lg font-bold text-white uppercase">{user?.email || 'Unknown Agent'}</p>
          </div>
        </div>
        <div className="flex gap-2">
           {user?.permissions?.map((p: string) => (
             <span key={p} className="px-3 py-1 bg-white/5 rounded-md text-xs font-semibold uppercase text-zinc-400 border border-white/5">{p}</span>
           ))}
        </div>
      </div>

      <UserAccessManager />
      
      {/* Bottom Logic Safety Check */}
      <div className="pt-20 pb-10 border-t border-white/5 mt-10">
         <p className="text-xs text-zinc-500 uppercase tracking-[0.4em] text-center font-mono">
           Integrity Hash: {btoa(debugData).slice(0, 32)}
         </p>
      </div>
    </div>
  );
}
