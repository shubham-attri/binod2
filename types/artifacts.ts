export type ArtifactType = "markdown" | "code" | "document" | "contract";

export interface DocumentVersion {
  id: string;
  content: string;
  createdAt: Date;
  comment?: string;
}

export interface Artifact {
  id: string;
  title: string;
  content: string;
  type: ArtifactType;
  metadata?: {
    documentType?: string;
    fileName?: string;
    chunks?: number;
    analysis?: string;
    comparison?: string;
    summary?: string;
    versions?: DocumentVersion[];
    storageUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
} 