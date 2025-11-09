
import { GraphData, GraphNode, GraphEdge } from '../types';

/**
 * Traverses a JSON object and converts it into a flat list of nodes and edges
 * suitable for a force-directed graph visualization with D3.js.
 * 
 * @param jsonData The JSON object to convert.
 * @param collapsedNodes A set of node IDs (paths) that should be treated as collapsed,
 *                       preventing their children from being added to the graph.
 * @returns A GraphData object containing the nodes and edges.
 */
export const convertJsonToGraphData = (jsonData: object, collapsedNodes: Set<string>): GraphData => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visited = new Set<string>();

  const traverse = (value: any, path: string, key: string, depth: number, parentId?: string) => {
    if (visited.has(path)) return;
    visited.add(path);

    const node: GraphNode = {
      id: path,
      key: key,
      value: value,
      depth: depth,
      // x, y, and width are now controlled by the D3 simulation, not pre-calculated.
      // We provide dummy values to satisfy the type.
      x: 0,
      y: 0,
      width: 100, 
    };
    nodes.push(node);

    if (parentId) {
      edges.push({
        id: `${parentId}-${path}`,
        source: parentId,
        target: path,
      });
    }

    const isObject = typeof value === 'object' && value !== null;
    if (isObject && !collapsedNodes.has(path)) {
      Object.entries(value).forEach(([childKey, childValue]) => {
        traverse(childValue, `${path}.${childKey}`, childKey, depth + 1, path);
      });
    }
  };

  traverse(jsonData, 'root', 'root', 0);

  // The width and height are now managed by the SVG container and D3 simulation,
  // but we return default values to satisfy the GraphData type.
  return { 
    nodes, 
    edges,
    width: 1200,
    height: 800
  };
};


/**
 * Recursively counts the number of nodes (keys and array elements) in a JSON object.
 * @param value The JSON value to count from.
 * @returns The total number of nodes.
 */
export const countNodes = (value: any): number => {
  let count = 1; // Count the current node
  if (typeof value === 'object' && value !== null) {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        count += countNodes(value[key]);
      }
    }
  }
  return count;
};

/**
 * Generates an initial set of collapsed node paths for large JSON objects to improve performance.
 * @param jsonData The full JSON object.
 * @param threshold The number of nodes above which the graph should start collapsed.
 * @returns A Set of node paths to be initially collapsed.
 */
export const getInitialCollapsedSet = (jsonData: object, threshold: number): Set<string> => {
  if (countNodes(jsonData) <= threshold) {
    return new Set<string>(); // Start expanded for smaller graphs
  }

  const nodesToCollapse = new Set<string>();
  const traverse = (value: any, path: string, depth: number) => {
    const isObject = typeof value === 'object' && value !== null;
    const hasChildren = isObject && Object.keys(value).length > 0;

    if (hasChildren) {
      // Collapse all expandable nodes except the root
      if (depth >= 1) { 
        nodesToCollapse.add(path);
      }
      
      // Continue traversal regardless of collapse to find all potential parents
      Object.entries(value).forEach(([key, childValue]) => {
        traverse(childValue, `${path}.${key}`, depth + 1);
      });
    }
  };

  traverse(jsonData, 'root', 0);
  return nodesToCollapse;
};
