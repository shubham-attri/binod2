"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FolderClosed, Clock, Star, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface VaultItem {
  id: string;
  title: string;
  type: "document" | "case" | "research";
  createdAt: Date;
  updatedAt: Date;
  starred?: boolean;
  tags?: string[];
}

export function Vault() {
  const [searchQuery, setSearchQuery] = useState("");
  const [items] = useState<VaultItem[]>([
    {
      id: "1",
      title: "Contract Template",
      type: "document",
      createdAt: new Date(),
      updatedAt: new Date(),
      starred: true,
      tags: ["template", "contract"],
    },
    // Add more items as needed
  ]);

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="container py-4">
          <h1 className="text-2xl font-semibold mb-2">Vault</h1>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vault..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button>New Folder</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1">
        <div className="container py-4">
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 m-0">
          <div className="container py-4">
            <div className="grid grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <VaultCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Add similar content for other tabs */}
      </Tabs>
    </div>
  );
}

interface VaultCardProps {
  item: VaultItem;
}

function VaultCard({ item }: VaultCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <div className="flex items-center gap-2">
            {item.type === "document" && <FileText className="h-4 w-4" />}
            {item.type === "case" && <FolderClosed className="h-4 w-4" />}
            {item.type === "research" && <Search className="h-4 w-4" />}
            {item.title}
          </div>
        </CardTitle>
        {item.starred && <Star className="h-4 w-4 text-yellow-500" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.updatedAt.toLocaleDateString()}
          </div>
          <div className="flex gap-1">
            {item.tags?.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  "bg-secondary text-secondary-foreground"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 