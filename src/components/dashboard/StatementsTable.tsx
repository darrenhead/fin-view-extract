import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserStatements, deleteStatement } from "@/lib/api/statements";
import { Statement } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, ExternalLink, AlertTriangle, Trash2 } from "lucide-react";
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

export function StatementsTable() {
  const { user } = useAuth();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStatements() {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await getUserStatements(user.id);
        if (error) {
          setError(error.message);
        } else {
          setStatements(data || []);
        }
      } catch (err) {
        setError("Failed to load statements");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatements();
  }, [user]);

  const handleDelete = async (statementId: string) => {
    if (!user) return;

    setDeletingId(statementId);
    try {
      const { success, error } = await deleteStatement(statementId, user.id);

      if (success) {
        // Remove the statement from the local state
        setStatements(
          statements.filter((statement) => statement.id !== statementId)
        );

        toast({
          title: "Statement deleted",
          description: "Statement and all associated data have been removed.",
        });
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
      setDeletingId(null);
    }
  };

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

  if (statements.length === 0) {
    return (
      <div className="text-center my-8 p-6 bg-muted rounded-lg">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium mb-1">No statements found</h3>
        <p className="text-muted-foreground mb-4">
          Upload your first statement to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.map((statement) => (
            <TableRow key={statement.id}>
              <TableCell className="font-medium">
                {statement.file_name}
              </TableCell>
              <TableCell>
                {new Date(statement.uploaded_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell>
                <StatusBadge status={statement.processing_status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    disabled={statement.processing_status === "error"}
                  >
                    <Link to={`/statements/${statement.id}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the statement "
                          {statement.file_name}" and all extracted transactions.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(statement.id)}
                          disabled={deletingId === statement.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingId === statement.id
                            ? "Deleting..."
                            : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status }: { status: Statement["processing_status"] }) {
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
}
