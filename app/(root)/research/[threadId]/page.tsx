import { ResearchMode } from "@/components/research/research-mode";
import { Suspense } from "react";

interface ResearchThreadPageProps {
  params: { threadId: string };
}

export default async function ResearchThreadPage({
  params,
}: ResearchThreadPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResearchMode threadId={params.threadId} />
    </Suspense>
  );
} 