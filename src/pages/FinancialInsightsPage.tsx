import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { FinancialInsightsOptimized } from "@/components/dashboard/FinancialInsightsOptimized";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft, RefreshCw, Lightbulb } from "lucide-react";
import { getAllUserTransactions } from "@/lib/api/statements";
import {
  generateAndStoreInsights,
  getCachedInsights,
} from "@/lib/api/insights";
import { Transaction } from "@/types/database.types";
import { useToast } from "@/components/ui/use-toast";

const FinancialInsightsPage = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const { toast } = useToast();

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleGenerateInsights = async () => {
    if (!user) return;

    setIsGeneratingInsights(true);
    toast({
      title: "Processing",
      description: "Fetching your transactions to generate insights...",
    });

    try {
      // Fetch all transactions
      const { data: transactions, error } = await getAllUserTransactions(
        user.id
      );

      if (error) {
        throw error;
      }

      if (!transactions || transactions.length === 0) {
        toast({
          title: "No transactions found",
          description: "Please upload statements with transactions first.",
          variant: "destructive",
        });
        return;
      }

      // Simplify the transactions for the AI
      const simplifiedTransactions = transactions.map((tx: Transaction) => ({
        date: tx.transaction_date,
        description: tx.description,
        amount: tx.amount,
        category: tx.category || "Uncategorized",
      }));

      // Generate and store insights
      toast({
        title: "Analyzing Transactions",
        description: "Using AI to analyze your financial data...",
      });

      const { data: insights, error: insightsError } =
        await generateAndStoreInsights(user.id, simplifiedTransactions);

      if (insightsError) {
        throw insightsError;
      }

      // Double-check that the insights were saved by fetching from cache
      const { data: cachedInsights } = await getCachedInsights(user.id);

      if (cachedInsights) {
        console.log("Verified insights were saved to database");
        toast({
          title: "Insights Generated",
          description: "Your financial insights are ready to view!",
        });

        // Refresh the page to show new insights with a delay
        setTimeout(() => {
          console.log("Refreshing dashboard after generating insights");
          handleRefresh();
        }, 800);
      } else {
        console.error("Insights were not found in cache after generation");
        toast({
          title: "Error Saving Insights",
          description:
            "Insights were generated but not saved. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description:
          "There was a problem generating your insights. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link to="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              size="icon"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights}
              className="gap-1"
            >
              {isGeneratingInsights ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis of your spending patterns and recommendations
          </p>
        </div>

        <FinancialInsightsOptimized key={`insights-${refreshKey}`} />
      </main>
    </div>
  );
};

export default FinancialInsightsPage;
