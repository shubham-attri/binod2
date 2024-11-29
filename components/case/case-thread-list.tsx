"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Send } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

interface Thread {
  id: string;
  title: string;
  createdAt: string;
  type: string;
}

interface CaseThreadListProps {
  caseId: string;
  selectedThreadId?: string;
  onThreadSelect: (thread: Thread) => void;
}

export function CaseThreadList({ caseId, selectedThreadId, onThreadSelect }: CaseThreadListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load threads for this case
  useEffect(() => {
    const loadThreads = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_threads')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setThreads(data);
      } catch (err) {
        console.error('Error loading threads:', err);
        toast.error("Failed to load threads");
      } finally {
        setIsLoading(false);
      }
    };

    loadThreads();
  }, [caseId]);

  const handleCreateThread = async (title: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .insert({
          title: title || 'New Thread',
          case_id: caseId,
          type: 'case',
          initial_query: title // Store the initial query
        })
        .select()
        .single();

      if (error) throw error;

      setThreads(prev => [data, ...prev]);
      onThreadSelect(data);
      toast.success("Thread created successfully");
      setSearchQuery(""); // Clear search after creating
    } catch (err) {
      console.error('Error creating thread:', err);
      toast.error("Failed to create thread");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await handleCreateThread(searchQuery.trim());
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or start a new thread..."
              className="pl-9 pr-24"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-2 flex gap-1">
              {searchQuery.trim() && (
                <Button type="submit" size="sm" variant="ghost">
                  <Send className="h-4 w-4" />
                </Button>
              )}
              <Button 
                type="button" 
                size="sm" 
                variant="ghost"
                onClick={() => handleCreateThread("New Thread")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading threads...
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? (
              <div className="space-y-2">
                <p>No threads found</p>
                <Button 
                  variant="outline" 
                  onClick={() => handleCreateThread(searchQuery)}
                >
                  Create "{searchQuery}"
                </Button>
              </div>
            ) : (
              "No threads yet"
            )}
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.id}
              className={`p-4 cursor-pointer hover:bg-secondary/50 ${
                selectedThreadId === thread.id ? 'bg-secondary' : ''
              }`}
              onClick={() => onThreadSelect(thread)}
            >
              <h3 className="font-medium">{thread.title}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(thread.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 