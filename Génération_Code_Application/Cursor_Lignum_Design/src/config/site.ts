export const siteConfig = {
  name: "Lignum Design",
  description:
    "Mobilier artisanal en bois massif, conçu pour durer. Tables, chaises et rangements au design intemporel.",
  url: "https://lignumdesign.ca",
  links: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    email: "contact@lignumdesign.ca",
  },
} as const;

export const navLinks = [
  { label: "Collections", href: "#collections" },
  { label: "Artisanat", href: "#craftsmanship" },
  { label: "À propos", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

export const featuredCategories = [
  {
    name: "Salon",
    description: "Canapés, tables basses et étagères au charme chaleureux.",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Salle à manger",
    description: "Tables et chaises en bois massif pour vos repas en famille.",
    image:
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Chambre",
    description: "Lits, commodes et bancs au design épuré et durable.",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
  },
] as const;

export const values = [
  {
    title: "Bois massif local",
    description:
      "Érable, chêne et noyer sélectionnés auprès de scieries québécoises responsables.",
  },
  {
    title: "Fabrication artisanale",
    description:
      "Chaque pièce est façonnée à la main dans notre atelier, avec une attention aux détails.",
  },
  {
    title: "Design intemporel",
    description:
      "Des lignes épurées qui traversent les tendances et s'intègrent à tout intérieur.",
  },
] as const;
