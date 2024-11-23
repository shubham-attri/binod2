"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface Case {
  id: string;
  title: string;
  clientName: string;
  status: "active" | "pending" | "closed";
  lastUpdated: Date;
}

interface CaseContextType {
  cases: Case[];
  selectedCase: Case | null;
  setSelectedCase: (case_: Case | null) => void;
  createCase: (caseData: Omit<Case, "id" | "lastUpdated">) => void;
  updateCase: (id: string, caseData: Partial<Case>) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const createCase = (caseData: Omit<Case, "id" | "lastUpdated">) => {
    const newCase: Case = {
      ...caseData,
      id: Date.now().toString(), // In production, this would come from the backend
      lastUpdated: new Date(),
    };
    setCases((prev) => [...prev, newCase]);
  };

  const updateCase = (id: string, caseData: Partial<Case>) => {
    setCases((prev) =>
      prev.map((case_) =>
        case_.id === id
          ? { ...case_, ...caseData, lastUpdated: new Date() }
          : case_
      )
    );
  };

  // In a real app, we'd fetch cases from an API here
  useEffect(() => {
    // TODO: Implement API call to fetch cases
  }, []);

  return (
    <CaseContext.Provider
      value={{
        cases,
        selectedCase,
        setSelectedCase,
        createCase,
        updateCase,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCase() {
  const context = useContext(CaseContext);
  if (context === undefined) {
    throw new Error("useCase must be used within a CaseProvider");
  }
  return context;
} 