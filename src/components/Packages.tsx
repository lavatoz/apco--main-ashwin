import React from 'react';
import { Check } from 'lucide-react';
import { openWhatsApp } from '../utils/whatsapp';

const Packages: React.FC = () => {
  const handleWhatsAppClick = () => {
    const message = `Hi AP Co Team! 👋

I visited your website and would love to discuss my wedding with your team.

I'm looking for a personalized photography and filmmaking experience.

Could we schedule a consultation?

My Name:
Wedding Date:
Venue:

Looking forward to hearing from you.`;

    openWhatsApp({
      message,
      source: 'Landing Page'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 relative z-10 flex flex-col items-center">
      {/* Header */}
      <div className="text-center max-w-3xl mb-16 md:mb-24 animate-ios-slide-up">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extralight tracking-tight text-white leading-tight mb-6">
          Let's Create Your Story
        </h2>
        <p className="text-xs md:text-sm font-light tracking-[0.2em] uppercase text-zinc-400 max-w-2xl mx-auto">
          Every wedding deserves a story that's uniquely yours.
        </p>
      </div>

      {/* Editorial Content Grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 w-full animate-ios-slide-up"
        style={{ animationDelay: '0.1s' }}
      >
        {/* Storytelling Copy */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pr-0 lg:pr-8">
          <p className="text-zinc-300 text-xl md:text-2xl font-light leading-relaxed tracking-wide">
            We don't believe in fixed packages because no two celebrations are ever the same.
          </p>
          <div className="space-y-6 text-zinc-400 text-sm md:text-base font-light leading-relaxed">
            <p>
              Whether you're planning an intimate ceremony, a grand celebration, or a destination wedding, we take the time to understand your vision, traditions, and expectations before crafting a personalized proposal.
            </p>
            <p>
              From cinematic films and timeless photography to luxury albums and live streaming, every detail is tailored to your story.
            </p>
          </div>
        </div>

        {/* Feature Highlights Checklist */}
        <div
          className="lg:col-span-5 bg-zinc-950/40 border border-zinc-900/80 p-8 md:p-10 rounded-none flex flex-col justify-center space-y-8"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500">
              EXPERIENCE DESIGN
            </span>
            <h3 className="text-lg font-medium text-white tracking-wide">
              Tailored Elements
            </h3>
          </div>
          <div className="space-y-5">
            {[
              "Personalized consultation",
              "Tailor-made photography & filmmaking",
              "Flexible coverage for every event",
              "Premium albums & keepsakes",
              "Destination weddings",
              "Dedicated creative team"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className="text-zinc-300 text-xs md:text-sm font-light leading-normal">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Elegant Divider */}
      <div
        className="w-full max-w-5xl h-[1px] bg-zinc-900 my-16 md:my-24 animate-ios-slide-up"
        style={{ animationDelay: '0.2s' }}
      />

      {/* Call To Action Block */}
      <div
        className="max-w-3xl text-center space-y-8 animate-ios-slide-up"
        style={{ animationDelay: '0.3s' }}
      >
        <div className="space-y-3">
          <h3 className="text-2xl md:text-3xl font-extralight tracking-wide text-white leading-tight">
            Ready to preserve your memories?
          </h3>
          <p className="text-zinc-400 text-xs md:text-sm font-light max-w-xl mx-auto leading-relaxed">
            From weddings and newborns to family portraits, corporate events, and every milestone in between, we're here to preserve the moments that matter most.          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={handleWhatsAppClick}
            className="w-[260px] py-4 bg-white text-black font-semibold text-xs tracking-[0.2em] uppercase hover:bg-zinc-200 transition-all duration-300 shadow-sm"
          >
            PLAN YOUR MEMORIES
          </button>
        </div>
      </div>
    </div>
  );
};

export default Packages;
