import { supabase } from "@/integrations/supabase/client";
import { Insights } from "@/types/database.types";
import { generateSpendingInsights } from "@/integrations/gemini/client";

type InsightsParams = {
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

/**
 * Get cached insights for a user if they exist and haven't expired
 */
export async function getCachedInsights(
  userId: string
): Promise<{ data: Insights | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("insights")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", now)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "No rows returned" error
      console.error("Error fetching cached insights:", error);
      return { data: null, error };
    }

    return {
      data: data as Insights | null,
      error: null,
    };
  } catch (error) {
    console.error("Error in getCachedInsights:", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Store insights in the database
 */
export async function storeInsights(
  userId: string,
  insights: InsightsParams
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // First delete any existing insights for this user to avoid multiple entries
    await supabase.from("insights").delete().eq("user_id", userId);

    // Insert new insights
    const { error } = await supabase.from("insights").insert({
      user_id: userId,
      insights_data: insights,
      generated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      console.error("Error storing insights:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in storeInsights:", error);
    return { success: false, error: error as Error };
  }
}

/**
 * Generate fresh insights for a user and store them in the database
 */
export async function generateAndStoreInsights(
  userId: string,
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    category: string;
    currency?: string;
  }>
): Promise<{ data: InsightsParams | null; error: Error | null }> {
  try {
    // Determine the primary currency from transactions
    // Use the most common currency in the transactions
    const currencyCounts: Record<string, number> = {};
    transactions.forEach((tx) => {
      const currency = tx.currency || "USD";
      currencyCounts[currency] = (currencyCounts[currency] || 0) + 1;
    });

    // Find the most common currency
    let primaryCurrency = "USD";
    let maxCount = 0;

    Object.entries(currencyCounts).forEach(([currency, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryCurrency = currency;
      }
    });

    console.log(
      `Detected primary currency: ${primaryCurrency} for insights generation`
    );

    // Generate insights using Gemini
    const insights = await generateSpendingInsights(transactions);

    // Add the detected currency to the insights data
    const insightsWithCurrency = {
      ...insights,
      currency: primaryCurrency,
    };

    // Store insights in the database
    const { success, error } = await storeInsights(
      userId,
      insightsWithCurrency
    );

    if (!success || error) {
      return {
        data: null,
        error: error || new Error("Failed to store insights"),
      };
    }

    return { data: insightsWithCurrency, error: null };
  } catch (error) {
    console.error("Error generating and storing insights:", error);
    return { data: null, error: error as Error };
  }
}
