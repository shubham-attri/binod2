"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { DocumentUpload } from "./document-upload";
import { DocumentList } from "./document-list";

export function DocumentDialog() {
  console.log('DocumentDialog: Rendering');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9"
          onClick={() => console.log('DocumentDialog: Button clicked')}
        >
          <FileText className="h-5 w-5" />
          <span className="sr-only">Open documents</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[600px]"
        onOpenAutoFocus={(e) => {
          console.log('DocumentDialog: Dialog opened');
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Documents</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <DocumentUpload />
          <DocumentList />
        </div>
      </DialogContent>
    </Dialog>
  );
} 