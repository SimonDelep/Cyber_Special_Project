export const EventType = {
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGOUT: 'auth.logout',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_DELETE: 'profile.delete',
  TRANSACTION_CHECKOUT_SUCCESS: 'transaction.checkout.success',
  TRANSACTION_CHECKOUT_FAILED: 'transaction.checkout.failed',
  REVIEW_SUBMIT: 'review.submit',
  ADMIN_USER_UPDATE: 'admin.user.update',
  ADMIN_USER_BALANCE: 'admin.user.balance',
  ADMIN_USER_DELETE: 'admin.user.delete',
  ADMIN_PRODUCT_CREATE: 'admin.product.create',
  ADMIN_PRODUCT_UPDATE: 'admin.product.update',
  ADMIN_PRODUCT_DELETE: 'admin.product.delete',
  ADMIN_PRODUCT_IMPORT: 'admin.product.import',
} as const;

export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

export const EVENT_TYPE_LABELS: Record<EventTypeValue, string> = {
  'auth.login.success': 'Login success',
  'auth.login.failed': 'Login failed',
  'auth.register': 'Registration',
  'auth.logout': 'Logout',
  'profile.update': 'Profile update',
  'profile.delete': 'Account deleted',
  'transaction.checkout.success': 'Checkout success',
  'transaction.checkout.failed': 'Checkout failed',
  'review.submit': 'Review submitted',
  'admin.user.update': 'Admin: user update',
  'admin.user.balance': 'Admin: balance change',
  'admin.user.delete': 'Admin: user delete',
  'admin.product.create': 'Admin: product create',
  'admin.product.update': 'Admin: product update',
  'admin.product.delete': 'Admin: product delete',
  'admin.product.import': 'Admin: CSV product import',
};
