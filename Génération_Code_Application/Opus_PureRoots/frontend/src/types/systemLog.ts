export interface SystemLog {
  id: number;
  event_type: string;
  user_id: number | null;
  username: string | null;
  ip_address: string | null;
  success: boolean;
  message: string;
  details: string | null;
  created_at: string;
}

export interface SystemLogListResponse {
  items: SystemLog[];
  total: number;
  limit: number;
  offset: number;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  login_success: "Login success",
  login_failure: "Login failure",
  logout: "Logout",
  register: "Registration",
  profile_update: "Profile change",
  checkout_success: "Checkout success",
  checkout_failure: "Checkout failure",
  balance_adjustment: "Balance adjustment",
  admin_user_update: "Admin user update",
};
