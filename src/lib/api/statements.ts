
import { supabase } from '@/integrations/supabase/client';
import { Statement, Transaction } from '@/types/database.types';

// Function to upload a PDF to Supabase Storage
export async function uploadPdf(file: File, userId: string): Promise<{ data: any; error: any }> {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `statements/${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('statements')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return { data: null, error: uploadError };
  }

  // Create statement record in database
  const { data: statementData, error: statementError } = await supabase
    .from('statements')
    .insert({
      user_id: userId,
      file_name: file.name,
      storage_path: filePath,
      uploaded_at: new Date().toISOString(),
      processing_status: 'uploaded'
    })
    .select()
    .single();

  if (statementError) {
    console.error('Database insert error:', statementError);
    // Delete the uploaded file if statement record creation fails
    await supabase.storage.from('statements').remove([filePath]);
    return { data: null, error: statementError };
  }

  // Trigger processing - safely access the id
  if (statementData && typeof statementData === 'object' && 'id' in statementData) {
    const statementId = statementData.id;
    await processPdf(statementId, userId, filePath);
  }

  return { data: statementData, error: null };
}

// Function to trigger PDF processing (this would be handled by a server-side API route in production)
async function processPdf(statementId: string, userId: string, filePath: string) {
  try {
    // Update statement status to processing
    await supabase
      .from('statements')
      .update({ processing_status: 'processing' })
      .eq('id', statementId);

    // In a real implementation, this would be a server-side API call
    // For this MVP, we'll simulate a successful processing after a short delay
    setTimeout(async () => {
      // Simulate extracting some sample data
      const mockTransactions = [
        {
          statement_id: statementId,
          user_id: userId,
          transaction_date: new Date().toISOString().split('T')[0],
          description: 'Sample Transaction 1',
          amount: 124.50,
          type: 'debit'
        },
        {
          statement_id: statementId,
          user_id: userId,
          transaction_date: new Date().toISOString().split('T')[0],
          description: 'Sample Transaction 2',
          amount: 75.20,
          type: 'debit'
        },
        {
          statement_id: statementId,
          user_id: userId,
          transaction_date: new Date().toISOString().split('T')[0],
          description: 'Deposit',
          amount: 1000.00,
          type: 'credit'
        }
      ];

      // Insert mock transactions
      await supabase.from('transactions').insert(mockTransactions);

      // Update statement status to processed
      await supabase
        .from('statements')
        .update({ processing_status: 'processed' })
        .eq('id', statementId);
    }, 3000);
  } catch (error) {
    console.error('Error processing PDF:', error);
    // Update statement status to error
    await supabase
      .from('statements')
      .update({ processing_status: 'error' })
      .eq('id', statementId);
  }
}

// Function to get all statements for a user
export async function getUserStatements(userId: string): Promise<{ data: Statement[] | null; error: any }> {
  const { data, error } = await supabase
    .from('statements')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  // Type assertion with safety check
  const typedData = data as unknown;
  return { 
    data: Array.isArray(typedData) ? typedData as Statement[] : null, 
    error 
  };
}

// Function to get a specific statement
export async function getStatement(statementId: string, userId: string): Promise<{ data: Statement | null; error: any }> {
  const { data, error } = await supabase
    .from('statements')
    .select('*')
    .eq('id', statementId)
    .eq('user_id', userId)
    .single();

  // Type assertion with safety check
  return { 
    data: data as unknown as Statement | null, 
    error 
  };
}

// Function to get transactions for a statement
export async function getStatementTransactions(statementId: string, userId: string): Promise<{ data: Transaction[] | null; error: any }> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('statement_id', statementId)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  // Type assertion with safety check
  const typedData = data as unknown;
  return { 
    data: Array.isArray(typedData) ? typedData as Transaction[] : null, 
    error 
  };
}
