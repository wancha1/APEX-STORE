import { Product } from "../types";

export function getSimulatedCsvContent(): string {
  const csvHeaders = "id,name,description,price,originalPrice,category,rating,reviewsCount,badge,specs,colors,storages,stockStatus,iconName,images,videos,videoPreview,detailedSpecs\n";
  const rows: string[] = [];

  const categories = [
    { name: "Phones", iconName: "Smartphone", count: 45 },
    { name: "Laptops", iconName: "Laptop", count: 45 },
    { name: "TVs & Audio", iconName: "Tv", count: 40 },
    { name: "Gaming", iconName: "Gamepad2", count: 35 },
    { name: "Accessories", iconName: "Speaker", count: 45 }
  ];

  // Concrete device profiles to expand realistically
  const baseDeviceProfiles: Record<string, any[]> = {
    "Phones": [
      { name: "iPhone 15 Pro Max Titanium", price: 5800000, orig: 6400000, baseSpecs: "A17 Pro;6.7\" OLED;5x Zoom;USB-C", colors: "Natural Titanium;Blue Titanium", storages: "256GB;512GB", badge: "POPULAR" },
      { name: "Galaxy S24 Ultra AI", price: 5200000, orig: 5800000, baseSpecs: "Snapdragon 8 Gen 3;200MP Lens;S-Pen Inside", colors: "Titanium Gray;Violet Blue", storages: "256GB;512GB", badge: "HOT" },
      { name: "Google Pixel 8 Pro", price: 3800000, orig: 4200000, baseSpecs: "Tensor G3;Magic Eraser AI;High Temp Sensor", colors: "Bay Blue;Obsidian;Porcelain", storages: "128GB;256GB", badge: "BEST CAMERA" },
      { name: "Redmi Note 13 Pro Plus", price: 1750000, orig: 1950000, baseSpecs: "Dimensity 7200;200MP Cam;120W Charge", colors: "Midnight Black;Aurora Purple", storages: "256GB", badge: "VALUE DEAL" },
      { name: "OnePlus 12 Flagship 5G", price: 3950000, orig: 4400000, baseSpecs: "Snapdragon 8 Gen 3;Hasselblad Cam;100W PD", colors: "Flowy Emerald;Silky Black", storages: "256GB;512GB", badge: "SUPERFAST" },
      { name: "Infinix Zero 30 Vlog 5G", price: 1250000, orig: 1400000, baseSpecs: "Helio G99;50MP Selfie Cam;120Hz curved", colors: "Golden Hour;Roma Green", storages: "256GB", badge: "VLOGGER SPECIAL" }
    ],
    "Laptops": [
      { name: "MacBook Pro 14 M3 Elite", price: 7900000, orig: 8500000, baseSpecs: "M3 chip;16GB RAM;512GB SSD;Liquid Retina", colors: "Space Gray;Silver", storages: "512GB SSD", badge: "M3 SILICON" },
      { name: "HP EliteBook 840 Premium", price: 3100000, orig: 3500000, baseSpecs: "Core i7;16GB DDR5;512GB NVMe;Wolf Security", colors: "Pike Silver", storages: "512GB SSD", badge: "BUSINESS CLASS" },
      { name: "Dell XPS 13 Plus Deluxe", price: 6200000, orig: 6800000, baseSpecs: "Intel Core i7 Evo;16GB;1TB SSD;InfinityEdge", colors: "Platinum Gray", storages: "1TB SSD", badge: "ULTRA BOOK" },
      { name: "Lenovo ThinkPad T14 Carbon", price: 3400000, orig: 3800000, baseSpecs: "Core i5 vPro;16GB RAM;512GB SSD;TrackPoint", colors: "Matte Black", storages: "512GB SSD", badge: "RELIABLE" },
      { name: "ASUS ZenBook 14 Vivid OLED", price: 4400000, orig: 4900000, baseSpecs: "Ryzen 7;16GB;1TB SSD;90Hz HDR Display", colors: "Ponder Blue", storages: "1TB SSD", badge: "CRISP SCREEN" },
      { name: "Acer Aspire 3 Starter", price: 1350000, orig: 1550000, baseSpecs: "Core i3;8GB RAM;256GB SSD;FHD Active Screen", colors: "Midnight Silver", storages: "256GB SSD", badge: "BUDGET BEAST" }
    ],
    "TVs & Audio": [
      { name: "Sony Bravia 65 4K Screen", price: 4700050, orig: 5300000, baseSpecs: "4K HDR HDR10;Google OS;Dolby Sound", colors: "Black Aluminum", storages: "", badge: "65-INCH" },
      { name: "LG C3 Cinema EVO OLED TV", price: 5800000, orig: 6500000, baseSpecs: "Alpha9 Gen6 AI;Perfect Contrast;Dynamic HDR", colors: "Charcoal Slate", storages: "", badge: "OLED DISPLAY" },
      { name: "Hisense 55 Ultra HD Screen", price: 1850000, orig: 2150000, baseSpecs: "4K smart panel;Frameless design;Wi-Fi App", colors: "Slate Black", storages: "", badge: "FREE BRACKET" },
      { name: "JBL Bar 500 Subwoofer Atmos", price: 1950000, orig: 2200000, baseSpecs: "590W Output;True Dolby Atmos;Airplay 2", colors: "Matte Black", storages: "", badge: "5.1 CINEMA" },
      { name: "Sony WH-1000XM5 ANC Headset", price: 1450000, orig: 1650000, specs: "Industry ANC;Hi-Res sound;Smart speak-to-chat", colors: "Silver Sand;Coal Black", storages: "", badge: "ANC CHING" }
    ],
    "Gaming": [
      { name: "PlayStation 5 Slim 1TB Box", price: 2900000, orig: 3300000, baseSpecs: "1TB Custom SSD;Ray Tracing;60FPS Ultra Play", colors: "Storm White", storages: "1TB", badge: "BEST SELLER" },
      { name: "Xbox Series X Performance", price: 2950000, orig: 3350000, baseSpecs: "12 Teraflops GPU;1TB SSD Storage;Quick Resume", colors: "Obsidian Black", storages: "1TB", badge: "MONSTER POWER" },
      { name: "Nintendo Switch OLED Joycon", price: 1750000, orig: 1950000, baseSpecs: "7\" OLED display;64GB;Multi-mode Dock station", colors: "Classic Red/Blue;Vibrant White", storages: "64GB", badge: "HANDHELD" },
      { name: "ASUS ROG Ally Extreme Console", price: 2950000, orig: 3450000, baseSpecs: "AMD Ryzen Extreme;120Hz screen;Windows 11 Setup", colors: "Robot White", storages: "512GB", badge: "PORTABLE PC" },
      { name: "Steam Deck 512GB Gaming Pad", price: 2650000, orig: 2950000, baseSpecs: "Custom AMD Zen CPU;SteamOS;Tactile stick pads", colors: "Matte Black", storages: "512GB", badge: "STEAM LIBRARY" }
    ],
    "Accessories": [
      { name: "Anker Prime 100W PD Charger", price: 280000, orig: 350000, baseSpecs: "GaN Fast charge;Dual USB-C+USB-A;Over-charge guard", colors: "Space Gray", storages: "", badge: "RECOMMENDED" },
      { name: "Oraimo Toast Powerbank Pro", price: 75000, orig: 95000, baseSpecs: "10000mAh capacity;22.5W PD fast lines out", colors: "Coal Black;Satin Green", storages: "", badge: "DURABLE CELL" },
      { name: "Apple Magsafe Certified Pad", price: 165000, orig: 210000, baseSpecs: "15W wireless speed;Perfect magnetic circle core", colors: "Silver", storages: "", badge: "GENUINE SEAL" },
      { "name": "SanDisk Extreme 512GB microSD", price: 220000, orig: 280000, baseSpecs: "190MB/S read speeds;Extreme shockproof rugged", colors: "RedGold", storages: "512GB", badge: "CAR CAMERA" }
    ]
  };

  const cdnFallbackImages = [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"
  ];

  // Loop generation to create exactly 210 high-fidelity products
  categories.forEach((catObj) => {
    const profiles = baseDeviceProfiles[catObj.name] || baseDeviceProfiles["Accessories"];
    
    for (let i = 0; i < catObj.count; i++) {
      const idx = i % profiles.length;
      const profile = profiles[idx];
      const modelNum = Math.floor(i / profiles.length) + 1;
      
      const cleanId = `${catObj.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-imported-${i + 1}`;
      const name = `${profile.name} (v.${modelNum})`;
      const desc = `Premium showroom approved device under the ${catObj.name} category. Specifically configured for Lira electronics distributions with original factory seals, physical invoice support, and robust local store warranties. Certified genuine.`;
      
      // Stagger price to look highly realistic
      const priceModifier = 1 + ((i % 10) - 5) * 0.02; // +/- 10%
      const price = Math.round(profile.price * priceModifier);
      const originalPrice = profile.orig ? Math.round(profile.orig * priceModifier) : undefined;
      
      const rating = (4.3 + (i % 8) * 0.1).toFixed(1);
      const reviews = 15 + (i * 4);
      const badge = profile.badge || (i % 6 === 0 ? "EXCELLENT DEAL" : "");
      const stockStatus = i % 8 === 0 ? "Low Stock" : i % 25 === 0 ? "Out of Stock" : "In Stock";
      
      // Semicolon separated image path formats with local public folder as primary, fallback as secondary
      const imagesList = `public/products/images/${cleanId}-1.webp;public/products/images/${cleanId}-2.webp;${cdnFallbackImages[i % cdnFallbackImages.length]}`;
      
      // Video showcase configuration
      const videosList = `public/products/videos/${cleanId}-promo.mp4;https://assets.mixkit.co/videos/preview/mixkit-mobile-phone-screen-close-up-34311-large.mp4`;
      const videoPreview = `public/products/videos/${cleanId}-preview.mp4`;
      
      // Detailed technical specifications compilation
      const detailedSpecs = `Brand:Genuine Certified;Warranty:12 Months Store Warranty;Store Location:Juba Road Lira;Weight:${200 + (i * 2)}g;Quality:Factory Sealed`;

      const specsStr = `${profile.baseSpecs || profile.specs || "100% Genuine;Approved Warranty;Lira Stock"}`;

      rows.push(`"${cleanId}","${name}","${desc}",${price},${originalPrice || ""},"${catObj.name}",${rating},${reviews},"${badge}","${specsStr}","${profile.colors || "Standard Color"}","${profile.storages || ""}","${stockStatus}","${catObj.iconName}","${imagesList}","${videosList}","${videoPreview}","${detailedSpecs}"`);
    }
  });

  return csvHeaders + rows.join("\n");
}
