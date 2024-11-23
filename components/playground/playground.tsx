"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Briefcase, ArrowRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreateCaseDialog } from "../case/create-case-dialog";
import { createThread } from "@/lib/chat-service";

export function Playground() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Create a new thread and store it with the initial query
      const thread = createThread(query.trim());
      // Redirect to research mode with the thread ID
      router.push(`/research/${thread.id}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const thread = createThread(suggestion);
    router.push(`/research/${thread.id}`);
  };

  const recentCases = [
    { id: "1", title: "Smith vs. Jones", type: "Contract Dispute" },
    { id: "2", title: "Estate Planning", type: "Will & Trust" },
    { id: "3", title: "Corporate Merger", type: "M&A" },
  ];

  return (
    <div className="container max-w-5xl mx-auto py-12">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">AI Legal Assistant</h1>
          <p className="text-xl text-muted-foreground">
            Choose how you want to proceed with your legal work
          </p>
        </motion.div>
      </div>

      <div className="space-y-8">
        {/* Legal Query Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative flex items-center">
                  <Input
                    placeholder="Ask a legal question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-12 pr-24"
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="absolute right-2"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
                <div className="flex gap-2 overflow-x-auto py-2 scrollbar-thin">
                  {[
                    "What are the requirements for a valid contract?",
                    "Explain force majeure clauses",
                    "Draft a non-disclosure agreement",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="whitespace-nowrap"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Case Management Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <p className="text-muted-foreground mb-4">
                    Access your existing cases or create a new one to manage documents and client information.
                  </p>
                  <div className="flex gap-4">
                    <Button
                      className="flex-1 h-12"
                      onClick={() => router.push("/cases")}
                    >
                      View All Cases
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <CreateCaseDialog>
                      <Button className="flex-1 h-12">
                        Create New Case
                        <Plus className="ml-2 h-4 w-4" />
                      </Button>
                    </CreateCaseDialog>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Recent Cases</h3>
                  <div className="grid gap-2">
                    {recentCases.map((case_) => (
                      <Button
                        key={case_.id}
                        variant="outline"
                        className="w-full justify-start h-auto py-3"
                        onClick={() => router.push(`/cases/${case_.id}`)}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{case_.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {case_.type}
                          </span>
                        </div>
                        <ArrowRight className="ml-auto h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 