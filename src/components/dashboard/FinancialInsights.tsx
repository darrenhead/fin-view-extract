import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUserTransactions } from "@/lib/api/statements";
import { generateSpendingInsights } from "@/integrations/gemini/client";
import { Transaction } from "@/types/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

type SpendingInsights = {
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
};

export function FinancialInsights() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await getAllUserTransactions(user.id);
        if (error) {
          setError(error.message);
        } else if (data && data.length > 0) {
          setTransactions(data);
          // Once we have transactions, generate insights
          await generateInsights(data);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        setError("Failed to load transaction data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [user]);

  async function generateInsights(transactionData: Transaction[]) {
    if (!transactionData || transactionData.length === 0) return;

    setInsightsLoading(true);
    try {
      // Process transactions to simplify for the AI
      const simplifiedTransactions = transactionData.map((tx) => ({
        date: tx.transaction_date,
        description: tx.description,
        amount: tx.amount,
        category: tx.category || "Uncategorized",
      }));

      const insightsData = await generateSpendingInsights(
        simplifiedTransactions
      );
      setInsights(insightsData);
    } catch (err) {
      console.error("Failed to generate insights:", err);
      setError("Failed to generate spending insights");
    } finally {
      setInsightsLoading(false);
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Financial Insights</CardTitle>
            <CardDescription>
              Analysis of your spending patterns
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle size={16} />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Financial Insights</CardTitle>
            <CardDescription>
              Analysis of your spending patterns
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">
              No transaction data yet
            </h3>
            <p className="text-muted-foreground">
              Upload statements to see financial insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>Analysis of your spending patterns</CardDescription>
        </div>
        <Link
          to="/insights"
          className="text-sm font-medium text-primary flex items-center hover:underline"
        >
          View More Details <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {insightsLoading ? (
          <LoadingSkeleton />
        ) : !insights ? (
          <div className="text-center p-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">Insights unavailable</h3>
            <p className="text-muted-foreground">
              We couldn't generate insights from your transactions.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="top-spending">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="top-spending">Top Spending</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="unusual">Unusual Activity</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="top-spending" className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Top Spending Categories
              </h3>

              {insights.topCategories.map((category, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{category.category}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(category.amount)}{" "}
                      ({category.percentage}%)
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="summary">
              <h3 className="font-semibold text-lg mb-4">Monthly Summary</h3>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <ArrowDown className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">
                        Income
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(insights.monthlySummary.totalIncome)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <ArrowUp className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">
                        Expenses
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(insights.monthlySummary.totalExpenses)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">
                        Net Cash Flow
                      </div>
                      <div
                        className={`text-2xl font-bold mt-1 ${
                          insights.monthlySummary.netCashFlow >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(insights.monthlySummary.netCashFlow)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Spending Trends
                </h4>
                <p className="text-sm text-muted-foreground">
                  {insights.spendingTrends}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="unusual">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Unusual Activity
              </h3>

              {insights.unusualActivity &&
              insights.unusualActivity.length > 0 ? (
                <div className="space-y-3">
                  {insights.unusualActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-md flex justify-between items-center"
                    >
                      <span className="text-sm">{activity.description}</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(activity.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  No unusual activity detected.
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" /> Recommendations
              </h3>

              <div className="space-y-3">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 bg-muted rounded-md">
                    <div className="flex gap-3">
                      <div className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>Analysis of your spending patterns</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
