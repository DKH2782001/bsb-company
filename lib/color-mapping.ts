// Maps shift hex color → CSS token for styling
// TODO Phase 2: store color_token ('morning'|'afternoon'|'night') directly in DB
//               instead of hex, to avoid this runtime mapping.

export type ShiftColorToken = "morning" | "afternoon" | "night" | "custom";

const TOKEN_MAP: Record<string, ShiftColorToken> = {
  "#F59E0B": "morning",    // amber  — Ca Sáng
  "#f59e0b": "morning",
  "#3B82F6": "afternoon",  // blue   — Ca Chiều
  "#3b82f6": "afternoon",
  "#6D5EF7": "night",      // purple — Ca Đêm
  "#6d5ef7": "night",
};

export function hexToShiftToken(hex: string): ShiftColorToken {
  return TOKEN_MAP[hex] ?? TOKEN_MAP[hex.toLowerCase()] ?? "custom";
}

/** For 'custom' token: derive readable text color from hex background via luminance. */
export function getTextColorForHex(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1A1A18" : "#FFFFFF";
}
