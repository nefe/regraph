import { LinkType } from './Link';
import { Point } from '../../Utils/graph';

type NodeId = string | number;

/** 用户输入 */
interface InputRelation {
  // 起始节点
  sourceId: NodeId;
  // 终止节点
  targetId: NodeId;
  // 已知环边
  isCycleRelation?: boolean;
}
interface InputNode<T extends InputRelation>{
  // node id
  id: NodeId;
  // 下游节点
  downRelations: T[];
  // 上游节点
  upRelations: T[];
  // 节点宽度
  nodeWidth?: number;
  // 节点高度
  nodeHeight?: number;
}

/** 算法输出 */
interface OutputRelation<T> {
  // 起始节点
  sourceId: NodeId;
  // 终止节点
  targetId: NodeId;
  // 计算路径
  path: string;
  // 计算路径点位
  pathPoint: Point[];
  // 边信息
  info: T;
}
interface OutputNode<T> {
  // 节点id
  id: NodeId;
  // 节点位置
  view: {
    x: number,
    y: number,
  };
  // 节点宽度
  nodeWidth: number;
  // 节点高度
  nodeHeight: number;
  // 节点信息
  info: T;
}

/** 算法内部 */
interface InternalUpGradeNode<ON, OL> {
  id: NodeId;
  // 当前 Node 作为 source 的 link 列表，去除自环
  sourceLinks: InternalUpGradeLink<ON, OL>[];
  // 当前 Node 作为 target 的 link 列表，去除自环
  targetLinks: InternalUpGradeLink<ON, OL>[];
  nodeWidth: number;
  nodeHeight: number;
  // 具体节点还是虚拟节点
  type: 'real' | 'virtual';
  // 原始信息
  originInfo: ON,

  // 节点关联数量
  linkNumber?: number;
  // 节点层级是否被设置
  levelSetted?: boolean;
  // 是否为骨干节点
  isBone?: boolean;
  // 骨干父节点
  parentBoneNode?: InternalUpGradeNode<ON, OL>[];
  // 骨干子节点
  childrenBoneNode?: InternalUpGradeNode<ON, OL>[];
  // 节点层级（x）-> finalPos.y
  level?: number;
  // 在当前层级的位置
  levelPos?: number;
  // 临时位置，用于比较
  _levelPos?: number;
  // 节点上层中位置
  _median?: number;
  // 节点位置 -> finalPos.x
  pos?: number;
  // 具有下游节点的序号
  sourceNodeIndex?: number;

  // 最终位置信息
  finalPos?: {
    x: number;
    y: number;
  };
}

class InternalUpGradeLink<ON, OL> {
  source: InternalUpGradeNode<ON, OL>;
  target: InternalUpGradeNode<ON, OL>;
  isCycleRelation?: boolean;
  // 原始信息
  originInfo: OL;

  // 跨层级子链
  linkChildren?: InternalUpGradeLink<ON, OL>[];
  // 起始点位置
  sourcePos?: number;
  // 结束点位置
  targetPos?: number;
  // 是否为逆置边
  isReverse?: boolean;
  // turnY 在间距中的位置
  turnYIndex?: number;
  // turnY 总数
  turnYCount?: number;
  // turnY 的数值
  turnYValue?: number;

  // 最终位置信息
  finalPath?: Point[];
}

class BaseConfig {
  // 默认虚拟节点宽度
  defaultVirtualNodeWidth?: number;
  // 节点与节点之间的距离
  nodeAndNodeSpace?: number;
  // 连线之间的间隔
  paddingLineSpace?: number;
  // 层级间距
  levelSpace?: number;
  // link 类型
  linkType?: LinkType;
  // 自定义 link
  DiyLine?: any;
  // 是否开启边合并，实验属性，默认开启，data-edge-coincide
  _isLinkMerge?: boolean;
}

class DAGAIUConfig extends BaseConfig {
  // 默认节点宽度
  defaultNodeWidth?: number;
  // 默认节点高度
  defaultNodeHeight?: number;
  // 全图
  margin?: {
    left: number,
    right: number,
    top: number,
    bottom: number,
  };
  // 图与图间的间隔
  padding?: number;
  // 是否是横向布局
  isTransverse?: boolean;
  // 点的去重识别
  getNodeKey?: (node: any) => string;
  // 边的去重识别
  getLinkKey?: (relation: any) => string;
}

class BaseDAGConfig extends BaseConfig {
}

export {
  NodeId,
  InputNode,
  InputRelation,
  OutputNode,
  OutputRelation,

  InternalUpGradeNode,
  InternalUpGradeLink,

  DAGAIUConfig,
  BaseDAGConfig,
}