import { CaseMode } from "@/components/case/case-mode";

export default function CaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <CaseMode caseId={params.id} />;
} 