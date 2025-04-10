
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadPdf } from '@/lib/api/statements';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, AlertCircle, FileText, X, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UploadDialog({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile: File | null) => {
    setError(null);
    
    if (!selectedFile) {
      return;
    }
    
    // Check if file is a PDF
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    
    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0] || null;
    validateAndSetFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file || !user) {
      if (!user) {
        setError('You must be logged in to upload files.');
      } else if (!file) {
        setError('Please select a file to upload.');
      }
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const { data, error } = await uploadPdf(file, user.id);
      
      if (error) {
        console.error('Upload error details:', error);
        if (typeof error === 'object' && error !== null) {
          if ('message' in error) {
            const errorMessage = error.message as string;
            if (errorMessage.includes('row-level security policy')) {
              setError('Permission denied: You do not have permission to upload files.');
            } else {
              setError(errorMessage || 'Upload failed');
            }
          } else {
            setError('An error occurred during upload.');
          }
        } else {
          setError('Upload failed with an unknown error.');
        }
        return;
      }
      
      toast({
        title: "Upload successful",
        description: "Your PDF was uploaded and is now being processed.",
      });
      
      setFile(null);
      setIsOpen(false);
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('An unexpected error occurred during upload: ' + (err.message || ''));
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Financial Statement</DialogTitle>
          <DialogDescription>
            Upload a bank statement or other financial document in PDF format
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!user && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-2 text-amber-700 text-sm">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <span>You need to be logged in to upload files.</span>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2 text-destructive text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {file ? (
            <div className="bg-secondary p-4 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                <div className="truncate">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X size={18} />
              </Button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">Drag & drop file here</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports: PDF only (max 10MB)
              </p>
              <div className="flex justify-center">
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md font-medium text-sm"
                >
                  Browse Files
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading || !user}
            className="relative"
          >
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary rounded-md">
                <div className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
              </div>
            )}
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
