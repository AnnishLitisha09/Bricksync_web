import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight, Award, Clock,
  Facebook,
  Instagram, Linkedin,
  Loader2,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Star,
  Truck,
  X
} from "lucide-react";
import React, { useEffect, useState } from "react";

// --- Configuration & Data ---
const highlights = [
  { icon: <Clock className="w-5 h-5" />, title: "15+ Years", desc: "Serving TN construction since 2009." },
  { icon: <Award className="w-5 h-5" />, title: "Official Dealer", desc: "Certified Dalmia & Maha Cement Partner." },
  { icon: <Truck className="w-5 h-5" />, title: "Own Logistics", desc: "Fleet of 12+ vehicles for rapid delivery." },
  { icon: <ShieldCheck className="w-5 h-5" />, title: "Lab Tested", desc: "ISI Standard compressive strength testing." },
];

const products = [
  { id: "01", name: "Hollow Bricks", icon: "🧱", size: "4\", 6\", 8\", 9\"", description: "Precision-molded with advanced vibration technology for superior bonding and thermal insulation.", imageUrl: "https://images.unsplash.com/photo-1590079015191-f569a6a26c80?auto=format&fit=crop&w=800&q=80" },
  { id: "02", name: "Red Stones", icon: "💎", size: "Standard / Custom", description: "Hard-mined natural foundation stones sourced from premium quarries for heavy-load bearing.", imageUrl: "https://images.unsplash.com/photo-1516216628859-9bccecad13ec?auto=format&fit=crop&w=800&q=80" },
  { id: "03", name: "Fly Ash Bricks", icon: "🌿", size: "9 x 4 x 3", description: "Eco-friendly alternatives with high dimensional accuracy and reduced mortar consumption.", imageUrl: "https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&w=800&q=80" },
  { id: "04", name: "M-Sand & P-Sand", icon: "🏜️", size: "Triple Washed", description: "Silt-free Karur sand. P-Sand for smooth plastering and M-Sand for high-strength concrete.", imageUrl: "https://images.unsplash.com/photo-1530263303734-8299f4d732be?auto=format&fit=crop&w=800&q=80" },
  { id: "06", name: "Premium Cement", icon: "💎", size: "Grade 53/43", description: "Authorized distribution of Dalmia Gold and Maha Cement for long-lasting structural life.", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" },
];

const testimonials = [
  { name: "Rajesh Kumar", role: "Structural Engineer", text: "Aswath Bricks has been our go-to supplier for 5 years. Their consistency in block size saves us a lot on mortar costs." },
  { name: "Senthil Prabhu", role: "Home Owner", text: "The delivery was surprisingly fast. Even in Tiruppur traffic, they reached my site exactly when promised." }
];

// Cleaned up Variants definition
const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  }
};

const AswathBricksPro: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState({ email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      setErrors({ email: "Please enter a valid business email." });
      return;
    }
    setErrors({ email: "" });
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    setIsModalOpen(false);
    alert("Quote Request Sent! Our manager will call you shortly.");
  };

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Products", href: "#products" },
    { name: "Contact", href: "#contact" }
  ];

  return (
    <div className="bg-[#fafafa] text-slate-950 selection:bg-orange-500 selection:text-white font-sans antialiased overflow-x-hidden">
      <motion.div className="fixed top-0 left-0 right-0 h-[4px] bg-orange-600 z-[2001] origin-left" style={{ scaleX }} />
      
      {/* Floating WhatsApp */}
      <a href="https://wa.me/919842048181" target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[1001] bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group">
        <span className="hidden md:block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold text-sm whitespace-nowrap px-0 group-hover:px-2">WhatsApp Us</span>
        <MessageCircle size={24} className="md:w-7 md:h-7" />
      </a>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[2005] flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] p-6 md:p-14">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-950 transition-colors"><X size={24} /></button>
              <div className="mb-8 md:mb-10">
                <h3 className="text-3xl md:text-4xl font-black italic uppercase leading-none mb-2">Build <span className="text-orange-500">Stronger.</span></h3>
                <p className="text-slate-500 text-xs md:text-sm font-medium">Professional quotation for bulk or retail requirements.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                   <input required type="text" placeholder="John Doe" className="w-full px-6 md:px-8 py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all text-sm" onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Contact Number</label>
                   <input required type="tel" placeholder="+91 00000 00000" className="w-full px-6 md:px-8 py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all text-sm" onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email Address</label>
                   <input required type="email" placeholder="name@company.com" className={`w-full px-6 md:px-8 py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all text-sm ${errors.email ? 'ring-2 ring-red-500' : ''}`} onChange={e => setFormData({...formData, email: e.target.value})} />
                   {errors.email && <p className="text-[10px] text-red-600 font-bold uppercase mt-1 ml-4">{errors.email}</p>}
                </div>
                <button disabled={isSubmitting} className="w-full bg-slate-950 text-white py-5 md:py-6 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <>Request Estimate <Send size={16} /></>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-[1000] transition-all duration-500 ${scrolled ? "py-3 md:py-4" : "py-6 md:py-10"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className={`flex justify-between items-center px-5 md:px-8 py-3 md:py-4 rounded-full transition-all duration-500 ${scrolled ? "bg-white/80 backdrop-blur-xl shadow-xl border border-white/20" : "bg-transparent"}`}>
            <div className="flex items-center gap-2 md:gap-3 group cursor-pointer">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg shadow-orange-200">A</div>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">Aswath <span className="text-orange-600 hidden xs:inline">Bricks</span></h1>
            </div>

            <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
              {navLinks.map((item) => (
                <a key={item.name} href={item.href} className="hover:text-orange-600 transition-colors relative group">
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-orange-500 transition-all group-hover:w-full" />
                </a>
              ))}
              <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-slate-950 text-white rounded-full hover:bg-orange-600 hover:scale-105 transition-all shadow-xl shadow-slate-200">Quote</button>
            </div>

            <button className="md:hidden p-2 text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed inset-0 z-[999] bg-white pt-28 px-8 md:hidden">
            <div className="flex flex-col gap-8">
              {navLinks.map((item) => (
                <a key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 border-b border-slate-100 pb-4">
                  {item.name}
                </a>
              ))}
              <button onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full py-6 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-100">Get a Quote</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden px-4 md:px-0">
        <motion.div style={{ y: backgroundY }} className="absolute inset-0 z-0 opacity-[0.03] md:opacity-[0.04] pointer-events-none flex justify-center items-center">
          <h1 className="text-[40vw] md:text-[30vw] font-black select-none tracking-tighter leading-none">ASWATH</h1>
        </motion.div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 w-full grid lg:grid-cols-2 gap-10 md:gap-20 items-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.15 } } }}>
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6 md:mb-8">
              <span className="h-[2px] w-8 md:w-12 bg-orange-500" />
              <span className="text-[9px] md:text-[11px] font-black tracking-[0.4em] text-orange-600 uppercase">Premium Structural Grade</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl xs:text-6xl md:text-[8.5rem] font-black leading-[0.9] md:leading-[0.8] tracking-tighter mb-8 md:mb-10 italic uppercase text-slate-900">
              Unyielding <br /> <span className="text-orange-600 underline decoration-[6px] md:decoration-[10px] underline-offset-[8px] md:underline-offset-[12px]">Purity.</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg md:text-2xl text-slate-500 max-w-lg mb-8 md:mb-12 leading-tight font-medium border-l-4 md:border-l-8 border-slate-100 pl-6 md:pl-8">
              Manufacturing structural confidence for South India's skyline.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row flex-wrap gap-4 md:gap-6">
              <button onClick={() => setIsModalOpen(true)} className="group px-8 md:px-12 py-5 md:py-6 bg-orange-600 text-white rounded-2xl md:rounded-3xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-2xl shadow-orange-200 flex items-center justify-center gap-4 hover:bg-slate-950 transition-all">
                Order Materials <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }} className="relative hidden lg:block">
            <div className="relative rounded-[5rem] overflow-hidden shadow-2xl group">
              <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1000&q=80" className="w-full aspect-[4/5] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt="Construction detail" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-20 md:py-40 px-4 md:px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
            <div className="relative px-2 md:px-0">
              <div className="absolute -z-10 top-10 -left-10 w-64 md:w-96 h-64 md:h-96 bg-orange-100 rounded-full blur-[80px] md:blur-[100px] opacity-40" />
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80" className="rounded-[2.5rem] md:rounded-[4rem] shadow-2xl z-10 relative border-[10px] md:border-[20px] border-slate-50 w-full" alt="Process" />
                <div className="absolute -bottom-6 md:-bottom-10 right-4 md:-right-10 bg-orange-600 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl z-20 min-w-[140px] md:min-w-0">
                  <span className="text-4xl md:text-6xl font-black italic block mb-1">15+</span>
                  <span className="text-[10px] md:text-[10px] font-black uppercase tracking-[0.3em]">Years of Glory</span>
                </div>
              </div>
            </div>
            <div className="pt-16 lg:pt-0">
              <h2 className="text-orange-600 font-black tracking-[0.4em] uppercase text-[10px] md:text-xs mb-4 md:mb-6">The Aswath Pedigree</h2>
              <h3 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 leading-none italic uppercase">Mastering the <br /> <span className="text-slate-400">Science of Clay.</span></h3>
              <p className="text-lg md:text-xl text-slate-500 mb-10 md:mb-12 leading-relaxed font-medium">Founded in 2009, Aswath Bricks leverages high-pressure hydraulic molding to ensure every brick exceeds ISI strength requirements.</p>
              <div className="grid sm:grid-cols-2 gap-8 md:gap-10">
                {highlights.map((h, i) => (
                  <div key={i} className="flex gap-4 md:gap-5">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-orange-500 shrink-0 shadow-lg">{h.icon}</div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase text-xs md:text-sm mb-1">{h.title}</h4>
                      <p className="text-[10px] md:text-xs text-slate-400 font-bold leading-relaxed">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      <section id="products" className="py-20 md:py-40 bg-slate-950 text-white px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-32">
            <h2 className="text-orange-500 font-black tracking-[0.5em] uppercase text-[9px] md:text-[11px] mb-4 md:mb-6">Master Inventory</h2>
            <h3 className="text-4xl md:text-[6rem] font-black tracking-tighter italic uppercase leading-none">Forged for <br /> <span className="text-slate-600">Permanence.</span></h3>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {products.map((p, i) => (
              <motion.div key={i} whileHover={{ y: -10 }} className="group relative bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] md:rounded-[4rem] p-4 md:p-5 border border-white/10">
                <div className="relative h-64 md:h-80 rounded-[2rem] md:rounded-[3rem] overflow-hidden mb-6 md:mb-8 shadow-2xl">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl border border-white/20">{p.icon}</div>
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] bg-orange-600 px-4 md:px-5 py-2 rounded-full">{p.size}</span>
                  </div>
                </div>
                <div className="px-4 md:px-6 pb-4 md:pb-6">
                  <h4 className="text-2xl md:text-3xl font-black italic uppercase mb-3 md:mb-4 tracking-tighter text-orange-500">{p.name}</h4>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-8 md:mb-10 font-medium opacity-80">{p.description}</p>
                  <button onClick={() => setIsModalOpen(true)} className="w-full py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] bg-white/5 border border-white/10 hover:bg-orange-600 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-all">Wholesale Price</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-20 md:py-40 px-4 md:px-6 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-12 md:gap-16 items-center">
           <div className="lg:col-span-1 text-center lg:text-left">
              <h2 className="text-orange-600 font-black tracking-[0.4em] uppercase text-xs mb-4">Client Stories</h2>
              <h3 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase leading-tight mb-6 md:mb-8">Voices of <br /> Satisfaction.</h3>
              <div className="flex justify-center lg:justify-start gap-2 text-orange-500">
                {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
              </div>
           </div>
           <div className="lg:col-span-2 grid md:grid-cols-2 gap-6 md:gap-8">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                  <p className="text-slate-600 text-base md:text-lg font-medium leading-relaxed mb-8 relative z-10 italic">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">{t.name[0]}</div>
                    <div>
                      <h5 className="font-black text-slate-900 uppercase text-xs">{t.name}</h5>
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-20 md:py-40 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 md:gap-12">
          <div className="lg:w-1/2 bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl order-2 lg:order-1">
            <h3 className="text-4xl md:text-6xl font-black italic uppercase leading-none mb-12 md:mb-16">Project <br /> Site <br /> <span className="text-orange-500">Support.</span></h3>
            <div className="space-y-10 md:space-y-12">
              <div className="flex gap-6 md:gap-8">
                <MapPin className="text-orange-500 shrink-0" size={24} />
                <div>
                  <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Corporate HQ</h6>
                  <p className="font-bold text-lg md:text-xl leading-tight">SS Tower, Pandian Nagar, Tiruppur</p>
                </div>
              </div>
              <div className="flex gap-6 md:gap-8">
                <Phone className="text-orange-500 shrink-0" size={24} />
                <div>
                  <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Primary Line</h6>
                  <p className="font-bold text-2xl md:text-3xl">+91 98420 48181</p>
                </div>
              </div>
              <div className="flex gap-6 md:gap-8">
                <Mail className="text-orange-500 shrink-0" size={24} />
                <div>
                  <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Inquiry</h6>
                  <p className="font-bold text-lg md:text-xl leading-tight">maswath55@gmail.com</p>
                </div>
              </div>
            </div>
            <div className="mt-12 md:mt-16 flex gap-4">
              {[Instagram, Facebook, Linkedin].map((Icon, idx) => (
                <a key={idx} href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-orange-600 transition-all border border-white/10"><Icon size={18}/></a>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 order-1 lg:order-2">
            <div className="h-[300px] md:h-full min-h-[400px] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden grayscale border-4 md:border-8 border-slate-50 shadow-xl">
              <iframe 
                title="Office Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125322.4415312762!2d77.25114798547363!3d11.10933454238711!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba9079979420083%3A0xc3c5f496350d534!2sTiruppur%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                className="w-full h-full border-none" 
                loading="lazy" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 md:py-20 bg-slate-950 text-center relative overflow-hidden px-4">
        <div className="relative z-10 flex flex-col items-center gap-8 md:gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black italic text-sm">A</div>
            <span className="font-black text-white tracking-tighter uppercase text-lg md:text-xl italic">Aswath <span className="text-orange-500">Bricks.</span></span>
          </div>
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 border-t border-white/5 pt-10 w-full max-w-xs md:max-w-none">© {new Date().getFullYear()} Aswath Bricks & Co. Engineered for Longevity.</p>
        </div>
      </footer>
    </div>
  );
};

export default AswathBricksPro;