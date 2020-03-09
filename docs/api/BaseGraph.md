---
order: 2
chinese: BaseGraph使用文档
english: BaseGraph document
---

# BaseGraph

以树、图为基础数据结构，规范数据定义并提供基础操作库

## 适配不同形式的初始数据

- 初始数据可能是数组，可能是对象
- 初始数据，可能是层级结构，可能是扁平结构

```ts
[
  { id: 1, children: [
    { id: 2, children: [] },
    { id: 3, children: [] },
  ]}
]

{
  id: 1, children: [
    { id: 2, children: [] },
    { id: 3, children: [] }
  ]
}

{
  id: 1, parent: {
    id: 2,
    parent: {
      id: 3
    }
  }
}

{
  vertex: [
    { id: 1 },
    { id: 2 },
  ],
  edge: [
    { u: 1, v: 2 },
  ]
}
```

### 构建树和图

- 树与图（有向图、无向图）统一使用 edge 与 vertex 去描述
- 可指定 vertex 唯一标识符，默认为 id
- 可指定 vertex 子节点列表，默认为 children
- 根据传入数据进行类型判断，构建树/图

#### 底层数据结构

- edge 与 vertex 分离
- 数据不冗余， 仅通过 id 去关联
- 树图数据结构统一，但会加入一些特征识别

```ts
vertex: [
  { id: 1, ... },
  { id: 2, ... },
],
edge: [
  { u: 1, v: 2, ... },
]
```

### 功能

#### 树

- 插入/删除/替换/查找节点/子树
- 插入/删除/替换/查找边
- 获取父节点/子节点/子孙节点/兄弟（层级结构/扁平结构/排序规则）
- 获取两个子节点的相同父节点
- 获取子节点到  任意节点（跟节点）的路径

#### 图

- 插入/删除/替换/查找节点
- 插入/删除/替换/查找边
- 获取父节点/子节点/子孙节点/兄弟（层级结构/扁平结构/排序规则）
- 获取两个子节点的相同父节点
- 获取子节点到任意节点（跟节点）的路径

### API

#### Tree

- 类型定义

```ts
class Vertex {
  id: string;
  content: string;
}
class Edge {
  u: string;
  v: string;
  content: string;
}

const data: {
  vertexes: Vertex[],
  edges: Edge[],
} = {
  vertexes: [
    { id: '1', content: '1' }, { id: '2', content: '2' },
    { id: '3', content: '3' }, { id: '4', content: '4' },
    { id: '5', content: '5' }, { id: '6', content: '6' },
    { id: '7', content: '7' }, { id: '8', content: '8' },
    { id: '9', content: '9' }, { id: '10', content: '10' },
    { id: '11', content: '11' }, { id: '12', content: '12' },
    { id: '13', content: '13' }, { id: '14', content: '14' },
    { id: '15', content: '15' }, { id: '16', content: '16' },
  ],
  edges: [
    { u: '7', v: '8', content: '7-8' }, { u: '7', v: '1', content: '7-1' }, { u: '7', v: '9', content: '7-9' },
    { u: '8', v: '5', content: '8-5' }, { u: '8', v: '2', content: '8-2' },
    { u: '5', v: '11', content: '5-11' }, { u: '5', v: '16', content: '5-16' }, { u: '5', v: '6', content: '5-6' },
    { u: '1', v: '12', content: '1-12' },
    { u: '12', v: '3', content: '12-3' }, { u: '12', v: '14', content: '12-14' },
    { u: '9', v: '4', content: '9-4' }, { u: '9', v: '10', content: '9-10' },
    { u: '10', v: '13', content: '10-13' },
    { u: '13', v: '15', content: '13-15' },
  ],
};
```

- 初始化树实例

```ts
const tree = new Tree<Vertex, Edge>(data.vertexes, data.edges);
```

- 判断是否为树

```ts
Tree.isTree(data.vertexes, data.edges)
```

- 判断是否为多树

```ts
Tree.isMulti(data.vertexes, data.edges)
```

- 获取唯一根节点

```ts
tree.getSingleRoot()
```

- 多树场景下，获取多个根节点

```ts
tree.getMultiRoot()
```

- 获取当前节点

```ts
tree.getNode('1');
```

- 获取节点的父节点

```ts
tree.getParent('12')
```

- 获取节点的所有子节点

```ts
tree.getChildren('9')
```

- 获取节点的层级

```ts
tree.getLevel('12')
```

- 获取节点子树，并可限制深度

```ts
tree.getSingleTree('1', 2)
```

- 多树场景下，获取多树，并限制深度

```ts
tree.getTree(null, 2)
```

- 获取两个节点最近公共祖先

```ts
tree.getNodeRelation('4', '15')
```

- 获取祖孙节点间的路径

```ts
tree.getPath('9', '15')
```

- 获取兄弟节点

```ts
const { pre, next, index } = tree.getSibling('11');
```

- 获取叶子节点

```ts
tree.getLeafVertexes('8')
```

- 遍历树，用于可视化渲染

```ts
console.log('==== dfs start ');
console.log(root);

tree.dfs(root, (parent) => {
  return tree.getChildren(parent.id);
  }, (parent, child) => {
  console.log(child);
});
console.log(' dfs end ====');

console.log('==== bfs start ');
const bfsQueue = [root];
while (bfsQueue.length !== 0) {
  const node = bfsQueue.shift();
  console.log(node);
  tree.bfs(node, (parent) => {
    return tree.getChildren(parent.id);
    }, (parent, child) => {
  	bfsQueue.push(child);
	});
}
console.log('== bfs end ====');
```

- 更新节点

```ts
tree.updateVertex({
  id: '1',
  content: '1-update',
});
```

- 更新边

```ts
tree.updateEdge({
  u: '1',
  v: '12',
  content: '1-12 upodate',
});
```

- 添加节点

```ts
tree.addVertex({
  id: '100',
  content: '100-addVertex',
}, '2');
```

- 删除边

```ts
const deleteChildTree = tree.deleteEdge('7', '9');
```

- 添加子树

```ts
tree.addChildTree(deleteChildTree, '14');
```

#### Graph

- 数据定义

```ts
class ComplexVertex {
  id: string;
  content: string;
}
class ComplexEdge {
  u: string;
  v: string;
  content: string;
}

// 有向图
const DirectedGraphData: {
  vertexes: ComplexVertex[],
  edges: ComplexEdge[],
} = {
  vertexes: [
    { id: '1', content: '1' }, { id: '2', content: '2' },
    { id: '3', content: '3' }, { id: '4', content: '4' },
  ],
  edges: [
    { u: '1', v: '2', content: '1-2' },
    { u: '2', v: '4', content: '2-4' },
    { u: '1', v: '3', content: '1-3' },
    { u: '3', v: '4', content: '3-4' },
    { u: '1', v: '4', content: '1-4' },
    { u: '4', v: '1', content: '4-1' },
  ],
};
// 无向图
const GraphData: {
  vertexes: ComplexVertex[],
  edges: ComplexEdge[],
} = {
  vertexes: [
    { id: '1', content: '1' }, { id: '2', content: '2' },
    { id: '3', content: '3' }, { id: '4', content: '4' },
  ],
  edges: [
    { u: '1', v: '2', content: '1-2' },
    { u: '2', v: '4', content: '2-4' },
    { u: '1', v: '3', content: '1-3' },
    { u: '3', v: '4', content: '3-4' },
    { u: '4', v: '1', content: '4-1' },
  ],
};
```

- 创建无向图

```ts
const graph = new Graph<ComplexVertex, ComplexEdge>(
  GraphData.vertexes,
  GraphData.edges,
  { isDirect: false }
);
```

- 创建有向图

```ts
const directedGraph = new Graph<ComplexVertex, ComplexEdge>(
  DirectedGraphData.vertexes,
  DirectedGraphData.edges,
  { isDirect: true }
);
```


- 获取边

```ts
graph.getEdge('2', '3');
```

- 获取节点

```ts
graph.getVertex('2');
```

- 获取所有关联节点

```ts
graph.getAdjacentVertexes('2','in');
```

- 输出图

```ts
directedGraph.getGraph('1')
```

- 更新图节点数据

```ts
graph.updateVertex({
    id: '2',
    content: '222222'
  });
```

- 更新图边数据

```ts
directedGraph.updateEdge({
  u: '1',
  v: '4',
  content: '23456'
});
```

- 更新图

```ts
directedGraph.updateGraph(
  [{ id: '5', content: '5' }],
  [{ u: '5', v: '4', content: '5-4' }, { u: '3', v: '5', content: '3-5' }]
);
```
