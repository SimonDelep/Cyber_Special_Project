import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    username: string;
    email?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      username: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    username: string;
  }
}
