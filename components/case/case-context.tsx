"use client";

import { createContext, useContext, useState } from "react";

interface Case {
  id: string;
  title: string;
  clientName: string;
  status: "active" | "pending" | "closed";
  lastUpdated: Date;
  description: string;
  tags?: string[];
  priority: "high" | "medium" | "low";
}

interface CaseContextType {
  cases: Case[];
  selectedCase: Case | null;
  setSelectedCase: (case_: Case | null) => void;
  addCase: (case_: Omit<Case, "id" | "lastUpdated">) => void;
  updateCase: (id: string, updates: Partial<Case>) => void;
  deleteCase: (id: string) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>([
    {
      id: "1",
      title: "Smith vs. Jones",
      clientName: "John Smith",
      status: "active",
      lastUpdated: new Date(),
      description: "Contract dispute case",
      tags: ["Contract", "Dispute"],
      priority: "high",
    },
  ]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const addCase = (newCase: Omit<Case, "id" | "lastUpdated">) => {
    const case_: Case = {
      ...newCase,
      id: Date.now().toString(),
      lastUpdated: new Date(),
    };
    setCases(prev => [...prev, case_]);
  };

  const updateCase = (id: string, updates: Partial<Case>) => {
    setCases(prev =>
      prev.map(case_ =>
        case_.id === id
          ? { ...case_, ...updates, lastUpdated: new Date() }
          : case_
      )
    );
  };

  const deleteCase = (id: string) => {
    setCases(prev => prev.filter(case_ => case_.id !== id));
    if (selectedCase?.id === id) {
      setSelectedCase(null);
    }
  };

  return (
    <CaseContext.Provider
      value={{
        cases,
        selectedCase,
        setSelectedCase,
        addCase,
        updateCase,
        deleteCase,
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