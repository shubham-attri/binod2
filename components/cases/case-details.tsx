import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Case {
  id: string;
  title: string;
  type: string;
  status: "active" | "closed" | "archived";
  clientName: string;
  createdAt: Date;
  nextHearing?: Date;
  description: string;
}

interface CaseDetailsProps {
  caseData: Case;
}

export function CaseDetails({ caseData }: CaseDetailsProps) {
  const statusColors = {
    active: "bg-green-500/10 text-green-500",
    closed: "bg-gray-500/10 text-gray-500",
    archived: "bg-yellow-500/10 text-yellow-500",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{caseData.title}</CardTitle>
            <Badge className={statusColors[caseData.status]}>
              {caseData.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="text-sm text-muted-foreground">Type</div>
            <div>{caseData.type}</div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm text-muted-foreground">Client</div>
            <div>{caseData.clientName}</div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm text-muted-foreground">Created</div>
            <div>
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(caseData.createdAt)}
            </div>
          </div>
          {caseData.nextHearing && (
            <div className="grid gap-2">
              <div className="text-sm text-muted-foreground">Next Hearing</div>
              <div>
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(caseData.nextHearing)}
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <div className="text-sm text-muted-foreground">Description</div>
            <div className="text-sm">{caseData.description}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Facts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-sm">
            <li>Initial complaint filed on {caseData.createdAt.toLocaleDateString()}</li>
            <li>Jurisdiction: Superior Court of California</li>
            <li>Case value: $150,000</li>
            <li>Related cases: None</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parties Involved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="font-medium">Plaintiff</div>
              <div className="text-sm text-muted-foreground">
                {caseData.clientName}
                <br />
                Represented by: Law Offices of Jane Doe
              </div>
            </div>
            <div>
              <div className="font-medium">Defendant</div>
              <div className="text-sm text-muted-foreground">
                Johnson Technologies Inc.
                <br />
                Represented by: Smith & Associates
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 