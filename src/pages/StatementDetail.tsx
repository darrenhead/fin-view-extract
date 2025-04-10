import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getStatement, deleteStatement } from "@/lib/api/statements";
import { Statement } from "@/types/database.types";
import { Header } from "@/components/layout/Header";
import { TransactionsTable } from "@/components/statements/TransactionsTable";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  FileText,
  RefreshCw,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const StatementDetail = () => {
  const { statementId } = useParams<{ statementId: string }>();
  const { user } = useAuth();
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStatement() {
      if (!user || !statementId) return;

      setLoading(true);
      try {
        const { data, error } = await getStatement(statementId, user.id);
        if (error) {
          setError(error.message);
        } else {
          setStatement(data);
        }
      } catch (err) {
        setError("Failed to load statement details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatement();
  }, [user, statementId, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleDelete = async () => {
    if (!user || !statementId) return;

    setIsDeleting(true);
    try {
      const { success, error } = await deleteStatement(statementId, user.id);

      if (success) {
        toast({
          title: "Statement deleted",
          description: "Statement and all associated data have been removed.",
        });
        // Redirect to dashboard after successful deletion
        navigate("/dashboard");
      } else {
        toast({
          title: "Error deleting statement",
          description:
            error?.message || "An error occurred while deleting the statement.",
          variant: "destructive",
        });
        console.error("Error deleting statement:", error);
      }
    } catch (err) {
      console.error("Unexpected error during deletion:", err);
      toast({
        title: "Error deleting statement",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: Statement["processing_status"]) => {
    switch (status) {
      case "uploaded":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Uploaded
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Processing
          </Badge>
        );
      case "processed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Processed
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" asChild>
            <Link to="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Link>
          </Button>

          {statement && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Statement
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this statement and all
                    extracted transactions. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 p-6 rounded-md flex items-center gap-3 text-destructive my-8">
            <AlertTriangle size={24} />
            <div>
              <h3 className="font-medium">Error Loading Statement</h3>
              <p>{error}</p>
            </div>
          </div>
        ) : statement ? (
          <div className="space-y-8">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {statement.file_name}
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>
                        Uploaded:{" "}
                        {new Date(statement.uploaded_at).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                      <span>•</span>
                      <span>{getStatusBadge(statement.processing_status)}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                Extracted Transactions
              </h2>

              {statement.processing_status === "processing" ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Processing your statement...
                  </p>
                </div>
              ) : statement.processing_status === "error" ? (
                <div className="bg-destructive/10 p-6 rounded-md text-center">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-destructive" />
                  <h3 className="text-lg font-medium text-destructive mb-1">
                    Processing Error
                  </h3>
                  <p className="text-muted-foreground">
                    There was an error processing this statement. Please try
                    uploading again.
                  </p>
                </div>
              ) : (
                <TransactionsTable
                  statementId={statement.id}
                  key={refreshKey}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Statement not found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StatementDetail;
