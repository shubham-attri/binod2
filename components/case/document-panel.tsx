"use client";

import { useState } from "react";
import { FileText, Upload, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
  size: number;
}

export function DocumentPanel() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      // TODO: Implement file upload to Supabase
      const newDoc: Document = {
        id: Date.now().toString(),
        name: files[0].name,
        type: files[0].type,
        uploadedAt: new Date(),
        size: files[0].size,
      };
      
      setDocuments((prev) => [...prev, newDoc]);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <SheetTitle>Documents</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
              aria-label="Upload document"
            />
            <Label htmlFor="file-upload">
              <Button
                className="w-full cursor-pointer"
                disabled={uploading}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </span>
              </Button>
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={cn(
                "transition-colors hover:bg-accent",
                "group relative"
              )}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat("en-US", {
                        style: "unit",
                        unit: "byte",
                        unitDisplay: "narrow",
                      }).format(doc.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/90"
                  onClick={() => {
                    setDocuments((prev) =>
                      prev.filter((d) => d.id !== doc.id)
                    );
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete document</span>
                </Button>
              </CardContent>
            </Card>
          ))}
          {documents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 