import React from "react";
import { Card } from "@/components/ui/card";

interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  date: Date;
  addedBy: string;
}

interface CaseTimelineProps {
  caseId: string;
}

export function CaseTimeline({ caseId }: CaseTimelineProps) {
  const [events, setEvents] = React.useState<TimelineEvent[]>([]);

  // Mock timeline data
  React.useEffect(() => {
    setEvents([
      {
        id: "1",
        type: "FILING",
        description: "Initial complaint filed",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        addedBy: "Jane Doe",
      },
      {
        id: "2",
        type: "DOCUMENT",
        description: "Response to complaint received",
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        addedBy: "System",
      },
      {
        id: "3",
        type: "HEARING",
        description: "Initial hearing scheduled",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        addedBy: "John Smith",
      },
      {
        id: "4",
        type: "NOTE",
        description: "Client meeting notes added",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        addedBy: "Jane Doe",
      },
    ]);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "FILING":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        );
      case "DOCUMENT":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        );
      case "HEARING":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <Card
          key={event.id}
          className="flex items-start gap-4 p-4"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            {getEventIcon(event.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="font-medium">{event.description}</div>
              <div className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(event.date)}
              </div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Added by {event.addedBy}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 