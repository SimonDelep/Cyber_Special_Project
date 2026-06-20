"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(80).optional().or(z.literal("")),
  lastName: z.string().min(1).max(80).optional().or(z.literal("")),
});

export async function registerAction(formData: FormData): Promise<void> {
  const raw = {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/register?error=1");
  }

  const { username, email, password, firstName, lastName } = parsed.data;
  const emailLower = email.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: emailLower }, { username }] },
    select: { id: true },
  });
  if (existing) {
    redirect("/register?error=exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      username,
      email: emailLower,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
    },
  });

  redirect("/login?registered=1");
}

