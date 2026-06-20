export const siteConfig = {
  name: "RoastRitual",
  description:
    "Specialty, ethically sourced whole-bean coffees and loose-leaf herbal tea subscription boxes.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3005",
  invoice: {
    companyName: "RoastRitual",
    addressLines: ["Chicoutimi, Saguenay", "Québec, Canada"],
    supportEmail: "billing@roastritual.ca",
  },
  location: {
    city: "Chicoutimi",
    region: "Saguenay",
    province: "Québec",
    country: "Canada",
    coordinates: { lat: 48.4294, lng: -71.0522 },
    mapUrl:
      "https://www.openstreetmap.org/?mlat=48.4294&mlon=-71.0522#map=12/48.4294/-71.0522",
  },
} as const;
