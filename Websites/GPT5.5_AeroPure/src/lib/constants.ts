export const SITE_NAME = "AeroPure";

export const NAV_LINKS = [
  { href: "/products", label: "Catalog" },
  { href: "/#features", label: "Features" },
  { href: "/#about", label: "About" },
] as const;

export const PRODUCT_CATEGORIES = [
  {
    id: "wireless",
    title: "Magnetic Wireless Charging",
    description:
      "Multi-device magnetic stations that keep your desk and nightstand clutter-free.",
    icon: "⚡",
  },
  {
    id: "solar",
    title: "Solar Power Banks",
    description:
      "High-capacity portable power with fast USB-C PD for travel and emergencies.",
    icon: "☀️",
  },
  {
    id: "organizer",
    title: "Travel Tech Organizers",
    description:
      "Sleek organizers with smart compartments for cables, adapters, and essentials.",
    icon: "✈️",
  },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  WIRELESS_CHARGING: "Wireless Charging",
  SOLAR_POWER_BANK: "Solar Power Bank",
  TRAVEL_ORGANIZER: "Travel Organizer",
};

export const CATEGORY_EMOJI: Record<string, string> = {
  WIRELESS_CHARGING: "⚡",
  SOLAR_POWER_BANK: "☀️",
  TRAVEL_ORGANIZER: "✈️",
};
