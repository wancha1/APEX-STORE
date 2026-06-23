import { Check, Target, Eye, Award } from "lucide-react";
import { BUSINESS_INFO } from "../data";

export default function About() {
  return (
    <section id="about" className="py-24 relative overflow-hidden text-left">
      {/* Dynamic top corner blurry aura */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[130px] -z-10 animate-pulse duration-5000" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-[#F68B1E] dark:text-[#f7993a] font-extrabold mb-3">
            Our Legacy of Authenticity
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Bringing Genuine Modern Tech To Lira
          </h3>
          <p className="text-slate-600 dark:text-slate-300 font-light leading-relaxed">
            {BUSINESS_INFO.name} is northern Uganda's trusted online retail marketplace based in Lira Town. We specialize in sourcing brand-sealed laptops, global smartphones, smart TVs, and sound systems, backed by secure local warranties and fast, reliable hometown distribution networks.
          </p>
        </div>

        {/*
        Company Overview & Mission Split Grid (Disabled per user request)
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mb-16">
          
          <div className="lg:col-span-12 xl:col-span-6 flex flex-col gap-6">
            
            <div className="glass-panel glass-panel-hover rounded-[2rem] p-6 md:p-8 backdrop-blur-md flex gap-5">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
                <Target className="w-6 h-6" />
               </div>
              <div>
                <h4 className="font-display font-bold text-lg text-white mb-2">Our Mission</h4>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                   To democratize access to high-end genuine consumer technology for families, professionals, and corporate offices in northern Uganda, providing authentic products with uncompromised customer service.
                </p>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover rounded-[2rem] p-6 md:p-8 backdrop-blur-md flex gap-5">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 shrink-0">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-white mb-2">Our Vision</h4>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                   To establish {BUSINESS_INFO.name} as East Africa's most recommended and trusted electronics brand, recognized for introducing robust local warranty standards and premium on-delivery support.
                </p>
              </div>
            </div>

          </div>

          <div className="lg:col-span-12 xl:col-span-6 glass-panel glass-panel-hover rounded-[2rem] p-6 md:p-8 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-xl text-white">Why Tech Lovers Trust {BUSINESS_INFO.name}</h4>
              </div>
              <p className="text-sm text-slate-400 font-light leading-relaxed mb-6">
                 Unlike informal traders, we are fully licensed partners of official global tech distributors. We guarantee that every coin you invest goes toward buying direct-from-factory, authentic technology.
              </p>
              
              <ul className="space-y-3.5">
                {[
                  "100% Guaranteed Factory-Sealed Box Deliveries",
                  "Free live demonstrations and initial data transfer setup assistants in Lira",
                  "Flexible payment channels via MTN Mobile Money, Airtel Money, or Cash-on-Delivery",
                  "Verified manufacturer warranties of up to 3 Years on elite tech lines",
                  "Comprehensive, immediate software setup of Windows and Office Suites",
                  "Dedicated phone line & immediate replacement policy on active defects"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-[#F68B1E] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
        */}

        {/* Localized Location Anchor Banner */}
        <div className="p-6 md:p-8 glass-panel rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-200/50 dark:border-white/5">
          <div>
            <span className="text-[10px] font-mono uppercase bg-[#F68B1E]/10 text-[#F68B1E] dark:text-[#f7993a] tracking-widest px-2.5 py-1 rounded border border-[#F68B1E]/30 font-semibold mb-2 inline-block">
              LOCAL PICKUP STATION
            </span>
            <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1.5">
              Based in Lira, Uganda (Juba Road PlotHQ Center)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-light max-w-2xl">
              Do you prefer face-to-face assistance or collecting your order in person rather than home shipping? Our distribution center and pickup station is open 6 days a week directly on Juba Road, Lira Town. Visit us to collect, verify and configure your items.
            </p>
          </div>
          <a
            href="#contact"
            className="px-6 py-3 rounded-xl border border-gray-300 dark:border-white/10 hover:border-[#F68B1E] hover:bg-gray-100/50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all text-center shrink-0 w-full md:w-auto cursor-pointer"
          >
            Find Our Direct Hub Location
          </a>
        </div>

      </div>
    </section>
  );
}
