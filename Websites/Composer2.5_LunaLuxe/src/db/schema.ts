import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const userRoles = ['user', 'admin'] as const;
export type UserRole = (typeof userRoles)[number];

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  category: text('category').notNull(),
  imageUrl: text('image_url').notNull(),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  bio: text('bio').notNull().default(''),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: userRoles }).notNull().default('user'),
  balance: real('balance').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const logSeverities = ['info', 'success', 'warning', 'error'] as const;
export type LogSeverity = (typeof logSeverities)[number];

export const systemLogs = sqliteTable('system_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventType: text('event_type').notNull(),
  severity: text('severity', { enum: logSeverities }).notNull(),
  message: text('message').notNull(),
  userId: integer('user_id'),
  username: text('username'),
  ipAddress: text('ip_address'),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull(),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  total: real('total').notNull(),
  balanceAfter: real('balance_after').notNull(),
  createdAt: text('created_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(),
  productName: text('product_name').notNull(),
  unitPrice: real('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: real('line_total').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull().unique(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderWithItems = Order & {
  items: OrderItem[];
  customerName: string;
  customerEmail: string;
};

export type ReviewWithAuthor = Review & {
  authorName: string;
  authorAvatar: string | null;
};

export type PublicUser = Pick<
  User,
  | 'id'
  | 'username'
  | 'email'
  | 'displayName'
  | 'bio'
  | 'avatarUrl'
  | 'role'
  | 'balance'
  | 'createdAt'
  | 'updatedAt'
>;

export const productCategories = [
  'Silk Sleep Masks',
  'Bamboo Bed Sheets',
  'Weighted Blankets',
] as const;
export type ProductCategory = (typeof productCategories)[number];
