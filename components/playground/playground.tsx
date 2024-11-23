"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, Briefcase, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChatInterface } from "../chat/chat-interface";

export function Playground() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showChat, setShowChat] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowChat(true);
    }
  };

  if (showChat) {
    return (
      <div className="h-full">
        <ChatInterface
          initialMessages={[
            {
              id: Date.now().toString(),
              role: "user",
              content: query,
              createdAt: new Date(),
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-12">
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

      <div className="space-y-6">
        {/* Research Mode Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Research Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Ask questions, conduct legal research, and get AI-powered assistance
                with document drafting.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Ask a legal question..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-12"
                />
                <Button type="submit" className="w-full h-12">
                  Start Research
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Popular questions:
                </p>
                <div className="space-y-2">
                  {[
                    "What are the requirements for a valid contract?",
                    "Explain force majeure clauses",
                    "Draft a non-disclosure agreement",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => {
                        setQuery(suggestion);
                        setShowChat(true);
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Case Mode Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Case Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Manage legal cases, track documents, and collaborate with team
                members on specific matters.
              </p>
              <div className="space-y-4">
                <Button
                  className="w-full h-12"
                  onClick={() => router.push("/cases")}
                >
                  View Cases
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Recent Cases
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { id: "1", title: "Smith vs. Jones", type: "Contract Dispute" },
                    { id: "2", title: "Estate Planning", type: "Will & Trust" },
                    { id: "3", title: "Corporate Merger", type: "M&A" },
                  ].map((case_) => (
                    <Button
                      key={case_.id}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left h-auto py-3",
                        "hover:border-primary"
                      )}
                      onClick={() => router.push(`/cases/${case_.id}`)}
                    >
                      <div>
                        <p className="font-medium">{case_.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {case_.type}
                        </p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 