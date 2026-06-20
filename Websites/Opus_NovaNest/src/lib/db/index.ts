export { getSqlite, resolveDbPath } from './client';
export {
  getAllProducts,
  searchProducts,
  getProductById,
  findProductBySlug,
  getProductsByCategory,
  getFeaturedProducts,
  countProducts,
  insertProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products';
export { products, users, sessions } from './schema';
export type {
  Product,
  NewProduct,
  User,
  NewUser,
  Session,
  SafeUser,
  Review,
  NewReview,
  ReviewWithAuthor,
} from './schema';
export type { ProductSort, ProductSearchFilters } from './products';
export {
  createOrder,
  getOrderById,
  listOrdersByUserId,
} from './orders';
export type {
  Order,
  OrderItem,
  OrderWithItems,
  OrderLineInput,
  InvoiceCustomer,
} from './orders';
export {
  insertSystemEvent,
  listSystemEvents,
  countSystemEvents,
} from './system-events';
export type { SystemEvent, SystemEventFilters } from './system-events';
export {
  listReviewsByProductId,
  findReviewByUserAndProduct,
  getProductReviewSummary,
  upsertReview,
  deleteReviewByUserAndProduct,
} from './reviews';
export {
  findUserById,
  findUserByUsername,
  findUserByEmail,
  createUser,
  updateUser,
  adminUpdateUser,
  setUserBalance,
  adjustUserBalance,
  debitUserBalance,
  deleteUser,
  countUsers,
  listUsers,
  toSafeUser,
} from './users';
export {
  createSession,
  getSessionUser,
  deleteSession,
  deleteSessionsForUser,
} from './sessions';
