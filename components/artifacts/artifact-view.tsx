"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, X, Edit2 } from "lucide-react";
import { MarkdownEditor } from "../editor/markdown-editor";
import { cn } from "@/lib/utils";
import { ActionsToolbar } from "./actions-toolbar";
import { Input } from "@/components/ui/input";

interface Artifact {
  id: string;
  title: string;
  content: string;
  type: "markdown" | "code";
  createdAt: Date;
  updatedAt: Date;
}

interface ArtifactViewProps {
  artifact: Artifact;
  onUpdate: (content: string) => void;
  onClose?: () => void;
  className?: string;
}

export function ArtifactView({ artifact, onUpdate, onClose, className }: ArtifactViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(artifact.content);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(artifact.title);

  const handleSave = () => {
    onUpdate(content);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTitleSave = () => {
    if (title.trim()) {
      // TODO: Implement title update
      artifact.title = title;
      setIsEditingTitle(false);
    }
  };

  const handleAction = async (action: string, options?: any) => {
    setIsLoading(true);
    try {
      // TODO: Implement action handling with LangChain
      switch (action) {
        case "expand":
          // Make content longer
          break;
        case "shorten":
          // Make content shorter
          break;
        case "simplify":
          // Simplify language
          break;
        case "professional":
          // Make more professional
          break;
        case "fix_grammar":
          // Fix grammar
          break;
        // ... handle other actions
      }
    } catch (error) {
      console.error("Error executing action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                className="h-7 w-[200px]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTitleSave();
                  } else if (e.key === "Escape") {
                    setTitle(artifact.title);
                    setIsEditingTitle(false);
                  }
                }}
                placeholder="Document name..."
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsEditingTitle(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-muted-foreground"
          >
            <Download className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <ActionsToolbar type={artifact.type} onAction={handleAction} />
      
      <CardContent className="flex-1 pt-4">
        <MarkdownEditor
          content={content}
          onChange={setContent}
          className="h-[calc(100vh-12rem)]"
        />

        {isEditing && (
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setContent(artifact.content);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 