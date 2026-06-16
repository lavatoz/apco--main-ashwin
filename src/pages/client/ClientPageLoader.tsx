import React from 'react';

const ClientPageLoader: React.FC = () => {
  return (
    <div className="p-8 md:p-12 animate-pulse max-w-[1400px] mx-auto font-sans">
      <div className="mb-12">
        <div className="h-12 w-64 bg-white/10 rounded-2xl mb-3" />
        <div className="h-6 w-40 bg-white/5 rounded-xl" />
      </div>

      <div className="space-y-8">
        <div className="glass-panel p-10 md:p-16 squircle-lg border border-white/5 bg-white/[0.01]">
          <div className="h-8 w-48 bg-white/10 rounded-xl mb-8" />
          <div className="h-24 w-full bg-white/5 rounded-2xl mb-8" />
          <div className="space-y-4">
            <div className="h-4 w-3/4 bg-white/5 rounded-lg" />
            <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
            <div className="h-4 w-2/3 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPageLoader;
