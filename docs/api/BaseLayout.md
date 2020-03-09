---
order: 3
chinese: BaseLayout使用文档
english: BaseLayout document
---

# OneLayout

主要处理树图布局集成

1. 图嵌套布局
2. 多图布局
3. 横向布局
4. 标准化输入输出
5. 点、边渲染自定义能力
6. 布局可拔插能力
7. web worker计算

** 当前仅提供了DAG相关布局算法，未来会引入更多的树/图布局算法 **

## 使用方式

```ts
import { OneLayout } from '@ali/one-graph';
const { DAGAIU } = OneLayout;
interface MyRelation {
  sourceId: number;
  targetId: number;
  periodDiff: number;
}
interface MyNode {
  id: number;
  downRelations: MyRelation[];
  upRelations: MyRelation[];
  name: string;
  desc: string;
  nodeWidth?: number;
  nodeHeight?: number;
}
// 生成dag图
const dag = new DAGAIU<MyNode, MyRelation>({
  isTransverse: true,
  padding: 20,
});
```

- 生成单个DAG

```ts
dag.getSingleDAG(data)
```

- 生成多个DAG

```ts
dag.getMultiDAG(data)
```

- 带组的图布局

```ts
this.groupLayout = new GroupGraphLayout(nodes, links, groups, groupLinks, config);
this.groupLayout.layout();
```