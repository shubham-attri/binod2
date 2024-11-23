"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  Code, 
  Languages, 
  Wand2, 
  BookOpen, 
  Plus,
  Settings 
} from "lucide-react";

interface ActionsToolbarProps {
  type: "markdown" | "code";
  onAction: (action: string, options?: any) => void;
}

export function ActionsToolbar({ type, onAction }: ActionsToolbarProps) {
  const textActions = [
    {
      label: "Make Longer",
      icon: <FileText className="h-4 w-4" />,
      action: "expand",
    },
    {
      label: "Make Shorter",
      icon: <FileText className="h-4 w-4" />,
      action: "shorten",
    },
    {
      label: "Simplify Language",
      icon: <BookOpen className="h-4 w-4" />,
      action: "simplify",
    },
    {
      label: "Make Professional",
      icon: <BookOpen className="h-4 w-4" />,
      action: "professional",
    },
  ];

  const codeActions = [
    {
      label: "Add Comments",
      icon: <Code className="h-4 w-4" />,
      action: "comment",
    },
    {
      label: "Optimize Code",
      icon: <Settings className="h-4 w-4" />,
      action: "optimize",
    },
    {
      label: "Port to Another Language",
      icon: <Languages className="h-4 w-4" />,
      action: "port",
    },
  ];

  const actions = type === "markdown" ? textActions : codeActions;

  return (
    <div className="flex items-center gap-2 p-2 border-b">
      {actions.map((action) => (
        <Button
          key={action.action}
          variant="ghost"
          size="sm"
          onClick={() => onAction(action.action)}
          className="flex items-center gap-2"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Wand2 className="h-4 w-4 mr-2" />
            Quick Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onAction("fix_grammar")}>
            Fix Grammar & Spelling
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("improve_style")}>
            Improve Writing Style
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("add_citations")}>
            Add Legal Citations
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="sm" onClick={() => onAction("custom")}>
        <Plus className="h-4 w-4 mr-2" />
        Custom Action
      </Button>
    </div>
  );
} 