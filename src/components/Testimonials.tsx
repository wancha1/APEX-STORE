import { TESTIMONIALS, BUSINESS_INFO } from "../data";
import { Star, Quote, MessageSquare, Smartphone } from "lucide-react";

export default function Testimonials() {
  const handleConsultation = () => {
    const defaultMsg = encodeURIComponent(`Hello ${BUSINESS_INFO.name}, I checked your customer reviews on the storefront. I'd love to chat with a representative about currently available stock!`);
    window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${defaultMsg}`, "_blank");
  };

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden text-left bg-bg-primary">
      {/* Decorative center glow for testimonials */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/3 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-[#8b5cf6] dark:text-purple-400 font-extrabold mb-3">
            Real Customer Satisfaction
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 text-center">
            Loved By Tech Enthusiasts Across Uganda
          </h3>
          <p className="text-slate-600 dark:text-slate-300 font-light leading-relaxed text-center">
            See how {BUSINESS_INFO.name} has delivered authentic top-tier gadgets, verified brand warranties, and fast doorstep setups to local retail buyers and modern corporate offices.
          </p>
        </div>

        {/* Testimonials Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {TESTIMONIALS.map((test, idx) => (
            <div
              key={idx}
              className="glass-panel glass-panel-hover rounded-[2rem] p-6 md:p-8 hover:shadow-md border border-gray-200/50 dark:border-white/5 flex flex-col justify-between relative"
            >
              {/* Quote Mark Design Accent */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-gray-150/40 dark:text-white/5 pointer-events-none" />

              <div>
                {/* Visual Stars */}
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(test.rating)].map((_, i) => (
                     <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>

                {/* Main Quote text */}
                <p className="text-sm text-slate-600 dark:text-slate-300 font-light leading-relaxed italic mb-8">
                  "{test.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="border-t border-gray-150/50 dark:border-white/5 pt-5 flex items-center justify-between">
                <div className="text-left">
                  <h5 className="font-display font-bold text-slate-900 dark:text-white text-sm">
                    {test.name}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {test.role}, <span className="text-blue-600 dark:text-blue-400 font-medium">{test.company}</span>
                  </p>
                </div>
                
                {/* Location Badge */}
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-gray-50/50 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-gray-200/50 dark:border-white/5 shrink-0 select-none">
                  {test.location}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Trust Banner */}
        <div className="text-center glass-panel rounded-[2.5rem] p-6 md:p-8 max-w-4xl mx-auto shadow-sm border border-gray-200/50 dark:border-white/5">
          <h4 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">
            Ready to secure genuine tech with complete peace of mind?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light mb-6 max-w-2xl mx-auto">
            Connect directly with our Juba Road sales representatives today to verify real-time inventory levels, request custom delivery setup, or register an official device warranty.
          </p>
          <button
            onClick={handleConsultation}
            className="px-8 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 cursor-pointer mx-auto hover:scale-[1.02] shadow-md transition-all"
          >
            <Smartphone className="w-4 h-4" />
            <span>Check Live Stock</span>
          </button>
        </div>

      </div>
    </section>
  );
}
