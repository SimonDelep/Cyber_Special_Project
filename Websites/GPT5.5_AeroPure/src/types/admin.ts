import type { ProductCategory, Role } from "@prisma/client";

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: Role;
  balance: number;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  featured: boolean;
  inStock: boolean;
  imageUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
};
