"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, Tag, Plus, FileText, Briefcase } from "lucide-react";
import { vaultService } from "@/lib/vault-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VaultItem {
  id: string;
  title: string;
  type: 'case' | 'document';
  createdAt: string;
  updatedAt: string;
  starred?: boolean;
  tags?: string[];
  caseId?: string;
}

interface VaultCardProps {
  item: VaultItem;
  onStar: (item: VaultItem) => void;
  onAddTag: (item: VaultItem) => void;
}

function VaultCard({ item, onStar, onAddTag }: VaultCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {item.type === 'case' ? (
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(item.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStar(item)}
              className={cn(item.starred && "text-yellow-500")}
            >
              <Star className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddTag(item)}
            >
              <Tag className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ItemGrid({ items, onStar, onAddTag, isLoading }: {
  items: VaultItem[];
  onStar: (item: VaultItem) => void;
  onAddTag: (item: VaultItem) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <VaultCard
          key={item.id}
          item={item}
          onStar={onStar}
          onAddTag={onAddTag}
        />
      ))}
    </div>
  );
}

export function Vault() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch vault items based on active tab
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        const userId = "test-user"; // TODO: Get from auth context
        let vaultItems: VaultItem[] = [];

        switch (activeTab) {
          case "all":
            vaultItems = await vaultService.getVaultItems(userId);
            break;
          case "cases":
            vaultItems = (await vaultService.getVaultItems(userId))
              .filter(item => item.type === 'case');
            break;
          case "documents":
            vaultItems = (await vaultService.getVaultItems(userId))
              .filter(item => item.type === 'document');
            break;
          case "starred":
            vaultItems = (await vaultService.getVaultItems(userId))
              .filter(item => item.starred);
            break;
          case "recent":
            vaultItems = await vaultService.getRecentItems(userId, 10);
            break;
        }

        setItems(vaultItems);
      } catch (err) {
        console.error('Error loading vault items:', err);
        toast.error("Failed to load vault items", {
          description: "Please try again later"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [activeTab]);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      const userId = "test-user";
      try {
        const vaultItems = await vaultService.getVaultItems(userId);
        setItems(vaultItems);
      } catch (err) {
        console.error('Error loading items:', err);
        toast.error("Failed to load items", {
          description: "Please try again",
        });
      }
      return;
    }

    try {
      const userId = "test-user";
      const results = await vaultService.searchVaultItems(query, userId);
      setItems(results);
    } catch (err) {
      console.error('Error searching vault items:', err);
      toast.error("Failed to search vault items", {
        description: "Please try again",
      });
    }
  };

  // Handle starring items
  const handleStar = async (item: VaultItem) => {
    try {
      await vaultService.starItem(item.id, item.type, !item.starred);
      setItems(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, starred: !i.starred } : i
        )
      );
      toast.success(item.starred ? "Removed from starred" : "Added to starred");
    } catch (err) {
      console.error('Error updating star status:', err);
      toast.error("Failed to update star status", {
        description: "Please try again"
      });
    }
  };

  // Handle adding tags
  const handleAddTag = async (item: VaultItem) => {
    const newTags = [...(item.tags || []), "new-tag"];
    try {
      await vaultService.addTags(item.id, item.type, newTags);
      setItems(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, tags: newTags } : i
        )
      );
      toast.success("Tag added successfully");
    } catch (err) {
      console.error('Error adding tag:', err);
      toast.error("Failed to add tag", {
        description: "Please try again",
      });
    }
  };

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
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="container py-4">
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
        </div>

        <div className="container py-4">
          <ItemGrid
            items={filteredItems}
            onStar={handleStar}
            onAddTag={handleAddTag}
            isLoading={isLoading}
          />
        </div>
      </Tabs>
    </div>
  );
} 