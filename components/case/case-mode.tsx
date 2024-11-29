"use client";

import { useState, useEffect } from "react";
import { GripVertical } from "lucide-react";
import { ChatInterface } from "../chat/chat-interface";
import { DocumentPanel } from "./document-panel";
import { CaseThreadList } from "./case-thread-list";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { Message } from "@/types/chat";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { supabase } from "@/lib/supabase-client";

interface Thread {
  id: string;
  title: string;
  createdAt: string;
  type: string;
  messages?: Message[];
}

interface CaseModeProps {
  caseId: string;
  threadId?: string;
}

export function CaseMode({ caseId, threadId }: CaseModeProps) {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [caseName, setCaseName] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);

  // Load case details
  useEffect(() => {
    const loadCase = async () => {
      try {
        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .select('title')
          .eq('id', caseId)
          .single();

        if (caseError) throw caseError;
        setCaseName(caseData.title);

        // If threadId is provided, load that thread
        if (threadId) {
          const { data: threadData, error: threadError } = await supabase
            .from('chat_threads')
            .select('*')
            .eq('id', threadId)
            .single();

          if (threadError) throw threadError;
          setSelectedThread(threadData);
        }
      } catch (err) {
        console.error('Error loading case:', err);
        // TODO: Handle error appropriately
      } finally {
        setIsLoading(false);
      }
    };

    loadCase();
  }, [caseId, threadId]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="container py-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/cases">Cases</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/cases/${caseId}`}>{caseName}</BreadcrumbLink>
              </BreadcrumbItem>
              {selectedThread && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{selectedThread.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <CaseThreadList
            caseId={caseId}
            selectedThreadId={selectedThread?.id}
            onThreadSelect={setSelectedThread}
          />
        </ResizablePanel>

        <ResizableHandle withHandle>
          <GripVertical className="h-4 w-4" />
        </ResizableHandle>

        <ResizablePanel defaultSize={50}>
          {selectedThread ? (
            <ChatInterface
              threadId={selectedThread.id}
              showCreateDocument={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a thread or create a new one
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle>
          <GripVertical className="h-4 w-4" />
        </ResizableHandle>

        <ResizablePanel defaultSize={30}>
          <DocumentPanel caseId={caseId} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 