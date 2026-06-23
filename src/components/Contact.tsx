import { useState, ChangeEvent, FormEvent } from "react";
import { BUSINESS_INFO, SERVICES } from "../data";
import { MessageSquare, Phone, Mail, MapPin, Send, MessageCircle } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    deliveryArea: "",
    selectedItem: SERVICES[0].title,
    message: "",
  });

  const [buttonLoading, setButtonLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setButtonLoading(true);

    // Format message text for WhatsApp API
    const textMessage = `Hello ${BUSINESS_INFO.name}! 👋
    
My name is *${formData.name}* ${formData.deliveryArea ? `located at *${formData.deliveryArea}*` : ""}.

I am looking to buy/reserve: *${formData.selectedItem}*
Inquiry Details: "${formData.message}"

Please let me know if this is currently in stock so we can finalize delivery!`;

    // Wait a brief simulated moment to make it look professional
    setTimeout(() => {
      setButtonLoading(false);
      window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(textMessage)}`, "_blank");
    }, 450);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${BUSINESS_INFO.email}?subject=Web Inquiry for ${BUSINESS_INFO.name}`;
  };

  const handlePhoneCall = () => {
    window.location.href = `tel:${BUSINESS_INFO.whatsappNumber}`;
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden text-left bg-bg-primary">
      {/* Decorative center halo for contact */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/3 rounded-full blur-[130px] -z-10 animate-pulse duration-5000" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-blue-600 dark:text-blue-400 font-extrabold mb-3">
            Contact {BUSINESS_INFO.name}
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Reserve Your Next Premium Device
          </h3>
          <p className="text-slate-600 dark:text-slate-300 font-light leading-relaxed">
            Fill out our active stock inquiry form or reach out directly to chat with our Lira-based sales representative.
          </p>
        </div>

        {/* Contact Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mb-16">
          
          {/* Left Column: Direct info panels */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between gap-6">
            
            <div className="space-y-6">
              <h4 className="font-display font-bold text-xl text-slate-900 dark:text-white">Direct Connect Info</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                Connect directly with our local retail consultants. We typically answer within 15 minutes during standard Lira business hours.
              </p>

              <div className="space-y-4">
                {/* Channel 1: WhatsApp Helpline */}
                <button
                  onClick={handlePhoneCall}
                  className="w-full glass-panel glass-panel-hover p-4 rounded-xl flex items-center gap-4 transition-all text-left group cursor-pointer shadow-sm border border-gray-200/50 dark:border-white/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block tracking-tight">Chat with Sales Rep</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{BUSINESS_INFO.whatsappDisplay}</span>
                  </div>
                </button>

                {/* Channel 2: Telephone Hotlines */}
                <button
                  onClick={handlePhoneCall}
                  className="w-full glass-panel glass-panel-hover p-4 rounded-xl flex items-center gap-4 transition-all text-left group cursor-pointer shadow-sm border border-gray-200/50 dark:border-white/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block tracking-tight">Sales Hotline</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{BUSINESS_INFO.phoneDisplay}</span>
                  </div>
                </button>

                {/* Channel 3: Email Address */}
                <button
                  onClick={handleEmailClick}
                  className="w-full glass-panel glass-panel-hover p-4 rounded-xl flex items-center gap-4 transition-all text-left group cursor-pointer shadow-sm border border-gray-200/50 dark:border-white/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block tracking-tight">Support Email Address</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{BUSINESS_INFO.email}</span>
                  </div>
                </button>

                {/* Channel 4: Lira HQ physical address */}
                <div className="glass-panel p-4 rounded-xl flex items-center gap-4 shadow-sm border border-gray-200/50 dark:border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block tracking-tight">Lira Retail Office</span>
                    <span className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{BUSINESS_INFO.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support working hours message */}
            <div className="glass-panel p-4 rounded-xl border border-gray-200/50 dark:border-white/5">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-450 block uppercase mb-1">Stock Dispatch Hours</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                Active retail sales are open Mondays through Saturdays from 08:30 AM to 06:30 PM East African Time. Fast doorstep delivery dispatch operates until 05:30 PM daily.
              </p>
            </div>

          </div>

          {/* Right Column: Direct dynamic WhatsApp Inquiry Planner */}
          <div className="lg:col-span-12 xl:col-span-7 glass-panel rounded-[2.5rem] p-6 md:p-8 relative shadow-sm border border-gray-200/50 dark:border-white/5">
            
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-mono mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
              Dynamic Store Catalog Request
            </span>

            <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-4">
              Instant In-Stock Verification
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-light leading-relaxed mb-6">
              Select your desired flagship item and type your questions. Clicking submits and pre-compiles your order into a formatted chat template to verify with our live inventory managers immediately.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field: Full Name */}
                <div>
                  <label htmlFor="name" className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5 font-bold">Your Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Ronald Ssubi"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50/50 dark:bg-slate-950/40 border border-gray-300 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs rounded-xl p-3.5 text-slate-800 dark:text-white transition-all outline-none"
                  />
                </div>

                {/* Field: Delivery Area */}
                <div>
                  <label htmlFor="deliveryArea" className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5 font-bold">Delivery Zone / Town</label>
                  <input
                    type="text"
                    id="deliveryArea"
                    name="deliveryArea"
                    placeholder="e.g. Lira Town, Plot 2 Road"
                    value={formData.deliveryArea}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50/50 dark:bg-slate-950/40 border border-gray-300 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs rounded-xl p-3.5 text-slate-800 dark:text-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Field: Item selector */}
              <div>
                <label htmlFor="selectedItem" className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5 font-bold">Flagship Gadget Group *</label>
                <select
                  id="selectedItem"
                  name="selectedItem"
                  value={formData.selectedItem}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50/50 dark:bg-slate-950/40 border border-gray-300 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs rounded-xl p-3.5 text-slate-800 dark:text-white transition-all outline-none cursor-pointer"
                >
                  {SERVICES.map((s, i) => (
                    <option key={i} value={s.title} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">{s.title} ({s.priceStart})</option>
                  ))}
                  <option value="Custom multi gadget bulk set" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">Other Accessory / Custom Bulk Order</option>
                </select>
              </div>

              {/* Field: Message */}
              <div>
                <label htmlFor="message" className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5 font-bold">Inquiry Details *</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  placeholder="Specify model, preferred storage/color (e.g. iPhone 15 Pro Max 256GB Natural Titanium)..."
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50/50 dark:bg-slate-950/40 border border-gray-300 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs rounded-xl p-3.5 text-slate-800 dark:text-white transition-all resize-none outline-none"
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                id="contact-form-submit"
                className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 cursor-pointer flex items-center justify-center gap-2 shadow-sm group hover:scale-[1.01] transition-transform"
              >
                {buttonLoading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 text-emerald-50" />
                    <span>Inquire via WhatsApp Catalog</span>
                    <Send className="w-3.5 h-3.5 text-green-100 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

          </div>

        </div>

        {/* Clean responsive Google Map iFrame card */}
        <div id="office-map-component" className="w-full h-80 glass-panel rounded-[2.5rem] overflow-hidden p-2 shadow-sm border border-gray-200/50 dark:border-white/5">
          <iframe
            title={`${BUSINESS_INFO.name} office location - Juba Road, Lira`}
            src={BUSINESS_INFO.googleMapsEmbed}
            className="w-full h-full rounded-2xl border-0 opacity-95 hover:opacity-100 transition-all duration-500"
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

      </div>
    </section>
  );
}
