const HEX_TO_COLOR_NAME_MAP = {
  "#ffffff": "White",
  "#fff": "White",
  "#000000": "Black",
  "#000": "Black",
  "#111827": "Black",
  "#1f2937": "Black",
  "#18181b": "Black",
  "#0f172a": "Black",
  "#4b5563": "Charcoal",
  "#374151": "Charcoal",
  "#6b7280": "Grey",
  "#9ca3af": "Light Grey",
  "#e5e7eb": "Light Grey",
  "#f3f4f6": "White",
  "#1e3a8a": "Navy Blue",
  "#1e40af": "Navy Blue",
  "#1d4ed8": "Royal Blue",
  "#2563eb": "Royal Blue",
  "#3b82f6": "Blue",
  "#60a5fa": "Light Blue",
  "#93c5fd": "Light Blue",
  "#dc2626": "Red",
  "#db2424": "Red",
  "#da1010": "Red",
  "#ef4444": "Red",
  "#b91c1c": "Dark Red",
  "#991b1b": "Maroon",
  "#7f1d1d": "Maroon",
  "#fbbf24": "Gold",
  "#f59e0b": "Amber",
  "#d97706": "Orange",
  "#ea580c": "Orange",
  "#f97316": "Orange",
  "#16a34a": "Green",
  "#15803d": "Green",
  "#22c55e": "Green",
  "#166534": "Dark Green",
  "#65a30d": "Olive Green",
  "#84cc16": "Lime Green",
  "#6d28d9": "Violet",
  "#7c3aed": "Purple",
  "#8b5cf6": "Purple",
  "#a855f7": "Purple",
  "#f472b6": "Pink",
  "#ec4899": "Pink",
  "#db2777": "Deep Pink",
  "#f5f5dc": "Beige",
  "#fef3c7": "Cream",
  "#78350f": "Brown",
  "#92400e": "Brown",
  "#854d0e": "Brown"
};

const KNOWN_COLOR_PALETTE = [
  { name: "White", r: 255, g: 255, b: 255 },
  { name: "Black", r: 17, g: 24, b: 39 },
  { name: "Charcoal", r: 75, g: 85, b: 99 },
  { name: "Grey", r: 107, g: 114, b: 128 },
  { name: "Light Grey", r: 229, g: 231, b: 235 },
  { name: "Navy Blue", r: 30, g: 58, b: 138 },
  { name: "Royal Blue", r: 37, g: 99, b: 235 },
  { name: "Light Blue", r: 147, g: 197, b: 253 },
  { name: "Red", r: 220, g: 38, b: 38 },
  { name: "Maroon", r: 128, g: 0, b: 0 },
  { name: "Gold", r: 251, g: 191, b: 36 },
  { name: "Orange", r: 249, g: 115, b: 22 },
  { name: "Green", r: 22, g: 163, b: 74 },
  { name: "Olive Green", r: 101, g: 163, b: 13 },
  { name: "Violet", r: 109, g: 40, b: 217 },
  { name: "Purple", r: 147, g: 51, b: 234 },
  { name: "Pink", r: 244, g: 114, b: 182 },
  { name: "Beige", r: 245, g: 245, b: 220 },
  { name: "Brown", r: 120, g: 53, b: 15 }
];

/**
 * Resolves any hex or raw color input into a clean capitalized color name
 * e.g., "#db2424" -> "Red", "#ffffff" -> "White", "black" -> "Black"
 */
function resolveColorName(colorInput) {
  if (!colorInput || typeof colorInput !== "string") return "White";
  const trimmed = colorInput.trim();
  
  if (!trimmed.startsWith("#")) {
    return trimmed.replace(/\b\w/g, c => c.toUpperCase());
  }

  const lowerHex = trimmed.toLowerCase();
  if (HEX_TO_COLOR_NAME_MAP[lowerHex]) {
    return HEX_TO_COLOR_NAME_MAP[lowerHex];
  }

  // Parse hex to RGB and find closest known color
  let hex = lowerHex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    let closest = KNOWN_COLOR_PALETTE[0];
    let minDistance = Infinity;
    for (const color of KNOWN_COLOR_PALETTE) {
      const dist = Math.sqrt(
        Math.pow(r - color.r, 2) +
        Math.pow(g - color.g, 2) +
        Math.pow(b - color.b, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = color;
      }
    }
    return closest.name;
  }

  return trimmed;
}

/**
 * Normalizes color strings for loose matching against inventory
 */
function normalizeColorStr(c) {
  if (!c) return "";
  const name = resolveColorName(c);
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Formats GSM value standardly as "GSM <value>" (e.g. "GSM 200", "GSM 180")
 */
function formatGsm(val) {
  if (!val) return "GSM 180";
  const str = val.toString().trim();
  const digits = str.replace(/[^0-9]/g, "").trim();
  if (digits) {
    return `GSM ${digits}`;
  }
  return str;
}

module.exports = {
  resolveColorName,
  normalizeColorStr,
  formatGsm,
  HEX_TO_COLOR_NAME_MAP
};


