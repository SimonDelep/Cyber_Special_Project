import { hashPassword } from '../auth/password';
import { ROLES } from '../auth/constants';
import { countUsers, createUser, findUserByUsername } from './users';

export async function seedDefaultAdmin(): Promise<void> {
  if (countUsers() > 0) return;

  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin123!';
  const email = process.env.ADMIN_EMAIL ?? 'admin@novanest.local';

  if (findUserByUsername(username)) {
    console.log('Admin user already exists, skipping.');
    return;
  }

  const passwordHash = await hashPassword(password);
  createUser({
    username,
    passwordHash,
    email,
    displayName: 'Administrator',
    role: ROLES.ADMIN,
  });

  console.log(`Seeded admin user "${username}" (change password after first login).`);
}
