import { supabase } from "@/integrations/supabase/client";
import { Statement, Transaction } from "@/types/database.types";
import { processPdfWithGemini } from "@/integrations/gemini/client";
import { PostgrestError } from "@supabase/supabase-js";
import { TablesUpdate } from "@/integrations/supabase/types";

/**
 * Helper function to encode file names for Supabase Storage
 * This handles non-ASCII characters like Japanese, Chinese, etc.
 */
function encodeFileName(fileName: string): string {
  return encodeURIComponent(fileName);
}

/**
 * Helper function to decode file names from Supabase Storage
 */
function decodeFileName(encodedFileName: string): string {
  return decodeURIComponent(encodedFileName);
}

// Function to upload a PDF to Supabase Storage
export async function uploadPdf(
  file: File,
  userId: string
): Promise<{ data: Statement | null; error: PostgrestError | Error | null }> {
  // Encode the file name to handle non-ASCII characters like Japanese
  const encodedFileName = encodeFileName(file.name);
  const fileName = `${Date.now()}_${encodedFileName}`;
  const filePath = `statements/${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("statements")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { data: null, error: uploadError };
  }

  // Create statement record in database
  const { data: statementData, error: statementError } = await supabase
    .from("statements")
    .insert({
      user_id: userId,
      file_name: file.name, // Store original file name in the database
      storage_path: filePath,
      uploaded_at: new Date().toISOString(),
      processing_status: "uploaded",
    })
    .select()
    .single();

  if (statementError) {
    console.error("Database insert error:", statementError);
    // Delete the uploaded file if statement record creation fails
    await supabase.storage.from("statements").remove([filePath]);
    return { data: null, error: statementError };
  }

  // Trigger processing - safely access the id
  if (
    statementData &&
    typeof statementData === "object" &&
    "id" in statementData
  ) {
    const statementId = statementData.id;
    await processPdf(statementId, userId, filePath, file);
  }

  return { data: statementData as Statement, error: null };
}

// Function to trigger PDF processing
async function processPdf(
  statementId: string,
  userId: string,
  filePath: string,
  file: File
) {
  try {
    // Update statement status to processing
    await supabase
      .from("statements")
      .update({ processing_status: "processing" })
      .eq("id", statementId);

    // Get the downloadable URL for the file from Supabase Storage
    // The filePath already contains the encoded file name, so we can use it directly
    const {
      data: { publicUrl },
    } = supabase.storage.from("statements").getPublicUrl(filePath);

    // Process the PDF using Gemini API
    let extractedData;
    try {
      // Process PDF directly with the file object
      extractedData = await processPdfWithGemini(file);
    } catch (error) {
      console.error("Error processing PDF with Gemini:", error);
      throw error;
    }

    if (!extractedData) {
      throw new Error("Invalid data format returned from Gemini");
    }

    const transactions = extractedData.transactions;
    const summary = extractedData.summary;

    if (!transactions || !Array.isArray(transactions)) {
      throw new Error("Invalid transaction data format returned from Gemini");
    }

    // Detect currency from the statement summary or filename
    let detectedCurrency = summary?.currency || "USD";

    // If the filename contains Japanese characters or mentions SMBC, it's likely JPY
    if (
      file.name.match(
        /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/g
      ) ||
      file.name.includes("SMBC") ||
      file.name.includes("三井住友") ||
      file.name.includes("みずほ") ||
      file.name.includes("Mizuho") ||
      file.name.includes("MUFG")
    ) {
      detectedCurrency = "JPY";
      console.log("Detected Japanese bank statement, setting currency to JPY");
    }

    // Update the statement with the detected currency
    // Using a type-safe approach to update just the currency field
    const updateData: Record<string, string> = { currency: detectedCurrency };
    await supabase.from("statements").update(updateData).eq("id", statementId);

    // Map the transactions to the correct format for our database
    const formattedTransactions = transactions.map((transaction) => ({
      statement_id: statementId,
      user_id: userId,
      transaction_date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.amount < 0 ? "debit" : "credit",
      category: transaction.category || null,
      balance: transaction.balance || null,
      currency: detectedCurrency,
    }));

    // For Japanese credit card statements, check total amount
    if (detectedCurrency === "JPY" && summary?.totalBillAmount) {
      console.log(
        `Credit card bill total amount detected: ${summary.totalBillAmount} ${detectedCurrency}`
      );

      // Update the statement to include the total bill amount
      const updateBillData: Record<string, unknown> = {
        currency: detectedCurrency,
        metadata: {
          total_bill_amount: summary.totalBillAmount,
          statement_type: "credit_card",
        },
      };

      await supabase
        .from("statements")
        .update(updateBillData)
        .eq("id", statementId);
    }

    // Insert transactions
    const { error: insertError } = await supabase
      .from("transactions")
      .insert(formattedTransactions);

    if (insertError) {
      console.error("Error inserting transactions:", insertError);
      throw insertError;
    }

    // Statement summary handling temporarily disabled until database types are updated
    /* 
    // Insert statement summary if available
    if (summary) {
      const formattedSummary = {
        statement_id: statementId,
        user_id: userId,
        account_number: summary.accountNumber || null,
        period_start: summary.period?.startDate || null,
        period_end: summary.period?.endDate || null,
        opening_balance: summary.openingBalance || null,
        total_paid_in: summary.totalPaidIn || null,
        total_paid_out: summary.totalPaidOut || null,
        closing_balance: summary.closingBalance || null,
        currency: summary.currency || "USD",
      };

      const { error: summaryError } = await supabase
        .from("statement_summary")
        .insert(formattedSummary);

      if (summaryError) {
        console.error("Error inserting statement summary:", summaryError);
        // Continue even if summary insertion fails
      }
    }
    */

    // Update statement status to processed
    await supabase
      .from("statements")
      .update({ processing_status: "processed" })
      .eq("id", statementId);
  } catch (error) {
    console.error("Error processing PDF:", error);
    // Update statement status to error
    await supabase
      .from("statements")
      .update({ processing_status: "error" })
      .eq("id", statementId);
  }
}

// Function to get all statements for a user
export async function getUserStatements(
  userId: string
): Promise<{ data: Statement[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  // Type assertion with safety check
  const typedData = data as unknown;
  return {
    data: Array.isArray(typedData) ? (typedData as Statement[]) : null,
    error,
  };
}

// Function to get a specific statement
export async function getStatement(
  statementId: string,
  userId: string
): Promise<{ data: Statement | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("id", statementId)
    .eq("user_id", userId)
    .single();

  // Type assertion with safety check
  return {
    data: data as unknown as Statement | null,
    error,
  };
}

// Function to get transactions for a statement
export async function getStatementTransactions(
  statementId: string,
  userId: string
): Promise<{ data: Transaction[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("statement_id", statementId)
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  // Type assertion with safety check
  const typedData = data as unknown;
  return {
    data: Array.isArray(typedData) ? (typedData as Transaction[]) : null,
    error,
  };
}

/**
 * Delete a statement and all associated data
 * This includes:
 * 1. The file from storage
 * 2. All transactions linked to the statement
 * 3. The statement record itself
 */
export async function deleteStatement(
  statementId: string,
  userId: string
): Promise<{ success: boolean; error: PostgrestError | Error | null }> {
  try {
    // Step 1: Get the statement to retrieve the storage path
    const { data: statement, error: fetchError } = await supabase
      .from("statements")
      .select("storage_path")
      .eq("id", statementId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !statement) {
      console.error("Error fetching statement:", fetchError);
      return {
        success: false,
        error: fetchError || new Error("Statement not found"),
      };
    }

    // Step 2: Delete all associated transactions
    const { error: transactionDeleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("statement_id", statementId)
      .eq("user_id", userId);

    if (transactionDeleteError) {
      console.error("Error deleting transactions:", transactionDeleteError);
      return { success: false, error: transactionDeleteError };
    }

    // Step 3: Delete the statement record
    const { error: statementDeleteError } = await supabase
      .from("statements")
      .delete()
      .eq("id", statementId)
      .eq("user_id", userId);

    if (statementDeleteError) {
      console.error("Error deleting statement:", statementDeleteError);
      return { success: false, error: statementDeleteError };
    }

    // Step 4: Delete the file from storage
    // The storage_path already contains the encoded file name, so we can use it directly
    const { error: storageDeleteError } = await supabase.storage
      .from("statements")
      .remove([statement.storage_path]);

    if (storageDeleteError) {
      console.error("Error deleting file from storage:", storageDeleteError);
      // Note: We still return success=true even if the storage deletion fails
      // because the database records have been deleted successfully
      // This could happen if the file was already removed or moved
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in deleteStatement:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Get all transactions for a user across all statements
 */
export async function getAllUserTransactions(
  userId: string
): Promise<{ data: Transaction[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  // Type assertion with safety check
  const typedData = data as unknown;
  return {
    data: Array.isArray(typedData) ? (typedData as Transaction[]) : null,
    error,
  };
}
