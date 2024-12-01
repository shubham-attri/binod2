"use client";

import React from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Card } from "../ui/card";

export interface Case {
  id: string;
  title: string;
  status: "active" | "closed" | "pending";
  client: string;
  lastUpdated: Date;
  description?: string;
}

interface CasePanelProps {
  cases?: Case[];
  selectedCase?: Case;
  onCaseSelect?: (caseItem: Case) => void;
  onNewCase?: () => void;
  isLoading?: boolean;
}

export function CasePanel({
  cases = [],
  selectedCase,
  onCaseSelect,
  onNewCase,
  isLoading = false,
}: CasePanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Button className="w-full" onClick={onNewCase}>
          New Case
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {cases.map((caseItem) => (
            <Card
              key={caseItem.id}
              className={`cursor-pointer p-3 hover:bg-muted/50 ${
                selectedCase?.id === caseItem.id ? "border-primary" : ""
              }`}
              onClick={() => onCaseSelect?.(caseItem)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{caseItem.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {caseItem.client}
                  </p>
                  {caseItem.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {caseItem.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      caseItem.status === "active"
                        ? "bg-green-100 text-green-700"
                        : caseItem.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {caseItem.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {caseItem.lastUpdated.toLocaleDateString()}
                  </span>
                </div>
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