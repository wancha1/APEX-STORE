import { useEffect } from "react";
import Header from "./components/Header";
import Services from "./components/Services";
import WhyChooseUs from "./components/WhyChooseUs";
import About from "./components/About";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppFloating from "./components/WhatsAppFloating";
import CartDrawer from "./components/CartDrawer";
import WishlistDrawer from "./components/WishlistDrawer";
import CompareModal from "./components/CompareModal";
import SearchModal from "./components/SearchModal";
import { CartProvider, useCart } from "./context/CartContext";
import BulkImporter from "./components/BulkImporter";

// Dynamic Meta Management (React Helmet Alternative)
function SeoHelmet() {
  const { activeCategory, selectedQuickViewProduct } = useCart();

  useEffect(() => {
    // Standard Defaults
    let title = "Nexus Tech Solutions | Premium Electronics, Phones & Laptops in Lira, Uganda";
    let description = "Discover the ultimate digital hub of Northern Uganda at Nexus Tech Solutions. Shop authenticated smartphones, high-spec laptops, and premium accessories with doorstep delivery and official warranties.";

    if (selectedQuickViewProduct) {
      // Dynamic title & meta description matching current product in view
      title = `${selectedQuickViewProduct.name} - Official Price & Specs | Nexus Tech Solutions`;
      description = `Buy the authentic ${selectedQuickViewProduct.name} at Nexus Tech Solutions Lira. Features: ${selectedQuickViewProduct.description || "Premium certified electronic hardware"}. Rated ${selectedQuickViewProduct.rating || "5.0"}/5 stars. Secure UGX ${selectedQuickViewProduct.price ? selectedQuickViewProduct.price.toLocaleString() : "best"} deal today via WhatsApp delivery.`;
    } else if (activeCategory && activeCategory !== "All") {
      // Dynamic title & meta description matching electronic category selection
      title = `Premium ${activeCategory} for Sale - Lira, Northern Uganda | Nexus Tech Solutions`;
      description = `Explore the best selection of ${activeCategory} in Lira and Northern Uganda. Authentic stock featuring top brands with official corporate warranties and speedy doorstep transport setups.`;
    }

    // Dynamic Title Execution
    document.title = title;

    // Dynamic Meta Description Execution
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);
  }, [activeCategory, selectedQuickViewProduct]);

  return null;
}

function MainLayout() {
  const { showMerchantAdmin } = useCart();
  return (
    <div className="relative min-h-screen font-sans bg-[#020205] text-[#f3f4f6] antialiased overflow-x-hidden">
      {/* Dynamic Navigation Header */}
      <Header />

      <main className="relative">
        {/* Services Showcase & Interactive Calculator */}
        <Services />

        {/* Why Choose Us Trust Indicators Grid */}
        <WhyChooseUs />

        {/* About Us Company Overview & Mission Statements */}
        <About />

        {/* Testimonials Review Cards */}
        <Testimonials />

        {/* Contact Info & compilable WhatsApp Planner Form & Maps Embed */}
        <Contact />

        {/* Bulk e-commerce inventory importer */}
        {showMerchantAdmin && <BulkImporter />}
      </main>

      {/* Structured sitemaps and copyrights Footer */}
      <Footer />

      {/* Apex checkout drawer dynamic modal */}
      <CartDrawer />

      {/* Wishlist Sidebar Overlay */}
      <WishlistDrawer />

      {/* Compare specs side-by-side Modal */}
      <CompareModal />

      {/* Global Interactive Search Modal Drawer */}
      <SearchModal />

      {/* Pulsing floating WhatsApp floating trigger */}
      <WhatsAppFloating />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <SeoHelmet />
      <MainLayout />
    </CartProvider>
  );
}


