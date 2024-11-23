"use client";

import { useState } from "react";
import { Folder, Users, Clock, Plus } from "lucide-react";
import { ChatInterface } from "../chat/chat-interface";
import { useCase } from "./case-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreateCaseDialog } from "./create-case-dialog";
import { DocumentPanel } from "./document-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Case {
  id: string;
  title: string;
  clientName: string;
  status: "active" | "pending" | "closed";
  lastUpdated: Date;
}

export function CaseMode() {
  const { cases, selectedCase, setSelectedCase } = useCase();

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Left Panel - Case List */}
      <div className="col-span-4 border-r p-4">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Cases</h2>
            <CreateCaseDialog />
          </div>

          <div className="space-y-2">
            {cases.map((case_) => (
              <CaseCard
                key={case_.id}
                case_={case_}
                isSelected={selectedCase?.id === case_.id}
                onClick={() => setSelectedCase(case_)}
              />
            ))}
            {cases.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-gray-500">
                  No cases yet. Create your first case to get started.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Case Details & Chat */}
      <div className="col-span-8 p-4">
        {selectedCase ? (
          <CaseDetail case_={selectedCase} />
        ) : (
          <Card>
            <CardContent className="h-[calc(100vh-2rem)] flex items-center justify-center text-gray-500">
              Select a case to view details
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface CaseCardProps {
  case_: Case;
  isSelected: boolean;
  onClick: () => void;
}

function CaseCard({ case_, isSelected, onClick }: CaseCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? "border-blue-200 bg-blue-50" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{case_.title}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              case_.status === "active"
                ? "bg-green-100 text-green-700"
                : case_.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {case_.status}
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {case_.clientName}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            {case_.lastUpdated.toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CaseDetailProps {
  case_: Case;
}

function CaseDetail({ case_ }: CaseDetailProps) {
  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{case_.title}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {case_.clientName}
                </div>
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  {case_.status}
                </div>
              </div>
            </div>
            <Button variant="outline">Edit Case</Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="chat" className="flex-1">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex-1 h-[calc(100vh-15rem)]">
          <ChatInterface />
        </TabsContent>
        <TabsContent value="documents" className="flex-1 h-[calc(100vh-15rem)]">
          <DocumentPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
} 