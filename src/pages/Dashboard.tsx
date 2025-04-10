
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { StatementsTable } from '@/components/dashboard/StatementsTable';
import { UploadDialog } from '@/components/dashboard/UploadDialog';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view your financial statements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              size="icon"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <UploadDialog onUploadComplete={handleRefresh} />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Your Statements</h2>
            <StatementsTable key={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
