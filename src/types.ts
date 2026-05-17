export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'member';
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  customer: string;
  invoice_no: string;
  category: string;
  description: string;
  source?: string;
  payment_mode?: '对公' | '对私';
  project_name?: string;
  attachment_url?: string;
  operator_id: number;
  operator_name: string;
  is_deleted: number;
  created_at: string;
  updated_at?: string;
}

export interface OperationLog {
  id: number;
  user_id: number;
  user_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  module: string;
  target_id: number;
  details: string;
  reason?: string;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  initial_balance: number;
  current_balance: number;
  created_at: string;
}
