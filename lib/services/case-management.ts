export interface Case {
  id: string;
  title: string;
  type: string;
  stage: string;
  status: 'active' | 'closed' | 'archived';
  clientId: string;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
  keyFacts: string[];
  timeline: TimelineEvent[];
  documents: string[];
  nextDeadline?: Date;
  metadata: Record<string, any>;
}

export interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  date: Date;
  addedBy: string;
  metadata?: Record<string, any>;
}

export async function createCase(data: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>): Promise<Case> {
  try {
    const response = await fetch('/api/cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create case: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
}

export async function getCaseDetails(id: string): Promise<Case> {
  try {
    const response = await fetch(`/api/cases/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get case details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting case details:', error);
    throw error;
  }
}

export async function updateCase(
  id: string,
  updates: Partial<Omit<Case, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Case> {
  try {
    const response = await fetch(`/api/cases/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update case: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating case:', error);
    throw error;
  }
}

export async function updateCaseTimeline(
  caseId: string,
  event: Omit<TimelineEvent, 'id'>
): Promise<TimelineEvent> {
  try {
    const response = await fetch(`/api/cases/${caseId}/timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(`Failed to update timeline: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating timeline:', error);
    throw error;
  }
}

export async function addCaseDocument(
  caseId: string,
  documentId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const response = await fetch(`/api/cases/${caseId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add document: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
}

export async function searchCases(query: {
  title?: string;
  type?: string;
  status?: Case['status'];
  clientId?: string;
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}): Promise<Case[]> {
  try {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        if (key === 'dateRange') {
          params.append('startDate', (value as any).start.toISOString());
          params.append('endDate', (value as any).end.toISOString());
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`/api/cases/search?${params}`);

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching cases:', error);
    throw error;
  }
} 