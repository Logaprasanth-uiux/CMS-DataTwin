export type PropertyType = 'string' | 'number' | 'boolean' | 'enum';

export interface PropertySchema {
  type: PropertyType;
  label: string;
  defaultValue: any;
  options?: {
    label: string;
    value: any;
  }[];
}

export interface ComponentContract {
  type: string;
  displayName: string;
  category: 'layout' | 'finance' | 'data' | 'visualization' | 'action';
  icon: string; // Lucide icon name
  allowedParents?: string[];
  allowedChildren?: string[];
  properties: Record<string, PropertySchema>;
}
