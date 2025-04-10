import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUserTransactions } from "@/lib/api/statements";
import {
  getCachedInsights,
  generateAndStoreInsights,
} from "@/lib/api/insights";
import { Transaction } from "@/types/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  RefreshCw,
  Clock,
  CircleDollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  currency?: string;
};

export type CurrencyConfig = {
  code: string;
  symbol: string;
  name: string;
};

// Japanese Yen is now the only currency we use
const JPY_CURRENCY: CurrencyConfig = {
  code: "JPY",
  symbol: "¥",
  name: "Japanese Yen",
};

export function FinancialInsightsOptimized() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [cachedTime, setCachedTime] = useState<string | null>(null);
  const { toast } = useToast();

  console.log("Component render state:", {
    hasTransactions: transactions.length > 0,
    hasInsights: !!insights,
    loading,
    insightsLoading,
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      setLoading(true);
      try {
        // First get transactions to check if we have any
        const { data: transactionData, error: transactionError } =
          await getAllUserTransactions(user.id);

        if (transactionError) {
          setError(transactionError.message);
          setLoading(false);
          return;
        }

        // Set transactions regardless of whether we have insights
        if (transactionData) {
          setTransactions(transactionData);
        } else {
          setTransactions([]);
        }

        // If we have no transactions, don't try to get insights
        if (!transactionData || transactionData.length === 0) {
          setInsights(null);
          setCachedTime(null);
          setLoading(false);
          return;
        }

        // Try to get cached insights now that we know we have transactions
        const { data: cachedInsights, error: cacheError } =
          await getCachedInsights(user.id);

        if (cachedInsights) {
          console.log("Found cached insights:", cachedInsights);
          setInsights(
            cachedInsights.insights_data as unknown as SpendingInsights
          );
          setCachedTime(cachedInsights.generated_at);
        } else {
          console.log("No cached insights found");
          setInsights(null);
          setCachedTime(null);
        }
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  function formatCurrency(amount: number): string {
    // Japanese yen doesn't use decimal places and uses special formatting
    const options: Intl.NumberFormatOptions = {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
      currencyDisplay: "symbol",
    };
    return new Intl.NumberFormat("ja-JP", options).format(amount);
  }

  async function handleGenerateInsights() {
    if (!user) return;

    // Only try to fetch transactions if we don't have any yet
    if (transactions.length === 0) {
      const hasTransactions = await fetchTransactions();
      if (!hasTransactions) {
        toast({
          title: "No transactions available",
          description:
            "Upload statements with transactions to generate insights.",
          variant: "destructive",
        });
        return;
      }
    }

    setInsightsLoading(true);
    try {
      console.log("Generating insights for transactions:", transactions.length);

      // Process transactions to simplify for the AI
      const simplifiedTransactions = transactions.map((tx) => ({
        date: tx.transaction_date,
        description: tx.description,
        amount: tx.amount,
        category: tx.category || "Uncategorized",
      }));

      // Generate and store insights
      const { data: newInsights, error } = await generateAndStoreInsights(
        user.id,
        simplifiedTransactions
      );

      if (error) {
        console.error("Error from generateAndStoreInsights:", error);
        throw error;
      }

      if (newInsights) {
        console.log("Successfully generated new insights:", newInsights);
        setInsights(newInsights);
        setCachedTime(new Date().toISOString());
        toast({
          title: "Insights generated",
          description: "New financial insights are now available.",
        });
      } else {
        // If newInsights is null, try to fetch them directly
        console.log("No insights returned, trying to fetch from cache");
        const { data: cachedInsights } = await getCachedInsights(user.id);
        if (cachedInsights) {
          console.log(
            "Found cached insights after generation:",
            cachedInsights
          );
          setInsights(
            cachedInsights.insights_data as unknown as SpendingInsights
          );
          setCachedTime(cachedInsights.generated_at);
          toast({
            title: "Insights loaded",
            description: "Your financial insights are now available.",
          });
        } else {
          console.error("No insights found in cache after generation");
        }
      }
    } catch (err) {
      console.error("Failed to generate insights:", err);
      setError("Failed to generate spending insights");
      toast({
        title: "Error generating insights",
        description:
          "There was a problem analyzing your transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInsightsLoading(false);
    }
  }

  async function fetchTransactions() {
    if (!user) return false;

    try {
      const { data, error } = await getAllUserTransactions(user.id);
      if (error) {
        throw error;
      }
      if (data && data.length > 0) {
        setTransactions(data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to load transactions:", err);
      return false;
    }
  }

  // If we're loading, show the skeleton
  if (loading) {
    return <LoadingSkeleton />;
  }

  // If we have an error, show it
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
          <Link
            to="/insights"
            className="text-sm font-medium text-primary flex items-center hover:underline"
          >
            View More Details <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
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

  // If we're actively generating insights, show loading
  if (insightsLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Financial Insights</CardTitle>
            <CardDescription>
              Analysis of your spending patterns
            </CardDescription>
          </div>
          <Link
            to="/insights"
            className="text-sm font-medium text-primary flex items-center hover:underline"
          >
            View More Details <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <RefreshCw className="h-10 w-10 text-primary/50 mx-auto mb-3 animate-spin" />
            <h3 className="text-lg font-medium mb-1">
              Analyzing your transactions
            </h3>
            <p className="text-muted-foreground">This might take a moment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have transactions but no insights, show the generate button
  if (transactions.length > 0 && !insights) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Financial Insights</CardTitle>
            <CardDescription>
              Analysis of your spending patterns
            </CardDescription>
          </div>
          <Link
            to="/insights"
            className="text-sm font-medium text-primary flex items-center hover:underline"
          >
            View More Details <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Generate Financial Insights
          </h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Use AI to analyze your transactions and get personalized financial
            insights.
          </p>
          <Button
            onClick={handleGenerateInsights}
            disabled={insightsLoading}
            className="flex items-center gap-1"
          >
            {insightsLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                Analyzing...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-1" />
                Generate Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If we have no transactions, show empty state
  if (transactions.length === 0 && !insights) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Financial Insights</CardTitle>
            <CardDescription>
              Analysis of your spending patterns
            </CardDescription>
          </div>
          <Link
            to="/insights"
            className="text-sm font-medium text-primary flex items-center hover:underline"
          >
            View More Details <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
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
          <div className="text-center p-6">
            <RefreshCw className="h-10 w-10 text-primary/50 mx-auto mb-3 animate-spin" />
            <h3 className="text-lg font-medium mb-1">
              Analyzing your transactions
            </h3>
            <p className="text-muted-foreground">This might take a moment...</p>
          </div>
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
                      {formatCurrency(category.amount)} ({category.percentage}%)
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
                        {formatCurrency(insights.monthlySummary.totalIncome)}
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
                        {formatCurrency(insights.monthlySummary.totalExpenses)}
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
                        {formatCurrency(insights.monthlySummary.netCashFlow)}
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
                        {formatCurrency(activity.amount)}
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
      {insights && cachedTime && (
        <CardFooter className="border-t pt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Generated {formatDistanceToNow(new Date(cachedTime))} ago
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateInsights}
            disabled={insightsLoading}
            className="gap-1"
          >
            {insightsLoading ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Refresh Insights
              </>
            )}
          </Button>
        </CardFooter>
      )}
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
