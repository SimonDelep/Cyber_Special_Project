export const AuditAction = {
  AUTH_LOGIN: "auth.login",
  AUTH_REGISTER: "auth.register",
  AUTH_LOGOUT: "auth.logout",
  PROFILE_UPDATE: "profile.update",
  PROFILE_DELETE: "profile.delete",
  PROFILE_AVATAR_UPLOAD: "profile.avatar_upload",
  TRANSACTION_CHECKOUT: "transaction.checkout",
  ADMIN_USER_UPDATE: "admin.user_update",
  ADMIN_USER_DELETE: "admin.user_delete",
  ADMIN_BALANCE_ADJUST: "admin.balance_adjust",
  ADMIN_PRODUCT_CREATE: "admin.product_create",
  ADMIN_PRODUCT_UPDATE: "admin.product_update",
  ADMIN_PRODUCT_DELETE: "admin.product_delete",
  ADMIN_PRODUCT_CSV_IMPORT: "admin.product_csv_import",
} as const;

export type AuditActionId = (typeof AuditAction)[keyof typeof AuditAction];
