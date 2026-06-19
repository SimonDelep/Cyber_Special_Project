export type EventCategory = "auth" | "profile" | "transaction" | "admin";
export type EventSeverity = "info" | "warning" | "error";

export interface SystemEvent {
  id: number;
  event_type: string;
  category: EventCategory;
  severity: EventSeverity;
  success: boolean;
  user_id: number | null;
  actor_username: string | null;
  ip_address: string | null;
  user_agent: string | null;
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface SystemEventListResponse {
  items: SystemEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface EventLogFilters {
  category?: EventCategory;
  event_type?: string;
  success?: boolean;
  user_id?: number;
  limit?: number;
  offset?: number;
}
