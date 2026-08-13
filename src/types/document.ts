export interface DocumentNode {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: DocumentNode[];
}

export interface PageDocument {
  id: string;
  name: string;
  type: string; // e.g. "Dashboard" | "Workspace" | "Page"
  status: "Draft" | "Published";
  version: number;
  layout: DocumentNode;
}
