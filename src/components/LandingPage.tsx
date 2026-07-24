import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Instagram, Mail, Camera, Film, ArrowUpRight, Sparkles, MapPin, Clapperboard, Globe, Layers } from 'lucide-react';
import Packages from './Packages';
import { api } from '../services/api';
import { type PublicDivisionMedia } from '../services/api/divisions';
import { getFullUrl } from '../utils/media';
import galleryPlaceholder from '../assets/placeholders/gallery-placeholder.jpg';
import { openWhatsApp } from '../utils/whatsapp';

const getSlugFromTitle = (title: string, itemSlug?: string): string => {
   if (itemSlug) return itemSlug;
   const t = title.toLowerCase();
   if (t.includes('innocence')) return 'innocence';
   if (t.includes('wedding') && !t.includes('pre')) return 'wedding';
   if (t.includes('reception')) return 'reception';
   if (t.includes('pre')) return 'pre-wedding';
   if (t.includes('maternity')) return 'maternity';
   if (t.includes('bridal')) return 'bridal';
   if (t.includes('family')) return 'family';
   if (t.includes('portfolio')) return 'portfolio';
   return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const GalleryCard: React.FC<{ item: any; index: number }> = ({ item, index }) => {
   const navigate = useNavigate();
   const [imgSrc, setImgSrc] = useState(item.coverImageUrl || item.coverImage);
   const [isFallback, setIsFallback] = useState(false);

   const variant = index % 4;
   let colSpanClass = 'lg:col-span-8';
   let aspectClass = 'aspect-[16/10]';
   let titleClass = 'text-4xl font-black uppercase mb-3';

   if (variant === 1) {
      colSpanClass = 'lg:col-span-4';
      aspectClass = 'aspect-[4/5] lg:aspect-auto';
      titleClass = 'text-3xl font-black uppercase mb-3';
   } else if (variant === 2) {
      colSpanClass = 'lg:col-span-4';
      aspectClass = 'aspect-square';
      titleClass = 'text-3xl font-black uppercase mb-3';
   } else if (variant === 3) {
      colSpanClass = 'lg:col-span-8';
      aspectClass = 'aspect-[16/10]';
      titleClass = 'text-4xl font-black uppercase mb-3';
   }

   const divisionLabels = ["AAHA Kalyanam", "Candid Moments", "Tiny Toes", "Artisans Signature"];
   const divisionLabel = item.category || divisionLabels[variant];

   const handleImageError = () => {
      if (!isFallback) {
         setImgSrc(galleryPlaceholder);
         setIsFallback(true);
      }
   };

   const handleClick = () => {
      const targetSlug = getSlugFromTitle(item.title, item.slug);
      if (targetSlug === 'portfolio') {
         navigate('/portfolio');
      } else {
         navigate(`/collections/${targetSlug}`);
      }
   };

   return (
      <div
         onClick={handleClick}
         className={`${colSpanClass} ${aspectClass} group relative overflow-hidden rounded-[3rem] border border-white/5 hover:border-white/20 transition-all duration-500 cursor-pointer`}
      >
         <img
            src={imgSrc || galleryPlaceholder}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[1.5s] group-hover:scale-110"
            alt={item.title}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
         <div className="absolute bottom-0 left-0 p-12 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
            <h3 className={titleClass}>{item.title}</h3>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 bg-zinc-900/20 border border-white/10 px-3 py-1 rounded-full w-max backdrop-blur-md">
               {divisionLabel}
            </p>
         </div>
      </div>
   );
};

const MediaCard: React.FC<{
   mediaItem: PublicDivisionMedia;
   instagramUrl: string | null;
}> = React.memo(({ mediaItem, instagramUrl }) => {
   const [hasError, setHasError] = useState(false);
   const [imgSrc, setImgSrc] = useState(getFullUrl(mediaItem.url));
   const [isFallback, setIsFallback] = useState(false);

   const handleImageError = () => {
      if (!isFallback) {
         setImgSrc(galleryPlaceholder);
         setIsFallback(true);
      } else {
         setHasError(true);
      }
   };

   const handleVideoError = () => {
      setHasError(true);
   };

   const cardClassName = instagramUrl
      ? 'relative w-48 h-64 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer border border-white/10 group/item'
      : 'relative w-48 h-64 flex-shrink-0 rounded-2xl overflow-hidden cursor-default border border-white/10 group/item';

   return (
      <div className={cardClassName}>
         {mediaItem.type === 'VIDEO' && !hasError ? (
            <video
               src={getFullUrl(mediaItem.url)}
               autoPlay
               muted
               loop
               playsInline
               preload="metadata"
               onError={handleVideoError}
               className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
            />
         ) : (
            <img
               src={hasError ? galleryPlaceholder : imgSrc}
               onError={handleImageError}
               loading="lazy"
               decoding="async"
               className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
               alt="Division Media"
            />
         )}
         <div className="absolute inset-0 bg-black/20 group-hover/item:bg-transparent transition-colors" />
         {instagramUrl && (
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity">
               <Instagram className="w-3 h-3 text-white" />
            </div>
         )}
      </div>
   );
});

interface LandingPageProps {
   onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
   const [scrolled, setScrolled] = useState(false);
   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
   const [galleries, setGalleries] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [divisions, setDivisions] = useState<any[]>([]);
   const [divisionsLoading, setDivisionsLoading] = useState(true);

   useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener('scroll', handleScroll);

      // Parallax/Gradient effect based on mouse
      const handleMouseMove = (e: MouseEvent) => {
         setMousePos({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener('mousemove', handleMouseMove);

      const loadData = async () => {
         setLoading(true);
         setDivisionsLoading(true);

         const galleriesPromise = api.getPublicGalleries()
            .then(data => setGalleries(data || []))
            .catch(err => console.error("Failed to load website galleries for landing page", err))
            .finally(() => setLoading(false));

         const divisionsPromise = api.getPublicDivisions()
            .then(data => setDivisions(data || []))
            .catch(err => console.error("Failed to load website divisions for landing page", err))
            .finally(() => setDivisionsLoading(false));

         await Promise.allSettled([galleriesPromise, divisionsPromise]);
      };
      loadData();

      return () => {
         window.removeEventListener('scroll', handleScroll);
         window.removeEventListener('mousemove', handleMouseMove);
      };
   }, []);

   return (
      <div className="min-h-screen bg-transparent text-white font-sans selection:bg-primary selection:text-white overflow-x-hidden relative">

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
               <div className="hidden md:flex items-center gap-8 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans">
                  <a href="#philosophy" className="hover:text-white hover:scale-105 transition-all duration-300">Studio</a>
                  <a href="#work" className="hover:text-white hover:scale-105 transition-all duration-300">Portfolio</a>
                  <a href="#divisions" className="hover:text-white hover:scale-105 transition-all duration-300">Divisions</a>
                  <a href="#packages" className="hover:text-white hover:scale-105 transition-all duration-300 relative group">
                     PACKAGES
                     <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </a>
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
                  src="https://www.instagram.com/p/DaagNC_EkzL/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="
                  className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-[2s] scale-105 animate-[pulse_10s_ease-in-out_infinite]"
                  alt="Cinematic Production"
               />
            </div>

            <div className="relative z-20 max-w-[1800px] mx-auto w-full mb-10 pl-4 md:pl-10">
               <h1 className="text-[12vw] leading-[0.8] font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30 animate-ios-slide-up" style={{ animationDelay: '0.2s' }}>
                  CRAFTING<br />MEMORIES
               </h1>
            </div>

            <div className="relative z-20 max-w-[1800px] mx-auto w-full flex flex-col md:flex-row justify-between items-end pl-4 md:pl-10 pr-4 md:pr-10 animate-ios-slide-up" style={{ animationDelay: '0.4s' }}>
               <div className="max-w-xl p-8 rounded-[2.5rem] bg-black/60 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
                  <p className="text-lg md:text-xl text-zinc-200 font-medium leading-relaxed">
                     Enterprise-grade wedding workflow & secure documentation platform.
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
                     <a href="https://www.google.com/search?num=10&newwindow=1&sca_esv=58ed6498840539ce&sxsrf=AE3TifP3xKbAXk-Lkm27q4qSZDFzjQrWyQ:1767363113304&kgmid=/g/11rb9ky4rz&q=Artisans+Production+Company&shndl=30&shem=ptotplc,shrtsdl&source=sh/x/loc/uni/m1/1&kgs=58f10297eb1b944b&utm_source=ptotplc,shrtsdl,sh/x/loc/uni/m1/1#lrd=0x3b061f1eb422a52f:0xd8bbbe8300057cb1,1,,,," target="_blank" rel="noopener noreferrer" className="group block">
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

            {loading ? (
               <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 aspect-[16/10] rounded-[3rem] bg-white/5 animate-pulse border border-white/5" />
                  <div className="lg:col-span-4 aspect-[4/5] lg:aspect-auto rounded-[3rem] bg-white/5 animate-pulse border border-white/5" />
                  <div className="lg:col-span-4 aspect-square rounded-[3rem] bg-white/5 animate-pulse border border-white/5" />
                  <div className="lg:col-span-8 aspect-[16/10] rounded-[3rem] bg-white/5 animate-pulse border border-white/5" />
               </div>
            ) : galleries.length === 0 ? (
               <div className="max-w-[1800px] mx-auto py-20 text-center glass-panel rounded-[3rem] border border-white/5 p-12">
                  <Globe className="w-12 h-12 text-zinc-600 mx-auto mb-6 animate-pulse" />
                  <h3 className="text-2xl font-black text-white/80 uppercase tracking-tight mb-2">No Featured Highlights</h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Check back later for our curated collection of works.</p>
               </div>
            ) : (
               <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
                  {galleries.map((item, index) => (
                     <GalleryCard key={item.id} item={item} index={index} />
                  ))}
               </div>
            )}
         </section>

         {/* Divisions - Futuristic Cards */}
         <section id="divisions" className="py-32 px-6 relative z-10">
            <div className="max-w-[1400px] mx-auto">
               <h2 className="text-[10vw] font-black uppercase tracking-tighter leading-none mb-24 opacity-20 text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent">Divisions</h2>

               {divisionsLoading ? (
                  /* Premium Loading Skeletons */
                  <div className="space-y-32">
                     {[0, 1].map((idx) => {
                        const isEvenSkeleton = idx % 2 === 1;
                        return (
                           <div
                              key={idx}
                              className={`flex flex-col ${isEvenSkeleton ? 'md:flex-row-reverse' : 'md:flex-row'} gap-16 items-center`}
                           >
                              <div className="flex-1 space-y-8 animate-pulse">
                                 <div className="w-24 h-24 bg-white/5 rounded-[2rem]" />
                                 <div className="h-10 bg-white/5 rounded-xl w-3/4" />
                                 <div className="space-y-3">
                                    <div className="h-4 bg-white/5 rounded w-full" />
                                    <div className="h-4 bg-white/5 rounded w-5/6" />
                                    <div className="h-4 bg-white/5 rounded w-4/5" />
                                 </div>
                                 <div className="w-36 h-12 bg-white/5 rounded-full" />
                              </div>
                              <div className="flex-1 w-full overflow-hidden animate-pulse">
                                 <div className="flex gap-4">
                                    {[1, 2, 3].map((mIdx) => (
                                       <div key={mIdx} className="w-48 h-64 bg-white/5 rounded-2xl border border-white/5 flex-shrink-0" />
                                    ))}
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               ) : divisions.length === 0 ? (
                  /* Premium Empty State */
                  <div className="max-w-2xl mx-auto py-20 text-center glass-panel rounded-[3rem] border border-white/5 p-12 animate-ios-slide-up">
                     <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-6 animate-pulse" />
                     <h3 className="text-2xl font-black text-white/80 uppercase tracking-tight mb-2">No Divisions Published</h3>
                     <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Check back later as we update our creative segments.</p>
                  </div>
               ) : (
                  <div className="space-y-32">
                     {divisions.map((division, index) => {
                        const isEvenTheme = index % 2 === 1;
                        const instagramUrl = division.instagramUrl || null;
                        const Icon = isEvenTheme ? Camera : Film;

                        const iconContainerClass = isEvenTheme
                           ? "w-24 h-24 bg-primary/10 glass-panel rounded-[2rem] flex items-center justify-center border border-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-[0_0_40px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                           : "w-24 h-24 glass-panel rounded-[2rem] flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-[0_0_40px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]";

                        const sortedMedia = division.media && division.media.length > 0
                           ? [...division.media].sort((a: any, b: any) => a.position - b.position)
                           : [];

                        const marqueeMedia = sortedMedia.length > 0
                           ? (sortedMedia.length < 4
                              ? [...sortedMedia, ...sortedMedia, ...sortedMedia, ...sortedMedia]
                              : [...sortedMedia, ...sortedMedia]
                           )
                           : [];

                        const handleDivisionClick = () => {
                           if (instagramUrl) {
                              window.open(instagramUrl, '_blank', 'noopener,noreferrer');
                           }
                        };

                        return (
                           <div
                              key={division.id}
                              onClick={handleDivisionClick}
                              className={`flex flex-col ${isEvenTheme ? 'md:flex-row-reverse' : 'md:flex-row'} gap-16 items-center group ${instagramUrl ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`}
                           >
                              {/* Text content info */}
                              <div className={`flex-1 space-y-8 ${isEvenTheme ? '' : 'order-2 md:order-1'}`}>
                                 <div className={iconContainerClass}>
                                    <Icon className="w-10 h-10" />
                                 </div>
                                 <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tight">{division.name}</h3>
                                 <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-lg">
                                    {division.description}
                                 </p>
                                 {instagramUrl && (
                                    <span
                                       className={isEvenTheme
                                          ? "inline-flex items-center gap-3 px-8 py-4 border border-primary/50 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300"
                                          : "inline-flex items-center gap-3 px-8 py-4 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
                                       }
                                    >
                                       <span>Visit Instagram</span>
                                       <ArrowUpRight className="w-3 h-3" />
                                    </span>
                                 )}
                              </div>

                              {/* Media Scrolling Feed */}
                              <div className={`flex-1 ${isEvenTheme ? 'relative' : 'order-1 md:order-2'} w-full overflow-hidden`}>
                                 <div className="relative w-full overflow-hidden group/feed rounded-[3rem] border border-white/10 glass-panel p-2">
                                    {marqueeMedia.length > 0 ? (
                                       <div
                                          className="flex gap-4 animate-marquee hover:pause"
                                          style={isEvenTheme ? { animationDirection: 'reverse' } : undefined}
                                       >
                                          {marqueeMedia.map((mediaItem, i) => (
                                             <MediaCard
                                                key={`${mediaItem.id}-${i}`}
                                                mediaItem={mediaItem}
                                                instagramUrl={instagramUrl}
                                             />
                                          ))}
                                       </div>
                                    ) : (
                                       <div className="flex justify-center items-center h-64 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                                          No Media Available
                                       </div>
                                    )}
                                    {/* Gradient Masks */}
                                    <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none rounded-l-[3rem]" />
                                    <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none rounded-r-[3rem]" />
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         </section>

         <section id="packages" className="relative z-10 scroll-mt-24">
            <Packages />
         </section>

          {/* Contact Section */}
          <section className="scroll-mt-24">
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
                         <a href="https://www.instagram.com/artisansproductioncompany/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white hover:text-black transition-all duration-300 border border-white/5"><Instagram className="w-5 h-5" /></a>
                         <a href="mailto:contact@artisans.co" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white hover:text-black transition-all duration-300 border border-white/5"><Mail className="w-5 h-5" /></a>
                         <a href="https://www.google.com/search?num=10&newwindow=1&sca_esv=58ed6498840539ce&sxsrf=AE3TifP3xKbAXk-Lkm27q4qSZDFzjQrWyQ:1767363113304&kgmid=/g/11rb9ky4rz&q=Artisans+Production+Company&shndl=30&shem=ptotplc,shrtsdl&source=sh/x/loc/uni/m1/1&kgs=58f10297eb1b944b&utm_source=ptotplc,shrtsdl,sh/x/loc/uni/m1/1#lrd=0x3b061f1eb422a52f:0xd8bbbe8300057cb1,1,,,," target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white hover:text-black transition-all duration-300 border border-white/5"><MapPin className="w-5 h-5" /></a>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-16">
                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Studio</h5>
                         <div className="flex flex-col gap-4 text-sm font-bold text-zinc-400">
                            <a href="https://www.instagram.com/aahakalyanam.from.apco/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">AAHA Kalyanam</a>
                            <a href="https://www.instagram.com/tinytoes.from.apco/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Tiny Toes</a>
                            <a href="https://www.google.com/search?num=10&newwindow=1&sca_esv=58ed6498840539ce&sxsrf=AE3TifP3xKbAXk-Lkm27q4qSZDFzjQrWyQ:1767363113304&kgmid=/g/11rb9ky4rz&q=Artisans+Production+Company&shndl=30&shem=ptotplc,shrtsdl&source=sh/x/loc/uni/m1/1&kgs=58f10297eb1b944b&utm_source=ptotplc,shrtsdl,sh/x/loc/uni/m1/1#lrd=0x3b061f1eb422a52f:0xd8bbbe8300057cb1,1,,,," target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Reviews</a>
                            <a
                               href="#contact"
                               onClick={(e) => {
                                  e.preventDefault();
                                  const element = document.getElementById("contact");
                                  console.log("Contact element:", element);
                                  if (element) {
                                     const y =
                                        element.getBoundingClientRect().top +
                                        window.pageYOffset -
                                        window.innerHeight * 0.2;

                                     window.scrollTo({
                                        top: y,
                                        behavior: "smooth",
                                     });
                                  } else {
                                     console.error("No element with id='contact' found.");
                                  }
                               }}
                               className="hover:text-white transition-colors"
                            >
                               Contact
                            </a>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Client</h5>
                         <div className="flex flex-col gap-4 text-sm font-bold text-zinc-400">
                            <button onClick={onLogin} className="text-left hover:text-white transition-colors">Member Login</button>
                            <button onClick={onLogin} className="text-left hover:text-white transition-colors">Project Access</button>
                            <a
                               href="#"
                               onClick={(e) => {
                                  e.preventDefault();
                                  openWhatsApp({
                                     message: "Hello Artisans Co., I need assistance with my booking or project.",
                                     source: "Footer Support"
                                  });
                               }}
                               className="hover:text-white transition-colors"
                            >
                               Support
                            </a>
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
          </section>
       </div>
    );
 };

export default LandingPage;
