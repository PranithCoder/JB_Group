import { createClient } from '@supabase/supabase-js';

// These would be configured in your .env or .env.local file
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/*
Database Schema Configuration:
To help you migrate from simulated localStorage to live Supabase, run this schema inside your Supabase SQL Editor:

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('officer', 'manager', 'boss', 'super_admin'))
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  preferences TEXT,
  notes TEXT,
  service_history_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_no TEXT UNIQUE,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  service_type TEXT,
  note TEXT,
  status TEXT CHECK (status IN ('pending', 'in-progress', 'completed')),
  amount DECIMAL(10, 2),
  payment_status TEXT CHECK (payment_status IN ('paid', 'unpaid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  role TEXT,
  salary DECIMAL(10, 2),
  join_date DATE,
  sick_leave_balance INTEGER DEFAULT 12,
  casual_leave_balance INTEGER DEFAULT 12,
  vacation_leave_balance INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_worked DECIMAL(4, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('Present', 'Absent')),
  leave_type TEXT CHECK (leave_type IN ('', 'sick', 'casual', 'vacation')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  stock_on_hand DECIMAL(10, 2) DEFAULT 0,
  reorder_threshold DECIMAL(10, 2) DEFAULT 0,
  unit_cost DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  quantity DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  date_reported DATE DEFAULT CURRENT_DATE,
  description TEXT,
  evidence_url TEXT,
  status TEXT CHECK (status IN ('In Review', 'Resolved', 'Escalated')),
  assigned_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  requested_by UUID REFERENCES profiles(id),
  request_date DATE DEFAULT CURRENT_DATE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  original_data JSONB,
  proposed_data JSONB,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  approval_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- Enable Row Level Security (RLS) policies based on user profile roles
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
*/
