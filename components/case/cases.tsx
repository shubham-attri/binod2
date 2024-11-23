"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users, Clock, ArrowRight, Filter } from "lucide-react";
import { CreateCaseDialog } from "./create-case-dialog";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Case {
  id: string;
  title: string;
  clientName: string;
  status: "active" | "pending" | "closed";
  lastUpdated: Date;
  description: string;
  tags?: string[];
  priority: "high" | "medium" | "low";
}

export function Cases() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "priority" | "title">("date");

  const [cases] = useState<Case[]>([
    {
      id: "1",
      title: "Smith vs. Jones",
      clientName: "John Smith",
      status: "active",
      lastUpdated: new Date(),
      description: "Contract dispute case",
      tags: ["Contract", "Dispute"],
      priority: "high",
    },
    // Add more cases
  ]);

  const filteredCases = cases
    .filter(case_ => 
      (searchQuery === "" || 
        case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.clientName.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (statusFilter.length === 0 || statusFilter.includes(case_.status)) &&
      (priorityFilter.length === 0 || priorityFilter.includes(case_.priority))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Cases</h1>
          <p className="text-muted-foreground">
            Manage and track your legal cases
          </p>
        </div>
        <CreateCaseDialog />
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {["active", "pending", "closed"].map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => {
                  setStatusFilter(prev =>
                    prev.includes(status)
                      ? prev.filter(s => s !== status)
                      : [...prev, status]
                  );
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={statusFilter.includes(status)}
                    readOnly
                  />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Priority</DropdownMenuLabel>
            {["high", "medium", "low"].map((priority) => (
              <DropdownMenuItem
                key={priority}
                onClick={() => {
                  setPriorityFilter(prev =>
                    prev.includes(priority)
                      ? prev.filter(p => p !== priority)
                      : [...prev, priority]
                  );
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={priorityFilter.includes(priority)}
                    readOnly
                  />
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: "date", label: "Date Updated" },
              { value: "priority", label: "Priority" },
              { value: "title", label: "Title" },
            ].map((sort) => (
              <DropdownMenuItem
                key={sort.value}
                onClick={() => setSortBy(sort.value as any)}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={sortBy === sort.value}
                    readOnly
                  />
                  {sort.label}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filteredCases.map((case_) => (
          <Card
            key={case_.id}
            className="group cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/cases/${case_.id}`)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{case_.title}</CardTitle>
                <Badge
                  variant={
                    case_.status === "active" ? "success" :
                    case_.status === "pending" ? "warning" : "secondary"
                  }
                >
                  {case_.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {case_.description}
              </p>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {case_.clientName}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {case_.lastUpdated.toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {case_.tags && case_.tags.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {case_.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 