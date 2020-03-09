/**
 * 配置、初始化、后期筛选前置
 * 处理多图
 * BaseDAG 只专注 DAG 布局算法
 */

import {
  InputNode,
  InputRelation,
  OutputNode,
  OutputRelation,
  NodeId,
  InternalUpGradeNode,
  InternalUpGradeLink,
  DAGAIUConfig,
} from './types';
import BaseDAG from './BaseDAG';
import { maxBy } from '../../Utils/utils';
import { Point } from '../../Utils/graph';

const defaultDAGAIUConfig: DAGAIUConfig = {
  isTransverse: false,
  defaultNodeWidth: 180,
  defaultNodeHeight: 50,
  nodeAndNodeSpace: 40,
  paddingLineSpace: 30,
  levelSpace: 80,
  margin: {
    left: 180,
    right: 180,
    top: 50,
    bottom: 50
  },
  padding: 200,
  linkType: 'polyline',
  DiyLine: () => { },
  _isLinkMerge: true,
};

const emptyDAG = {
  nodes: [] as any,
  links: [] as any,
  pos: {
    width: 0,
    height: 0
  }
};

class DAGAIU<Node extends InputNode<Relation>, Relation extends InputRelation> {
  /** 默认配置项 */
  private config: DAGAIUConfig = defaultDAGAIUConfig;

  constructor(DAGConfig: DAGAIUConfig = {}) {
    this.config = {
      ...this.config,
      // 横向布局时要尽量减小虚拟节点的高度
      defaultVirtualNodeWidth: DAGConfig.isTransverse ? 0.1 : 180,
      ...DAGConfig,
    };
  }

  // 数据预处理，将节点与边信息提取出来，
  _preprocess(data: Node[]) {
    // 节点去重
    const nodeMap = new Map<NodeId, InternalUpGradeNode<Node, Relation>>();
    // 边去重
    const linkMap = new Map<NodeId, InternalUpGradeLink<Node, Relation>>();
    // 去重节点列表
    const nodes: InternalUpGradeNode<Node, Relation>[] = [];
    // 去重边列表，不带自环
    const links: InternalUpGradeLink<Node, Relation>[] = [];
    // 自环边
    const selfLinks: InternalUpGradeLink<Node, Relation>[] = [];
    data.forEach(node => {
      // 去除重复节点
      if (node && node.id && !nodeMap.has(node.id)) {
        const newNode: InternalUpGradeNode<Node, Relation> = {
          id: node.id,
          sourceLinks: [],
          targetLinks: [],
          type: 'real',
          nodeWidth: this.config.isTransverse
            ? node.nodeHeight || this.config.defaultNodeHeight
            : node.nodeWidth || this.config.defaultNodeWidth,
          nodeHeight: this.config.isTransverse
            ? node.nodeWidth || this.config.defaultNodeWidth
            : node.nodeHeight || this.config.defaultNodeHeight,
          originInfo: node
        };
        const key = this.config.getNodeKey ? this.config.getNodeKey(node) : node.id; 
        nodeMap.set(key, newNode);
        nodes.push(newNode);
      }
    });

    data.forEach(node => {
      if (node && node.id) {
        [...node.downRelations, ...node.upRelations].forEach(relation => {
          const { sourceId, targetId } = relation;
          const key = this.config.getLinkKey ? this.config.getLinkKey(relation) : `${sourceId}-${targetId}`;
          const sourceNode = nodeMap.get(sourceId);
          const targetNode = nodeMap.get(targetId);

          // 先确保节点均存在，连线不重复
          if (sourceNode && targetNode && !linkMap.has(key)) {
            const newRelation: InternalUpGradeLink<Node, Relation> = {
              source: sourceNode,
              target: targetNode,
              originInfo: relation,
              isReverse: false,
            };

            // 处理自环
            if (sourceId === targetId) {
              linkMap.set(key, newRelation);
              selfLinks.push(newRelation);
            } else {
              linkMap.set(key, newRelation);
              links.push(newRelation);
              sourceNode.sourceLinks.push(newRelation);
              targetNode.targetLinks.push(newRelation);
            }
          }
        });
      }
    });

    return {
      nodes,
      links,
      selfLinks
    };
  }

  _getDAG(data: Node[]): BaseDAG<Node, Relation> {
    const { nodes, links, selfLinks } = this._preprocess(data);
    const {
      defaultVirtualNodeWidth,
      nodeAndNodeSpace,
      paddingLineSpace,
      levelSpace,
      linkType,
      DiyLine,
      _isLinkMerge,
    } = this.config;
    const dag = new BaseDAG<Node, Relation>({
      nodes,
      links,
      selfLinks,
      config: {
        defaultVirtualNodeWidth,
        nodeAndNodeSpace,
        paddingLineSpace,
        levelSpace,
        linkType,
        DiyLine,
        _isLinkMerge,
      }
    });

    return dag;
  }

  /**
   * 单个 DAG
   * @param data
   */
  getSingleDAG(
    data: Node[]
  ): {
    nodes: OutputNode<Node>[];
    links: OutputRelation<Relation>[];
    pos: { width: number; height: number };
  } {
    if (!data || !data.length) {
      return emptyDAG;
    }

    // 单图横向布局，本质为逆转竖向布局
    if (this.config.isTransverse) {
      const ans = this._getDAG(data)
        .run()
        .getOutput(this.config.margin.bottom, this.config.margin.left);
      
      const width = ans.pos.width + this.config.margin.top + this.config.margin.bottom;
      const height = ans.pos.height + this.config.margin.left + this.config.margin.right;

      return {
        nodes: ans.nodes.map((node) => {
          return {
            ...node,
            nodeWidth: node.nodeHeight,
            nodeHeight: node.nodeWidth,
            view: {
              x: node.view.y,
              y: node.view.x,
            }
          };
        }),
        links: ans.links.map(link => {
          return {
            ...link,
            pathPoint: link.path,
            path: `${link.path
              .map((point, index) => {
                if (index === 0) return `M${point.y},${point.x}`;
                return `L${point.y},${point.x}`;
              })
              .join(' ')}`
          };
        }),
        pos: {
          width: height,
          height: width, 
        }
      };
    }

    const ans = this._getDAG(data)
      .run()
      .getOutput(this.config.margin.left, this.config.margin.top);

    return {
      ...ans,
      links: ans.links.map(link => {
        return {
          ...link,
          pathPoint: link.path,
          path: `${link.path
            .map((point, index) => {
              if (index === 0) return `M${point.x},${point.y}`;
              return `L${point.x},${point.y}`;
            })
            .join(' ')}`
        };
      }),
      pos: {
        width:
          ans.pos.width + this.config.margin.left + this.config.margin.right,
        height:
          ans.pos.height + this.config.margin.top + this.config.margin.bottom
      }
    };
  }

  /**
   * 多个DAG，可兼容单个 DAG
   * @param data
   */
  getMultiDAG(
    data: Node[]
  ): {
    nodes: OutputNode<Node>[];
    links: OutputRelation<Relation>[];
    pos: { width: number; height: number };
  } {
    if (!data || !data.length) {
      return emptyDAG;
    }

    const nodesList = this._separateNodes(data);
    // 单个 DAG
    if (nodesList.length === 1) {
      return this.getSingleDAG(nodesList[0]);
    } else {
      const widthList: number[] = [];
      const heightList: number[] = [];

      const dagInstanceList = nodesList.map(nodes => {
        const dag = this._getDAG(nodes).run();
        const { width, height } = dag.getSize();
        widthList.push(width);
        heightList.push(height);
        return dag;
      });

      if (this.config.isTransverse) {
        const height = maxBy(heightList, width => {
          return width;
        }) + this.config.margin.left + this.config.margin.right;
        const width = widthList.reduce((pre, width, index) => {
          if (index === 0) {
            return pre + width;
          }
          return pre + width + this.config.padding;
        }, 0) +
          this.config.margin.top +
          this.config.margin.bottom;
        
        const result = dagInstanceList.reduce(
          (pre, dag) => {
            const { addWidth } = pre;
            const { height: curheight } = dag.getSize();
            
            const ans = dag.getOutput(addWidth, (height - curheight) / 2);

            return {
              nodes: [...pre.nodes, ...ans.nodes],
              links: [...pre.links, ...ans.links],
              addWidth: addWidth + this.config.padding + ans.pos.width
            };
          },
          {
            nodes: [],
            links: [],
            addWidth: this.config.margin.top
          });

        return {
          nodes: result.nodes.map((node) => {
            return {
              ...node,
              nodeWidth: node.nodeHeight,
              nodeHeight: node.nodeWidth,
              view: {
                x: node.view.y,
                y: node.view.x,
              }
            };
          }),
          links: result.links.map(link => {
            return {
              ...link,
              pathPoint: link.path,
              path: `${link.path
                .map((point: Point, index: number) => {
                  if (index === 0) return `M${point.y},${point.x}`;
                  return `L${point.y},${point.x}`;
                })
                .join(' ')}`
            };
          }),
          pos: {
            width: height,
            height: width
          }
        };
      }
      
      const height =
        maxBy(heightList, height => {
          return height;
        }) +
        this.config.margin.top +
        this.config.margin.bottom;
      const width =
        widthList.reduce((pre, width, index) => {
          if (index === 0) {
            return pre + width;
          }
          return pre + width + this.config.padding;
        }, 0) +
        this.config.margin.left +
        this.config.margin.right;
      const result = dagInstanceList.reduce(
        (pre, dag, index) => {
          const { addWidth } = pre;
          const { height: curheight } = dag.getSize();

          const ans = dag.getOutput(addWidth, (height - curheight) / 2);

          return {
            nodes: [...pre.nodes, ...ans.nodes],
            links: [...pre.links, ...ans.links],
            addWidth: addWidth + this.config.padding + ans.pos.width
          };
        },
        {
          nodes: [],
          links: [],
          addWidth: this.config.margin.left
        }
      );

      return {
        nodes: result.nodes,
        links: result.links.map(link => {
          return {
            ...link,
            pathPoint: link.path,
            path: `${link.path
              .map((point: Point, index: number) => {
                if (index === 0) return `M${point.x},${point.y}`;
                return `L${point.x},${point.y}`;
              })
              .join(' ')}`
          };
        }),
        pos: {
          width,
          height
        }
      };
    }
  }

  dfs(
    node: Node,
    result: Node[],
    queueId: number,
    nodeMarkMap: Map<NodeId, { node: Node; queueId: number }>
  ) {
    /** 下游节点 */
    [...node.upRelations, ...node.downRelations].forEach(link => {
      const nodeId = link.targetId !== node.id ? link.targetId : link.sourceId;
      if (nodeMarkMap.has(nodeId)) {
        if (nodeMarkMap.get(nodeId).queueId === -1) {
          const targetNode = nodeMarkMap.get(nodeId).node;
          nodeMarkMap.set(nodeId, {
            node: targetNode,
            queueId
          });
          result.push(targetNode);
          this.dfs(targetNode, result, queueId, nodeMarkMap);
        } else {
          /** 表示重复遍历 */
          // if (nodeMarkMap.get(nodeId).queueId === queueId) { }
          if (nodeMarkMap.get(nodeId).queueId !== queueId) {
            throw new Error(`图数据异常, ${nodeId}，${node.id}`);
          }
        }
      }
    });
  }

  /**
   * 将 nodes 进行分离
   * @param data
   */
  _separateNodes(data: Node[]): Node[][] {
    const nodeMarkMap = new Map<
      NodeId,
      {
        node: Node;
        queueId: number;
      }
    >();

    // 初始化 nodeMarkMap
    data.forEach(node => {
      if (!nodeMarkMap.has(node.id)) {
        nodeMarkMap.set(node.id, {
          node,
          queueId: -1
        });
      }
    });

    const result = [] as Node[][];
    let index = 0;
    data.forEach(node => {
      if (nodeMarkMap.get(node.id).queueId === -1) {
        result[index] = [];
        result[index].push(node);
        const targetNode = nodeMarkMap.get(node.id).node;
        nodeMarkMap.set(node.id, {
          node: targetNode,
          queueId: index
        });
        this.dfs(node, result[index], index, nodeMarkMap);
        index++;
      }
    });

    return result;
  }
}

export default DAGAIU;