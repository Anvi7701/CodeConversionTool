
export interface Explanation {
  value: string;
  explanation: string;
}

export interface Selection {
  path: string;
  key: string;
  value: any;
}

export interface GraphNode {
  id: string; // Corresponds to the selection path
  key: string;
  value: any;
  x: number;
  y: number;
  depth: number;
  width: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}
