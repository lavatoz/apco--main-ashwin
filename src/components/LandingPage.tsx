import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Instagram, Mail, Camera, Film, ArrowUpRight, Sparkles, MapPin, Clapperboard, Globe, Layers, Menu, X } from 'lucide-react';
import Packages from './Packages';
import Ballpit from './Ballpit';
import StarBorder from './StarBorder';
import ShinyText from './ShinyText';
import { api } from '../services/api';
import { type PublicDivisionMedia } from '../services/api/divisions';
import { getFullUrl } from '../utils/media';
import galleryPlaceholder from '../assets/placeholders/gallery-placeholder.jpg';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { gsap } from 'gsap';

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
   let titleClass = 'solan-vesta-title mb-3';
   let fontSizeStyle = { fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.03em' };

   if (variant === 1) {
      colSpanClass = 'lg:col-span-4';
      aspectClass = 'aspect-[4/5] lg:aspect-auto';
      titleClass = 'solan-vesta-title mb-3';
      fontSizeStyle = { fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', letterSpacing: '-0.03em' };
   } else if (variant === 2) {
      colSpanClass = 'lg:col-span-4';
      aspectClass = 'aspect-square';
      titleClass = 'solan-vesta-title mb-3';
      fontSizeStyle = { fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', letterSpacing: '-0.03em' };
   } else if (variant === 3) {
      colSpanClass = 'lg:col-span-8';
      aspectClass = 'aspect-[16/10]';
      titleClass = 'solan-vesta-title mb-3';
      fontSizeStyle = { fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.03em' };
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
            <h3 className={titleClass} style={fontSizeStyle}>{item.title}</h3>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 bg-zinc-900/20 border border-white/10 px-3 py-1 rounded-full w-max backdrop-blur-md">
               {divisionLabel}
            </p>
         </div>
      </div>
   );
};

const MediaCard: React.FC<{
   mediaItem: PublicDivisionMedia;
}> = React.memo(({ mediaItem }) => {
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

   const cardClassName = 'relative w-48 h-64 flex-shrink-0 rounded-2xl overflow-hidden cursor-default border border-white/10 group/item';

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
      </div>
   );
});

interface LandingPageProps {
   onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
   const navigate = useNavigate();
   const [scrolled, setScrolled] = useState(false);
   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
   const [galleries, setGalleries] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [divisions, setDivisions] = useState<any[]>([]);
   const [divisionsLoading, setDivisionsLoading] = useState(true);
   const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
   const [isVisible, setIsVisible] = useState(false);
   const [scrollY, setScrollY] = useState(0);
   const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
   const philosophyRef = useRef<HTMLDivElement>(null);
   const menuRef = useRef<HTMLDivElement>(null);
   const linksRef = useRef<HTMLDivElement>(null);
   const footerLinksRef = useRef<HTMLDivElement>(null);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const [activeSection, setActiveSection] = useState('home');

   useEffect(() => {
      const handleScroll = () => {
         const currentScrollY = window.scrollY;
         setScrolled(currentScrollY > 50);
         setScrollY(currentScrollY);

         // Active section detection
         const sections = ['philosophy', 'work', 'divisions', 'packages'];
         const scrollPos = currentScrollY + 250;
         let currentSec = 'home';
         for (const section of sections) {
            const el = document.getElementById(section);
            if (el) {
               const top = el.offsetTop;
               const height = el.offsetHeight;
               if (scrollPos >= top && scrollPos < top + height) {
                  currentSec = section;
                  break;
               }
            }
         }
         setActiveSection(currentSec);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });

      // Parallax/Gradient effect based on mouse
      const handleMouseMove = (e: MouseEvent) => {
         setMousePos({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener('mousemove', handleMouseMove);

      const handleResize = () => {
         setIsMobile(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);

      // prefers-reduced-motion detection
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const motionListener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', motionListener);

      // Intersection Observer for Philosophy Section
      const observer = new IntersectionObserver(([entry]) => {
         if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
         }
      }, { threshold: 0.15 });

      if (philosophyRef.current) {
         observer.observe(philosophyRef.current);
      }

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
         window.removeEventListener('resize', handleResize);
         mediaQuery.removeEventListener('change', motionListener);
         observer.disconnect();
      };
   }, []);

    // Lock body scrolling when mobile menu is open
    useEffect(() => {
       if (isMobileMenuOpen) {
          const originalStyle = window.getComputedStyle(document.body).overflow;
          document.body.style.overflow = 'hidden';
          return () => {
             document.body.style.overflow = originalStyle;
          };
       }
    }, [isMobileMenuOpen]);

    // Close mobile menu on Escape key press
    useEffect(() => {
       const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
             setIsMobileMenuOpen(false);
          }
       };
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // GSAP menu animations
    useEffect(() => {
       if (!menuRef.current) return;
       
       const links = linksRef.current?.querySelectorAll('a, button');
       const footerItems = footerLinksRef.current?.children;

       if (isMobileMenuOpen) {
          gsap.killTweensOf([menuRef.current, links, footerItems]);
          
          gsap.set(menuRef.current, { opacity: 0, y: -20, display: 'flex' });
          if (links) gsap.set(links, { opacity: 0, y: 15 });
          if (footerItems) gsap.set(footerItems, { opacity: 0, y: 10 });

          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          tl.to(menuRef.current, {
             opacity: 1,
             y: 0,
             duration: 0.5
          });
          
          if (links && links.length > 0) {
             tl.to(links, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                stagger: 0.05
             }, '-=0.3');
          }

          if (footerItems && footerItems.length > 0) {
             tl.to(footerItems, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.05
             }, '-=0.2');
          }
       } else {
          gsap.killTweensOf([menuRef.current, links, footerItems]);
          const tl = gsap.timeline({
             defaults: { ease: 'power3.inOut' },
             onComplete: () => {
                gsap.set(menuRef.current, { display: 'none' });
             }
          });
          
          if (links && links.length > 0) {
             tl.to(links, {
                opacity: 0,
                y: -10,
                duration: 0.3,
                stagger: 0.02
             });
          }
          
          tl.to(menuRef.current, {
             opacity: 0,
             y: -15,
             duration: 0.4
          }, '-=0.2');
       }
    }, [isMobileMenuOpen]);

    console.log('[DEBUG] LandingPage divisions state:', divisions);

    // Calculate relative parallax offset for the philosophy section image
    let parallaxOffset = 0;
    if (philosophyRef.current && !prefersReducedMotion) {
       const rect = philosophyRef.current.getBoundingClientRect();
       const elementTop = rect.top + scrollY;
       const scrollPosition = scrollY + window.innerHeight / 2;
       parallaxOffset = (scrollPosition - (elementTop + rect.height / 2)) * 0.05;
       parallaxOffset = Math.min(40, Math.max(-40, parallaxOffset));
    }

    const getAnimationStyle = (delay: number) => {
       if (prefersReducedMotion) return {};
       return {
          transitionProperty: 'all',
          transitionDuration: '800ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: `${delay}ms`
       };
    };

    const handleMobileNavClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string, type: string) => {
       e.preventDefault();
       setIsMobileMenuOpen(false);

       if (type === 'route') {
          setTimeout(() => {
             navigate(href);
          }, 450); // Wait for menu close GSAP animation to complete
       } else if (type === 'button') {
          setTimeout(() => {
             onLogin();
          }, 450);
       } else {
          const id = href.replace('#', '');
          const element = document.getElementById(id);
          if (element) {
             setTimeout(() => {
                const yOffset = -80; // Navbar spacing offset
                const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({
                   top: y,
                   behavior: 'smooth'
                });
             }, 450);
          }
       }
    };

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
             <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black text-xl rounded-2xl group-hover:rotate-12 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.3)]">A</div>
                <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-80 group-hover:opacity-100 transition-opacity">Artisans Co.</span>
             </div>
 
             <div className="flex items-center gap-10">
                <div className="hidden lg:flex items-center gap-8 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans">
                   <a href="#philosophy" className="hover:text-white hover:scale-105 transition-all duration-300">Studio</a>
                   <a href="#work" className="hover:text-white hover:scale-105 transition-all duration-300">Portfolio</a>
                   <a href="#divisions" className="hover:text-white hover:scale-105 transition-all duration-300">Divisions</a>
                   <a href="#packages" className="hover:text-white hover:scale-105 transition-all duration-300 relative group">
                      PACKAGES
                      <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                   </a>
                </div>
                
                <StarBorder
                   as="button"
                   onClick={onLogin}
                   className="hidden lg:inline-block rounded-full group hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-shadow duration-500"
                   innerClassName="flex items-center gap-3 px-6 py-3 bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/10 rounded-full text-white text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500"
                   color="white"
                   speed="5s"
                   thickness={1.5}
                >
                   <span>Client Portal</span>
                   <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </StarBorder>

                {/* Hamburger menu button for mobile/tablet */}
                <button
                   onClick={() => setIsMobileMenuOpen(true)}
                   aria-label="Open navigation menu"
                   aria-expanded={isMobileMenuOpen}
                   aria-controls="mobile-menu"
                   className="lg:hidden p-3 rounded-full hover:bg-white/5 border border-white/5 bg-white/5 flex items-center justify-center cursor-pointer transition-all active:scale-95 text-white"
                >
                   <Menu className="w-5 h-5" />
                </button>
             </div>
          </nav>

          {/* Mobile Navigation Overlay */}
          <div
             id="mobile-menu"
             ref={menuRef}
             role="dialog"
             aria-modal="true"
             aria-label="Navigation Menu"
             style={{ display: 'none' }}
             onClick={(e) => {
                if (e.target === e.currentTarget) {
                   setIsMobileMenuOpen(false);
                }
             }}
             className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-8 lg:hidden"
          >
             {/* Header inside menu overlay */}
             <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                   <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black text-xl rounded-2xl">A</div>
                   <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-80 text-white">Artisans Co.</span>
                </div>
                <button
                   onClick={() => setIsMobileMenuOpen(false)}
                   aria-label="Close navigation menu"
                   className="p-3 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
                >
                   <X className="w-6 h-6" />
                </button>
             </div>

             {/* Navigation list */}
             <div className="flex flex-col justify-center items-center flex-1 py-6" ref={linksRef}>
                <nav className="flex flex-col gap-5 text-center w-full max-w-sm">
                   {[
                      { label: 'STUDIO', href: '#philosophy', active: activeSection === 'philosophy', type: 'anchor' },
                      { label: 'PORTFOLIO', href: '/portfolio', active: false, type: 'route' },
                      { label: 'GALLERY', href: '/curated-gallery', active: false, type: 'route' },
                      { label: 'DIVISIONS', href: '#divisions', active: activeSection === 'divisions', type: 'anchor' },
                      { label: 'PACKAGES', href: '#packages', active: activeSection === 'packages', type: 'anchor' }
                   ].map((item) => {
                      const baseClass = "text-xl font-bold uppercase tracking-[0.25em] py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 w-full min-h-[48px] focus:outline-none focus:ring-1 focus:ring-white/20";
                      const activeClass = item.active ? "text-white bg-white/5" : "text-zinc-500 hover:text-white hover:bg-white/5";
                      
                      if (item.type === 'button') {
                         return (
                            <button
                               key={item.label}
                               onClick={(e) => handleMobileNavClick(e, '', 'button')}
                               className={`${baseClass} ${activeClass} text-center`}
                            >
                               {item.label}
                            </button>
                         );
                      }

                      return (
                         <a
                            key={item.label}
                            href={item.href}
                            onClick={(e) => handleMobileNavClick(e, item.href, item.type)}
                            className={`${baseClass} ${activeClass}`}
                         >
                            {item.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                            {item.label}
                         </a>
                      );
                   })}
                </nav>
             </div>

             {/* Footer inside mobile menu overlay */}
             <div className="w-full flex flex-col gap-6 text-center border-t border-white/5 pt-6" ref={footerLinksRef}>
                <div className="flex justify-center gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                   <a 
                      href="https://www.instagram.com/artisansproductioncompany/" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="hover:text-white transition-colors"
                   >
                      Instagram
                   </a>
                   <a 
                      href={buildWhatsAppUrl({
                         message: "Hello Artisans Co., I would like to get in touch with you.",
                         source: "Mobile Menu Footer"
                      }) || '#'} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="hover:text-white transition-colors"
                   >
                      WhatsApp
                   </a>
                   <a 
                      href="https://www.google.com/maps?q=Mumbai,+India" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="hover:text-white transition-colors"
                   >
                      Location
                   </a>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">© 2025 Artisans Co. Productions</p>
             </div>
          </div>


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
               <div className="absolute inset-0 z-0">
                  <Ballpit
                     count={isMobile ? 50 : 140}
                     gravity={0.4}
                     friction={0.99}
                     wallBounce={0.95}
                     followCursor={true}
                     colors={[0xffffff, 0x052e16, 0x14532d, 0x166534, 0x15803d, 0x22c55e]}
                     ambientColor={0xffffff}
                     ambientIntensity={1.5}
                     lightIntensity={300}
                     minSize={0.4}
                     maxSize={0.8}
                  />
               </div>
            </div>

            <div className="relative z-20 max-w-[1800px] mx-auto w-full mb-10 pl-4 md:pl-10">
                <h1 className="leading-[0.85] uppercase animate-ios-slide-up luxury-hero-heading solan-vesta-title" style={{ animationDelay: '0.2s' }}>
                  <ShinyText
                     text="CRAFTING"
                     disabled={false}
                     speed={3}
                     className="block"
                     color="rgba(255, 255, 255, 0.8)"
                     shineColor="#ffffff"
                     spread={40}
                     direction="left"
                  />
                  <ShinyText
                     text="MEMORIES"
                     disabled={false}
                     speed={3}
                     className="block"
                     color="rgba(255, 255, 255, 0.3)"
                     shineColor="#ffffff"
                     spread={40}
                     direction="left"
                  />
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
          <section 
             id="philosophy" 
             ref={philosophyRef}
             className="py-32 px-6 relative overflow-hidden z-10"
             style={{
                background: 'radial-gradient(circle at 75% 50%, rgba(16, 185, 129, 0.02) 0%, transparent 60%), radial-gradient(circle at 25% 50%, rgba(0, 0, 0, 0.95) 0%, #080808 100%)'
             }}
          >
             {/* Gentle vignette overlays */}
             <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/50 via-transparent to-black/50 z-0" />
             <div className="absolute inset-0 pointer-events-none bg-noise opacity-[0.02] z-0" />

             <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-[60%_40%] lg:grid-cols-[65%_35%] gap-16 lg:gap-24 items-center relative z-10">
                <div className="space-y-10">
                   <div 
                      style={getAnimationStyle(100)} 
                      className={`inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-emerald-950/20 border border-emerald-500/10 text-emerald-400 backdrop-blur-md w-max ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                   >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.25em]">THE ARTISAN WAY</span>
                   </div>

                    <h2 className="solan-vesta-title tracking-tight" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', letterSpacing: '-0.03em' }}>
                       <span className="block overflow-hidden">
                          <span 
                             style={getAnimationStyle(200)}
                             className={`block transition-transform duration-[850ms] ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                          >
                             More than coverage.
                          </span>
                       </span>
                       <span className="block overflow-hidden mt-1.5">
                          <span 
                             style={getAnimationStyle(300)}
                             className={`block transition-transform duration-[850ms] ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                          >
                             This is your legacy.
                          </span>
                       </span>
                    </h2>

                   <div 
                      style={getAnimationStyle(450)} 
                      className={`text-zinc-400 text-lg leading-relaxed space-y-6 max-w-[600px] transition-all duration-[800ms] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                   >
                      <p>
                         Whether it is the grandeur of <span className="font-semibold text-white">AAHA Kalyanam</span> or the tender innocence of <span className="font-semibold text-white">Tiny Toes</span>, our lens seeks the emotion behind the moment.
                      </p>
                      <p>
                         We don't just click buttons; we craft time capsules. Operating from Mumbai and traveling globally, we bring a cinematic, editorial flair to your most personal celebrations.
                      </p>
                   </div>

                   <div 
                      style={getAnimationStyle(600)} 
                      className={`pt-4 transition-all duration-[800ms] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                   >
                      <a 
                         href="https://www.instagram.com/artisansproductioncompany/" 
                         target="_blank" 
                         rel="noreferrer" 
                         className="group inline-flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-full text-white text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500 hover:shadow-[0_0_35px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                      >
                         <span>FOLLOW OUR JOURNEY</span>
                         <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </a>
                   </div>
                </div>

                <div 
                   style={{ 
                      transform: prefersReducedMotion ? 'none' : `translateY(${parallaxOffset}px)`
                   }}
                   className="relative w-full aspect-[3/4] md:aspect-[4/5] lg:aspect-[3/4] rounded-[2rem] overflow-hidden group border border-white/10 glass-panel p-2 shadow-2xl transition-transform duration-[400ms] ease-out"
                >
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 rounded-[1.8rem]" />
                   
                   {/* Floating Division Icon Overlay */}
                   <div className="absolute top-6 right-6 z-20 glass-panel backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/80">Artisans Signature</span>
                   </div>

                   <img
                      src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2574&auto=format&fit=crop"
                      loading="lazy"
                      className={`w-full h-full object-cover grayscale transition-all duration-[1200ms] ease-out group-hover:grayscale-0 motion-safe:group-hover:scale-105 rounded-[1.8rem] ${isVisible ? 'scale-100' : 'scale-105'}`}
                      alt="Artisans Philosophy"
                   />
                   <div className="absolute bottom-8 left-8 z-20">
                      <div className="w-12 h-12 glass-panel backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                         <Clapperboard className="w-5 h-5 text-white" />
                      </div>
                   </div>
                </div>
             </div>
          </section>

         {/* Selected Works - Futuristic Grid */}
         <section id="work" className="py-32 px-6 relative z-10">
            <div className="max-w-[1800px] mx-auto mb-20 flex flex-col md:flex-row justify-between items-end gap-6 animate-ios-slide-up">
                <h2 className="solan-vesta-title" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.03em' }}>Curated Gallery</h2>
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
                <h2 className="solan-vesta-title opacity-20" style={{ fontSize: 'clamp(5rem, 10vw, 9rem)', letterSpacing: '-0.03em' }}>Divisions</h2>

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

                        return (
                           <div
                              key={division.id}
                              className={`flex flex-col ${isEvenTheme ? 'md:flex-row-reverse' : 'md:flex-row'} gap-16 items-center group`}
                           >
                              {/* Text content info */}
                              <div className={`flex-1 space-y-8 ${isEvenTheme ? '' : 'order-2 md:order-1'}`}>
                                 <div className={iconContainerClass}>
                                    <Icon className="w-10 h-10" />
                                 </div>
                                 <div className="flex flex-col gap-6 md:gap-7">
                                    <h3 className="solan-vesta-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em' }}>{division.name}</h3>
                                    <p className="division-editorial-description">
                                       {division.description}
                                    </p>
                                 </div>
                                 {instagramUrl && (
                                    <a
                                       href={instagramUrl}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       aria-label={`Visit ${division.name} Instagram page`}
                                       className="inline-flex items-center gap-2.5 px-6 py-3 bg-transparent border border-white/20 hover:border-white text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white w-max cursor-pointer"
                                    >
                                       <Instagram className="w-3.5 h-3.5 text-white/90" />
                                       <span>Visit Instagram</span>
                                       <span className="text-[10px] translate-y-[0.5px]">→</span>
                                    </a>
                                 )}
                              </div>

                              {/* Media Scrolling Feed */}
                              <div className={`flex-1 ${isEvenTheme ? 'relative' : 'order-1 md:order-2'} w-full overflow-hidden`}>
                                 <div className="relative w-full overflow-hidden rounded-[3rem] border border-white/10 glass-panel p-2">
                                    {marqueeMedia.length > 0 ? (
                                       <div
                                          className="flex gap-4 animate-marquee hover:pause"
                                          style={isEvenTheme ? { animationDirection: 'reverse' } : undefined}
                                       >
                                          {marqueeMedia.map((mediaItem, i) => (
                                             <MediaCard
                                                key={`${mediaItem.id}-${i}`}
                                                mediaItem={mediaItem}
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
                            <a href="https://www.instagram.com/aahakalyanam.from.apco?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">AAHA Kalyanam</a>
                            <a href="https://www.instagram.com/tinytoes.from.apco?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Tiny Toes</a>
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
                               href={buildWhatsAppUrl({
                                  message: "Hello Artisans Co., I need assistance with my booking or project.",
                                  source: "Footer Support"
                               }) || '#'}
                               target="_blank"
                               rel="noopener noreferrer"
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
