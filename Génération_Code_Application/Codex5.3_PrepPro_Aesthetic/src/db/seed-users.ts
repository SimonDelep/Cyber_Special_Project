import { hashPassword } from "@/lib/auth/password";
import { createUser, findUserByUsername, updateUser } from "./users";

async function seedUsers() {
  console.log("Seeding users…");

  const adminUsername = "admin";
  if (!findUserByUsername(adminUsername)) {
    const passwordHash = await hashPassword("Admin123!");
    createUser({
      username: adminUsername,
      email: "admin@preppro.local",
      passwordHash,
      displayName: "PrepPro Admin",
      role: "admin",
    });
    console.log("  Created admin user (username: admin, password: Admin123!)");
  } else {
    console.log("  Admin user already exists, skipped.");
  }

  const demoUsername = "demo";
  if (!findUserByUsername(demoUsername)) {
    const passwordHash = await hashPassword("Demo1234!");
    const demo = createUser({
      username: demoUsername,
      email: "demo@preppro.local",
      passwordHash,
      displayName: "Demo User",
      role: "user",
    });
    updateUser(demo.id, { balanceCents: 5000 });
    console.log("  Created demo user (username: demo, password: Demo1234!)");
  } else {
    console.log("  Demo user already exists, skipped.");
  }
}

seedUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
