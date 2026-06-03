import React from 'react';
import { Users, Mail, ExternalLink, Calendar } from 'lucide-react';
import type { Client } from '../../types';

interface ClientDirectoryProps {
  client: Client | null;
}

const ClientDirectory: React.FC<ClientDirectoryProps> = ({ client }) => {
  if (!client) return null;

  const clientId = client.id || (client as any)._id;
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const savedTeamAssignments = JSON.parse(localStorage.getItem(`client_team_${clientId}`) || 'null');

  console.log('loggedInClientId', clientId);
  console.log('savedTeamAssignments', savedTeamAssignments);

  const assignedStaff: any[] = [];

  if (savedTeamAssignments && Array.isArray(savedTeamAssignments)) {
     savedTeamAssignments.forEach((cat: any) => {
        if (cat.members && Array.isArray(cat.members)) {
           cat.members.forEach((m: any) => {
              if (m.memberId) {
                 const user = users.find((u: any) => u.id === m.memberId);
                 if (user) {
                    assignedStaff.push({
                       ...user,
                       displayRole: cat.name,
                       assignedDates: m.assigned_dates || []
                    });
                 }
              }
           });
        }
     });
  }

  console.log('filteredTeamAssignments', assignedStaff);

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Directory</h1>
        <p className="text-xl text-zinc-400 font-medium">Your Assigned Production Team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedStaff.length > 0 ? (
           assignedStaff.map((person, index) => (
             <div key={person.id + index} className="glass-panel p-8 squircle-lg flex flex-col group hover:border-white/10 transition-colors border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                   <Users className="w-32 h-32" />
                </div>
                <div className="flex items-center gap-5 mb-6 relative z-10">
                   <div className="w-14 h-14 bg-white/10 rounded-[1.2rem] flex items-center justify-center font-serif text-2xl font-bold text-white shadow-xl">
                      {(person.name || person.email || '?').charAt(0)}
                   </div>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">{person.name || person.email.split('@')[0]}</h3>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">{person.displayRole}</p>
                   </div>
                </div>
                
                {person.assignedDates && person.assignedDates.length > 0 && (
                   <div className="mb-6 relative z-10 space-y-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                         <Calendar className="w-3 h-3" /> Assigned Dates
                      </p>
                      <div className="flex flex-wrap gap-2">
                         {person.assignedDates.map((d: string, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-zinc-300">
                               {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                         ))}
                      </div>
                   </div>
                )}
                
                <div className="mt-auto space-y-3 relative z-10 pt-4 border-t border-white/5">
                   <a href={`mailto:${person.email}`} className="flex items-center gap-3 text-sm font-bold text-zinc-400 hover:text-white transition-colors group/link">
                      <Mail className="w-4 h-4" />
                      <span>Email Contact</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity ml-auto" />
                   </a>
                </div>
             </div>
           ))
        ) : (
           <div className="col-span-full glass-panel p-12 squircle-lg flex flex-col justify-center items-center text-center border border-dashed border-white/10">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                No team members assigned yet.
              </p>
           </div>
        )}
        
        <div className="glass-panel p-8 squircle-lg flex flex-col justify-center items-center text-center border border-dashed border-white/10">
           <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
             Need to reach someone else? <br />
             <a href="/support" className="text-white hover:underline mt-2 inline-block">Contact Support Team</a>
           </p>
        </div>
      </div>
    </div>
  );
};

export default ClientDirectory;
