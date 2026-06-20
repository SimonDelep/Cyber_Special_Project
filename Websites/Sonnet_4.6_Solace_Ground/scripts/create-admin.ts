import { eq } from 'drizzle-orm';
import { getDb } from '../src/db';
import { users } from '../src/db/schema';
import { hashPassword } from '../src/lib/auth/password';

const USERNAME = 'admin';
const PASSWORD = 'Admin123!';
const EMAIL = 'admin@solaceground.local';

const db = getDb();
const existing = db.select().from(users).where(eq(users.username, USERNAME)).get();
const now = new Date().toISOString();
const passwordHash = await hashPassword(PASSWORD);

if (existing) {
  db.update(users)
    .set({ role: 'admin', passwordHash, updatedAt: now })
    .where(eq(users.id, existing.id))
    .run();
  console.log('Updated existing admin (role + password reset).');
} else {
  db.insert(users)
    .values({
      username: USERNAME,
      email: EMAIL,
      passwordHash,
      role: 'admin',
      displayName: 'Administrator',
      createdAt: now,
      updatedAt: now,
    })
    .run();
  console.log('Created admin account.');
}

console.log(`\nSign in at http://localhost:4321/login`);
console.log(`  Username: ${USERNAME}`);
console.log(`  Password: ${PASSWORD}`);
console.log(`\nAdmin panel: http://localhost:4321/admin`);
