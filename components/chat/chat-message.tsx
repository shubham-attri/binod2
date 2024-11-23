import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const messageDate = message.createdAt 
    ? new Date(message.createdAt)
    : null;

  return (
    <Card className={cn(
      "border",
      message.role === "assistant" ? "bg-muted" : "bg-background"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "rounded-full p-2",
            message.role === "user" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted-foreground/20"
          )}>
            {message.role === "user" ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {message.content}
            </div>
            {messageDate && (
              <time className="text-xs text-muted-foreground mt-2 block">
                {messageDate.toLocaleTimeString()}
              </time>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 