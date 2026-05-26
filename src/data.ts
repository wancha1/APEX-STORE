import { Service, TrustSignal, Testimonial, Product } from "./types";

export const BUSINESS_INFO = {
  name: "Apex Devices & Electronics",
  tagline: "Lira's Premium Hub for Genuine Tech, Gadgets & Accessories",
  subTagline: "The modern flagship store for genuine tech. Discover high-end smartphones, Apple Silicon MacBooks, crisp 4K displays, and next-gen gaming gear with official brand warranties and immediate local delivery.",
  whatsappNumber: "256708428805", // Standard international format without '+' for API
  whatsappDisplay: "+256 708 428 805",
  email: "sales@apexdevices.ug",
  phoneDisplay: "+256 708 428 805",
  address: "Plot 24, Juba Road, Lira, Uganda",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15939.88092770258!2d32.893112089405625!3d2.2497655153284704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1770c3ba50172e29%3A0xa1ea142345fb12c8!2sLira!5e0!3m2!1sen!2sug!4v1700000000000!5m2!1sen!2sug"
};

export const SERVICES: Service[] = [
  {
    id: "phones",
    title: "Premium Flagship Phones",
    description: "Get the latest genuine Apple iPhone models and Samsung Galaxy flagship series, complete with a 2-Year official brand warranty and immediate device data transfer.",
    iconName: "Smartphone",
    priceStart: "UGX 1,500,000",
    benefits: [
      "100% Genuine Sealed Box Devices",
      "2-Year Official Brand Warranty Card",
      "Free Superfast PD Charging Brick",
      "Immediate Phone Data Backup & Sync"
    ]
  },
  {
    id: "laptops",
    title: "High-Power Laptops & MacBooks",
    description: "Unleash ultimate productivity. Grab high-performance business laptops and new Apple Silicon M3 MacBooks, customized with preloads.",
    iconName: "Globe", // Showing a laptop for tech bundle
    priceStart: "UGX 2,200,000",
    benefits: [
      "Up to 16GB / 512GB SSD High Specs",
      "Free Installed Licensed Office Suite",
      "Premium Waterproof Carrying Bag Included",
      "1st-Year Free Dust Cleaning & Service"
    ]
  },
  {
    id: "smart-tvs",
    title: "4K Smart TVs & Home Audio",
    description: "Equip your living room, lounge or boardroom with crisp 4K Ultra HD smart screens and high-fidelity sound bars for extreme clarity.",
    iconName: "MapPin",
    priceStart: "UGX 1,300,000",
    benefits: [
      "Frameless Screens & HDR Color Tech",
      "Free Secure Concrete Wall Mounting",
      "Preloaded Netflix, DSTV App & YouTube",
      "Includes Certified Digital TV Surge Protector"
    ]
  },
  {
    id: "gaming-gear",
    title: "Next-Gen Gaming & Consoles",
    description: "Play without limits. Grab the latest gaming consoles like PlayStation 5 Slims, wireless gamepad packs, and premium mechanical gaming sets.",
    iconName: "MessageSquare",
    priceStart: "UGX 1,800,000",
    benefits: [
      "Genuine PS5 Horizon/Spiderman Bundles",
      "Dual DualSense Controllers Pack",
      "3 Best-Selling Games Preloaded Free",
      "12-Month Swap/Replacement Guarantee"
    ]
  }
];

export const PRODUCTS: Product[] = [
  {
    id: "iphone-15-pro-max",
    name: "Apple iPhone 15 Pro Max (Titanium)",
    description: "The ultimate peak tech device featuring an aerospace-grade titanium design, the revolutionary A17 Pro chip, customizable Action button, and a powerful 5x Telephoto camera.",
    price: 5800000,
    originalPrice: 6400000,
    category: "Phones",
    rating: 4.9,
    reviewsCount: 148,
    badge: "9% OFF",
    colors: ["Natural Titanium", "Blue Titanium", "Black Titanium"],
    storages: ["256GB", "512GB"],
    stockStatus: "In Stock",
    specs: ["A17 Pro Chip", "6.7\" Super Retina XDR", "5x Optical Zoom Camera", "USB-C High Speed"],
    iconName: "Smartphone"
  },
  {
    id: "galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra (AI Flagship)",
    description: "Meet Galaxy S24 Ultra, the ultimate form of Galaxy S24. Outfitted with next-generation Galaxy AI capabilities, 200MP Main Lens, and the power of the embedded S-Pen stylus.",
    price: 5200000,
    originalPrice: 5800000,
    category: "Phones",
    rating: 4.8,
    reviewsCount: 92,
    badge: "HOT ITEM",
    colors: ["Titanium Gray", "Titanium Black", "Titanium Violet"],
    storages: ["256GB", "512GB"],
    stockStatus: "In Stock",
    specs: ["Snapdragon 8 Gen 3", "6.8\" Dynamic AMOLED 2X", "S-Pen Stylus Included", "Galaxy AI Engine"],
    iconName: "Smartphone"
  },
  {
    id: "macbook-pro-m3",
    name: "Apple MacBook Pro 14\" M3 Powerhouse",
    description: "Equipped with the groundbreaking 3-nanometer M3 Apple Silicon processor, massive 16GB memory architecture, and 512GB ultra-high-speed solid-state disk drive.",
    price: 7900000,
    originalPrice: 8500000,
    category: "Laptops",
    rating: 4.9,
    reviewsCount: 74,
    badge: "SAVE 600K",
    colors: ["Space Gray", "Silver"],
    storages: ["512GB SSD", "1TB SSD"],
    stockStatus: "In Stock",
    specs: ["Apple M3 8-Core CPU", "16GB Unified Memory", "14.2\" Liquid Retina XDR", "Up to 22h Battery Life"],
    iconName: "Laptop"
  },
  {
    id: "hp-elitebook-840",
    name: "HP EliteBook 840 G10 Business Elite",
    description: "High-power corporate computing. Crafted with premium solid metal, integrated multi-layered HP Wolf security, and the latest Core i7 processor ready for ultimate Lira office scale.",
    price: 3100000,
    originalPrice: 3500000,
    category: "Laptops",
    rating: 4.7,
    reviewsCount: 41,
    badge: "BEST DEAL",
    colors: ["Astor Silver"],
    storages: ["512GB SSD"],
    stockStatus: "In Stock",
    specs: ["Intel Core i7 13th Gen", "16GB DDR5 RAM", "14.0\" FHD Anti-Glare", "Windows 11 Pro Licensed"],
    iconName: "Laptop"
  },
  {
    id: "sony-ps5-slim",
    name: "Sony PlayStation 5 Slim (Disc Edition)",
    description: "Experience lightning-fast loading with an ultra-high-speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio, and an all-new generation of incredible PlayStation games.",
    price: 2900000,
    originalPrice: 3300000,
    category: "Gaming",
    rating: 4.9,
    reviewsCount: 162,
    badge: "BEST SELLER",
    colors: ["Classic White"],
    storages: ["1TB SSD Storage"],
    stockStatus: "Low Stock",
    specs: ["Ultra-High Speed 1TB SSD", "Haptic Feedback Control", "4K-TV Gaming Output", "Ray Tracing Technology"],
    iconName: "Gamepad2"
  },
  {
    id: "samsung-55-4k",
    name: "Samsung 55\" Crystal UHD 4K Smart TV",
    description: "Live the dream. Unveil lifelike color clarity with direct Dynamic Crystal Color, a highly powerful superfast Crystal Processor 4K, and absolute frameless look.",
    price: 2400000,
    originalPrice: 2800000,
    category: "TVs & Audio",
    rating: 4.6,
    reviewsCount: 55,
    badge: "FREE WALL MOUNT",
    colors: ["Midnight Black"],
    stockStatus: "In Stock",
    specs: ["55\" HDR 4K Screen", "Tizen Smart TV OS", "Object Tracking Sound Lite", "DSTV/Netflix Preloaded"],
    iconName: "Tv"
  },
  {
    id: "airpods-pro-2",
    name: "Apple AirPods Pro (2nd Gen, USB-C)",
    description: "Engineered for excellence. Delivers up to 2x more Active Noise Cancellation than its predecessor, Adaptive Audio, and Transparencies directly tuned to block city noise.",
    price: 9500000 / 10, // 950,000
    originalPrice: 1100000,
    category: "Accessories",
    rating: 4.8,
    reviewsCount: 204,
    badge: "14% OFF",
    colors: ["Classic White"],
    stockStatus: "In Stock",
    specs: ["Active Noise Cancelling", "Adaptive Transparency", "USB-C MagSafe Case", "Up to 6 hours listening"],
    iconName: "Headphones"
  },
  {
    id: "anker-prime-100w",
    name: "Anker Prime 100W PD Fast Wall Charger",
    description: "Power up to three devices concurrently with two ultra-high performance USB-C ports and one USB-A port. Charges a 16\" MacBook Pro M3 to 50% in standard 26 minutes.",
    price: 280000,
    originalPrice: 350000,
    category: "Accessories",
    rating: 4.7,
    reviewsCount: 88,
    badge: "RECOMMENDED",
    colors: ["Steel Gray"],
    stockStatus: "In Stock",
    specs: ["100W Power Delivery", "Gallium Nitride (GaN) Tech", "3-Port Multi Charging", "ActiveShield Safety 2.0"],
    iconName: "Speaker"
  }
];

export const TRUST_SIGNALS: TrustSignal[] = [
  {
    title: "100% Genuine Tag",
    description: "Every single smartphone, laptop, and accessory is sourced directly from verified brand distributors with intact seals.",
    iconName: "Wallet"
  },
  {
    title: "Same-Day Hand Delivery",
    description: "Get your valuable gadgets delivered straight to your home or office in Lira within hours, fully secure in transit.",
    iconName: "Zap"
  },
  {
    title: "Trade-In & Sell",
    description: "Instantly evaluate your old smartphone or laptop, trade it with us, and easily upgrade to the newest model in stock.",
    iconName: "Share2"
  },
  {
    title: "Physical Tech Showroom",
    description: "Want to hold and try before buying? Visit our flagship showroom on Juba Road, Lira to test live demo models.",
    iconName: "Users"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ssubi Ronald",
    role: "General Manager",
    company: "Victoria Safaris Ltd",
    location: "Lira",
    quote: "We outfitted our safari office and hotel lobbies with premium Samsung 4K TV screens from Apex Devices. They mounted them safely on concrete, connected our streaming apps, and gave us verified warranty logs. Exceptionally professional tech partner.",
    rating: 5
  },
  {
    name: "Akello Gloria",
    role: "Digital Designer & Architect",
    company: "Akello Designs Studio",
    location: "Lira Town",
    quote: "Purchased my MacBook Pro M3 from Apex. They did not just sell me a box; they transferred 100GB of files from my old laptop, pre-configured my Adobe suite, and delivered it directly to my desk in Lira with a free bag!",
    rating: 5
  },
  {
    name: "Oyo Joshua",
    role: "Independent Retail Merchant",
    company: "Oyo Trading Stores",
    location: "Lira District",
    quote: "Their online product customizer is wonderful. I configured my iPhone upgrade package, including a matte screen guard and car charger. The purchase quote compiled into WhatsApp instantly. Fast local money delivery on exchange!",
    rating: 5
  }
];

export const STATS = [
  { value: "10k+", label: "Genuine Gadgets Delivered" },
  { value: "100%", label: "Verified Brand Warranties" },
  { value: "same-day", label: "Instant Delivery in Lira" },
  { value: "4.9★", label: "Average Google Reviews" }
];
