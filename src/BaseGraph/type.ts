/**
 * @file 类型定义
 */

// 树输出点
export type OutputVertex<T extends object> = {
  id: string;
  children: OutputVertex<T>[];
  _origin: T,
} & {
  [x in keyof T]: T[x];
}

// 图输出点
export type OutputGraphVertex<V extends object, E extends object> = {
  _id: string;
  _relations: OutputGraphEdge<V, E>[];
} & {
  [x in keyof V]: V[x];
}

// 图输出边
export type OutputGraphEdge<V extends object, E extends object> = {
  _u: OutputGraphVertex<V, E>;
  _v: OutputGraphVertex<V, E>;
  _origin: E;
} & {
  [x in keyof E]: E[x];
}

// 图配置定义
export class GraphConfig {
  /** 是否为有向图 */
  isDirect: boolean
}

export const defaultGraphConfig: GraphConfig = {
  isDirect: true,
};
