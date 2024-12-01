import React, { createContext, useContext, useState } from "react";

interface Document {
  id: string;
  title: string;
  type: string;
  uploadedAt: Date;
  size: number;
}

interface ResearchContextType {
  documents: Document[];
  addDocument: (doc: Document) => void;
  removeDocument: (id: string) => void;
  selectedDocument: Document | null;
  setSelectedDocument: (doc: Document | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined);

export function ResearchProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const addDocument = (doc: Document) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    if (selectedDocument?.id === id) {
      setSelectedDocument(null);
    }
  };

  return (
    <ResearchContext.Provider
      value={{
        documents,
        addDocument,
        removeDocument,
        selectedDocument,
        setSelectedDocument,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const context = useContext(ResearchContext);
  if (context === undefined) {
    throw new Error("useResearch must be used within a ResearchProvider");
  }
  return context;
} 