// Centralized Size Metadata and Helper Utilities for PrintSphere

export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"];

export const SIZE_METADATA = {
  "XS": { code: "XS", label: "Extra Small", desc: "Chest: 34-36\"" },
  "S": { code: "S", label: "Small", desc: "Chest: 36-38\"" },
  "M": { code: "M", label: "Medium", desc: "Chest: 38-40\"" },
  "L": { code: "L", label: "Large", desc: "Chest: 40-42\"" },
  "XL": { code: "XL", label: "Extra Large", desc: "Chest: 42-44\"" },
  "XXL": { code: "XXL", label: "Double Extra Large", desc: "Chest: 44-46\"" },
  "2XL": { code: "2XL", label: "Double Extra Large", desc: "Chest: 44-46\"" },
  "3XL": { code: "3XL", label: "Triple Extra Large", desc: "Chest: 46-48\"" }
};

export const SIZE_RANK = {
  "XS": 1,
  "S": 2,
  "M": 3,
  "L": 4,
  "XL": 5,
  "XXL": 6,
  "2XL": 6,
  "3XL": 7
};

/**
 * Standardize size code (e.g., 'xs' -> 'XS', '3xl' -> '3XL')
 */
export const normalizeSizeCode = (sizeStr) => {
  if (!sizeStr) return "";
  return String(sizeStr).trim().toUpperCase();
};

/**
 * Get human readable full name for a size (e.g. 'XS' -> 'Extra Small')
 */
export const getSizeFullName = (sizeStr) => {
  if (!sizeStr) return "";
  const code = normalizeSizeCode(sizeStr);
  return SIZE_METADATA[code]?.label || code;
};

/**
 * Get formatted size with code and label (e.g. 'XS (Extra Small)')
 */
export const getSizeDisplayLabel = (sizeStr) => {
  if (!sizeStr) return "";
  const code = normalizeSizeCode(sizeStr);
  const meta = SIZE_METADATA[code];
  return meta ? `${meta.code} (${meta.label})` : code;
};

/**
 * Get size object with code, label, and description
 */
export const getSizeInfo = (sizeStr) => {
  const code = normalizeSizeCode(sizeStr);
  return (
    SIZE_METADATA[code] || {
      code,
      label: code,
      desc: "Custom Dimensions"
    }
  );
};

/**
 * Sort a list of sizes in ascending order (XS -> S -> M -> L -> XL -> XXL -> 3XL)
 */
export const sortSizesAscending = (sizeList) => {
  if (!Array.isArray(sizeList)) return [];

  return [...sizeList].sort((a, b) => {
    const codeA = normalizeSizeCode(a);
    const codeB = normalizeSizeCode(b);
    const rankA = SIZE_RANK[codeA] || 99;
    const rankB = SIZE_RANK[codeB] || 99;

    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return codeA.localeCompare(codeB);
  });
};

/**
 * Format a list of sizes into an ascending comma-separated string
 */
export const formatSizeList = (sizeList, showFullNames = false) => {
  if (!sizeList || !Array.isArray(sizeList) || sizeList.length === 0) return "None";
  const sorted = sortSizesAscending(sizeList);
  if (showFullNames) {
    return sorted.map((s) => `${s} (${getSizeFullName(s)})`).join(", ");
  }
  return sorted.join(", ");
};
