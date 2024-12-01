"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Calendar, Tag } from "lucide-react";
import { mockCases, type Case } from "../../lib/mock/cases";

export function CaseMode() {
  const router = useRouter();
  const [cases, setCases] = React.useState<Case[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newCase, setNewCase] = React.useState({
    title: "",
    client: {
      name: "",
      email: "",
      company: "",
    },
    description: "",
  });

  React.useEffect(() => {
    setCases(mockCases);
  }, []);

  const handleCreateCase = async () => {
    if (!newCase.title || !newCase.client.name) {
      toast.error("Please fill in required fields", {
        description: "Case title and client name are required"
      });
      return;
    }

    try {
      const createdCase: Case = {
        id: `CASE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        title: newCase.title,
        description: newCase.description,
        client: newCase.client,
        status: "active",
        priority: "medium",
        createdAt: new Date(),
        updatedAt: new Date(),
        threads: [],
        documents: [],
        tags: []
      };

      setCases((prev) => [...prev, createdCase]);
      setNewCase({ 
        title: "", 
        client: { name: "", email: "", company: "" }, 
        description: "" 
      });
      setIsDialogOpen(false);
      toast.success("Case created successfully");
    } catch (error) {
      console.error("Case creation error:", error);
      toast.error("Failed to create case");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Cases</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cases.map((caseItem) => (
          <Card
            key={caseItem.id}
            className="p-4 hover:bg-accent cursor-pointer transition-colors"
            onClick={() => router.push(`/cases/${caseItem.id}`)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium">{caseItem.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {caseItem.client.name}
                  {caseItem.client.company && ` - ${caseItem.client.company}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    caseItem.status === "active"
                      ? "bg-green-100 text-green-700"
                      : caseItem.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {caseItem.status}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    caseItem.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : caseItem.priority === "medium"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {caseItem.priority}
                </span>
              </div>
            </div>
            {caseItem.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {caseItem.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mb-3">
              {caseItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                {caseItem.threads.length} threads
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {caseItem.updatedAt.toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Case Title</label>
              <Input
                value={newCase.title}
                onChange={(e) =>
                  setNewCase((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter case title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Name</label>
              <Input
                value={newCase.client.name}
                onChange={(e) =>
                  setNewCase((prev) => ({
                    ...prev,
                    client: { ...prev.client, name: e.target.value }
                  }))
                }
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Email</label>
              <Input
                value={newCase.client.email}
                onChange={(e) =>
                  setNewCase((prev) => ({
                    ...prev,
                    client: { ...prev.client, email: e.target.value }
                  }))
                }
                placeholder="Enter client email"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company (Optional)</label>
              <Input
                value={newCase.client.company}
                onChange={(e) =>
                  setNewCase((prev) => ({
                    ...prev,
                    client: { ...prev.client, company: e.target.value }
                  }))
                }
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newCase.description}
                onChange={(e) =>
                  setNewCase((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter case description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCase}>Create Case</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 