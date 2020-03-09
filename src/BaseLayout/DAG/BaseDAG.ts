/**
 * 算法优化版本
 * 主要基于 dagre 修改节点顺序与位置算法
 */

import {
  InputNode,
  InputRelation,
  NodeId,
  InternalUpGradeNode,
  InternalUpGradeLink,
  BaseDAGConfig,
} from './types';

import LinkGenerator, { Polyline } from './Link';
import {
  minBy,
  find,
  sumBy,
  reverseArray,
  maxBy,
  getObjectMaxMin
} from '../../Utils/utils';
import { sortNodelevel, crossing } from './utils';

const MAX_ITERATIONS = 24;

class BaseDAG<
  Node extends InputNode<Relation>,
  Relation extends InputRelation
> {
  // 去重节点列表，包含虚拟节点
  private nodes: InternalUpGradeNode<Node, Relation>[];
  // 去重边列表，不带自环
  private links: InternalUpGradeLink<Node, Relation>[];
  // 自环边
  private selfLinks: InternalUpGradeLink<Node, Relation>[];
  // 虚拟节点编号
  private virtualId: number = 0;

  /** 配置项 */
  private config: BaseDAGConfig;

  // 整个 DAG 的高度与宽度
  private width: number;
  private height: number;

  private paddingSum: number[] = [];
  private levelPaddings: number[] = [];

  // 节点层级初始化排序使用
  private levelMap = new Map<number, number>();
  // 按节点层级划分的
  private nodesByLevel: InternalUpGradeNode<Node, Relation>[][] = [];
  // 节点层级中 height 最大的节点
  private nodesLevelMaxHeight: number[] = [];
  // dfs 节点标记
  private dfsVisited: NodeId[] = [];
  // link 实例
  private linkInstace: any;

  constructor({
    nodes,
    links,
    selfLinks,
    config
  }: {
    nodes: InternalUpGradeNode<Node, Relation>[];
    links: InternalUpGradeLink<Node, Relation>[];
    selfLinks: InternalUpGradeLink<Node, Relation>[];
    config: BaseDAGConfig;
  }) {
    this.nodes = nodes.slice().sort((nodeA, nodeB) => {
      return nodeA.id > nodeB.id ? 1 : -1;
    });
    this.links = links.slice().sort((linkA, linkB) => {
      return `${linkA.source.id}-${linkA.target.id}` >
        `${linkB.source.id}-${linkB.target.id}`
        ? 1
        : -1;
    });
    this.selfLinks = selfLinks.slice();
    this.config = { ...config };
  }

  destroy() {
    this.nodes = null;
    this.links = null;
    this.selfLinks = null;
    this.nodesByLevel = null;
    this.nodesLevelMaxHeight = null;
  }

  getOutput(left: number, top: number) {
    // 加整体偏移量
    this.nodes.forEach(node => {
      node.finalPos = {
        x: node.pos + left,
        // y: this.paddingSum[node.level] + 50 * node.level + top,
        // 间隔高度 + 节点层高度 + margin.top + 在层级中高度居中
        y:
          this.paddingSum[node.level] +
          top +
          this.nodesLevelMaxHeight.reduce((pre, height, index) => {
            if (index < node.level)
              return pre + this.nodesLevelMaxHeight[index];
            return pre;
          }, 0) +
          (this.nodesLevelMaxHeight[node.level] - node.nodeHeight) / 2
      };
    });

    this.links.forEach(link => {
      if (link.linkChildren && link.linkChildren.length) {
        link.finalPath = link.linkChildren.reduce((path, child, index) => {
          if (index === 0) {
            return this.linkInstace.getFinalPath(child, this.levelPaddings, false, true);
          }
          return path.concat(this.linkInstace.getFinalPath(child, this.levelPaddings, index === link.linkChildren.length - 1, false));
        }, []);
      } else {
        link.finalPath = this.linkInstace.getFinalPath(link, this.levelPaddings, true, true);
      }
    });

    this.selfLinks.forEach(link => {
      link.finalPath = this.linkInstace.getSelfFinalPath(link);
    });

    // 逆转边还原
    this.recoverCycle();

    return {
      nodes: this.nodes.filter(node => node.type !== 'virtual').map(node => {
      // nodes: this.nodes.map(node => {
        return {
          id: node.id,
          view: {
            x: node.finalPos.x,
            y: node.finalPos.y
          },
          nodeWidth: node.nodeWidth,
          nodeHeight: node.nodeHeight,
          info: node.originInfo
        };
      }),
      links: [
        ...this.links
          .filter(
            link =>
              link.source.type !== 'virtual' && link.target.type !== 'virtual'
          )
          .map(link => {
            return {
              sourceId: link.source.id,
              targetId: link.target.id,
              path: link.finalPath,
              info: link.originInfo
            };
          }),
        ...this.selfLinks.map(link => {
          return {
            sourceId: link.source.id,
            targetId: link.target.id,
            path: link.finalPath,
            info: link.originInfo
          };
        })
      ],
      pos: {
        width: this.width,
        height: this.height
      }
    };
  }

  run() {
    // 将有向有环图转为为有向无环图
    this.clearCycle();
    // 计算节点层级
    this.calcNodeLevels();
    // 计算节点位置
    this.calcNodePos();
    // 计算节点坐标
    this.xcordinate();
    // 计算线的位置，做成插件分离出来，输入所有 node 的信息
    this.calcLinkPos();
    // 计算真实尺寸
    this.calcRealSize();

    return this;
  }

  getSize() {
    return {
      width: this.width,
      height: this.height
    };
  }

  calcLinkPos() {
    const { linkType, DiyLine } = this.config;
    const LinkClass = LinkGenerator(linkType, DiyLine);
    this.linkInstace = new LinkClass(this.nodesByLevel, this.selfLinks, this.config);
    this.levelPaddings = this.linkInstace.calcPosAndPadding();
  }

  calcRealSize() {
    let sum = 0;
    // 累计 padding
    this.levelPaddings.forEach((padding, index) => {
      this.paddingSum[index] = sum;
      sum += padding;
    });

    // width 和 height 为纯的宽高
    this.height =
      this.paddingSum[this.paddingSum.length - 1] +
      sumBy(this.nodesLevelMaxHeight, height => height);
    this.width =
      this.nodes.reduce((max, curNode) => {
        return curNode.pos + curNode.nodeWidth > max
          ? curNode.pos + curNode.nodeWidth
          : max;
      }, 0) -
      this.nodes.reduce((min, curNode) => {
        return curNode.pos < min ? curNode.pos : min;
      }, 0);
  }

  addVirtualNode() {
    const virtualNodes: InternalUpGradeNode<Node, Relation>[] = [];
    const virtualLinks: InternalUpGradeLink<Node, Relation>[] = [];
    this.links.forEach(link => {
      const source = link.source;
      const target = link.target;

      const sourceLevel = source.level;
      const targetLevel = target.level;

      link.linkChildren = [];
      // 跨层级的边上才需要添加虚拟节点
      if (sourceLevel + 1 < targetLevel) {
        for (let i = sourceLevel + 1; i < targetLevel; i++) {
          const virtualNode: InternalUpGradeNode<Node, Relation> = {
            id: `virtual${this.virtualId++}`,
            sourceLinks: [],
            targetLinks: [],
            type: 'virtual',
            nodeWidth: this.config.defaultVirtualNodeWidth,
            nodeHeight: this.nodesLevelMaxHeight[i],
            originInfo: {} as any,
            level: i
          };
          const sourceNode =
            i === sourceLevel + 1
              ? source
              : virtualNodes[virtualNodes.length - 1];
          const virtualLink: InternalUpGradeLink<Node, Relation> = {
            source: sourceNode,
            target: virtualNode,
            originInfo: {} as any,
            isReverse: link.isReverse,
          };
          link.linkChildren.push(virtualLink);
          virtualLinks.push(virtualLink);
          sourceNode.sourceLinks.push(virtualLink);
          virtualNode.targetLinks.push(virtualLink);
          if (i === targetLevel - 1) {
            const virtualLink: InternalUpGradeLink<Node, Relation> = {
              source: virtualNode,
              target,
              originInfo: {} as any,
              isReverse: link.isReverse,
            };
            link.linkChildren.push(virtualLink);
            virtualLinks.push(virtualLink);
            virtualNode.sourceLinks.push(virtualLink);
            target.targetLinks.push(virtualLink);
          }
          virtualNodes.push(virtualNode);
        }
      }
    });

    this.nodes = [...this.nodes, ...virtualNodes];
    this.links = [...this.links, ...virtualLinks];
  }

  dfsOrder(node: InternalUpGradeNode<Node, Relation>) {
    if (this.dfsVisited.indexOf(node.id) > -1) return;

    const pos = this.levelMap.get(node.level);
    node.levelPos = pos;
    node._levelPos = pos;
    this.levelMap.set(node.level, pos + 1);
    this.dfsVisited.push(node.id);

    node.sourceLinks.forEach(link => {
      const { source, target } = link;

      // 只处理相邻层级
      if (target.level - source.level === 1) {
        this.dfsOrder(target);
      }
    });
  }

  initOrder() {
    // 分割进入
    this.nodes.forEach(node => {
      const level = node.level;
      if (this.nodesByLevel[level]) {
        this.nodesByLevel[level].push(node);
      } else {
        this.nodesByLevel[level] = [node];
        this.levelMap.set(level, 0);
      }
    });

    // 利用 dfs 来设置 order，树可以保证初始化排序没有交叉
    this.dfsVisited = [];
    for (let i = 0; i < this.nodesByLevel.length; i++) {
      for (let j = 0; j < this.nodesByLevel[i].length; j++) {
        if (this.nodesByLevel[i][j].levelPos === undefined) {
          this.dfsOrder(this.nodesByLevel[i][j]);
        }
      }
    }
  }

  wmedian(index: number) {
    /**
     * 节点中位数
     * @param nodelevel
     */
    function medianNodeLevel(nodelevel: InternalUpGradeNode<Node, Relation>[]) {
      nodelevel.forEach(node => {
        // 筛选出非跨层级上游节点，并按照 levelPos 排序
        const parentNode = node.targetLinks
          .filter(link => {
            return link.target.level - link.source.level === 1;
          })
          .map(link => link.source);
        parentNode.sort((node1, node2) => {
          return node1.levelPos - node2.levelPos;
        });

        const m = Math.floor(parentNode.length / 2);
        if (parentNode.length === 0) {
          node._median = -1;
        } else if (parentNode.length % 2 === 1) {
          node._median = parentNode[m].levelPos;
        } else if (parentNode.length === 2) {
          node._median = (parentNode[0].levelPos + parentNode[1].levelPos) / 2;
        } else {
          const left = parentNode[m - 1].levelPos - parentNode[0].levelPos;
          const right = parentNode[parentNode.length - 1].levelPos - parentNode[m].levelPos;
          node._median = (parentNode[m - 1].levelPos * right + parentNode[m].levelPos * left) / (left + right);
        }
      });
    }

    // index 为偶，从上到下，index 为奇，从下到上
    if (index % 2 === 0) {
      for (let i = 0; i < this.nodesByLevel.length; i++) {
        const nodelevel = this.nodesByLevel[i];
        medianNodeLevel(nodelevel);
        // 根据 _median 重排序
        this.nodesByLevel[i] = sortNodelevel(nodelevel);
      }
      return;
    } else {
      for (let i = this.nodesByLevel.length - 1; i >= 0; i--) {
        const nodelevel = this.nodesByLevel[i];
        medianNodeLevel(nodelevel);
        this.nodesByLevel[i] = sortNodelevel(nodelevel);
      }
    }
  }

  // 求全图交叉数量
  crossing() {
    let count = 0;
    for (let i = 1; i < this.nodesByLevel.length; i++) {
      count += crossing<Node, Relation>(
        this.nodesByLevel[i - 1],
        this.nodesByLevel[i]
      );
    }
    return count;
  }

  // 交换相邻节点位置
  transpose() {
    let bestCount = this.crossing();
    // 这里 i,j 的顺序与 level、_levelPos 的顺序保持一致
    for (let i = 0; i < this.nodesByLevel.length; i++) {
      if (this.nodesByLevel.length === 1) continue;
      for (let j = 1; j < this.nodesByLevel[i].length; j++) {
        // 暂时交换位置
        this.nodesByLevel[i][j]._levelPos = j - 1;
        this.nodesByLevel[i][j - 1]._levelPos = j;
        let currentCount = this.crossing();
        if (currentCount < bestCount) {
          // 能减少交叉，完成交换
          const tmpNode = this.nodesByLevel[i][j];
          this.nodesByLevel[i][j] = this.nodesByLevel[i][j - 1];
          this.nodesByLevel[i][j - 1] = tmpNode;
          bestCount = currentCount;
        } else {
          // 没有效果，还原
          this.nodesByLevel[i][j]._levelPos = j;
          this.nodesByLevel[i][j - 1]._levelPos = j - 1;
        }
      }
    }
    return bestCount;
  }

  /**
   * 确定同层级中节点的先后排列顺序，这里需要尽可能减少边交叉
   * 算法来源：A Technique for Drawing Directed Graphs.pdf 第3节
   * 主要思路是根据 dfs 遍历顺序获取一个初始顺序
   * 然后是启发式算法：从上到下，从下到上遍历，子节点位置由父节点们来决定，同时每次遍历完成后，尝试交换相邻节点的位置，看看是否能够减少边交叉数
   * 取最小边交叉数的排序，默认为最优解
   */
  ordering() {
    // 按层级排布，并给予初始化排序
    this.initOrder();
    let bestCount = this.crossing();
    if (bestCount !== 0) {
      for (let i = 0; i <= MAX_ITERATIONS; i++) {
        this.wmedian(i);
        const currentCount = this.transpose();
        if (bestCount > currentCount) {
          bestCount = currentCount;
          // 将所有 _levelPos 赋给 levelPos，并排序
          this.nodesByLevel.forEach((nodelevel, i) => {
            nodelevel.forEach(node => (node.levelPos = node._levelPos));
            nodelevel.sort((node1, node2) => {
              return node1.levelPos - node2.levelPos;
            });
          });
        }
      }
    }
    // 最终以 levelPos 为准
    this.nodesByLevel.forEach((nodelevel, i) => {
      nodelevel.sort((node1, node2) => {
        return node1.levelPos - node2.levelPos;
      });
    });
  }

  findTypeConflicts() {
    const conflicts: InternalUpGradeLink<Node, Relation>[] = [];

    // 层级
    for (let i = 1; i < this.nodesByLevel.length; i++) {
      let k0 = 0;
      let scanPos = 0;
      let prevLayerLength = this.nodesByLevel[i - 1].length;

      // 层级中的节点
      for (let j = 0; j < this.nodesByLevel[i].length; j++) {
        let node = this.nodesByLevel[i][j];
        // 寻找两个虚节点连成的边，寻找当前虚拟节点的相邻上游的虚拟节点，有且仅有一个
        const upVirtualLink =
          node.type === 'virtual' &&
          node.targetLinks.filter(link => {
            return (
              link.target.level - link.source.level === 1 &&
              link.source.type === 'virtual'
            );
          });
        const upVirtualNode =
          upVirtualLink && upVirtualLink.length
            ? upVirtualLink[0].source
            : undefined;
        let k1 = upVirtualNode ? upVirtualNode.levelPos : prevLayerLength;

        // 分段方法
        // 拥有上一层级虚节点，检查当前虚节点以前的
        // 当前虚节点为当前层级最后一个节点，检查最后一个虚节点以后的
        if (upVirtualNode || j === this.nodesByLevel[i].length - 1) {
          this.nodesByLevel[i].slice(scanPos, j + 1).forEach(curNode => {
            // 当前层级的上层节点
            const upCurNodes = curNode.targetLinks
              .filter(node => node.target.level - node.source.level === 1)
              .map(link => link.source);
            upCurNodes.forEach(upCurNode => {
              const pos = upCurNode.levelPos;
              if (
                (pos < k0 || k1 < pos) &&
                !(upCurNode.type === 'virtual' && curNode.type === 'virtual')
              ) {
                conflicts.push(
                  find(
                    curNode.targetLinks,
                    link =>
                      link.source.id === upCurNode.id &&
                      link.target.id === curNode.id
                  )
                );
              }
            });
          });
          scanPos = j + 1;
          k0 = k1;
        }
      }
    }

    return conflicts;
  }

  verticalAlignment(
    vert: 'u' | 'd',
    typeConflicts: InternalUpGradeLink<Node, Relation>[]
  ) {
    const root = {} as any;
    const align = {} as any;

    function hasConflict(
      node1: InternalUpGradeNode<Node, Relation>,
      node2: InternalUpGradeNode<Node, Relation>
    ) {
      for (let i = 0; i < typeConflicts.length; i++) {
        const link = typeConflicts[i];
        if (
          (link.source.id === node1.id && link.target.id === node2.id) ||
          (link.source.id === node2.id && link.target.id === node1.id)
        ) {
          return true;
        }
      }
      return false;
    }

    // 初始化
    for (let i = 0; i < this.nodesByLevel.length; i++) {
      for (let j = 0; j < this.nodesByLevel[i].length; j++) {
        const { id } = this.nodesByLevel[i][j];
        root[id] = id;
        align[id] = id;
      }
    }

    for (let i = 0; i < this.nodesByLevel.length; i++) {
      // 因为我们是从 0 计数的，所以这里要改为 -1
      let r = -1;
      for (let j = 0; j < this.nodesByLevel[i].length; j++) {
        const nodeV = this.nodesByLevel[i][j];
        // 从上到下取上游邻居，从下到上取上游邻居
        let neighbors =
          vert === 'u'
            ? nodeV.targetLinks
                .filter(link => {
                  return Math.abs(link.target.level - link.source.level) === 1;
                })
                .map(link => link.source)
            : nodeV.sourceLinks
                .filter(link => {
                  return Math.abs(link.target.level - link.source.level) === 1;
                })
                .map(link => link.target);

        if (neighbors && neighbors.length) {
          neighbors.sort((node1, node2) => {
            return node1.levelPos - node2.levelPos;
          });
          // 取邻居中位数节点，1 or 2
          const mid = (neighbors.length - 1) / 2;
          for (let z = Math.floor(mid); z <= Math.ceil(mid); z++) {
            const nodeW = neighbors[z];
            if (
              align[nodeV.id] === nodeV.id &&
              r < nodeW.levelPos &&
              !hasConflict(nodeV, nodeW)
            ) {
              align[nodeW.id] = nodeV.id;
              align[nodeV.id] = root[nodeV.id] = root[nodeW.id];
              r = nodeW.levelPos;
            }
          }
        }
      }
    }

    return {
      root,
      align
    };
  }

  horizontalCompaction(root: any, align: any, horiz: 'l' | 'r') {
    const sink = {} as any;
    const shift = {} as any;
    const x = {} as any;

    // 计算块与块间的最大间距，为了适配不同节点宽度
    const blockSpaceMap: Map<string, number> = new Map<string, number>();
    this.nodesByLevel.forEach((nodeLevel, i) => {
      let uNode: InternalUpGradeNode<Node, Relation>;
      nodeLevel.forEach((vnode) => {
        const vRootNodeId = root[vnode.id];
        if (uNode) {
          const uRootNodeId = root[uNode.id];
          const blockSpace = blockSpaceMap.has(`${vRootNodeId}-${uRootNodeId}`) || blockSpaceMap.has(`${uRootNodeId}-${vRootNodeId}`) ?
            blockSpaceMap.get(`${vRootNodeId}-${uRootNodeId}`) || blockSpaceMap.get(`${uRootNodeId}-${vRootNodeId}`) : 0;
          const curSpace = vnode.nodeWidth / 2 + this.config.nodeAndNodeSpace + uNode.nodeWidth / 2;
          blockSpaceMap.set(`${vRootNodeId}-${uRootNodeId}`, Math.max(blockSpace, curSpace));
          blockSpaceMap.set(`${uRootNodeId}-${vRootNodeId}`, Math.max(blockSpace, curSpace));
        }
        uNode = vnode;
      });
    });

    const placeBlock = (node: InternalUpGradeNode<Node, Relation>) => {
      if (x[node.id] === undefined) {
        x[node.id] = 0;
        let w = node.id;
        do {
          // 非第一个
          const curNode = find(this.nodes, node => node.id === w);
          if (curNode.levelPos > 0) {
            // 同层级左相邻节点
            const preNode = this.nodesByLevel[curNode.level][
              curNode.levelPos - 1
            ];
            // 取根节点
            const rootId = root[preNode.id];
            placeBlock(find(this.nodes, node => node.id === rootId));
            if (sink[node.id] === node.id) {
              sink[node.id] = sink[rootId];
            }
            if (!blockSpaceMap.has(`${rootId}-${root[node.id]}`) && !blockSpaceMap.has(`${root[node.id]}-${rootId}`)) {
              throw new Error(`${rootId}, ${root[node.id]}无法获取`);
            }
            if (sink[node.id] !== sink[rootId]) {
              shift[sink[rootId]] = Math.min(
                shift[sink[rootId]],
                x[node.id] - x[rootId] - (blockSpaceMap.get(`${rootId}-${root[node.id]}`) || blockSpaceMap.get(`${root[node.id]}-${rootId}`))
              );
            } else {
              x[node.id] = Math.max(
                x[node.id],
                x[rootId] + (blockSpaceMap.get(`${rootId}-${root[node.id]}`) || blockSpaceMap.get(`${root[node.id]}-${rootId}`))
              );
            }
          }
          w = align[w];
          // 块循环结束
        } while (w !== node.id);
      }
    };

    // 初始化
    for (let i = 0; i < this.nodesByLevel.length; i++) {
      for (let j = 0; j < this.nodesByLevel[i].length; j++) {
        const { id } = this.nodesByLevel[i][j];
        sink[id] = id;
        shift[id] = Number.MAX_SAFE_INTEGER;
        x[id] = undefined;
      }
    }

    // placeBlock
    for (let i = 0; i < this.nodesByLevel.length; i++) {
      for (let j = 0; j < this.nodesByLevel[i].length; j++) {
        const { id } = this.nodesByLevel[i][j];
        if (root[id] === id) {
          placeBlock(this.nodesByLevel[i][j]);
        }
      }
    }

    // 整理
    for (let i = 0; i < this.nodesByLevel.length; i++) {
      for (let j = 0; j < this.nodesByLevel[i].length; j++) {
        const { id } = this.nodesByLevel[i][j];
        x[id] = x[root[id]];
        if (shift[sink[root[id]]] < Number.MAX_SAFE_INTEGER) {
          x[id] = x[id] + shift[sink[root[id]]];
        }
      }
    }

    return x;
  }

  getDirectNodesByLevel(vert: 'u' | 'd', horiz: 'l' | 'r') {
    if (vert === 'u' && horiz === 'l') {
      return;
    }
    if ((vert === 'u' && horiz === 'r') || (vert === 'd' && horiz === 'r')) {
      this.nodesByLevel = this.nodesByLevel.map((nodeLevel, i) => {
        return reverseArray(nodeLevel, (node, levelPos) => {
          node.levelPos = levelPos;
          return node;
        });
      });
    }
    if (vert === 'd' && horiz === 'l') {
      this.nodesByLevel = reverseArray(
        this.nodesByLevel,
        (nodeLevel, level) => {
          return reverseArray(nodeLevel, (node, levelPos) => {
            node.level = level;
            node.levelPos = levelPos;
            return node;
          });
        }
      );
    }
  }

  resetLevel() {
    this.nodesByLevel = reverseArray(this.nodesByLevel, (nodeLevel, level) => {
      return reverseArray(nodeLevel, (node, levelPos) => {
        node.level = level;
        node.levelPos = levelPos;
        return node;
      });
    });
  }

  /**
   * 节点具体位置确定，算法稳定，能保证相同节点相同边的 DAG 不发生变动
   * 算法来源：Fast and Simple Horizontal Coordinate Assignment
   * 将节点从 左、右、上、下 四个方向进行块划分，拉开最小距离，最终取中位值，实现原理暂时不是很了解
   */
  xcordinate() {
    // 寻找出与（虚拟-虚拟）边交叉的（真实-真实/真实-虚拟）边
    const typeConflicts = this.findTypeConflicts();

    // 四个方向
    const xSet = {} as any;
    ['u', 'd'].forEach((vert: 'u' | 'd') => {
      ['l', 'r'].forEach((horiz: 'l' | 'r') => {
        /** 对 nodesByLevel 进行转置 */
        this.getDirectNodesByLevel(vert, horiz);

        // 相当于块划分
        const { root, align } = this.verticalAlignment(vert, typeConflicts);
        const x = this.horizontalCompaction(root, align, horiz);

        // right 方向为负
        if (horiz === 'r') {
          for (let key in x) {
            x[key] = -x[key];
          }
        }

        xSet[vert + horiz] = x;
      });
    });

    this.resetLevel();

    const {
      minSet: smallestWidth,
      minDirect
    } = this.findSmallestWidthAlignment(xSet);
    this.alignCoordinates(xSet, smallestWidth, minDirect);
    const finalPosSet = this.balance(xSet);

    let minPos = Infinity;
    /** 得出节点最后位置 */
    this.nodes.forEach(node => {
      node.pos = finalPosSet[node.id] - node.nodeWidth / 2;
      if (minPos > node.pos) {
        minPos = node.pos;
      }
    });
    this.nodes.forEach(node => {
      node.pos = node.pos - minPos;
    });
  }

  /** 从四个方向的几何中寻找一个宽度最小的 */
  findSmallestWidthAlignment(xSet: any) {
    let minSet;
    let minDirect;
    let minSetValue = Number.MAX_SAFE_INTEGER;
    for (let direction in xSet) {
      const xs = xSet[direction];
      let minValue = Number.MAX_SAFE_INTEGER;
      let maxValue = Number.MIN_SAFE_INTEGER;
      for (let key in xs) {
        const value = xs[key];
        const node = find(this.nodes, (node) => {
          // 兼容业务方id为number的情况
          return String(node.id) === String(key);
        });
        if (value + (node.nodeWidth / 2) > maxValue) maxValue = value + (node.nodeWidth / 2);
        if (value - (node.nodeWidth / 2) < minValue) minValue = value - (node.nodeWidth / 2);
      }
      if (maxValue - minValue < minSetValue) {
        minSetValue = maxValue - minValue;
        minSet = xs;
        minDirect = direction;
      }
    }
    return {
      minSet,
      minDirect
    };
  }

  alignCoordinates(xSet: any, smallestWidth: any, direct: string) {
    let { maxValue: maxAlign, minValue: minAlign } = getObjectMaxMin(
      smallestWidth
    );

    ['u', 'd'].forEach((vert: 'u' | 'd') => {
      ['l', 'r'].forEach((horiz: 'l' | 'r') => {
        let alignment = vert + horiz;
        if (alignment !== direct) {
          const xs = xSet[alignment];
          const { maxValue: maxXs, minValue: minXs } = getObjectMaxMin(xs);
          let delta = horiz === 'l' ? minAlign - minXs : maxAlign - maxXs;

          if (delta) {
            for (let key in xs) {
              xs[key] = xs[key] + delta;
            }
          }
        }
      });
    });
  }

  balance(xSet: any) {
    const posListSet = {} as any;
    for (let direction in xSet) {
      for (let key in xSet[direction]) {
        if (posListSet[key] && posListSet[key].length) {
          posListSet[key].push(xSet[direction][key]);
        } else {
          posListSet[key] = [xSet[direction][key]];
        }
      }
    }

    const finalPosSet = {} as any;
    for (let key in posListSet) {
      posListSet[key].sort((a: any, b: any) => a - b);
      finalPosSet[key] = (posListSet[key][1] + posListSet[key][2]) / 2;
    }

    return finalPosSet;
  }

  calcNodePos() {
    // 添加跨节点边的虚拟节点
    this.addVirtualNode();
    // 开始迭代变换
    this.ordering();
  }

  recoverCycle() {
    this.links.forEach((link) => {
      if (link.isReverse) {
        this.exchangeLink(link);
        if (link.linkChildren && link.linkChildren.length) {
          link.linkChildren.forEach((link) => {
            if (link.isReverse) {
              this.exchangeLink(link);
            }
          });
        }
      }
    });
  }

  clearCycleDfs(node: InternalUpGradeNode<Node, Relation>, stack: (string | number)[], isFirst: boolean) {
    const lastNodeId = stack[stack.length - 1];
    // 当前节点已被遍历，不需要再遍历
    if (lastNodeId) {
      if (this.dfsVisited.indexOf(`${lastNodeId}_${node.id}`) > -1) {
        return;
      }
      this.dfsVisited.push(`${lastNodeId}_${node.id}`);
    }

    // 当前节点成环，对边进行逆转标记
    if (stack.indexOf(node.id) > -1) {
      console.warn('当前图中存在环，已被逆转处理');
      const link = find(this.links, (link) => {
        return link.source.id === lastNodeId && link.target.id === node.id;
      });
      link.isReverse = true;
    }
    
    // 保证按真实连线进行上下关系
    const LinkList = isFirst ? node.sourceLinks.filter(link => !link.isCycleRelation) : node.sourceLinks;
    for (let i = 0; i < LinkList.length; i++) {
      this.clearCycleDfs(LinkList[i].target, [...stack, node.id], false);
    }
    return;
  }

  exchangeLink(link: InternalUpGradeLink<Node, Relation>) {
    const source = link.source;
    const target = link.target;

    // 从 sourceLinks 中去除
    source.sourceLinks = source.sourceLinks.filter(link => {
      return link.source.id !== source.id || link.target.id !== target.id || !link.isReverse; 
    });
    // 添加到 targetLinks 
    source.targetLinks.push(link);

    // 从 targetLinks 中去除
    target.targetLinks = target.targetLinks.filter(link => {
      return link.source.id !== source.id || link.target.id !== target.id || !link.isReverse;
    });
    target.sourceLinks.push(link);

    link.source = target;
    link.target = source;
  }

  /** 利用 dfs 去除环 */
  clearCycle() {
    this.dfsVisited = [];
    for (let i = 0; i < this.nodes.length; i++) {
      this.clearCycleDfs(this.nodes[i], [], true);
    }
    this.links.forEach((link) => {
      if (link.isReverse) {
        this.exchangeLink(link);
      }
    });
  }

  /**
   * 确定节点层级
   * 算法来源：A Technique for Drawing Directed Graphs，2.3 节，主要采用了生成树的做法，原理难懂且实现比较复杂
   * 实现算法为简要版本，来源于 jdk137/dag，主要通过获取骨干节点后，其余节点根据自己的父子节点层级来决定层级，比较简单
   */
  calcNodeLevels() {
    this.nodes.forEach(node => {
      node.linkNumber = node.targetLinks.length + node.sourceLinks.length;
      node.levelSetted = false;
    });

    let shrink = true;
    let boneNodes = this.nodes;
    // 去除度为 1 的节点的边，获取骨干节点
    while (shrink) {
      shrink = false;
      boneNodes.forEach(node => {
        if (node.linkNumber === 1) {
          shrink = true;
          node.linkNumber = 0;
          node.sourceLinks.forEach(link => {
            link.target.linkNumber--;
          });
          node.targetLinks.forEach(link => {
            link.source.linkNumber--;
          });
        }
      });
      boneNodes = boneNodes.filter(node => {
        return node.linkNumber > 0;
      });
    }

    boneNodes.forEach(node => {
      node.isBone = true;
    });

    let level = 0;
    let confirmNodeLevelList = boneNodes;
    // boneNodes > 0 说明当前DAG图成环状，如 1—>2 2->3 1->3
    // 通过不断遍历节点的下游节点，确定节点层级
    if (boneNodes.length > 0) {
      while (confirmNodeLevelList.length) {
        const nextNodes: InternalUpGradeNode<Node, Relation>[] = [];
        confirmNodeLevelList.forEach(node => {
          node.level = level;
          node.sourceLinks.forEach(link => {
            // @Fix 2018-06-27，需要进行去重处理，不然由于图层级过深，nextNodes 数组会变得很大，导致 crash
            if (!find(nextNodes, (node) => {
              return node.id === link.target.id;
            })) {
              nextNodes.push(link.target);
            }
          });
        });
        confirmNodeLevelList = nextNodes;
        level++;
      }
      // 收集节点的上下游骨干节点
      boneNodes.forEach(node => {
        const parentBoneNode: InternalUpGradeNode<Node, Relation>[] = [];
        const childrenBoneNode: InternalUpGradeNode<Node, Relation>[] = [];
        node.targetLinks.forEach(link => {
          if (link.source.isBone) {
            parentBoneNode.push(link.source);
          }
        });
        node.sourceLinks.forEach(link => {
          if (link.target.isBone) {
            childrenBoneNode.push(link.target);
          }
        });
        node.parentBoneNode = parentBoneNode;
        node.childrenBoneNode = childrenBoneNode;

        const minChildLevel: number = (
          minBy(node.childrenBoneNode, boneNode => boneNode.level) ||
          ({} as InternalUpGradeNode<Node, Relation>)
        ).level;
        // 如果没有父节点，当前节点层级就是最上层子节点的上级
        if (node.parentBoneNode.length === 0) {
          node.level = minChildLevel - 1;
        }
        if (minChildLevel && minChildLevel - node.level > 1) {
          // 如果当前节点与最上层子节点相差超过一个层级，就需要进行调整，如果子节点数量少于父节点数量，则当前节点应更加靠近子节点
          if (node.childrenBoneNode.length < node.parentBoneNode.length) {
            node.level = minChildLevel - 1;
          }
          // 其余情况不需要处理
        }
      });
    } else {
      // 不成环的情况，将第一个节点设为骨干节点
      this.nodes[0].level = 0;
      boneNodes.push(this.nodes[0]);
    }

    boneNodes.forEach(node => {
      node.levelSetted = true;
    });
    // 处理未成环状的节点，根据他上下游的依赖节点的层级来判断位置
    let waitSetLevelNodes = boneNodes;
    while (waitSetLevelNodes.length) {
      const tmpNodeList: InternalUpGradeNode<Node, Relation>[] = [];
      waitSetLevelNodes.forEach(node => {
        node.sourceLinks.forEach(link => {
          const targetNode = link.target;
          if (!targetNode.levelSetted) {
            targetNode.level = node.level + 1;
            node.levelSetted = true;
            tmpNodeList.push(targetNode);
          }
        });
        node.targetLinks.forEach(link => {
          const sourceNode = link.source;
          if (!sourceNode.levelSetted) {
            sourceNode.level = node.level - 1;
            node.levelSetted = true;
            tmpNodeList.push(sourceNode);
          }
        });
      });
      waitSetLevelNodes = tmpNodeList;
    }

    // 归 0 化处理，计算层级可能为负数
    const minLevel: number = minBy(this.nodes, node => node.level).level;
    this.nodes.forEach(node => {
      node.level -= minLevel;
    });

    // 算出每个层级中最大的节点高度，以匹配节点高度不同
    const maxLevel: number = maxBy(this.nodes, node => node.level).level;
    this.nodesLevelMaxHeight = Array(maxLevel + 1).fill(-Infinity);
    this.nodes.forEach(node => {
      if (this.nodesLevelMaxHeight[node.level] < node.nodeHeight) {
        this.nodesLevelMaxHeight[node.level] = node.nodeHeight;
      }
    });
  }
}

export default BaseDAG;
