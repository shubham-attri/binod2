"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { DocumentPanel, type Document } from "@/components/research/document-panel";
import { useChat } from "@/hooks/use-chat";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronRight, Upload, Plus, Clock, FileText, Tag, Edit2, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockCases, type Case, type CaseThread } from "@/lib/mock/cases";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CaseDetailPage() {
  const params = useParams();
  const { messages, sendMessage, isLoading, setMessages } = useChat();
  const [currentCase, setCurrentCase] = React.useState<Case>();
  const [selectedThread, setSelectedThread] = React.useState<CaseThread>();
  const [isDocPanelCollapsed, setIsDocPanelCollapsed] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    title: "",
    description: "",
    status: "",
    priority: ""
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const caseId = params.id as string;
    const foundCase = mockCases.find(c => c.id === caseId);
    if (foundCase) {
      setCurrentCase(foundCase);
      setEditForm({
        title: foundCase.title,
        description: foundCase.description,
        status: foundCase.status,
        priority: foundCase.priority
      });
      if (foundCase.threads.length > 0) {
        const latestThread = foundCase.threads[0];
        setSelectedThread(latestThread);
        setMessages(latestThread.messages);
      }
    }
  }, [params.id, setMessages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const newDocument = {
        id: `DOC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        name: file.name,
        type: file.type,
        uploadedAt: new Date(),
        size: file.size
      };

      if (currentCase) {
        setCurrentCase({
          ...currentCase,
          documents: [...currentCase.documents, newDocument]
        });
      }

      toast.success(`Successfully uploaded ${file.name}`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    }
  };

  const handleNewThread = () => {
    if (!currentCase) return;

    const newThread: CaseThread = {
      id: `THR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      title: "New Discussion Thread",
      status: "active",
      lastUpdated: new Date(),
      messages: []
    };

    setCurrentCase({
      ...currentCase,
      threads: [newThread, ...currentCase.threads]
    });
    setSelectedThread(newThread);
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedThread || !currentCase) return;

    const newMessage = {
      id: `MSG-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      content,
      timestamp: new Date(),
      sender: currentCase.client.name,
      role: "user" as const
    };

    // Update the thread with the new message
    const updatedThread = {
      ...selectedThread,
      messages: [...selectedThread.messages, newMessage],
      lastUpdated: new Date()
    };

    // Update the case with the updated thread
    setCurrentCase({
      ...currentCase,
      threads: currentCase.threads.map(t =>
        t.id === selectedThread.id ? updatedThread : t
      )
    });

    setSelectedThread(updatedThread);
    await sendMessage(content, currentCase.client.name);
  };

  const handleEditCase = () => {
    if (!currentCase || !editForm.title) return;

    setCurrentCase({
      ...currentCase,
      title: editForm.title,
      description: editForm.description,
      status: editForm.status as any,
      priority: editForm.priority as any,
      updatedAt: new Date()
    });

    setIsEditDialogOpen(false);
    toast.success("Case updated successfully");
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/cases">Cases</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentCase?.title || "Loading..."}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
              currentCase?.status === "active" ? "bg-green-100 text-green-700" :
              currentCase?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-700"
            )}>
              {currentCase?.status}
            </span>
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
              currentCase?.priority === "high" ? "bg-red-100 text-red-700" :
              currentCase?.priority === "medium" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-700"
            )}>
              {currentCase?.priority}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Case
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r flex flex-col">
          <div className="p-4 border-b space-y-4">
            <Button className="w-full" onClick={handleNewThread}>
              <Plus className="h-4 w-4 mr-2" />
              New Thread
            </Button>
            <Card className="p-3 space-y-2">
              <div className="text-sm font-medium">Client Details</div>
              <div className="text-sm">
                <div>{currentCase?.client.name}</div>
                <div className="text-muted-foreground text-xs">{currentCase?.client.email}</div>
                {currentCase?.client.company && (
                  <div className="text-muted-foreground text-xs">{currentCase?.client.company}</div>
                )}
              </div>
            </Card>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {currentCase?.threads.map((thread) => (
                <Button
                  key={thread.id}
                  variant={selectedThread?.id === thread.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left"
                  onClick={() => {
                    setSelectedThread(thread);
                    setMessages(thread.messages);
                  }}
                >
                  <div className="flex flex-col w-full">
                    <div className="font-medium truncate">{thread.title}</div>
                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                      <span className={cn(
                        "rounded-full px-2 py-0.5",
                        thread.status === "active" ? "bg-green-100 text-green-700" :
                        thread.status === "resolved" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      )}>
                        {thread.status}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {thread.lastUpdated.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 p-4">
            {selectedThread ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedThread.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      Created {selectedThread.lastUpdated.toLocaleDateString()}
                    </p>
                  </div>
                  <Select
                    value={selectedThread.status}
                    onValueChange={(value) => {
                      if (!currentCase) return;
                      const updatedThread = { ...selectedThread, status: value as any };
                      setCurrentCase({
                        ...currentCase,
                        threads: currentCase.threads.map(t =>
                          t.id === selectedThread.id ? updatedThread : t
                        )
                      });
                      setSelectedThread(updatedThread);
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Thread Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  className="h-[calc(100%-4rem)]"
                  actions={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  }
                />
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a thread or create a new one to start the discussion
              </div>
            )}
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt"
            />
          </div>

          <div className={cn(
            "flex transition-all duration-300",
            isDocPanelCollapsed ? "w-10" : "w-[300px]"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDocPanelCollapsed(!isDocPanelCollapsed)}
              className="shrink-0"
            >
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                !isDocPanelCollapsed && "rotate-180"
              )} />
            </Button>
            {!isDocPanelCollapsed && (
              <div className="border-l flex-1">
                <DocumentPanel
                  documents={currentCase?.documents.map(doc => ({
                    id: doc.id,
                    title: doc.name,
                    type: doc.type.split('/')[1] || doc.type,
                    url: `/documents/${doc.name}`,
                    excerpt: `${(doc.size / 1024).toFixed(1)}KB - Uploaded ${doc.uploadedAt.toLocaleDateString()}`
                  })) || []}
                  onDocumentSelect={(doc) => {
                    toast.success("Document selected", {
                      description: `Selected "${doc.title}"`
                    });
                  }}
                  isLoading={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Case Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter case title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter case description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={editForm.priority}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCase}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 