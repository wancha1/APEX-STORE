import { Product } from "../types";

/**
 * Parses a standard RFC 4180 CSV line into an array of fields, correctly handling
 * double quotes, commas inside cells, and escaped quotes.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentToken = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentToken += '"';
        i++; // skip next quote
      } else {
        // Toggle quote status
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentToken.trim());
      currentToken = "";
    } else {
      currentToken += char;
    }
  }
  result.push(currentToken.trim());
  return result;
}

/**
 * Parses a multi-row CSV string into an array of Product objects.
 * Expects the first row to be headers, which can match Product attributes:
 * - id, slug, name, description, price, originalPrice, category, rating, reviewsCount, badge, specs, colors, storages, stockStatus, iconName
 * 
 * Semicolons are used for array parsing in specs, colors, and storages fields.
 */
export function parseCsvToProducts(csvString: string): Product[] {
  // Normalize line endings
  const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return [];

  // Parse headers
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());

  const parsedProducts: Product[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    // Skip empty or mismatching rows
    if (fields.length === 0 || (fields.length === 1 && fields[0] === "")) continue;

    // Create record mapping header to cell text
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = fields[index] || "";
    });

    // Extract ID or generate one safely
    const rawId = record.id || record.slug || record.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "";
    if (!rawId) continue;

    // Type coercion & validation
    const priceGroup = parseFloat((record.price || "0").replace(/[^0-9.]/g, ""));
    const price = isNaN(priceGroup) ? 0 : priceGroup;

    const origPriceRaw = record.originalprice || record.original_price;
    const originalPrice = origPriceRaw ? parseFloat(origPriceRaw.replace(/[^0-9.]/g, "")) : undefined;

    const ratingVal = parseFloat(record.rating || "4.5");
    const rating = isNaN(ratingVal) ? 4.5 : Math.max(0, Math.min(5, ratingVal));

    const reviewsCountVal = parseInt(record.reviewscount || record.reviews_count || "0", 10);
    const reviewsCount = isNaN(reviewsCountVal) ? 0 : reviewsCountVal;

    // Parse semicolon separated lists
    const specsStr = record.specs || record.specifications || "";
    const specs = specsStr
      ? specsStr.split(";").map(s => s.trim()).filter(Boolean)
      : [];

    const colorsStr = record.colors || "";
    const colors = colorsStr
      ? colorsStr.split(";").map(c => c.trim()).filter(Boolean)
      : undefined;

    const storagesStr = record.storages || record.storage_variants || "";
    const storages = storagesStr
      ? storagesStr.split(";").map(s => s.trim()).filter(Boolean)
      : undefined;

    // Validate stock status values
    let stockStatus: Product["stockStatus"] = "In Stock";
    const rawStock = (record.stockstatus || record.stock_status || "").toLowerCase();
    if (rawStock.includes("out")) {
      stockStatus = "Out of Stock";
    } else if (rawStock.includes("low")) {
      stockStatus = "Low Stock";
    }

    // Validate icon fields or fallback based on category
    let iconName: Product["iconName"] = "Smartphone";
    const rawIcon = (record.iconname || record.icon_name || "").toLowerCase();
    
    if (["smartphone", "phone"].includes(rawIcon)) iconName = "Smartphone";
    else if (["laptop", "computer", "notebook"].includes(rawIcon)) iconName = "Laptop";
    else if (["tv", "television", "display", "screen"].includes(rawIcon)) iconName = "Tv";
    else if (["gamepad2", "game", "console", "gaming"].includes(rawIcon)) iconName = "Gamepad2";
    else if (["watch", "smartwatch"].includes(rawIcon)) iconName = "Watch";
    else if (["headphones", "earbuds", "audio"].includes(rawIcon)) iconName = "Headphones";
    else if (["camera"].includes(rawIcon)) iconName = "Camera";
    else if (["speaker", "charger", "power"].includes(rawIcon)) iconName = "Speaker";
    else {
      // Auto-detect based on category
      const cat = (record.category || "").toLowerCase();
      if (cat.includes("phone")) iconName = "Smartphone";
      else if (cat.includes("laptop") || cat.includes("computer")) iconName = "Laptop";
      else if (cat.includes("tv") || cat.includes("audio")) iconName = "Tv";
      else if (cat.includes("game") || cat.includes("playstation")) iconName = "Gamepad2";
      else if (cat.includes("watch")) iconName = "Watch";
      else if (cat.includes("headphone") || cat.includes("earbud")) iconName = "Headphones";
      else if (cat.includes("camera")) iconName = "Camera";
      else if (cat.includes("accessory") || cat.includes("power") || cat.includes("speaker")) iconName = "Speaker";
    }

    // Parse additional media catalog variables
    const imagesStr = record.images || "";
    const images = imagesStr
      ? imagesStr.split(";").map(img => img.trim()).filter(Boolean)
      : undefined;

    const videosStr = record.videos || "";
    const videos = videosStr
      ? videosStr.split(";").map(vid => vid.trim()).filter(Boolean)
      : undefined;

    const videoPreview = record.videopreview || record.video_preview || undefined;

    const detailedSpecsStr = record.detailedspecs || record.detailed_specs || "";
    const detailedSpecs = detailedSpecsStr
      ? detailedSpecsStr.split(";").map(pair => {
          const parts = pair.split(":");
          const label = parts[0]?.trim() || "";
          const value = parts.slice(1).join(":")?.trim() || "";
          return { label, value };
        }).filter(item => item.label && item.value)
      : undefined;

    const product: Product = {
      id: rawId,
      name: record.name || "Unnamed Product",
      description: record.description || "No description provided.",
      price,
      originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : undefined,
      category: record.category || "General",
      rating,
      reviewsCount,
      badge: record.badge || undefined,
      specs,
      colors,
      storages,
      stockStatus,
      iconName,
      images,
      videos,
      videoPreview,
      detailedSpecs,
    };

    parsedProducts.push(product);
  }

  return parsedProducts;
}
