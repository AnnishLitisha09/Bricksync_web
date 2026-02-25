import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight, Award, Clock,
  Facebook,
  Instagram, Linkedin,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Truck,
  X,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Note: Ensure your BASE_URL is correctly exported from your api file
import { BASE_URL } from "../../../api/base";

// --- Configuration & Data ---
const highlights = [
  { icon: <Clock className="w-5 h-5" />, title: "15+ Years", desc: "Serving TN construction since 2009." },
  { icon: <Award className="w-5 h-5" />, title: "Official Dealer", desc: "Certified Dalmia & Maha Cement Partner." },
  { icon: <Truck className="w-5 h-5" />, title: "Own Logistics", desc: "Fleet of 12+ vehicles for rapid delivery." },
  { icon: <ShieldCheck className="w-5 h-5" />, title: "Lab Tested", desc: "ISI Standard compressive strength testing." },
];

const products = [
  { id: "01", name: "Hollow Bricks Hollows", icon: "🧱", size: "4\", 6\", 8\", 9\"", description: "Precision-molded with advanced vibration technology for superior bonding and thermal insulation.", imageUrl: "https://imgs.search.brave.com/UCdh5oqt7EL3Xfk5tV3B1KcQiz-SOddxY3MP0l4TNWY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93b3Jk/cHJlc3MuYnJpY2tu/Ym9sdC5jb20vYmxv/Z3MtYW5kLWFydGlj/bGVzL3dwLWNvbnRl/bnQvdXBsb2Fkcy9z/aXRlcy8yLzIwMjQv/MTEvSG9sbG93LUNl/bWVudC1Ccmlja3Mt/VHlwZXMtQmVuZWZp/dHMtQXBwbGljYXRp/b25zLndlYnA" },
  { id: "02", name: "Red Stones", icon: "💎", size: "Standard / Custom", description: "Hard-mined natural foundation stones sourced from premium quarries for heavy-load bearing.", imageUrl: "https://imgs.search.brave.com/B64R8-wWuKt0HYOcigVBSofMOzlzb5_9GkYS4JiDM9g/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjUv/NjU5LzEyMC9zbWFs/bC9zdGFja2VkLXJl/ZC1icmlja3MtYS1k/ZXRhaWxlZC12aWV3/LW9mLWNvbnN0cnVj/dGlvbi1tYXRlcmlh/bC1mcmVlLXBob3Rv/LmpwZWc" },
  { id: "03", name: "Fly Ash Bricks", icon: "🌿", size: "9 x 4 x 3", description: "Eco-friendly alternatives with high dimensional accuracy and reduced mortar consumption.", imageUrl: "https://imgs.search.brave.com/SQtLsKBrd7VM7FeXttHx0WK4XxzMw4Ne55iVEYfvLz8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tY2Nv/eW1hcnQuY29tL3Bv/c3Qvd3AtY29udGVu/dC93ZWJwLWV4cHJl/c3Mvd2VicC1pbWFn/ZXMvdXBsb2Fkcy8w/OC1NYXktMjQtRmx5/LUFzaC1Ccmlja3Mt/QS5qcGcud2VicA" },
  { id: "04", name: "M-Sand & P-Sand", icon: "🏜️", size: "Triple Washed", description: "Silt-free Karur sand. P-Sand for smooth plastering and M-Sand for high-strength concrete.", imageUrl: "https://imgs.search.brave.com/L0M_3TJYY7I8RHoInozI4UN55NRMZ8JJLXyvJLBr8zA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly81Lmlt/aW1nLmNvbS9kYXRh/NS9EUi9GVS9NWS02/MzU0ODIwOC9tc2Fu/ZC0xMDAweDEwMDAu/anBn" },
  {
    id: "05",
    name: "Jalli (Aggregates)",
    icon: "⛰️",
    size: "6mm, 12mm, 20mm, 40mm",
    description: "High-quality crushed blue metal stone. Ideal for RCC works, flooring base, and heavy-duty concrete construction.",
    imageUrl: "https://imgs.search.brave.com/M0uYqUR_4jLqd49lSAppNguitBU9hvusPqcnLlGEBj8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly81Lmlt/aW1nLmNvbS9kYXRh/NS9TRUxMRVIvRGVm/YXVsdC8yMDI0LzUv/NDIwMzk1NDQ1L0RB/L0tBL0ZJLzc3MTg4/MzIvMjBtbS00MG1t/LWFnZ3JlZ2F0ZXMt/amFsbGktc3RvbmUt/NTAweDUwMC5qcGc"
  },
  { id: "06", name: "Premium Cement", icon: "💎", size: "Grade 53/43", description: "Authorized distribution of Dalmia Gold and Maha Cement for long-lasting structural life.", imageUrl: "https://imgs.search.brave.com/wpyzRXKdRF7WB0Liwmk8M2owqFS-NvmsRyRuqZZT-HA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNzUv/ODUwLzY0MC9zbWFs/bC9zdGFja2VkLWNl/bWVudC1iYWdzLXdp/dGgtdHJvd2VsLWFu/ZC1sb29zZS1tYXRl/cmlhbC1uZWFyYnkt/cGhvdG8uanBn" },
];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const AswathBricksPro: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState({ phone: "", email: "" });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toLowerCase())) return false;

    const dummyEmails = [
      "example@gmail.com",
      "test@test.com",
      "test@gmail.com",
      "admin@gmail.com",
      "user@gmail.com",
      "dummy@gmail.com",
      "name@company.com", // Placeholder in UI
    ];
    if (dummyEmails.includes(email.toLowerCase())) return false;

    return true;
  };

  const validatePhone = (phone: string) => /^\d{10}$/.test(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    const newErrors = { phone: "", email: "" };

    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
      hasError = true;
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid, non-dummy email address.";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setErrors({ phone: "", email: "" });
    setIsSubmitting(true);
    setLoadingStage("Verifying Details...");
    await new Promise(r => setTimeout(r, 800));
    setLoadingStage("Notifying Sales Team...");

    try {
      const response = await fetch(`${BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setLoadingStage("Syncing with Dispatch...");
        await new Promise(r => setTimeout(r, 1000));
        setIsSuccess(true);
        setFormData({ name: "", phone: "", email: "" });
        setTimeout(() => {
          setIsModalOpen(false);
          setIsSuccess(false);
          setIsSubmitting(false);
        }, 3000);
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      alert("Submission error. Please try again.");
      setIsSubmitting(false);
    }
  };

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Products", href: "#products" },
    { name: "Contact", href: "#contact" }
  ];

  const [secretClicks, setSecretClicks] = useState(0);
  useEffect(() => {
    if (secretClicks >= 5) navigate("/login");
  }, [secretClicks, navigate]);

  const handleSecretClick = () => {
    setSecretClicks((prev) => prev + 1);
    const timeout = setTimeout(() => setSecretClicks(0), 2000);
    return () => clearTimeout(timeout);
  };

  return (
    <div className="bg-[#fafafa] text-slate-950 selection:bg-orange-500 selection:text-white font-sans antialiased overflow-x-hidden scroll-smooth">
      <motion.div className="fixed top-0 left-0 right-0 h-[4px] bg-orange-600 z-[2001] origin-left" style={{ scaleX }} />

      {/* Floating WhatsApp */}
      <a href="https://wa.me/919843083521" target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[1001] bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group">
        <span className="hidden md:block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold text-sm whitespace-nowrap px-0 group-hover:px-2">WhatsApp Us</span>
        <MessageCircle size={24} className="md:w-7 md:h-7" />
      </a>

      {/* MODAL WITH ENHANCED LOADING */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[2005] flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!isSubmitting) setIsModalOpen(false) }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden p-8 md:p-14">
              {!isSubmitting && !isSuccess && (
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-950 transition-colors"><X size={24} /></button>
              )}
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-10">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-3xl font-black uppercase italic mb-2">Request Received!</h3>
                    <p className="text-slate-500 font-medium">Our managers are coordinating your quote now.</p>
                  </motion.div>
                ) : isSubmitting ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12">
                    <div className="relative w-24 h-24 mb-8">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-0 border-4 border-orange-100 border-t-orange-600 rounded-full" />
                      <div className="absolute inset-0 flex items-center justify-center"><Truck className="text-orange-600 animate-bounce" size={32} /></div>
                    </div>
                    <motion.p key={loadingStage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-orange-600 font-black uppercase tracking-widest text-xs">{loadingStage}</motion.p>
                  </motion.div>
                ) : (
                  <motion.div key="form">
                    <div className="mb-8 md:mb-10">
                      <h3 className="text-3xl md:text-4xl font-black italic uppercase leading-none mb-2">Build <span className="text-orange-500">Stronger.</span></h3>
                      <p className="text-slate-500 text-xs md:text-sm font-medium">Professional quotation for bulk or retail requirements.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                        <input required value={formData.name} type="text" placeholder="John Doe" className="w-full px-6 md:px-8 py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all text-sm" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Contact Number</label>
                        <input
                          required
                          value={formData.phone}
                          type="tel"
                          placeholder="00000 00000"
                          className={`w-full px-6 md:px-8 py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all text-sm ${errors.phone ? 'ring-2 ring-red-500' : ''}`}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 10) setFormData({ ...formData, phone: val });
                          }}
                        />
                        {errors.phone && <p className="text-red-500 text-[10px] ml-4 font-bold">{errors.phone}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email Address</label>
                        <input required value={formData.email} type="email" placeholder="name@company.com" className={`w-full px-6 md:px-8 py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all text-sm ${errors.email ? 'ring-2 ring-red-500' : ''}`} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        {errors.email && <p className="text-red-500 text-[10px] ml-4 font-bold">{errors.email}</p>}
                      </div>
                      <button className="w-full bg-slate-950 text-white py-5 md:py-6 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:bg-orange-600 transition-all flex items-center justify-center gap-3 mt-4">
                        Request Estimate <Send size={16} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-[1000] transition-all duration-500 ${scrolled ? "py-3 md:py-4" : "py-6 md:py-10"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className={`flex justify-between items-center px-5 md:px-8 py-3 md:py-4 rounded-full transition-all duration-500 ${scrolled ? "bg-white/80 backdrop-blur-xl shadow-xl border border-white/20" : "bg-transparent"}`}>
            <div className="flex items-center gap-2 md:gap-3 group cursor-pointer" onClick={handleSecretClick}>
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

      {/* CONTACT SECTION - NEWLY UPDATED */}
      <section id="contact" className="py-24 md:py-44 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div>
              <h2 className="text-orange-600 font-black tracking-[0.4em] uppercase text-[10px] md:text-xs mb-6">Dispatch & Logistics</h2>
              <h3 className="text-5xl md:text-8xl font-black tracking-tighter italic uppercase leading-[0.85] mb-12">Get in <br /> <span className="text-slate-300">Touch.</span></h3>

              <div className="space-y-12">
                <div className="flex gap-8 group cursor-pointer">
                  <div className="w-16 h-16 bg-slate-950 text-orange-500 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                    <Phone size={28} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Sales Hotline</h4>
                    <p className="text-2xl md:text-3xl font-black italic">+91 98420 48181 , 9843083521</p>
                    <p className="text-slate-400 font-medium text-sm mt-1">Available Mon-Sat, 7AM - 8PM</p>
                  </div>
                </div>

                <div className="flex gap-8 group cursor-pointer">
                  <div className="w-16 h-16 bg-slate-950 text-orange-500 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                    <Mail size={28} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email Inquiry</h4>
                    <p className="text-2xl md:text-3xl font-black italic">bricksync001@gmail.com</p>
                    <p className="text-slate-400 font-medium text-sm mt-1">Response within 24 business hours.</p>
                  </div>
                </div>

                <div className="flex gap-8 group cursor-pointer">
                  <div className="w-16 h-16 bg-slate-950 text-orange-500 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                    <MapPin size={28} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Main Plant</h4>
                    <p className="text-xl md:text-2xl font-black italic leading-tight">SS tower, Pandian nagar bus stop<br /> Pn road, Tiruppur, Tamil Nadu - 641604</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Map Container - Matches the rounded style of your icon boxes */}
              <div className="aspect-square bg-slate-950 rounded-[3rem] md:rounded-[5rem] overflow-hidden border-[12px] md:border-[24px] border-slate-50 relative group shadow-2xl">

                {/* Google Maps Embed pinned at 11.166174, 77.349766 */}
                <iframe
                  title="Aswath Bricks Location"
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3913.626815310706!2d77.349766!3d11.166174!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDA5JzU4LjIiTiA3N8KwMjAnNTkuMiJF!5e0!3m2!1sen!2sin!4v1708420000000!5m2!1sen!2sin&q=11.166174,77.349766"
                  className="w-full h-full grayscale contrast-125 opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 scale-105 group-hover:scale-100"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                ></iframe>

                {/* External Link Button - Pinned to the top right */}
                <div className="absolute top-8 right-8 md:top-12 md:right-12">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=11.166174,77.349766"
                    target="_blank"
                    rel="noreferrer"
                    className="w-16 h-16 bg-orange-600 text-white rounded-3xl flex items-center justify-center shadow-2xl hover:bg-slate-950 hover:scale-110 transition-all duration-500"
                  >
                    <ExternalLink size={28} />
                  </a>
                </div>

                {/* Interactive Overlay Text */}
                <div className="absolute bottom-10 left-10 pointer-events-none">
                  <p className="text-white font-black italic uppercase tracking-tighter text-2xl md:text-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                    Our <span className="text-orange-500">Location</span>
                  </p>
                </div>
              </div>

              {/* Decorative Background Glow */}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER - EXPANDED */}
      <footer className="bg-slate-950 pt-24 pb-12 px-4 md:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-24">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl">A</div>
                <span className="font-black text-white tracking-tighter uppercase text-2xl italic">Aswath <span className="text-orange-500">Bricks.</span></span>
              </div>
              <p className="text-slate-500 text-lg font-medium max-w-sm mb-8 leading-relaxed">
                Leading South India's construction material supply chain with quality-certified bricks, stones, and high-grade sands.
              </p>
              <div className="flex gap-4">
                {[<Instagram size={20} />, <Facebook size={20} />, <Linkedin size={20} />].map((icon, i) => (
                  <a key={i} href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-orange-600 hover:text-white transition-all">
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Navigation</h4>
              <ul className="space-y-4">
                {navLinks.map(link => (
                  <li key={link.name}>
                    <a href={link.href} className="text-slate-500 hover:text-orange-500 font-bold uppercase text-[11px] tracking-widest transition-colors">{link.name}</a>
                  </li>
                ))}
                <li><button onClick={() => setIsModalOpen(true)} className="text-slate-500 hover:text-orange-500 font-bold uppercase text-[11px] tracking-widest transition-colors">Request Quote</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Certifications</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-widest"><ShieldCheck size={14} className="text-orange-600" /> ISI Standard 1077</li>
                <li className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-widest"><ShieldCheck size={14} className="text-orange-600" /> ISO 9001:2015</li>
                <li className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-widest"><ShieldCheck size={14} className="text-orange-600" /> MSME Certified</li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
              © {new Date().getFullYear()} Aswath Bricks & Co. Engineered for Longevity.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-orange-500 transition-colors">Privacy Policy</a>
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-orange-500 transition-colors">Terms of Supply</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AswathBricksPro;