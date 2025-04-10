
export type Profile = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Statement = {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  uploaded_at: string;
  statement_type?: 'bank' | 'investment' | 'crypto';
  processing_status: 'uploaded' | 'processing' | 'processed' | 'error';
};

export type Transaction = {
  id: string;
  statement_id: string;
  user_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type?: 'debit' | 'credit';
  raw_data?: string;
};
