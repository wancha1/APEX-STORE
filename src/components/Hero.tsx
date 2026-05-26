import { ArrowRight, MessageSquare, BadgeCheck, Zap, Laptop, Clock } from "lucide-react";
import { BUSINESS_INFO, STATS } from "../data";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export default function Hero() {
  const [timeStr, setTimeStr] = useState("07:21:10");

  useEffect(() => {
    // Show current Uganda local time (UTC+3) format nicely
    const updateUgTime = () => {
      const ugTime = new Date(new Date().getTime() + (new Date().getTimezoneOffset() + 180) * 60000);
      const hours = String(ugTime.getHours()).padStart(2, "0");
      const minutes = String(ugTime.getMinutes()).padStart(2, "0");
      const seconds = String(ugTime.getSeconds()).padStart(2, "0");
      setTimeStr(`${hours}:${minutes}:${seconds}`);
    };
    const interval = setInterval(updateUgTime, 1000);
    updateUgTime();
    return () => clearInterval(interval);
  }, []);

  const handleWhatsAppConsultation = () => {
    const defaultMsg = encodeURIComponent(`Hello ${BUSINESS_INFO.name}, I checked your online tech showroom. I am looking to get pricing and check stock availability for a premium device upgrade!`);
    window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${defaultMsg}`, "_blank");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section
      id="hero"
      className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-grid-white text-left"
    >
      {/* Decorative Blur Blobs - Frosted Style */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/15 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/15 rounded-full blur-[120px] -z-10 animate-pulse duration-4000" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <motion.div
            className="lg:col-span-12 xl:col-span-7 flex flex-col align-start text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Location Tag */}
            <motion.div variants={itemVariants} className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Lira, Uganda | Premium Flagship
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-7xl font-display font-extrabold leading-[1.05] tracking-tight text-white mb-6"
            >
              Discover Ultimate Genuine Gadgets & {" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Premium Tech
              </span>
            </motion.h1>

            {/* Supporting Intro */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-slate-400 font-light leading-relaxed max-w-2xl mb-8"
            >
              {BUSINESS_INFO.subTagline} Backed by immediate local customer support, certified warranties, and instant mobile money refund flows.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10"
            >
              <button
                id="hero-cta-whatsapp"
                onClick={handleWhatsAppConsultation}
                className="px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-blue-600/20"
              >
                <MessageSquare className="w-5 h-5 text-blue-100" />
                <span>Order on WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                id="hero-secondary-services"
                href="#services"
                className="px-6 py-4 rounded-2xl font-semibold text-white bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-center gap-2 text-center"
              >
                View Tech Categories
              </a>
            </motion.div>

            {/* Quick trust metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-2 gap-4 max-w-lg border-t border-white/10 pt-8"
            >
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-sm font-medium text-slate-300">100% Genuine Sealed Brands</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-purple-400 shrink-0" />
                <span className="text-sm font-medium text-slate-300">Official Local Brand Warranties</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Right Content - Futuristic Interactive Mockup Dashboard */}
          <motion.div
            className="lg:col-span-12 xl:col-span-5 relative"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          >
            {/* Graphic card borders */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-600/10 rounded-[2rem] blur-2xl -z-10" />

            {/* Device frame Mockup - Frosted Glass Container */}
            <div className="w-full bg-white/4 border border-white/10 backdrop-blur-md rounded-[2rem] overflow-hidden p-6 max-w-md mx-auto shadow-2xl shadow-black/40 relative text-left">
              {/* Top notch detail */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>{BUSINESS_INFO.name.toLowerCase().replace(/\s+/g, "_")}_live_catalog.ts</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-sm">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{timeStr} EAT</span>
                </div>
              </div>

              {/* Status Header */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-300">Showroom Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    DISPATCH HOUSE ACTIVE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-white/3 p-2.5 rounded-xl border border-white/5">
                    <div className="text-sm font-display font-extrabold text-white">Lira Juba Rd</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-tight">Main Retail Showroom</div>
                  </div>
                  <div className="bg-white/3 p-2.5 rounded-xl border border-white/5">
                    <div className="text-sm font-display font-extrabold text-blue-400">Same-Day</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-tight">Dispatch Home Delivery</div>
                  </div>
                </div>
              </div>

              {/* Live order mockup visualization */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <h4 className="font-mono text-xs text-purple-300 mb-3 uppercase tracking-wider">Fast 3-Step WhatsApp Order Cycle</h4>
                
                <div className="space-y-3 font-mono text-[11px]">
                  {/* Step 1 */}
                  <div className="flex items-start gap-2 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/10 text-blue-200">
                    <span className="bg-blue-500/20 text-blue-300 font-bold px-1.5 rounded text-[10px]">1</span>
                    <div>
                      <p className="font-medium text-white">Select Product Configuration</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Pick phone, laptop, or display and accessories</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-2 bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/10 text-purple-200">
                    <span className="bg-purple-500/20 text-purple-300 font-bold px-1.5 rounded text-[10px]">2</span>
                    <div>
                      <p className="font-medium text-white">Secure WhatsApp Order Form</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Click compiles bill detail; instantly alerts dispatcher</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Delivery Agent Transit Dispatch</span>
                      <span className="text-emerald-400 font-semibold">Status: IN-FLIGHT</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full w-[90%] animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Float decor for high premium look */}
              <div className="absolute -bottom-4 -left-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 shadow-lg flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500">
                  🛡️
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Brand Sealed Protection</div>
                  <div className="text-[9px] text-slate-500">100% Genuine Certified</div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>


    </section>
  );
}
