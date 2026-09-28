export const colors = {
  bg: "#F7F8F5",
  surface: "#FFFFFF",
  text: "#0F1B2D",
  muted: "#64748B",
  label: "#5B6B7F",
  placeholder: "#94A3B8",
  border: "#D5DBE3",
  divider: "#EEF1F4",
  primary: "#165F4B",
  primaryDisabled: "#93B3A7",
  primarySoft: "#E8F5F0",
  brandDark: "#12302B",
  brandAccent: "#5BA586",
  error: "#DC2626",
  errorBg: "#FEF2F2",
  gold: "#D4A73A",
  goldSoft: "#FDF3DC",
  goldText: "#B7862B",
};

export const radius = { md: 14, lg: 18 };

// Soft layered shadow so cards lift off the background instead of relying on outlines
export const shadow = {
  card: { boxShadow: "0px 1px 2px rgba(15, 27, 45, 0.05), 0px 6px 16px rgba(15, 27, 45, 0.06)" },
} as const;
