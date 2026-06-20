export type EventType =
  | "login_attempt"
  | "logout"
  | "register"
  | "profile_update"
  | "profile_avatar"
  | "account_delete"
  | "checkout_request"
  | "admin_user_update"
  | "admin_balance_adjust";

export type EventStatus = "success" | "failure" | "info";

export interface SystemEvent {
  id: number;
  event_type: EventType;
  status: EventStatus;
  message: string;
  user_id: number | null;
  username: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SystemEventFilters {
  limit?: number;
  event_type?: EventType;
  status?: EventStatus;
  user_id?: number;
}
