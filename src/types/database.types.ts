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
  statement_type: string;
  processing_status: "pending" | "processing" | "completed" | "failed";
  uploaded_at: string;
  storage_path: string;
  currency?: string;
  metadata?: Record<string, unknown>;
};

export type Transaction = {
  id: string;
  statement_id: string;
  user_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type?: "debit" | "credit";
  category?: string;
  raw_data?: string;
  balance?: number;
  currency?: string;
};

export type StatementSummary = {
  id: string;
  statement_id: string;
  user_id: string;
  account_number?: string;
  period_start?: string;
  period_end?: string;
  opening_balance?: number;
  total_paid_in?: number;
  total_paid_out?: number;
  closing_balance?: number;
  created_at: string;
};

export type Insights = {
  id: string;
  user_id: string;
  insights_data: {
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    monthlySummary: {
      totalIncome: number;
      totalExpenses: number;
      netCashFlow: number;
    };
    unusualActivity: Array<{
      description: string;
      amount: number;
    }>;
    spendingTrends: string;
    recommendations: string[];
    currency?: string;
  };
  generated_at: string;
  expires_at: string;
};
