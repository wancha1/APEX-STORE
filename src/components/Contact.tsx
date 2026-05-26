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

Please let me know if this is currently in stock at the showroom so we can finalize delivery!`;

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
    <section id="contact" className="py-24 relative overflow-hidden text-left">
      {/* Decorative center halo for contact */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[130px] -z-10 animate-pulse duration-5000" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-blue-400 font-extrabold mb-3">
            Contact {BUSINESS_INFO.name}
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight mb-4">
            Reserve Your Next Premium Device
          </h3>
          <p className="text-slate-400 font-light leading-relaxed">
            Fill out our active showroom stock inquiry form or reach out directly to chat with our Lira-based sales representative.
          </p>
        </div>

        {/* Contact Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mb-16">
          
          {/* Left Column: Direct info panels */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between gap-6">
            
            <div className="space-y-6">
              <h4 className="font-display font-bold text-xl text-white">Direct Connect Info</h4>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Connect directly with our local retail consultants. We typically answer within 15 minutes during standard Lira business hours.
              </p>

              <div className="space-y-4">
                {/* Channel 1: WhatsApp Helpline */}
                <button
                  onClick={handlePhoneCall}
                  className="w-full bg-white/4 border border-white/8 hover:border-white/15 hover:bg-white/10 p-4 rounded-xl flex items-center gap-4 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block tracking-tight">Chat with Sales Rep</span>
                    <span className="text-sm font-semibold text-white font-mono">{BUSINESS_INFO.whatsappDisplay}</span>
                  </div>
                </button>

                {/* Channel 2: Telephone Hotlines */}
                <button
                  onClick={handlePhoneCall}
                  className="w-full bg-white/4 border border-white/8 hover:border-white/15 hover:bg-white/10 p-4 rounded-xl flex items-center gap-4 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block tracking-tight">Sales Hotline</span>
                    <span className="text-sm font-semibold text-white font-mono">{BUSINESS_INFO.phoneDisplay}</span>
                  </div>
                </button>

                {/* Channel 3: Email Address */}
                <button
                  onClick={handleEmailClick}
                  className="w-full bg-white/4 border border-white/8 hover:border-white/15 hover:bg-white/10 p-4 rounded-xl flex items-center gap-4 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block tracking-tight">Showroom Digital Mailbox</span>
                    <span className="text-sm font-semibold text-white font-mono">{BUSINESS_INFO.email}</span>
                  </div>
                </button>

                {/* Channel 4: Lira HQ physical address */}
                <div className="bg-white/4 border border-white/8 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block tracking-tight">Lira Showroom Lounge</span>
                    <span className="text-xs text-white leading-relaxed">{BUSINESS_INFO.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support working hours message */}
            <div className="bg-white/3 border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] font-mono font-bold text-blue-400 block uppercase mb-1">Stock Dispatch Hours</span>
              <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                Active showroom sales are open Mondays through Saturdays from 08:30 AM to 06:30 PM East African Time. Fast doorstep delivery dispatch operates until 05:30 PM daily.
              </p>
            </div>

          </div>

          {/* Right Column: Direct dynamic WhatsApp Inquiry Planner */}
          <div className="lg:col-span-12 xl:col-span-7 bg-white/4 border border-white/10 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 relative">
            
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Dynamic Showroom Catalog Request
            </span>

            <h4 className="font-display font-bold text-white text-lg mb-4">
              Instant In-Stock Verification
            </h4>
            <p className="text-xs text-slate-400 font-light leading-relaxed mb-6">
              Select your desired flagship item and type your questions. Clicking submits and pre-compiles your order into a formatted chat template to verify with our live inventory managers immediately.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field: Full Name */}
                <div>
                  <label htmlFor="name" className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold">Your Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Ronald Ssubi"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-xs rounded-xl p-3.5 text-white transition-all outline-none"
                  />
                </div>

                {/* Field: Delivery Area */}
                <div>
                  <label htmlFor="deliveryArea" className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold">Delivery Zone / Town</label>
                  <input
                    type="text"
                    id="deliveryArea"
                    name="deliveryArea"
                    placeholder="e.g. Lira Town, Plot 2 Road"
                    value={formData.deliveryArea}
                    onChange={handleInputChange}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-xs rounded-xl p-3.5 text-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Field: Item selector */}
              <div>
                <label htmlFor="selectedItem" className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold">Flagship Gadget Group *</label>
                <select
                  id="selectedItem"
                  name="selectedItem"
                  value={formData.selectedItem}
                  onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-xs rounded-xl p-3.5 text-white transition-all outline-none cursor-pointer"
                >
                  {SERVICES.map((s, i) => (
                    <option key={i} value={s.title}>{s.title} ({s.priceStart})</option>
                  ))}
                  <option value="Custom multi gadget bulk set">Other Accessory / Custom Bulk Order</option>
                </select>
              </div>

              {/* Field: Message */}
              <div>
                <label htmlFor="message" className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold">Inquiry Details *</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  placeholder="Specify model, preferred storage/color (e.g. iPhone 15 Pro Max 256GB Natural Titanium)..."
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-xs rounded-xl p-3.5 text-white transition-all resize-none outline-none"
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                id="contact-form-submit"
                className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-green-500/15 group hover:scale-[1.01] transition-transform"
              >
                {buttonLoading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 text-emerald-100" />
                    <span>Inquire via WhatsApp Catalog</span>
                    <Send className="w-3.5 h-3.5 text-green-200 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

          </div>

        </div>

        {/* Clean responsive Google Map iFrame card */}
        <div id="office-map-component" className="w-full h-80 bg-white/3 border border-white/10 rounded-[2.5rem] overflow-hidden p-2 shadow-2xl">
          <iframe
            title={`${BUSINESS_INFO.name} office location - Juba Road, Lira`}
            src={BUSINESS_INFO.googleMapsEmbed}
            className="w-full h-full rounded-2xl border-0 grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-500"
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

      </div>
    </section>
  );
}
