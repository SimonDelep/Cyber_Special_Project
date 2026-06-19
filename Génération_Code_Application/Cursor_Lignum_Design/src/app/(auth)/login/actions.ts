"use server";

import { redirect } from "next/navigation";

export async function loginAction(formData: FormData): Promise<void> {
  // Login form is handled client-side via next-auth/react for next-auth v4.
  // This server action is kept only to avoid broken imports if referenced.
  void formData;
  redirect("/login?error=1");
}

