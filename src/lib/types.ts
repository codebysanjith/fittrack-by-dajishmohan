// FitTrack CRM Types

export type ClientSource = 'instagram_dm' | 'whatsapp' | 'referral' | 'other';
export type ClientStatus = 'lead' | 'active' | 'completed' | 'inactive';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer';
export type ServiceType = 'diet_plan' | 'personal_training' | 'consultation';
export type FollowUpType = 'check_in' | 'diet_review' | 'payment_reminder' | 'promotional';
export type FollowUpStatus = 'pending' | 'done' | 'skipped';
export type DietPlanStatus = 'active' | 'completed' | 'paused';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  instagram_handle: string;
  source: ClientSource;
  status: ClientStatus;
  notes: string;
  custom_rate: number;
  payment_status: 'paid' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface HealthMetric {
  id: string;
  client_id: string;
  date: string;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  body_fat_pct: number | null;
  notes: string;
  created_at: string;
}

export interface DietPlan {
  id: string;
  client_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  plan_details: string;
  changes_log: string;
  status: DietPlanStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  service_type: ServiceType;
  status?: 'paid' | 'pending';
  notes: string;
  created_at: string;
}

export interface FollowUp {
  id: string;
  client_id: string;
  follow_up_date: string;
  follow_up_type: FollowUpType;
  message: string;
  amount?: number | null;
  status: FollowUpStatus;
  completed_at: string | null;
  created_at: string;
}

export interface FollowUpWithClient extends FollowUp {
  client_name: string;
  client_phone: string;
  client_instagram: string;
  client_source?: ClientSource;
  custom_rate?: number;
  payment_status?: 'paid' | 'pending';
}

export interface DashboardStats {
  total_clients: number;
  active_clients: number;
  leads: number;
  this_month_earnings: number;
  total_earnings: number;
  pending_follow_ups: number;
  overdue_follow_ups: number;
}

export interface ClientDetail extends Client {
  health_metrics: HealthMetric[];
  diet_plans: DietPlan[];
  payments: Payment[];
  follow_ups: FollowUp[];
  total_paid: number;
}

export interface EarningsSummary {
  total: number;
  this_month: number;
  last_month: number;
  by_service: { service_type: ServiceType; total: number }[];
  by_month: { month: string; total: number }[];
  recent_payments: (Payment & { client_name: string })[];
}
