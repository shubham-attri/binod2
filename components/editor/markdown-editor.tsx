"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  placeholder?: string;
}

export function MarkdownEditor({
  content,
  onChange,
  className,
  placeholder = "Start writing in markdown..."
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "write" | "preview")}
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="flex-1 p-4">
          <Textarea
            value={content}
            onChange={handleChange}
            placeholder={placeholder}
            className="min-h-[500px] font-mono resize-none"
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 p-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: content
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
            }} />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 