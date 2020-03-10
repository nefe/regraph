# ReGraph

数据领域图表定义：以树、图为基础数据结构，带有数据业务属性与特征的图表

现状与痛点

- 数据产品中领域图表较多，业务场景丰富
- 产品中领域图表交互实现方式不统一
- 领域图表开发成本高，几乎都需要个性化开发
- 在树与图的渲染与交互上，比较成熟，但在布局上，对于开发者而言，门槛很高，直接使用第三方库也很难上手，很难调整到理想情况

ReGraph针对以上痛点，打造了基础操作层、渲染交互层、布局算法层三层结构。

ReGraph = 计算（布局插件）+ 底层操作（树图基础库）+ 渲染（交互的统一封装）

## 安装

```
yarn add regraph-next
```

## ReScreen

ReScreen 组件统一封装了画布的操作和缩略图功能，支持对画布的全屏、复位、显示所有、重置、平移缩放等常见功能。

### 使用

```tsx
import { ReScreen } from 'regraph-next';

<ReScreen  
  height = {500}
  width = {500}
  mapWidth = {200}
  mapHeight = {200}
  mapPosition = "RT-IN" >
  <svg>
    <g>
      <circle cx={0} cy={0} r={500} fill="yellow" />
      <circle cx={cx} cy={cy} r={250} fill="red" /> 
    </g>
  </svg> 
</ReScreen>

```

### API
| 参数           | 说明     | 类型         | 默认值                                                                    |
| -------------- | -------- | --------------- | ------------------------------------------------------------------------------ |
| type | 画布内容的类型 | 枚举值，可选值（`SVG` ,`DOM`) | SVG |
| width | 组件整体的尺寸，支持传入百分数 | number/string | - | 
| height | 组件整体的尺寸，支持传入百分数 | number/string | - | 
| zoomEnabled | 是否启动鼠标滚动缩放画布 | boolean | true | 
| focusEnabled | 是否启动聚焦功能，0表示不启动，1表示单击触发，2表示双击触发 | number | 0 | 
| minZoom | 缩放范围，最小值 | number | - |
| maxZoom | 缩放范围，最大值 | number | - |
| dragDirection | `ALL`,`HOR`, `VER` | 拖拽方向的锁定 | `ALL` |
| needMinimap | 是否需要缩略图 | boolean | true |
| minimap | React.ReactElement<any> | 支持自定义传入缩略图组件 | - |
| mapPosition | `RT`, `RB`, `LT`, `LB`,  `RT-IN`, `RB-IN`, `LT-IN`, `LB-IN` | 缩略图位置，右上角；-IN表示在画布的内部 | 默认为`RT` |
| mapPadding | 缩略图和原图之间的大小 | number | 20| 
| mapWidth | 缩略图大小 | number | 100px | 
| mapHeight | 缩略图大小 | number | 100px | 
| mapRectStyle | 缩略图矩形的样式 | object | - |
| Buttons | 按钮组件 | React.ReactElement<any> | - |
| needRefresh | 由于画布元素的变化而引起的视图变化 | boolean | - |
| resetNeedRefresh | 通知外层重置needRefresh为false | function | - |
| onScreenChange | 画布发生变化时的回调，对外暴露当前的缩放信息 | (transform: ZoomTransform) => void | - |
| getScreenHandler | 对外暴露画布操作函数 | any | - |


## BaseGraph

BaseGraph 以树、图为基础数据结构，规范数据定义并提供基础操作库。

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

更多详细[BaseGraph API](https://github.com/nefe/regraph/blob/master/docs/api/BaseGraph.md)

## BaseLayout

BaseLayout 主要处理树图布局集成

### 使用方式

```ts
import { ReLayout } from 'regraph-next';
const { DAGAIU } = ReLayout;
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