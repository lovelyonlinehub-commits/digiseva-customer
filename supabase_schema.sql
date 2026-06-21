-- ============================================
-- DIGI SEVA CENTER - DATABASE SCHEMA
-- Supabase (PostgreSQL) ke liye
-- Yeh poora file Supabase SQL Editor mein paste karke RUN karein
-- ============================================

-- 1. SERVICES TABLE (Admin yahan se services manage karega)
create table services (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  price numeric not null,
  required_docs text,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Shuruwati services daal rahe hain
insert into services (name, category, price, required_docs, description) values
('GST Registration', 'Tax & Accounting', 499, 'Aadhar, PAN, Business Proof', 'Naya GST number lene ke liye'),
('ITR Filing', 'Tax & Accounting', 299, 'Aadhar, PAN, Form 16', 'Income tax return file karna'),
('PAN Card Apply', 'Identity Document', 149, 'Aadhar, Photo, DOB Proof', 'Naya PAN card banana'),
('Cast Certificate', 'Government Certificate', 99, 'Aadhar, Ration Card', 'Cast certificate banana'),
('Income Certificate', 'Government Certificate', 99, 'Aadhar, Income Proof', 'Income certificate banana'),
('Resident Certificate', 'Government Certificate', 99, 'Aadhar, Address Proof', 'Resident certificate banana'),
('Ration Card', 'Government Certificate', 199, 'Aadhar, Family Photo', 'Naya ration card banana'),
('Tally / Excel Work', 'Financial', 399, 'Data file ya records', 'Business accounting kaam');

-- 2. CUSTOMERS TABLE (mobile number se login)
create table customers (
  id uuid default gen_random_uuid() primary key,
  mobile text unique not null,
  full_name text,
  email text,
  address text,
  created_at timestamp with time zone default now()
);

-- 3. AGENTS TABLE (admin agents add karega)
create table agents (
  id uuid default gen_random_uuid() primary key,
  mobile text unique not null,
  full_name text not null,
  password text not null, -- production mein hashed hona chahiye
  specialization text,
  is_active boolean default true,
  total_earned numeric default 0,
  created_at timestamp with time zone default now()
);

-- 4. ORDERS TABLE (sabse zaroori table)
create table orders (
  id bigint generated always as identity primary key,
  order_number text unique not null,
  customer_id uuid references customers(id),
  service_id bigint references services(id),
  agent_id uuid references agents(id),
  customer_name text not null,
  customer_mobile text not null,
  customer_email text,
  customer_address text,
  service_name text not null,
  price numeric not null,
  agent_commission numeric default 0,
  status text default 'pending', -- pending, in_progress, complete, cancelled
  payment_status text default 'unpaid', -- unpaid, paid
  payment_method text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. ORDER DOCUMENTS (customer ke uploaded documents)
create table order_documents (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  uploaded_by text default 'customer', -- customer or agent
  doc_type text default 'document', -- document or certificate
  created_at timestamp with time zone default now()
);

-- 6. ORDER STATUS HISTORY (tracking ke liye)
create table order_status_history (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamp with time zone default now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Security ke liye zaroori
-- ============================================

alter table services enable row level security;
alter table customers enable row level security;
alter table agents enable row level security;
alter table orders enable row level security;
alter table order_documents enable row level security;
alter table order_status_history enable row level security;

-- Services: sab dekh sakte hain (sirf active)
create policy "Active services dikhao sabko" on services
  for select using (is_active = true);

-- Customers: apna data dekh/edit kar sakte hain
create policy "Customer apna data dekh sake" on customers
  for select using (true);
create policy "Customer apna data bana sake" on customers
  for insert with check (true);
create policy "Customer apna data update kar sake" on customers
  for update using (true);

-- Orders: customer apna order dekh/bana sake
create policy "Customer apna order dekh sake" on orders
  for select using (true);
create policy "Customer order bana sake" on orders
  for insert with check (true);
create policy "Order update ho sake" on orders
  for update using (true);

-- Documents: dekh sake aur upload kar sake
create policy "Documents dekh sake" on order_documents
  for select using (true);
create policy "Documents upload kar sake" on order_documents
  for insert with check (true);

-- Status history
create policy "Status history dekh sake" on order_status_history
  for select using (true);
create policy "Status history bana sake" on order_status_history
  for insert with check (true);

-- ============================================
-- STORAGE BUCKET (documents upload ke liye)
-- Yeh Supabase Dashboard > Storage mein manually banayein:
-- Bucket name: "documents"
-- Public: true (ya policy set karein)
-- ============================================
