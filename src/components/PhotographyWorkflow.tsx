import React from 'react';
import { UploadCloud, Users, MessageSquare, Briefcase, RefreshCw } from 'lucide-react';

const PhotographyWorkflow: React.FC = () => {
  const steps = [
    {
      title: 'Upload Album Sheets',
      description: 'Securely transfer high-resolution contact sheets and spreads directly into the centralized workspace.',
      icon: UploadCloud,
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
      color: 'text-blue-400 group-hover:text-blue-300'
    },
    {
      title: 'Share with Clients',
      description: 'Generate encrypted magic access links and instantly notify clients to review the initial curation.',
      icon: Users,
      glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]',
      color: 'text-pink-400 group-hover:text-pink-300'
    },
    {
      title: 'Get Comments on Sheets',
      description: 'Enable clients to leave precise, timestamped feedback directly on specific sheets to avoid confusion.',
      icon: MessageSquare,
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      color: 'text-emerald-400 group-hover:text-emerald-300'
    },
    {
      title: 'Share with Editor / Freelancer',
      description: 'Automatically compile and route client feedback packages to your designated photo editor.',
      icon: Briefcase,
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
      color: 'text-amber-400 group-hover:text-amber-300'
    },
    {
      title: 'Send Revisions & Updates',
      description: 'Deliver the seamlessly updated and revised gallery back to the client for final approval.',
      icon: RefreshCw,
      glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
      color: 'text-indigo-400 group-hover:text-indigo-300'
    }
  ];

  return (
    <section className="bg-black py-24 text-white overflow-hidden relative min-h-screen flex items-center">
      {/* Matte Cinematic Noise Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.85] pointer-events-none z-0" />
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-zinc-900/50 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
        
        {/* Left Column: Heading & Description */}
        <div className="space-y-8 max-w-lg lg:sticky lg:top-32 self-start animate-ios-slide-up">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-[2rem] shadow-xl backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-300">Pipeline OS</span>
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.05] mb-6 text-white drop-shadow-2xl">
              Production <br/><span className="text-zinc-600 block mt-2">Workflow</span>
            </h2>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-medium md:max-w-md">
              Eliminate friction from your post-production process. Seamlessly handle client feedback, collaborate securely with freelancers, and manage complex revisions inside one encrypted, cinematic space.
            </p>
          </div>

          <button className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 hover:bg-zinc-200 transition-all">
            Access Operations
          </button>
        </div>

        {/* Right Column: Vertical Timeline */}
        <div className="relative py-4 lg:py-0">
          {/* Vertical Connecting Line */}
          <div className="absolute top-8 left-[1.75rem] md:left-[2.25rem] w-[2px] h-[calc(100%-8rem)] bg-gradient-to-b from-white/20 via-white/5 to-transparent hidden sm:block" />

          <div className="space-y-8 relative">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="flex flex-col sm:flex-row items-start gap-5 md:gap-8 group cursor-default"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                
                {/* Node / Icon Component */}
                <div className="relative z-10 flex flex-col items-center mt-1 shrink-0">
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] border border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:-translate-y-1 group-hover:${step.glow} group-hover:bg-white/5 group-hover:border-white/20 relative overflow-hidden`}>
                    
                    {/* Inner subtle glow ray */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />

                    <step.icon className={`w-6 h-6 md:w-7 md:h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 ${step.color}`} />
                  </div>
                </div>

                {/* Content Glass Card */}
                <div className="flex-1 bg-black/40 p-6 md:p-8 rounded-[2rem] border border-white/5 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/5 hover:border-white/10 relative overflow-hidden group-hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                  {/* Subtle Top Border Gradient Reveal */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-2 md:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[12px] md:text-sm text-zinc-500 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotographyWorkflow;
