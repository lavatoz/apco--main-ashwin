
import React, { useEffect, useState } from 'react';
import { ArrowRight, Instagram, Mail, Camera, Film, ArrowUpRight, Sparkles, MapPin, Clapperboard } from 'lucide-react';

interface LandingPageProps {
   onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
   const [scrolled, setScrolled] = useState(false);
   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

   useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener('scroll', handleScroll);

      // Parallax/Gradient effect based on mouse
      const handleMouseMove = (e: MouseEvent) => {
         setMousePos({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener('mousemove', handleMouseMove);

      return () => {
         window.removeEventListener('scroll', handleScroll);
         window.removeEventListener('mousemove', handleMouseMove);
      };
   }, []);

   // Mock Instagram Data
   const aahaImages = [
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560982-1927bb242493?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1545232979-8bf68ee29183?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=600&auto=format&fit=crop"
   ];

   const tinyImages = [
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1510746968896-c2cd169eb6db?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596939170830-6b6062f6892e?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519340241574-2291ec33587f?q=80&w=600&auto=format&fit=crop"
   ];

   return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden relative">

         {/* Matte Noise Overlay */}
         <div className="fixed inset-0 pointer-events-none bg-noise z-0 opacity-50" />

         {/* Dynamic Background Glow */}
         <div
            className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
            style={{
               background: `radial-gradient(circle 800px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.04), transparent 80%)`
            }}
         />

         {/* Navigation */}
         <nav className={`fixed top-0 left-0 right-0 z-50 py-6 px-8 flex justify-between items-center transition-all duration-700 ${scrolled ? 'glass-panel-dark border-b border-white/5 py-4' : 'bg-transparent'}`}>
            <div className="flex items-center gap-4 group cursor-pointer">
               <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black text-xl rounded-2xl group-hover:rotate-12 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.3)]">A</div>
               <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-80 group-hover:opacity-100 transition-opacity">Artisans Co.</span>
            </div>

            <div className="flex items-center gap-10">
               <div className="hidden md:flex items-center gap-8 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  <a href="#work" className="hover:text-white hover:scale-105 transition-all duration-300">Portfolio</a>
                  <a href="#divisions" className="hover:text-white hover:scale-105 transition-all duration-300">Divisions</a>
                  <a href="#philosophy" className="hover:text-white hover:scale-105 transition-all duration-300">Studio</a>
               </div>
               <button
                  onClick={onLogin}
                  className="group flex items-center gap-3 px-6 py-3 glass-panel rounded-full text-white text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
               >
                  <span>Client Portal</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
         </nav>

         {/* Hero Section */}
         <section className="h-screen w-full relative flex flex-col justify-end px-6 pb-20 overflow-hidden">
            {/* Background Video/Image with rounding and floating effect */}
            <div className="absolute inset-4 rounded-[3rem] overflow-hidden z-0 border border-white/5 animate-ios-slide-up">
               <div className="absolute inset-0 bg-black/40 z-10" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />
               {/* Cinematic Camera/Production Shot representing Artisans Co */}
               <img
                  src="https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?q=80&w=2670&auto=format&fit=crop"
                  className="w-full h-full object-cover opacity-80 scale-105 animate-[pulse_10s_ease-in-out_infinite]"
                  alt="Cinematic Production"
               />
            </div>

            <div className="relative z-20 max-w-[1800px] mx-auto w-full mb-10 pl-4 md:pl-10">
               <h1 className="text-[12vw] leading-[0.8] font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 animate-ios-slide-up" style={{ animationDelay: '0.2s' }}>
                  Crafting<br />Memories
               </h1>
            </div>

            <div className="relative z-20 max-w-[1800px] mx-auto w-full flex flex-col md:flex-row justify-between items-end pl-4 md:pl-10 pr-4 md:pr-10 animate-ios-slide-up" style={{ animationDelay: '0.4s' }}>
               <div className="max-w-xl p-8 rounded-[2.5rem] glass-panel backdrop-blur-xl border border-white/10">
                  <p className="text-lg md:text-xl text-zinc-200 font-medium leading-relaxed">
                     We are <span className="text-white font-bold">Artisans Production Company</span>. A boutique house for fine-art wedding cinematography & lifestyle portraiture.
                  </p>
               </div>
               <div className="flex gap-12 mt-10 md:mt-0">
                  <div className="text-right">
                     <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Est.</p>
                     <p className="text-xl font-bold font-mono text-white">2025</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Stories Told</p>
                     <p className="text-xl font-bold font-mono text-white">140+</p>
                  </div>
                  <div className="text-right">
                     <a href="https://share.google/ewR0TawJRKAG5eZBl" target="_blank" rel="noreferrer" className="group block">
                        <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1 group-hover:text-white transition-colors">Reviews</p>
                        <div className="flex items-center gap-1 justify-end">
                           <p className="text-xl font-bold font-mono text-white">5.0</p>
                           <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                        </div>
                     </a>
                  </div>
               </div>
            </div>
         </section>

         {/* Philosophy Section */}
         <section id="philosophy" className="py-32 px-6 relative z-10">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
               <div className="space-y-10 animate-ios-slide-up" style={{ animationDelay: '0.2s' }}>
                  <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-900/10 border border-emerald-900/20 w-max">
                     <Sparkles className="w-3 h-3" />
                     The Artisan Way
                  </span>
                  <h2 className="text-4xl md:text-6xl font-medium leading-tight">
                     More than coverage.<br />
                     <span className="text-zinc-600">This is your legacy.</span>
                  </h2>
                  <div className="text-zinc-400 text-lg leading-relaxed space-y-6">
                     <p>
                        Whether it is the grandeur of <span className="text-white">AAHA Kalyanam</span> or the tender innocence of <span className="text-white">Tiny Toes</span>, our lens seeks the emotion behind the moment.
                     </p>
                     <p>
                        We don't just click buttons; we craft time capsules. Operating from Mumbai and traveling globally, we bring a cinematic, editorial flair to your most personal celebrations.
                     </p>
                  </div>
                  <div className="pt-4">
                     <a href="https://www.instagram.com/artisansproductioncompany/" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">
                        Follow Our Journey <ArrowRight className="w-3 h-3 group-hover:translate-x-2 transition-transform" />
                     </a>
                  </div>
               </div>
               <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden group border border-white/10 animate-ios-slide-up glass-panel p-2" style={{ animationDelay: '0.4s' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 rounded-[2.5rem]" />
                  <img
                     src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2574&auto=format&fit=crop"
                     className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-110 group-hover:scale-100 transition-all duration-[1.5s] ease-in-out rounded-[2.5rem]"
                     alt="Artisans Philosophy"
                  />
                  <div className="absolute bottom-8 left-8 z-20">
                     <div className="w-16 h-16 glass-panel backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                        <Clapperboard className="w-6 h-6 text-white" />
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Selected Works - Futuristic Grid */}
         <section id="work" className="py-32 px-6 relative z-10">
            <div className="max-w-[1800px] mx-auto mb-20 flex flex-col md:flex-row justify-between items-end gap-6 animate-ios-slide-up">
               <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white/90">Curated Gallery</h2>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2 px-4 py-2 rounded-full border border-white/10 glass-panel">Highlights 2024-25</span>
            </div>

            <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
               {/* Item 1 - Wedding (AAHA Kalyanam vibe) */}
               <div className="lg:col-span-8 group cursor-pointer relative overflow-hidden aspect-[16/10] rounded-[3rem] border border-white/5 hover:border-white/20 transition-all duration-500">
                  <img src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 p-12 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                     <h3 className="text-4xl font-black uppercase mb-3">The Royal Vows</h3>
                     <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-yellow-500 bg-yellow-900/20 border border-yellow-500/20 px-3 py-1 rounded-full w-max backdrop-blur-md">AAHA Kalyanam</p>
                  </div>
               </div>

               {/* Item 2 - Wedding Portrait */}
               <div className="lg:col-span-4 group cursor-pointer relative overflow-hidden aspect-[4/5] lg:aspect-auto rounded-[3rem] border border-white/5 hover:border-white/20 transition-all duration-500">
                  <img src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=2574&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 p-12 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                     <h3 className="text-3xl font-black uppercase mb-3">Haldi Joy</h3>
                     <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-500 bg-emerald-900/20 border border-emerald-500/20 px-3 py-1 rounded-full w-max backdrop-blur-md">Candid Moments</p>
                  </div>
               </div>

               {/* Item 3 - Kids (Tiny Toes vibe) */}
               <div className="lg:col-span-4 group cursor-pointer relative overflow-hidden aspect-square rounded-[3rem] border border-white/5 hover:border-white/20 transition-all duration-500">
                  <img src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 p-12 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                     <h3 className="text-3xl font-black uppercase mb-3">Pure Innocence</h3>
                     <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-500 bg-blue-900/20 border border-blue-500/20 px-3 py-1 rounded-full w-max backdrop-blur-md">Tiny Toes</p>
                  </div>
               </div>

               {/* Item 4 - Event/Celebration */}
               <div className="lg:col-span-8 group cursor-pointer relative overflow-hidden aspect-[16/10] rounded-[3rem] border border-white/5 hover:border-white/20 transition-all duration-500">
                  <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 p-12 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                     <h3 className="text-4xl font-black uppercase mb-3">Grand Celebrations</h3>
                     <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-purple-500 bg-purple-900/20 border border-purple-500/20 px-3 py-1 rounded-full w-max backdrop-blur-md">Artisans Signature</p>
                  </div>
               </div>
            </div>
         </section>

         {/* Divisions - Futuristic Cards */}
         <section id="divisions" className="py-32 px-6 relative z-10">
            <div className="max-w-[1400px] mx-auto">
               <h2 className="text-[10vw] font-black uppercase tracking-tighter leading-none mb-24 opacity-20 text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent">Divisions</h2>

               <div className="space-y-32">
                  {/* Division 1: AAHA Kalyanam */}
                  <div className="flex flex-col md:flex-row gap-16 items-center group">
                     <div className="flex-1 space-y-8 order-2 md:order-1">
                        <div className="w-24 h-24 glass-panel rounded-[2rem] flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-[0_0_40px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                           <Film className="w-10 h-10" />
                        </div>
                        <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tight">AAHA Kalyanam</h3>
                        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-lg">
                           The gold standard in Indian wedding cinematography. We craft feature-length films that document the grandeur, ritual, and emotion of your union with cinematic precision.
                        </p>
                        <a
                           href="https://www.instagram.com/aahakalyanam.from.apco/"
                           target="_blank"
                           rel="noreferrer"
                           className="inline-flex items-center gap-3 px-8 py-4 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
                        >
                           <span>Visit Instagram</span>
                           <ArrowUpRight className="w-3 h-3" />
                        </a>
                     </div>
                     <div className="flex-1 order-1 md:order-2 w-full overflow-hidden">
                        {/* Instagram Scrolling Feed */}
                        <div className="relative w-full overflow-hidden group/feed rounded-[3rem] border border-white/10 glass-panel p-2">
                           <div className="flex gap-4 animate-marquee hover:pause">
                              {[...aahaImages, ...aahaImages].map((img, i) => (
                                 <a
                                    href="https://www.instagram.com/aahakalyanam.from.apco/"
                                    target="_blank"
                                    rel="noreferrer"
                                    key={i}
                                    className="relative w-48 h-64 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer border border-white/10 group/item"
                                 >
                                    <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" alt="Wedding Post" />
                                    <div className="absolute inset-0 bg-black/20 group-hover/item:bg-transparent transition-colors" />
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity">
                                       <Instagram className="w-3 h-3 text-white" />
                                    </div>
                                 </a>
                              ))}
                           </div>
                           {/* Gradient Masks */}
                           <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none rounded-l-[3rem]" />
                           <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none rounded-r-[3rem]" />
                        </div>
                     </div>
                  </div>

                  {/* Division 2: Tiny Toes */}
                  <div className="flex flex-col md:flex-row-reverse gap-16 items-center group">
                     <div className="flex-1 space-y-8">
                        <div className="w-24 h-24 bg-blue-500/10 glass-panel rounded-[2rem] flex items-center justify-center border border-blue-500/20 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-[0_0_40px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                           <Camera className="w-10 h-10" />
                        </div>
                        <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Tiny Toes</h3>
                        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-lg">
                           Specialized newborn, maternity, and family photography. Capturing the fleeting moments of childhood with a playful, artistic, and patient approach that families cherish.
                        </p>
                        <a
                           href="https://www.instagram.com/tinytoes.from.apco/"
                           target="_blank"
                           rel="noreferrer"
                           className="inline-flex items-center gap-3 px-8 py-4 border border-blue-500/50 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all duration-300"
                        >
                           <span>Visit Instagram</span>
                           <ArrowUpRight className="w-3 h-3" />
                        </a>
                     </div>
                     <div className="flex-1 relative w-full overflow-hidden">
                        {/* Instagram Scrolling Feed */}
                        <div className="relative w-full overflow-hidden group/feed rounded-[3rem] border border-white/10 glass-panel p-2">
                           <div className="flex gap-4 animate-marquee hover:pause" style={{ animationDirection: 'reverse' }}>
                              {[...tinyImages, ...tinyImages].map((img, i) => (
                                 <a
                                    href="https://www.instagram.com/tinytoes.from.apco/"
                                    target="_blank"
                                    rel="noreferrer"
                                    key={i}
                                    className="relative w-48 h-64 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer border border-white/10 group/item"
                                 >
                                    <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" alt="Kids Post" />
                                    <div className="absolute inset-0 bg-black/20 group-hover/item:bg-transparent transition-colors" />
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity">
                                       <Instagram className="w-3 h-3 text-white" />
                                    </div>
                                 </a>
                              ))}
                           </div>
                           {/* Gradient Masks */}
                           <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none rounded-l-[3rem]" />
                           <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none rounded-r-[3rem]" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Footer - Minimal */}
         <footer className="py-24 px-6 border-t border-white/5 relative bg-black z-20">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between gap-16 relative z-10">
               <div className="space-y-8">
                  <h4 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                     <div className="w-8 h-8 bg-white rounded-lg" /> Artisans Co.
                  </h4>
                  <p className="text-zinc-500 max-w-xs text-sm leading-relaxed">
                     Creating visual legacies for the modern connoisseur. Based in Mumbai, available worldwide.
                  </p>
                  <div className="flex gap-4">
                     <a href="https://www.instagram.com/artisansproductioncompany/" target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white hover:text-black transition-all duration-300 border border-white/5"><Instagram className="w-5 h-5" /></a>
                     <a href="mailto:contact@artisans.co" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white hover:text-black transition-all duration-300 border border-white/5"><Mail className="w-5 h-5" /></a>
                     <a href="https://share.google/ewR0TawJRKAG5eZBl" target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white hover:text-black transition-all duration-300 border border-white/5"><MapPin className="w-5 h-5" /></a>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-16">
                  <div className="space-y-6">
                     <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Studio</h5>
                     <div className="flex flex-col gap-4 text-sm font-bold text-zinc-400">
                        <a href="https://www.instagram.com/aahakalyanam.from.apco/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">AAHA Kalyanam</a>
                        <a href="https://www.instagram.com/tinytoes.from.apco/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Tiny Toes</a>
                        <a href="https://share.google/ewR0TawJRKAG5eZBl" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Reviews</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Client</h5>
                     <div className="flex flex-col gap-4 text-sm font-bold text-zinc-400">
                        <button onClick={onLogin} className="text-left hover:text-white transition-colors">Member Login</button>
                        <button onClick={onLogin} className="text-left hover:text-white transition-colors">Project Access</button>
                        <a href="#" className="hover:text-white transition-colors">Support</a>
                     </div>
                  </div>
               </div>
            </div>
            <div className="max-w-[1600px] mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-700">
               <p>© 2025 Artisans Co. Productions</p>
               <div className="flex gap-6 mt-4 md:mt-0">
                  <a href="#" className="hover:text-zinc-500">Privacy Policy</a>
                  <a href="#" className="hover:text-zinc-500">Terms of Service</a>
               </div>
            </div>
         </footer>
      </div>
   );
};

export default LandingPage;
