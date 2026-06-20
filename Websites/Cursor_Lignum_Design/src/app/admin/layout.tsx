import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin&error=UNAUTHORIZED");
  if (session.user.role !== "ADMIN") redirect("/unauthorized?code=FORBIDDEN&next=/");
  return <>{children}</>;
}

