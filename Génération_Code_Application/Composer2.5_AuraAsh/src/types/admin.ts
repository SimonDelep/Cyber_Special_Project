export type AdminUser = {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "USER" | "ADMIN";
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: "CANDLES" | "INCENSE_HOLDERS" | "DIFFUSERS";
  imageUrl: string | null;
  inStock: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SystemLogItem = {
  id: string;
  category: "AUTH" | "PROFILE" | "TRANSACTION" | "ADMIN";
  action: string;
  status: "SUCCESS" | "FAILURE" | "WARNING";
  message: string;
  userId: string | null;
  username: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};
