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
  attachment_url?: string;
  operator_id: number;
  operator_name: string;
  is_deleted: number;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  initial_balance: number;
  current_balance: number;
  created_at: string;
}
