import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface Document {
  id: string;
  title: string;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  category: "pleading" | "evidence" | "correspondence" | "other";
}

interface CaseDocumentsProps {
  caseId: string;
}

export function CaseDocuments({ caseId }: CaseDocumentsProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  // Mock document data
  React.useEffect(() => {
    setDocuments([
      {
        id: "doc1",
        title: "Initial Complaint.pdf",
        type: "application/pdf",
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        uploadedBy: "Jane Doe",
        size: 2500000,
        category: "pleading",
      },
      {
        id: "doc2",
        title: "Evidence A - Contract.pdf",
        type: "application/pdf",
        uploadedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        uploadedBy: "John Smith",
        size: 1500000,
        category: "evidence",
      },
      {
        id: "doc3",
        title: "Client Communication.docx",
        type: "application/docx",
        uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        uploadedBy: "Jane Doe",
        size: 500000,
        category: "correspondence",
      },
    ]);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      // Mock document upload
      const newDoc: Document = {
        id: Math.random().toString(36).substring(7),
        title: files[0].name,
        type: files[0].type,
        uploadedAt: new Date(),
        uploadedBy: "Current User",
        size: files[0].size,
        category: "other",
      };

      setDocuments((prev) => [...prev, newDoc]);
      toast({
        title: "Document uploaded",
        description: `Successfully uploaded ${files[0].name}`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => document.getElementById("case-file-upload")?.click()}
          disabled={isUploading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="sr-only">Upload document</span>
        </Button>
        <input
          id="case-file-upload"
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
        />
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(doc.size)} • Uploaded by {doc.uploadedBy} •{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                    }).format(doc.uploadedAt)}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="sr-only">Download document</span>
              </Button>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 