import { HistoryInterface } from "@/components/history/history-interface";
import { Sidebar } from "@/components/layout/sidebar";
export default function HistoryPage() {
  return (
    <div className="flex h-screen bg-background font-noto-sans">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <HistoryInterface />
      </main>
    </div>
  );
} 