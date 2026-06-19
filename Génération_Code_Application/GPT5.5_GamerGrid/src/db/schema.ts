import { sqliteTable, text, integer, real, unique } from 'drizzle-orm/sqlite-core';

export const userRoles = ['user', 'admin'] as const;
export type UserRole = (typeof userRoles)[number];

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  image: text('image').notNull(),
  badge: text('badge'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  bio: text('bio').notNull().default(''),
  profilePicture: text('profile_picture'),
  role: text('role').$type<UserRole>().notNull().default('user'),
  balance: real('balance').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const eventCategories = ['auth', 'profile', 'transaction', 'admin'] as const;
export type DbEventCategory = (typeof eventCategories)[number];

export const eventSeverities = ['info', 'warning', 'error'] as const;
export type DbEventSeverity = (typeof eventSeverities)[number];

export const eventStatuses = ['success', 'failure'] as const;
export type DbEventStatus = (typeof eventStatuses)[number];

export const systemEvents = sqliteTable('system_events', {
  id: text('id').primaryKey(),
  category: text('category').$type<DbEventCategory>().notNull(),
  action: text('action').notNull(),
  severity: text('severity').$type<DbEventSeverity>().notNull(),
  status: text('status').$type<DbEventStatus>().notNull(),
  userId: text('user_id'),
  username: text('username'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  message: text('message').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  lineItems: text('line_items').notNull(),
  total: real('total').notNull(),
  previousBalance: real('previous_balance').notNull(),
  newBalance: real('new_balance').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const reviews = sqliteTable(
  'reviews',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [unique().on(table.productId, table.userId)],
);

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type SystemEvent = typeof systemEvents.$inferSelect;
export type Order = typeof orders.$inferSelect;
