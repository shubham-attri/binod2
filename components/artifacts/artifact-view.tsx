"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Download, 
  History, 
  Copy, 
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Artifact, DocumentVersion } from "@/types/artifacts";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export interface ArtifactViewProps {
  artifact: Artifact;
  onClose: () => void;
  onSelect?: (document: Artifact) => void;
  className?: string;
}

export function ArtifactView({
  artifact,
  onClose,
  className
}: ArtifactViewProps) {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(
    artifact.metadata?.versions?.[0] || null
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVersionSelect = (version: DocumentVersion) => {
    setSelectedVersion(version);
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
        <div className="flex items-center space-x-4">
          <CardTitle className="truncate">{artifact.title}</CardTitle>
          {artifact.metadata?.versions && artifact.metadata.versions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-1" />
                  {selectedVersion ? format(new Date(selectedVersion.createdAt), "MMM d, yyyy") : "Versions"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {artifact.metadata.versions.map((version) => (
                  <DropdownMenuItem
                    key={version.id}
                    onClick={() => handleVersionSelect(version)}
                  >
                    {format(new Date(version.createdAt), "MMM d, yyyy h:mm a")}
                    {version.comment && ` - ${version.comment}`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
            <Download className="h-4 w-4" />
          </Button>
          {artifact.metadata?.storageUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(artifact.metadata?.storageUrl, "_blank")}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <ScrollArea className="h-full">
          <div className="prose dark:prose-invert max-w-none">
            {selectedVersion ? selectedVersion.content : artifact.content}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 