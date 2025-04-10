import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStatementTransactions, getStatement } from "@/lib/api/statements";
import { Transaction, Statement } from "@/types/database.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TransactionsTable({ statementId }: { statementId: string }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [totalBillAmount, setTotalBillAmount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user || !statementId) return;

      setLoading(true);
      try {
        // First get the statement to get its currency
        const { data: statementData, error: statementError } =
          await getStatement(statementId, user.id);

        if (statementError) {
          throw statementError;
        }

        setStatement(statementData);

        // Check for total bill amount in metadata
        if (
          statementData?.metadata &&
          typeof statementData.metadata === "object" &&
          "total_bill_amount" in statementData.metadata
        ) {
          setTotalBillAmount(
            statementData.metadata.total_bill_amount as number
          );
        }

        // Then get transactions
        const { data, error } = await getStatementTransactions(
          statementId,
          user.id
        );
        if (error) {
          setError(error.message);
        } else {
          setTransactions(data || []);
        }
      } catch (err) {
        setError("Failed to load transactions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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
        <p className="text-muted-foreground">
          No transaction data could be extracted from this statement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TransactionSummary
        transactions={transactions}
        statementType={statement?.statement_type || ""}
        currency={statement?.currency}
        totalBillAmount={totalBillAmount}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">
                  {transaction.description}
                </TableCell>
                <TableCell className="text-right">
                  <TransactionAmount
                    amount={transaction.amount}
                    type={transaction.type}
                    currency={statement?.currency}
                  />
                </TableCell>
                <TableCell>
                  {transaction.category && (
                    <CategoryBadge category={transaction.category} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TransactionSummary({
  transactions,
  statementType,
  currency,
  totalBillAmount,
}: {
  transactions: Transaction[];
  statementType: string;
  currency?: string;
  totalBillAmount?: number | null;
}) {
  // Calculate total credits (money in)
  const totalCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate total debits (money out)
  const totalDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate net amount
  const netAmount = totalCredits - totalDebits;

  // Also calculate raw sum of all transactions regardless of type
  const rawTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Count of each transaction type
  const creditCount = transactions.filter((t) => t.type === "credit").length;
  const debitCount = transactions.filter((t) => t.type === "debit").length;
  const undefinedTypeCount = transactions.filter(
    (t) => t.type === undefined
  ).length;

  // Look for final balance if available in last transaction
  const lastTransaction = [...transactions].sort(
    (a, b) =>
      new Date(b.transaction_date).getTime() -
      new Date(a.transaction_date).getTime()
  )[0];
  const finalBalance = lastTransaction?.balance;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {statementType === "credit_card"
            ? "Payment Summary"
            : "Account Summary"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statementType === "credit_card" ? (
            <>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Charges</p>
                <p className="text-xl font-bold text-red-600">
                  {formatAmount(totalDebits, currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-xl font-bold text-green-600">
                  {formatAmount(totalCredits, currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p
                  className={`text-xl font-bold ${
                    netAmount < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatAmount(Math.abs(netAmount), currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Raw Total</p>
                <p className="text-xl font-bold">
                  {formatAmount(Math.abs(rawTotal), currency)}
                </p>
              </div>
              {totalBillAmount && (
                <div className="space-y-1 col-span-4 mt-2 bg-amber-50 p-3 rounded-md border border-amber-200">
                  <p className="text-sm font-medium text-amber-700">
                    Statement Total Amount
                  </p>
                  <p className="text-xl font-bold text-amber-800">
                    {formatAmount(totalBillAmount, currency)}
                  </p>
                  {Math.abs(totalBillAmount) !== Math.abs(rawTotal) && (
                    <p className="text-xs text-amber-600 mt-1">
                      Note: This amount differs from the sum of extracted
                      transactions ({formatAmount(Math.abs(rawTotal), currency)}
                      ). Some transactions may be missing.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Money In</p>
                <p className="text-xl font-bold text-green-600">
                  {formatAmount(totalCredits, currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Money Out</p>
                <p className="text-xl font-bold text-red-600">
                  {formatAmount(totalDebits, currency)}
                </p>
              </div>
              {finalBalance !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Ending Balance
                  </p>
                  <p className="text-xl font-bold">
                    {formatAmount(finalBalance, currency)}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net Change</p>
                <p
                  className={`text-xl font-bold ${
                    netAmount < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatAmount(netAmount, currency)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Debug information */}
        <div className="mt-4 text-xs text-muted-foreground border-t pt-2">
          <p>
            Extracted: {transactions.length} transactions (Credits:{" "}
            {creditCount}, Debits: {debitCount}
            {undefinedTypeCount > 0 ? `, Untyped: ${undefinedTypeCount}` : ""})
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionAmount({
  amount,
  type,
  currency,
}: {
  amount: number;
  type?: string;
  currency?: string;
}) {
  const formattedAmount = formatAmount(Math.abs(amount), currency || "USD");

  if (type === "credit") {
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

function CategoryBadge({ category }: { category: string }) {
  // Color mapping for common categories
  const categoryColors: Record<string, string> = {
    "Eating Out": "bg-orange-50 text-orange-700 border-orange-200",
    Groceries: "bg-green-50 text-green-700 border-green-200",
    Transportation: "bg-blue-50 text-blue-700 border-blue-200",
    Entertainment: "bg-purple-50 text-purple-700 border-purple-200",
    Utilities: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Housing: "bg-slate-50 text-slate-700 border-slate-200",
    Shopping: "bg-pink-50 text-pink-700 border-pink-200",
    Healthcare: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  const colorClass =
    categoryColors[category] || "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <Badge variant="outline" className={colorClass}>
      {category}
    </Badge>
  );
}

// Helper function to properly format currency amounts
function formatCurrencyAmount(amount: number, currency?: string): string {
  // If detected as JPY, use Japanese formatting
  if (currency === "JPY") {
    const options: Intl.NumberFormatOptions = {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
      currencyDisplay: "symbol",
    };
    return new Intl.NumberFormat("ja-JP", options).format(amount);
  }

  // Default formatting for other currencies or when currency is not specified
  return formatAmount(amount);
}
