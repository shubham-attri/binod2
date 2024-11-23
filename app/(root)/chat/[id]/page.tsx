import { ChatHistory } from "@/components/chat/chat-history";

export default function ChatHistoryPage({
  params,
}: {
  params: { id: string };
}) {
  return <ChatHistory chatId={params.id} />;
} 