/**
 * @flie 全局统一类型
 */

export interface BaseVertex {
  id: string;
}

export interface BaseEdge {
  /** 对于有向树边而言，u 为父节点id，v 为子节点id */
  u: string;
  v: string;
}

// 顶点
export type Vertex<T extends BaseVertex> = {
  [key in keyof T]: T[key];
}

// 边
export type Edge<T extends BaseEdge> = {
  [key in keyof T]: T[key];
}

// 节点组
export type VertexGroup<V extends BaseVertex, T extends BaseVertex> = {
  [key in keyof T]: T[key];
} & {
  vertexes: Vertex<V>[];
}