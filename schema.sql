-- FitTrack CRM - Cloudflare D1 Database Schema
-- Run this in your Cloudflare D1 database:
-- npx wrangler d1 execute fittrack-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  instagram_handle TEXT DEFAULT '',
  source TEXT CHECK(source IN ('instagram_dm', 'whatsapp', 'referral', 'other')) DEFAULT 'instagram_dm',
  status TEXT CHECK(status IN ('lead', 'active', 'completed', 'inactive')) DEFAULT 'lead',
  custom_rate REAL DEFAULT 2500,
  payment_status TEXT CHECK(payment_status IN ('paid', 'pending')) DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS health_metrics (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date TEXT NOT NULL DEFAULT (date('now')),
  weight_kg REAL,
  height_cm REAL,
  bmi REAL,
  body_fat_pct REAL,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diet_plans (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  start_date TEXT NOT NULL DEFAULT (date('now')),
  end_date TEXT DEFAULT '',
  plan_details TEXT DEFAULT '{}',
  changes_log TEXT DEFAULT '[]',
  status TEXT CHECK(status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount REAL NOT NULL DEFAULT 2500,
  payment_date TEXT NOT NULL DEFAULT (date('now')),
  payment_method TEXT CHECK(payment_method IN ('cash', 'upi', 'bank_transfer')) DEFAULT 'upi',
  service_type TEXT CHECK(service_type IN ('diet_plan', 'personal_training', 'consultation')) DEFAULT 'diet_plan',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  follow_up_date TEXT NOT NULL,
  follow_up_type TEXT CHECK(follow_up_type IN ('check_in', 'diet_review', 'payment_reminder', 'promotional')) DEFAULT 'check_in',
  message TEXT DEFAULT '',
  amount REAL,
  status TEXT CHECK(status IN ('pending', 'done', 'skipped')) DEFAULT 'pending',
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_health_client ON health_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_diet_client ON diet_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_followups_client ON follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_followups_date ON follow_ups(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
