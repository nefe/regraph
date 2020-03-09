/**
 * @file 图操作
 */

import { GraphConfig, defaultGraphConfig, OutputGraphVertex } from "./type";
import { find } from '../Utils/utils';
import { BaseVertex, BaseEdge, Vertex, Edge } from '../type';

/** 内部索引图节点 */
class _GraphVertex<V, E> {
  /** 节点识别 id */
  id: string;
  /** 相关联的边，包含同向边和异向边 */
  edges: _GraphEdge<V, E>[] = [];
  /** 源信息，与 Vertex[] 对应 */
  origin: V;

  constructor(config: {
    id: string;
    edges: _GraphEdge<V, E>[];
    origin: V;
  }) {
    this.id = config.id;
    this.edges = config.edges;
    this.origin = config.origin;
  }

  // 根据关联节点 id，获取节点的边
  getEdge(id: string, isDirect: boolean): _GraphEdge<V, E> {
    if (isDirect) {
      return find(this.edges, (edge) => {
        return edge.v.id === id;
      }) || null;
    }
    return find(this.edges, (edge) => {
      return edge.u.id === id || edge.v.id === id;
    }) || null;
  }

  // 获取节点的所有关联边，有向需要区分入度，出度，默认 out
  getEdges(isDirect: boolean, direct: 'in' | 'out' = 'out'): _GraphEdge<V, E>[] {
    if (isDirect) {
      return this.edges.filter(edge => {
        // 求解下游边
        if (direct === 'out') {
          return edge.u.id === this.id;
        }
        return edge.v.id === this.id;
      });
    }
    return this.edges;
  }

  // 获取节点的所有关联节点，有向需要区分入度，出度，默认 out
  getAdjacentVertexes(isDirect: boolean, direct: 'in' | 'out' = 'out'): _GraphVertex<V, E>[] {
    if (isDirect) {
      return this.getEdges(isDirect, direct).map(edge => {
        return edge.u.id === this.id ? edge.v : edge.u;
      });
    }
    return this.edges.map(edge => {
      return edge.u.id === this.id ? edge.v : edge.u;
    });
  }
}

/** 内部索引图边 */
class _GraphEdge<V, E> {
  /** 一端节点索引 */
  u: _GraphVertex<V, E>;
  /** 另一端节点索引 */
  v: _GraphVertex<V, E>;
  /** 源信息，与 Edge[] 对应 */
  origin: E;

  constructor(config: {
    u: _GraphVertex<V, E>,
    v: _GraphVertex<V, E>,
    origin: E,
  }) {
    this.u = config.u;
    this.v = config.v;
    this.origin = config.origin;
  }
}

/**
 * 内部存成领接表 边带节点
 */
class Graph<V extends BaseVertex, E extends BaseEdge> {
  // 外界传入的节点数据
  private vertexes: Array<Vertex<V>> = [];
  // 外界传入的边数据
  private edges: Array<Edge<E>> = [];

  // 内部领接表图
  private _graph: _GraphVertex<V, E>[] = [];
  // 节点索引 map
  private _graphMap: Map<string, _GraphVertex<V, E>> = new Map();
  // 内部图是否构建完成
  private _graphReady: boolean;
  // 图配置
  private graphConfig: GraphConfig;
  // 图节点是否已经访问过了
  private visited: string[] = [];

  constructor(vertexes: Array<Vertex<V>>, edges: Array<Edge<E>>, graphConfig = defaultGraphConfig) {
    this.vertexes = vertexes;
    this.edges = edges;
    this.graphConfig = graphConfig;
    // @Todo 树图均需要检测是否重复边和重复点
    // @Todo 是否可以根据数据特征，自动判别有向还是无向？
    if (!this.graphConfig.isDirect) {
      // @Todo 无向图，不能出现，edge.u === edge.v && edge.v === edge.u 的情况
    }
    this._graph = this._createGraph();
  }

  _createGraph(): _GraphVertex<V, E>[] {
    this._graphReady = false;
    this._graphMap.clear();

    const vertexes = this.vertexes.map(vertex => {
      return new _GraphVertex<V, E>({
        id: vertex.id,
        edges: [],
        origin: vertex,
      });
    });

    vertexes.forEach((vertex) => {
      this._graphMap.set(vertex.id, vertex);
    });

    this.edges.forEach((edge) => {
      const { u, v } = edge;
      const uVertex = this.getVertex(u);
      const vVertex = this.getVertex(v);

      const graphEdge = new _GraphEdge<V, E>({
        u: uVertex,
        v: vVertex,
        origin: edge,
      });

      uVertex.edges.push(graphEdge);
      vVertex.edges.push(graphEdge);
    });

    this._graphReady = true;

    return vertexes;
  }

  _defaultIsDfs(id: string) {
    if (this.visited.includes(id)) {
      return false;
    }
    this.visited.push(id);
    return true;
  }

  /** dfs 遍历图，@Todo 先复制树操作的代码，后面再统一 */
  dfs<N extends { id: string }, R>(
    vertex: N,
    getAdjacentVertexes: (source: N) => N[],
    callback: (source: N, target: N, preCallBackResult: R, index: number) => R,
    isDfs: (id: string) => boolean = () => true,
    callBackResult: R = null,
    _isFirst = true,
  ) {
    if (_isFirst) {
      this.visited = [];
    }
    if (!isDfs(vertex.id) || !this._defaultIsDfs(vertex.id)) {
      return;
    }
    getAdjacentVertexes(vertex).forEach((node, index) => {
      const result = callback(vertex, node, callBackResult, index);
      this.dfs(node, getAdjacentVertexes, callback, isDfs, result, false);
    });
    if (_isFirst) {
      this.visited = [];
    }
  }

  /** 获取边 */
  getEdge(u: string, v: string): _GraphEdge<V, E> {
    if (!this._graphMap.has(u) || !this._graphMap.has(v)) {
      return null;
    }
    const graphNode = this._graphMap.get(u);
    return graphNode.getEdge(v, this.graphConfig.isDirect);
  }

  /** 获取节点 */
  getVertex(id: string): _GraphVertex<V, E> {
    if (!this._graphMap.has(id)) {
      return null;
    }
    return this._graphMap.get(id);
  }

  /** 获取所有关联节点 */
  getAdjacentVertexes(id: string, direct: 'in' | 'out' = 'out'): _GraphVertex<V, E>[] {
    if (!this._graphMap.has(id)) {
      return [];
    }
    return this._graphMap.get(id).getAdjacentVertexes(this.graphConfig.isDirect, direct);
  }

  /** 以一个点作为起点，输出图, */
  // @Todo 无向图有问题
  getGraph(nodeId?: string): OutputGraphVertex<Vertex<V>, Edge<E>> {
    const id = nodeId || this.vertexes[0].id;
    if (!this._graphMap.has(id)) {
      return null;
    }

    const source = this._graphMap.get(id);

    const tempNodeMap: Map<string, OutputGraphVertex<Vertex<V>, Edge<E>>> = new Map();
    const vertexes: OutputGraphVertex<Vertex<V>, Edge<E>> = {
      ...(source.origin as any),
      _id: source.id,
      _relations: [],
    };
    tempNodeMap.set(source.id, vertexes);
    
    this.dfs<OutputGraphVertex<Vertex<V>, Edge<E>>, void>(
      vertexes,
      (vertex) => {
        const _graphNode = this._graphMap.get(vertex.id);

        _graphNode.getEdges(this.graphConfig.isDirect).forEach(edge => {
          vertex._relations.push({
            ...(edge.origin as any),
            _u: null,
            _v: null,
            _origin: edge.origin,
          });
        });
        
        return _graphNode.getAdjacentVertexes(this.graphConfig.isDirect).map(_node => {
          // _node 可能已经存在，需要返回引用，使关联
          if (tempNodeMap.has(_node.id)) {
            return tempNodeMap.get(_node.id);
          }
          const node = {
            ...(_node.origin as any),
            _id: _node.id,
            _relations: [],
            _origin: _node.origin,
          };
          tempNodeMap.set(_node.id, node);
          return node;
        });
      },
      (source, target) => {
        const relation = find(source._relations, (relation) => {
          // @Todo 边的方向
          return relation.u === source._id && relation.v === target._id;
        });
        relation._u = source;
        relation._v = target;
      }
    );

    tempNodeMap.clear();
    
    return vertexes;
  }

  /** 更新图节点数据 */
  updateVertex(vertex: V): void {
    if (!this._graphMap.has(vertex.id)) {
      return;
    }

    const curVertex = this._graphMap.get(vertex.id);
    curVertex.origin = vertex;

    this.vertexes = this.vertexes.map(node => {
      return node.id === vertex.id ? vertex : node;
    });
  }

  /** 更新图边数据 */
  // @Todo 需要考虑有向无向
  updateEdge(edge: E): void {
    if (!this._graphMap.has(edge.v) || !this._graphMap.has(edge.u)) {
      return;
    }

    const curU = this._graphMap.get(edge.u);
    const curEdge = curU.getEdge(edge.v, this.graphConfig.isDirect);

    if (curEdge) {
      curEdge.origin = edge;
      this.edges = this.edges.map(e => {
        if (e.u === edge.u && e.v === edge.v) {
          return edge;
        }
        return e;
      });
    }
  }

  /** 更新图 */
  // @Todo 需要考虑有向无向
  // 目前只考虑增，没有考虑减
  updateGraph(
    vertexes: Array<Vertex<V>>,
    edges: Array<Edge<E>>,
    changeVertex: (newV: V, oldV: V) => V = (newV) => newV,
    changeEdge: (newE: E, oldE: E) => E = (newE) => newE,
  ) {
    this._graphReady = false;

    const newVertexes = vertexes.map(vertex => {
      if (this._graphMap.has(vertex.id)) {
        const oldVertex = this._graphMap.get(vertex.id).origin;
        const newVertex = changeVertex(vertex, oldVertex);
        this.updateVertex(newVertex);
        return this._graphMap.get(vertex.id);
      }
      this.vertexes.push(vertex);
      return new _GraphVertex<V, E>({
        id: vertex.id,
        edges: [],
        origin: vertex,
      });
    });

    newVertexes.forEach((vertex) => {
      if (!this._graphMap.has(vertex.id)) {
        this._graphMap.set(vertex.id, vertex);
      }
    });

    edges.forEach((edge) => {
      const { u, v } = edge;
      const uVertex = this.getVertex(u);
      const vVertex = this.getVertex(v);

      // 需要去掉重复的边
      // @Todo 需要考虑有向无向
      if (!this.getEdge(u, v)) {
        const graphEdge = new _GraphEdge<V, E>({
          u: uVertex,
          v: vVertex,
          origin: edge,
        });
        this.edges.push(edge);
        uVertex.edges.push(graphEdge);
        vVertex.edges.push(graphEdge);
      } else {
        const oldEdge = this.getEdge(u, v).origin;
        const newEdge = changeEdge(edge, oldEdge);
        this.updateEdge(newEdge);
      }
    });

    this._graphReady = true;
  }
}

export default Graph;

