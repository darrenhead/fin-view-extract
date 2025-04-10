
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStatementTransactions } from '@/lib/api/statements';
import { Transaction } from '@/types/database.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react';

export function TransactionsTable({ statementId }: { statementId: string }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      if (!user || !statementId) return;
      
      setLoading(true);
      try {
        const { data, error } = await getStatementTransactions(statementId, user.id);
        if (error) {
          setError(error.message);
        } else {
          setTransactions(data || []);
        }
      } catch (err) {
        setError('Failed to load transactions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [user, statementId]);

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md flex items-center gap-2 text-destructive">
        <AlertTriangle size={16} />
        <p>{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center my-8 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-medium mb-1">No transactions found</h3>
        <p className="text-muted-foreground">No transaction data could be extracted from this statement.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {new Date(transaction.transaction_date).toLocaleDateString()}
              </TableCell>
              <TableCell className="font-medium">{transaction.description}</TableCell>
              <TableCell className="text-right">
                <TransactionAmount 
                  amount={transaction.amount} 
                  type={transaction.type} 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TransactionAmount({ amount, type }: { amount: number, type?: string }) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));

  if (type === 'credit') {
    return (
      <span className="text-green-600 flex items-center justify-end">
        <ArrowDown className="h-3 w-3 mr-1" />
        {formattedAmount}
      </span>
    );
  } else {
    return (
      <span className="text-red-600 flex items-center justify-end">
        <ArrowUp className="h-3 w-3 mr-1" />
        {formattedAmount}
      </span>
    );
  }
}
