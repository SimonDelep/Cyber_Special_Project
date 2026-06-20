export const EVENT_CATEGORY = {
  AUTH: 'auth',
  PROFILE: 'profile',
  TRANSACTION: 'transaction',
  ADMIN: 'admin',
} as const;

export type EventCategory = (typeof EVENT_CATEGORY)[keyof typeof EVENT_CATEGORY];

export const EVENT_ACTION = {
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  REGISTER: 'auth.register',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_DELETE: 'profile.delete',
  PROFILE_AVATAR: 'profile.avatar',
  CHECKOUT: 'transaction.checkout',
  ADMIN_USER_UPDATE: 'admin.user.update',
  ADMIN_USER_DELETE: 'admin.user.delete',
  ADMIN_BALANCE: 'admin.balance',
  ADMIN_PRODUCT_CREATE: 'admin.product.create',
  ADMIN_PRODUCT_UPDATE: 'admin.product.update',
  ADMIN_PRODUCT_DELETE: 'admin.product.delete',
  ADMIN_PRODUCT_IMPORT: 'admin.product.import',
} as const;

export type EventAction = (typeof EVENT_ACTION)[keyof typeof EVENT_ACTION];

export const EVENT_OUTCOME = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  DENIED: 'denied',
} as const;

export type EventOutcome = (typeof EVENT_OUTCOME)[keyof typeof EVENT_OUTCOME];
