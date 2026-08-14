export interface DocumentNode {
  id: string;
  type: string;
  props: Record<string, any>;
  customLabel?: string;
  children?: DocumentNode[];
}

export interface PageDocument {
  id: string;
  name: string;
  type: string; // e.g. "Dashboard" | "Workspace" | "Page"
  description: string;
  status: "Draft" | "Under Review" | "Published";
  version: number;
  layout: DocumentNode;
}
