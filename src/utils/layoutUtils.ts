import { DocumentNode } from "@/types/document";
import { COMPONENT_REGISTRY } from "@/registry";

// Helper to generate unique component IDs (duplicated from store to maintain independence)
export const generateId = (type: string): string => {
  return `${type.toLowerCase()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Recursive search to locate a node by ID
export const findNode = (root: DocumentNode, id: string): DocumentNode | null => {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

// Recursive search to locate the parent of a node by ID
export const findParentNode = (root: DocumentNode, id: string): DocumentNode | null => {
  if (root.children) {
    for (const child of root.children) {
      if (child.id === id) return root;
      const parent = findParentNode(child, id);
      if (parent) return parent;
    }
  }
  return null;
};

// Deep clone a node subtree and generate fresh unique IDs for all cloned nodes
export const duplicateSubtree = (node: DocumentNode): DocumentNode => {
  const newId = generateId(node.type);
  return {
    ...node,
    id: newId,
    children: node.children ? node.children.map(duplicateSubtree) : undefined,
  };
};

// Verify if targetParentId is a descendant inside childNode's subtree (prevents recursive parent-in-child moves)
export const isDescendant = (childNode: DocumentNode, targetParentId: string): boolean => {
  if (childNode.id === targetParentId) return true;
  if (childNode.children) {
    for (const child of childNode.children) {
      if (isDescendant(child, targetParentId)) return true;
    }
  }
  return false;
};

// Validate parent/child registry contracts
export const isValidNesting = (childType: string, parentType: string): boolean => {
  const parentContract = COMPONENT_REGISTRY[parentType];
  const childContract = COMPONENT_REGISTRY[childType];
  
  if (!parentContract || !childContract) return false;

  // Check parent allowed children list
  if (parentContract.allowedChildren && parentContract.allowedChildren.length > 0) {
    if (!parentContract.allowedChildren.includes(childType)) return false;
  }

  // Check child allowed parents list
  if (childContract.allowedParents && childContract.allowedParents.length > 0) {
    if (!childContract.allowedParents.includes(parentType)) return false;
  }

  return true;
};
