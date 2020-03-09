/**
 * @file 树操作
 */

import { OutputVertex } from './type';
import { findIndex, find } from '../Utils/utils';
import { BaseVertex, BaseEdge, Vertex, Edge,  } from '../type';

const VIRTUAL_ROOT_ID = Symbol('VIRTUAL_ROOT_ID');

// 内部 Tree 节点
class _TreeVertex<V, E> {
  /** 索引 id */
  id: string;
  /** 节点类型 */
  type: 'virtualRoot' | 'realNode';
  /** 当前节点层级 */
  level: number;
  /** 父节点关联边 */
  parentEdge: _TreeEdge<V, E>;
  /** 子节点关联边列表 */
  childrenEdge: _TreeEdge<V, E>[];
  /** 源信息，与 Vertex[] 对应 */
  origin: V;

  constructor(config: {
    id: string;
    type: 'virtualRoot' | 'realNode';
    level: number;
    parentEdge: _TreeEdge<V, E>;
    childrenEdge: _TreeEdge<V, E>[];
    origin: V;
  }) {
    this.id = config.id;
    this.type = config.type;
    this.level = config.level;
    this.parentEdge = config.parentEdge;
    this.childrenEdge = config.childrenEdge;
    this.origin = config.origin;
  }

  getParent(): _TreeVertex<V, E> {
    return this.parentEdge.parent;
  }

  getChildrenOriginNode(): V[] {
    return this.childrenEdge.map(childEdge => {
      return childEdge.child.getOriginNode();
    });
  }

  getOriginNode() {
    return this.origin;
  }

  getLevel() {
    return this.level;
  }

  /** 获取兄弟节点 */
  getSibling() {
    const sibling = this.parentEdge.parent.getChildrenOriginNode();
    const index = findIndex(sibling, (item: any) => {
      return item.id === this.id;
    });
    return {
      pre: sibling.slice(0, index),
      index,
      next: sibling.slice(index + 1)
    };
  }

  isVirtualRoot() {
    return this.type === 'virtualRoot';
  }
}

// 内部 Tree 边
class _TreeEdge<V, E> {
  /** 父节点索引 */
  parent: _TreeVertex<V, E>;
  /** 另一端节点索引 */
  child: _TreeVertex<V, E>;
  /** 源信息 */
  origin: E;

  constructor(config: { parent: _TreeVertex<V, E>; child: _TreeVertex<V, E>; origin: E }) {
    this.parent = config.parent;
    this.child = config.child;
    this.origin = config.origin;
  }
}

// 获取根节点
function getRoot<V extends BaseVertex, E extends BaseEdge>(
  vertexes: Array<Vertex<V>>,
  edges: Array<Edge<E>>
): Array<Vertex<V>> {
  const roots: Array<Vertex<V>> = [];
  for (let i = 0; i < vertexes.length; i++) {
    const id = vertexes[i].id;
    // 没有上游节点，说明为根节点
    if (edges.filter(edge => edge.v === id).map(edge => edge.u).length === 0) {
      roots.push(vertexes[i]);
    }
  }
  return roots;
}

/**
 * 针对传入的 vertexes, edges 建立一颗索引树
 * CURD 操作时都有两种模式，存在索引树，或不存在
 * 注意：edge的 u，v，表示 v 是 u 的子节点，存在从属关系，无向图的树无法明确生成
 * @Todo 同树同层级子节点的顺序定义
 */
class Tree<V extends BaseVertex, E extends BaseEdge> {
  // 类的静态方法，是否为树
  static isTree: (vertexes: Array<Vertex<BaseVertex>>, edges: Array<Edge<BaseEdge>>) => boolean;
  // 类的静态方法，是否为多树
  static isMulti: (vertexes: Array<Vertex<BaseVertex>>, edges: Array<Edge<BaseEdge>>) => boolean;
  // 类的静态方法，解析嵌套结构
  static parse: <V extends BaseVertex, E extends BaseEdge>(
    tree: V[],
    getId?: (node: V) => string,
    getChildren?: (node: V) => V[],
    getEdge?: (parent: V, child: V) => E
  ) => { vertexes: Array<Vertex<V>>; edges: Array<Edge<E>> };

  // 外界传入的节点数据
  private vertexes: Array<Vertex<V>> = [];
  // 外界传入的边数据
  private edges: Array<Edge<E>> = [];

  // 内部索引树
  private _tree: _TreeVertex<V, E> = null;
  // 内部索引 Map
  private _treeMap: Map<string, _TreeVertex<V, E>> = new Map();
  // 内部索引树是否已经建立，已建立，使用索引树加速查询
  private _treeReady: boolean = false;
  // bfs 内部队列
  private _bfsQueue: OutputVertex<V>[];

  constructor(vertexes: Array<Vertex<V>>, edges: Array<Edge<E>>) {
    if (Tree.isTree(vertexes, edges) || Tree.isMulti(vertexes, edges)) {
      this.vertexes = vertexes;
      this.edges = edges;
      this._tree = this._createTree();
      return;
    }
    console.error('当前数据无法成树');
  }

  /**
   * 创建链式树，为了多树场景，需要创建一个虚拟根节点
   */
  _createTree() {
    this._treeReady = false;
    this._treeMap.clear();

    const virtualRoot = this._createVirtualRoot();
    this._treeMap.set(virtualRoot.id, virtualRoot);
    const root = this._getRoot();

    // 虚拟根节点与真实根节点产生关联
    root.forEach(node => {
      const treeNode: _TreeVertex<V, E> = new _TreeVertex({
        id: node.id,
        type: 'realNode',
        level: virtualRoot.level + 1,
        parentEdge: null,
        childrenEdge: [],
        origin: node
      });
      this._addChildren(virtualRoot, treeNode);
      this.dfs<_TreeVertex<V, E>, void>(
        treeNode,
        parent => {
          const children = this.getChildren(parent.id);
          return children.map(child => {
            return new _TreeVertex({
              id: child.id,
              type: 'realNode',
              level: parent.level + 1,
              parentEdge: null,
              childrenEdge: [],
              origin: child
            });
          });
        },
        (parent, child) => {
          if (child) {
            this._addChildren(parent, child);
          }
        }
      );
    });

    this._treeReady = true;

    return virtualRoot;
  }

  _addChildren(parentNode: _TreeVertex<V, E>, childNode: _TreeVertex<V, E>) {
    const isExistChild = find(
      parentNode.childrenEdge.map(childEdge => {
        return childEdge.child;
      }),
      child => {
        return child.id === childNode.id;
      }
    );
    if (!isExistChild) {
      const edge = this.getEdge(parentNode.origin.id, childNode.origin.id);
      parentNode.childrenEdge.push(
        new _TreeEdge({
          parent: parentNode,
          child: childNode,
          origin: edge
        })
      );
      childNode.parentEdge = new _TreeEdge({
        parent: parentNode,
        child: childNode,
        origin: edge
      });
      this._treeMap.set(childNode.id, childNode);
    }
  }

  /** 创建虚拟根节点 */
  _createVirtualRoot(): _TreeVertex<V, E> {
    const id = VIRTUAL_ROOT_ID.toString();
    return new _TreeVertex({
      id,
      parentEdge: null,
      type: 'virtualRoot',
      level: 0,
      childrenEdge: [],
      origin: {
        id
      } as V
    });
  }

  /** dfs 遍历树 */
  dfs<N extends { id: string }, R>(
    node: N,
    getChildren: (parent: N) => N[],
    beforeCallback: (parent: N, child: N, preCallBackResult: R) => R = () => undefined,
    isDfs: (id: string) => boolean = () => true,
    callBackResult: R = null,
    afterCallback: (parent: N, child: N, preCallBackResult: R) => void = () => undefined
  ) {
    if (!isDfs(node.id)) {
      return;
    }
    const children = getChildren(node);
    if (children && children.length) {
      children.forEach(child => {
        const result = beforeCallback(node, child, callBackResult);
        this.dfs(child, getChildren, beforeCallback, isDfs, result, afterCallback);
        afterCallback(node, child, result);
      });
    } else {
      const result = beforeCallback(node, null, callBackResult);
      afterCallback(node, null, result);
    }
  }

  /** bfs 遍历树 */
  bfs<N extends { id: string }>(
    node: N,
    getChildren: (parent: N) => N[],
    callback: (parent: N, child: N) => void,
    isBfs: (id: string) => boolean = () => true
  ) {
    if (!isBfs(node.id)) {
      return;
    }
    getChildren(node).forEach(child => {
      callback(node, child);
    });
  }

  _getRoot(isVirtual?: boolean): V[] {
    if (this._treeReady) {
      // 返回虚拟根节点
      if (isVirtual) {
        return [this._tree.getOriginNode()];
      }
      return this._tree.getChildrenOriginNode();
    } else {
      return getRoot<V, E>(this.vertexes, this.edges);
    }
  }

  /** 得到树的唯一根节点 */
  getSingleRoot(): V {
    const roots = this._getRoot();
    return roots[0];
  }

  /** 得到树的多重根节点 */
  getMultiRoot(): V[] {
    return this._getRoot();
  }

  /** 获取当前节点的父节点 */
  getParent(id: string): V {
    if (this._treeReady) {
      if (this._treeMap.has(id)) {
        const parent = this._treeMap.get(id).getParent();
        // 如果父元素是虚拟的根元素
        if (parent.isVirtualRoot()) {
          return null;
        }
        return parent.getOriginNode();
      }
      return null;
    } else {
      const edgeIdList = this.edges.filter(edge => edge.v === id).map(edge => edge.u);
      if (edgeIdList.length === 0) {
        return null;
      }
      return find(this.vertexes, vertex => {
        return edgeIdList.indexOf(vertex.id) !== -1;
      });
    }
  }

  /** 得到当前边 */
  getEdge(parentId: string, childId: string): E {
    const edges = this.edges.filter(edge => {
      return edge.u === parentId && edge.v === childId;
    });
    return edges.length === 0 ? null : edges[0];
  }

  /** 得到当前节点 */
  getNode(id: string): V {
    if (this._treeReady) {
      if (this._treeMap.has(id)) {
        return this._treeMap.get(id).getOriginNode();
      }
      return null;
    } else {
      const vertex = this.vertexes.filter(vertex => {
        return vertex.id === id;
      });
      return vertex.length === 0 ? null : vertex[0];
    }
  }

  getSibling(
    id: string
  ): {
    pre: V[];
    next: V[];
    index: number;
  } {
    if (this._treeReady) {
      if (this._treeMap.has(id)) {
        return this._treeMap.get(id).getSibling();
      }
    }
    /** @todo 有点懒得写 */
    return {
      pre: [],
      next: [],
      index: -1
    };
  }

  /** 得到子节点 */
  getChildren(id: string): V[] {
    if (this._treeReady) {
      if (this._treeMap.has(id)) {
        return this._treeMap.get(id).getChildrenOriginNode();
      }
      return [];
    } else {
      if (id === VIRTUAL_ROOT_ID.toString()) {
        return this._getRoot();
      }
      const edgeIdList = this.edges.filter(edge => edge.u === id).map(edge => edge.v);
      return this.vertexes.filter(vertex => {
        return edgeIdList.indexOf(vertex.id) !== -1;
      });
    }
  }

  /** 获取节点层级 */
  getLevel(id: string): number {
    if (this._treeMap.has(id)) {
      return this._treeMap.get(id).getLevel();
    }
    /** @Todo 注意异常处理 */
    return null;
  }

  /** 得到唯一树 */
  getSingleTree(id?: string, depth = -1): OutputVertex<V> {
    if (id && !this._treeMap.has(id)) {
      return null;
    }
    return this.getTree(id, depth)[0];
  }

  /** 得到树，子树，可定义多少深度 */
  getTree(id?: string, depth = -1): OutputVertex<V>[] {
    if (id && !this._treeMap.has(id)) {
      return [];
    }
    // 如果没有 id 则默认为根节点
    const nodes = id
      ? [
          {
            ...(this._treeMap.get(id).getOriginNode() as any),
            children: [],
            _origin: this._treeMap.get(id).getOriginNode()
          }
        ]
      : this._getRoot().map(root => {
          return {
            ...(root as any),
            children: [],
            _origin: root
          };
        });
    nodes.forEach(node => {
      this.dfs<OutputVertex<V>, void>(
        node,
        parent => {
          const children = this.getChildren(parent.id);
          return children.map(child => {
            return {
              ...(child as any),
              children: [],
              _origin: child
            };
          });
        },
        (parent, child) => {
          if (child) {
            parent.children.push(child);
          }
        },
        id => {
          const currentLevel = this._treeMap.get(id).getLevel();
          const level = this._treeMap.get(node.id).getLevel();

          if (depth === -1 || currentLevel - level < depth - 1) {
            return true;
          }
          return false;
        }
      );
    });

    return nodes;
  }

  /** 使用 BFS 获取子树 */
  _getTreeByBFS(id?: string, depth = -1): OutputVertex<V>[] {
    if (id && !this._treeMap.has(id)) {
      return [];
    }

    // 如果没有 id 则默认为根节点
    const nodes = id
      ? [
          {
            ...(this._treeMap.get(id).getOriginNode() as any),
            children: [],
            _origin: this._treeMap.get(id).getOriginNode()
          }
        ]
      : this._getRoot().map(root => {
          return {
            ...(root as any),
            children: [],
            _origin: root
          };
        });

    // 深拷贝
    this._bfsQueue = [...nodes];

    while (this._bfsQueue.length !== 0) {
      const node = this._bfsQueue.shift();
      this.bfs<OutputVertex<V>>(
        node,
        parent => {
          return this.getChildren(parent.id).map(child => {
            return {
              ...(child as any),
              children: [],
              _origin: child
            };
          });
        },
        (parent, child) => {
          parent.children.push(child);
          this._bfsQueue.push(child);
        },
        id => {
          const currentLevel = this._treeMap.get(id).getLevel();
          const level = this._treeMap.get(nodes[0].id).getLevel();

          if (depth === -1 || currentLevel - level < depth - 1) {
            return true;
          }
          return false;
        }
      );
    }

    return nodes;
  }

  /**
   * 获取祖孙节点的路径
   */
  getPath(ancestorId: string, childId: string): V[] {
    const ancestor = this.getNode(ancestorId);
    if (!ancestor) return [];
    let path: V[] = [];
    this.dfs<V, V[]>(
      ancestor,
      p => {
        return this.getChildren(p.id);
      },
      (p, child, pre) => {
        if (child) {
          if (childId === child.id) {
            path = [...pre, child];
          }
          return [...pre, child];
        }
        return pre;
      },
      () => {
        return path.length === 0;
      },
      [ancestor]
    );

    return path;
  }

  /**
   * 获取两节点的最近公共祖先，
   * 这里先采用在线的算法，离线适用于大量查询场景，暂时还没有
   */
  getNodeRelation(node1: string, node2: string): V {
    const root = this._getRoot(true)[0];
    const path1 = this.getPath(root.id, node1);
    const path2 = this.getPath(root.id, node2);

    const commonRoot = path1.reduce((pre, item) => {
      const node = find(path2, i => {
        return item.id === i.id;
      });
      if (node) {
        return node;
      }
      return pre;
    }, null);

    if (commonRoot.id === VIRTUAL_ROOT_ID.toString()) {
      return null;
    }
    return commonRoot;
  }

  _translate(
    vertex: OutputVertex<V>
  ): {
    vertexes: V[];
    edges: E[];
  } {
    const vertexResult: V[] = [vertex._origin];
    const edgeResult: E[] = [];
    this.dfs<OutputVertex<V>, void>(
      vertex,
      parent => {
        parent.children.forEach(child => {
          vertexResult.push(child._origin);
          /** @Todo 这会造成边信息丢失，目前只能用 updateEdge 来补 */
          edgeResult.push({
            u: parent.id,
            v: child.id
          } as E);
        });
        return parent.children;
      },
      () => {}
    );
    return {
      vertexes: vertexResult,
      edges: edgeResult
    };
  }

  /**
   * 添加点，自动增加一条边
   * 不存在 parentId，即新开一棵树，挂载到虚拟节点上
   */
  addVertex(vertex: V, parentId = VIRTUAL_ROOT_ID.toString()): void {
    if (!this._treeMap.has(parentId)) {
      return;
    }

    this.edges =
      parentId === VIRTUAL_ROOT_ID.toString() ? this.edges : [...this.edges, { u: parentId, v: vertex.id } as E];
    this.vertexes = [...this.vertexes, vertex];

    const parent = this._treeMap.get(parentId);
    const newTreeNode = new _TreeVertex<V, E>({
      id: vertex.id,
      parentEdge: null,
      type: 'realNode',
      level: parent.level + 1,
      childrenEdge: [],
      origin: vertex
    });

    this._addChildren(parent, newTreeNode);
  }

  /**
   * 添加子树，自动增加一条边
   * 不存在 parentId，即新开一棵树，挂载到虚拟节点上
   */
  addChildTree(vertex: OutputVertex<V>, parentId = VIRTUAL_ROOT_ID.toString()): void {
    if (!this._treeMap.has(parentId)) {
      return;
    }

    // 虚拟节点与真实节点的边不加入 this.edges
    this.edges =
      parentId === VIRTUAL_ROOT_ID.toString() ? this.edges : [...this.edges, { u: parentId, v: vertex.id } as E];
    const { vertexes, edges } = this._translate(vertex);
    this.vertexes = [...this.vertexes, ...vertexes];
    this.edges = [...this.edges, ...edges];

    this._treeReady = false;

    const parent = this._treeMap.get(parentId);
    this.dfs<_TreeVertex<V, E>, void>(
      parent,
      parent => {
        const children = this.getChildren(parent.id);
        return children.map(child => {
          return new _TreeVertex<V, E>({
            id: child.id,
            parentEdge: null,
            type: 'realNode',
            level: parent.level + 1,
            childrenEdge: [],
            origin: child
          });
        });
      },
      (parent, child) => {
        if (child) {
          this._addChildren(parent, child);
        }
      }
    );

    this._treeReady = true;
  }

  /**
   * 删除节点及其所有下游节点
   * 返回删除的子树
   */
  deleteVertex(vertexId: string): OutputVertex<V> {
    if (!this._treeMap.has(vertexId)) {
      return null;
    }

    const childTree = this.getSingleTree(vertexId);
    const parent = this._treeMap.get(vertexId).getParent();
    const { vertexes, edges } = this._translate(childTree);

    this.vertexes = this.vertexes.filter(vertex => {
      return find(vertexes, item => {
        return item.id === vertex.id;
      })
        ? false
        : true;
    });
    this.edges = this.edges.filter(edge => {
      return find(edges, e => {
        return (edge.u === e.u && edge.v === e.v) || (edge.u === parent.id && edge.v === vertexId);
      })
        ? false
        : true;
    });

    // 清除 _tree 与 _treeMap
    vertexes.forEach(vertex => {
      this._treeMap.delete(vertex.id);
    });
    parent.childrenEdge = parent.childrenEdge.filter(childEdge => {
      return childEdge.child.id !== vertexId;
    });

    return childTree;
  }

  /**
   * 更新节点
   */
  updateVertex(vertex: V): void {
    this.vertexes = this.vertexes.map(item => {
      if (item.id === vertex.id) {
        return vertex;
      }
      return item;
    });
    if (this._treeMap.has(vertex.id)) {
      // 修改引用
      const oldVertex = this._treeMap.get(vertex.id);
      oldVertex.origin = vertex;
    }
  }

  /**
   * 更新边
   */
  updateEdge(edge: E): void {
    this.edges = this.edges.map(e => {
      if (e.u === edge.u && e.v === edge.v) {
        return edge;
      }
      return e;
    });
  }

  /**
   * 删除边，同时删除与关联的下游节点
   * 返回下游子树
   */
  deleteEdge(u: string, v: string): OutputVertex<V> {
    if (!this._treeMap.has(u) || !this._treeMap.has(v)) {
      return null;
    }

    this.edges = this.edges.filter(edge => {
      return edge.u !== u && edge.v !== edge.v;
    });
    return this.deleteVertex(v);
  }

  getVertexes() {
    return this.vertexes;
  }

  getEdges() {
    return this.edges;
  }

  /** 获取当前节点所有的叶子节点 */
  getLeafVertexes(id?: string, depth = -1): V[] {
    const { vertexes } = this._translate(this._getTreeByBFS(id, depth)[0]);
    return vertexes.filter(node => {
      return this.getChildren(node.id).length === 0;
    });
  }
}

// 判断是否为树
Tree.isTree = (vertexes: Array<Vertex<BaseVertex>>, edges: Array<Edge<BaseEdge>>): boolean => {
  const visitedList: string[] = [];
  function dfs(node: Vertex<BaseVertex>) {
    if (visitedList.indexOf(node.id) !== -1) {
      return false;
    }
    visitedList.push(node.id);

    const edgeIdList = edges.filter(edge => edge.u === node.id).map(edge => edge.v);
    const children = vertexes.filter(vertex => {
      return edgeIdList.indexOf(vertex.id) !== -1;
    });

    for (let i = 0; i < children.length; i++) {
      if (!dfs(children[i])) {
        return false;
      }
    }
    return true;
  }

  // 树必然 n 个节点，n - 1 条边
  if (vertexes.length !== edges.length + 1) {
    return false;
  }
  // 不存在环
  const roots = getRoot<BaseVertex, BaseEdge>(vertexes, edges);
  if (roots.length === 1) {
    return dfs(roots[0]);
  }
  return false;
};

// 判断是否为多树，寻找出多个根节点，用虚拟根节点连接，能形成一颗树
Tree.isMulti = (vertexes: Array<Vertex<BaseVertex>>, edges: Array<Edge<BaseEdge>>): boolean => {
  const roots = getRoot<BaseVertex, BaseEdge>(vertexes, edges);
  if (roots.length <= 1) {
    return false;
  }
  const virtualRootId = VIRTUAL_ROOT_ID.toString();
  return Tree.isTree(
    [...vertexes, { id: virtualRootId }],
    [
      ...edges,
      ...roots.map(node => {
        return {
          u: virtualRootId,
          v: node.id
        };
      })
    ]
  );
};

/** 解析嵌套的树结构 */
Tree.parse = <V extends BaseVertex, E extends BaseEdge>(
  tree: V[],
  getId?: (node: V) => string,
  getChildren?: (node: V) => V[],
  getEdge?: (parent: V, child: V) => E
) => {
  const getIdHandler = getId
    ? getId
    : (node: any) => {
        return node.id;
      };
  const getChildrenHandler = getChildren
    ? getChildren
    : (node: any) => {
        return node.children;
      };

  const vertexes: Array<Vertex<V>> = [];
  const edges: Array<Edge<E>> = [];

  const visitedList: string[] = [];
  function dfs(node: V) {
    const id = getIdHandler(node);
    node.id = id;
    if (visitedList.indexOf(id) !== -1) {
      console.error('存在环！');
      return false;
    }
    visitedList.push(id);

    vertexes.push(node);

    const children: V[] = getChildrenHandler(node);
    if (children && children.length) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childId = getIdHandler(child);
        child.id = childId;

        const edge = getEdge
          ? getEdge(node, child)
          : ({
              u: id,
              v: childId
            } as E);
        edges.push(edge);
        dfs(child);
      }
    }
  }

  for (let i = 0; i < tree.length; i++) {
    dfs(tree[i]);
  }

  return {
    vertexes,
    edges
  };
};

export default Tree;
