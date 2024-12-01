"use client";

import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function SearchPage() {
  const params = useParams();
  const mode = params.mode as string;

  const getPlaceholder = () => {
    switch (mode) {
      case "research":
        return "Search legal documents, cases, and research...";
      case "cases":
        return "Search across all cases...";
      case "playground":
        return "Search chat history and saved prompts...";
      default:
        return "Search...";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder={getPlaceholder()}
            className="flex-1"
          />
          <Button>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Recent Searches</h2>
          <div className="grid gap-2">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-medium mb-1">Contract Law Research</h3>
              <p className="text-sm text-muted-foreground">2 days ago</p>
            </Card>
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-medium mb-1">Intellectual Property Cases</h3>
              <p className="text-sm text-muted-foreground">1 week ago</p>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Suggested</h2>
          <div className="grid gap-2">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-medium mb-1">Popular in {mode}</h3>
              <p className="text-sm text-muted-foreground">
                Most searched topics in {mode} mode
              </p>
            </Card>
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-medium mb-1">Trending</h3>
              <p className="text-sm text-muted-foreground">
                Currently trending searches
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 