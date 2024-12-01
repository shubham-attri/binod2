import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          pre: ({ node, ...props }) => (
            <pre className="overflow-auto rounded-lg bg-muted/50 p-4" {...props} />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="rounded-md bg-muted px-1.5 py-0.5" {...props} />
            ) : (
              <code {...props} />
            ),
          a: ({ node, ...props }) => (
            <a className="text-primary underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 