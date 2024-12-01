"use client";

import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Card } from "../ui/card";

export interface Document {
  id: string;
  title: string;
  type: "pdf" | "doc" | "txt";
  url: string;
  excerpt?: string;
}

interface DocumentPanelProps {
  documents?: Document[];
  onSearch?: (query: string) => void;
  onDocumentSelect?: (document: Document) => void;
  isLoading?: boolean;
}

export function DocumentPanel({
  documents = [],
  onSearch,
  onDocumentSelect,
  isLoading = false,
}: DocumentPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Input
          placeholder="Search documents..."
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer p-3 hover:bg-muted/50"
              onClick={() => onDocumentSelect?.(doc)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{doc.title}</h4>
                  {doc.excerpt && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {doc.excerpt}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon">
                  <FileIcon className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {isLoading && (
            <div className="flex justify-center p-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
} 