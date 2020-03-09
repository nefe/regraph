/**
 * @file 连线生成类
 */

import {
  InternalUpGradeNode,
  InternalUpGradeLink,
  DAGAIUConfig
} from './types';
import { getRatio } from './utils';
import { isCross, crossPoint, distance, Point } from '../../Utils/graph';
import { find } from '../../Utils/utils';

export type LinkType = 'straightLine' | 'polyline' | 'diy';

export class StraightLine<Node, Relation> {
  // 层级节点数据
  private nodesByLevel: InternalUpGradeNode<Node, Relation>[][];
  // 自环边
  private selfLinks: InternalUpGradeLink<Node, Relation>[];
  // 配置
  private config: DAGAIUConfig;

  private nodeLinkByLevelSourceNodeCount: number[] = [];

  constructor(
    nodesByLevel: InternalUpGradeNode<Node, Relation>[][],
    selfLinks: InternalUpGradeLink<Node, Relation>[],
    config: DAGAIUConfig
  ) {
    this.nodesByLevel = nodesByLevel;
    this.selfLinks = selfLinks;
    this.config = config;
  }

  calcPosAndPadding() {
    this.nodesByLevel.forEach(nodelevel => {
      let count = 0;
      nodelevel.forEach(node => {
        if (node.sourceLinks && node.sourceLinks.length) {
          count += node.sourceLinks.filter(link => {
            return link.target.level - link.source.level === 1;
          }).length;
        }
      });
      this.nodeLinkByLevelSourceNodeCount.push(count);
    });

    const levelPaddings: number[] = [];
    // 每个层级的间距，index = 0，对应 0 ~ 1 层级的高度
    this.nodesByLevel.forEach((nodelevel, level) => {
      // 最后一层
      if (level === this.nodesByLevel.length - 1) {
        levelPaddings[level] = 0;
      } else {
        levelPaddings[level] = Math.max(
          this.nodeLinkByLevelSourceNodeCount[level] * 15,
          this.config.levelSpace
        );
      }
    });
    return levelPaddings;
  }

  getFinalPath(
    link: InternalUpGradeLink<Node, Relation>,
    levelPaddings: number[],
    isLast: boolean,
    isFirst: boolean
  ): Point[] {
    // 箭头长度
    const bDis = 6;
    const angle = 1 / 2;

    const startPoint = {
      x: link.source.finalPos.x + link.source.nodeWidth / 2,
      y: link.source.finalPos.y + link.source.nodeHeight / 2
    };
    const endPoint = {
      x: link.target.finalPos.x + link.target.nodeWidth / 2,
      y: link.target.finalPos.y + link.target.nodeHeight / 2
    };

    // @Todo 两个相同节点的相互连接边会重合，要考虑一下如何处理这个特殊情况
    if (isFirst && link.isReverse) {
      const startNodeEdge = [
        { x: link.source.finalPos.x, y: link.source.finalPos.y },
        {
          x: link.source.finalPos.x + link.source.nodeWidth,
          y: link.source.finalPos.y
        },
        {
          x: link.source.finalPos.x + link.source.nodeWidth,
          y: link.source.finalPos.y + link.source.nodeHeight
        },
        {
          x: link.source.finalPos.x,
          y: link.source.finalPos.y + link.source.nodeHeight
        }
      ];

      const cPoint = startNodeEdge.reduce((pre, edge, index) => {
        if (
          isCross(
            startNodeEdge[index],
            startNodeEdge[index === startNodeEdge.length - 1 ? 0 : index + 1],
            startPoint,
            endPoint
          )
        ) {
          return crossPoint(
            startNodeEdge[index],
            startNodeEdge[index === startNodeEdge.length - 1 ? 0 : index + 1],
            startPoint,
            endPoint
          );
        }
        return pre;
      }, null);

      // 向量长度
      const aDis = distance(endPoint, cPoint);

      // 计算箭头
      const b = (endPoint.x - cPoint.x) * aDis * bDis * 2 * angle;
      const a =
        (endPoint.x - cPoint.x) * (endPoint.x - cPoint.x) +
        (endPoint.y - cPoint.y) * (endPoint.y - cPoint.y);
      const c =
        angle * angle * aDis * aDis * bDis * bDis -
        (endPoint.y - cPoint.y) * (endPoint.y - cPoint.y) * bDis * bDis;

      const y1 = cPoint.y + (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      const x1 =
        (angle * aDis * bDis +
          ((-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a)) *
            (endPoint.x - cPoint.x)) /
          (endPoint.y - cPoint.y) +
        cPoint.x;

      const y2 = cPoint.y + (b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      const x2 =
        (((endPoint.x - cPoint.x) * (b - Math.sqrt(b * b - 4 * a * c))) /
          (2 * a) -
          angle * aDis * bDis) /
          (endPoint.y - cPoint.y) +
        cPoint.x;

      return [
        startPoint,
        cPoint,
        { x: x1, y: y1 },
        cPoint,
        { x: x2, y: y2 },
        cPoint,
        endPoint
      ];
    }

    if (isLast && !link.isReverse) {
      const endNodeEdge = [
        { x: link.target.finalPos.x, y: link.target.finalPos.y },
        {
          x: link.target.finalPos.x + link.target.nodeWidth,
          y: link.target.finalPos.y
        },
        {
          x: link.target.finalPos.x + link.target.nodeWidth,
          y: link.target.finalPos.y + link.target.nodeHeight
        },
        {
          x: link.target.finalPos.x,
          y: link.target.finalPos.y + link.target.nodeHeight
        }
      ];

      // 求焦点
      const cPoint = endNodeEdge.reduce((pre, edge, index) => {
        if (
          isCross(
            endNodeEdge[index],
            endNodeEdge[index === endNodeEdge.length - 1 ? 0 : index + 1],
            startPoint,
            endPoint
          )
        ) {
          return crossPoint(
            endNodeEdge[index],
            endNodeEdge[index === endNodeEdge.length - 1 ? 0 : index + 1],
            startPoint,
            endPoint
          );
        }
        return pre;
      }, null);

      // 向量长度
      const aDis = distance(startPoint, cPoint);

      // 计算箭头
      const b = (startPoint.x - cPoint.x) * aDis * bDis * 2 * angle;
      const a =
        (startPoint.x - cPoint.x) * (startPoint.x - cPoint.x) +
        (startPoint.y - cPoint.y) * (startPoint.y - cPoint.y);
      const c =
        angle * angle * aDis * aDis * bDis * bDis -
        (startPoint.y - cPoint.y) * (startPoint.y - cPoint.y) * bDis * bDis;

      const y1 = cPoint.y + (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      const x1 =
        (angle * aDis * bDis +
          ((-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a)) *
            (startPoint.x - cPoint.x)) /
          (startPoint.y - cPoint.y) +
        cPoint.x;

      const y2 = cPoint.y + (b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      const x2 =
        (((startPoint.x - cPoint.x) * (b - Math.sqrt(b * b - 4 * a * c))) /
          (2 * a) -
          angle * aDis * bDis) /
          (startPoint.y - cPoint.y) +
        cPoint.x;

      return [
        startPoint,
        cPoint,
        { x: x1, y: y1 },
        cPoint,
        { x: x2, y: y2 },
        cPoint,
        endPoint
      ];
    }

    return [startPoint, endPoint];
  }

  getSelfFinalPath(link: InternalUpGradeLink<Node, Relation>): Point[] {
    const x0 = link.source.finalPos.x + link.source.nodeWidth / 2;
    const y0 = link.source.finalPos.y + link.source.nodeHeight;
    const x1 = link.target.finalPos.x + link.source.nodeWidth / 2 - 30;
    const y1 = link.target.finalPos.y;

    return [
      { x: x0, y: y0 },
      { x: x0, y: y0 + 12 },
      { x: link.source.finalPos.x - 24, y: y0 + 12 },
      { x: link.source.finalPos.x - 24, y: y1 - 12 },
      { x: x1, y: y1 - 12 },
      { x: x1, y: y1 },
      { x: x1 - 3, y: y1 - 5 },
      { x: x1, y: y1 },
      { x: x1 + 3, y: y1 - 5 },
      { x: x1, y: y1 }
    ];
  }
}

export class Polyline<Node, Relation> {
  // 层级节点数据
  private nodesByLevel: InternalUpGradeNode<Node, Relation>[][];
  // 自环边
  private selfLinks: InternalUpGradeLink<Node, Relation>[];
  // 配置
  private config: DAGAIUConfig;
  // 水平线防止重合
  private turnYMap: Map<number, {
    /** 线的数量 */
    allLine: Array<InternalUpGradeLink<Node, Relation>>,
    /** 记录 */
    allRecord: Array<InternalUpGradeLink<Node, Relation>>
  }>;

  // 节点度的统计
  private nodeLinkByLevelSourceNodeCount: number[] = [];

  constructor(
    nodesByLevel: InternalUpGradeNode<Node, Relation>[][],
    selfLinks: InternalUpGradeLink<Node, Relation>[],
    config: DAGAIUConfig
  ) {
    this.nodesByLevel = nodesByLevel;
    this.selfLinks = selfLinks;
    this.config = config;
  }

  // 计算连线起始位置
  // 计算层级间距
  calcPosAndPadding() {
    this.nodesByLevel.forEach(nodelevel => {
      let count = -1;
      nodelevel.forEach(node => {
        if (node.sourceLinks && node.sourceLinks.length) {
          node.sourceNodeIndex = ++count;
        }

        // 是否存在自环的情况
        const selfLink = find(this.selfLinks, link => {
          return link.source.id === node.id;
        });

        // 当前 node 下游节点数
        const singleLevelSourceLinkCount = node.sourceLinks.filter(link => {
          return link.target.level - link.source.level === 1;
        }).length;
        // 当前 node 上游节点数
        const singleLevelTargetLinkCount = node.targetLinks.filter(link => {
          return link.target.level - link.source.level === 1;
        }).length;

        // 会形成环的边是特殊的情况，不能合并
        const singleLevelSourceLinks = node.sourceLinks
          .filter(link => {
            return link.target.level - link.source.level === 1;
          })
          .sort((alink, blink) => {
            return (
              alink.source.levelPos - blink.source.levelPos ||
              (alink.isReverse ? 1 : 0) - (blink.isReverse ? 1 : 0)
            );
          });

        const sourceCount =
          node.sourceLinks.filter(link => {
            return link.isReverse;
          }).length + 1;

        let index = 0;
        singleLevelSourceLinks.forEach(link => {
          if (link.isReverse) index++;
          link.sourcePos =
            (((index + 1) / (sourceCount + 1) - 0.5) * 0.6 + 0.5) *
            link.source.nodeWidth;
        });

        const singleLevelTargetLinks = node.targetLinks
          .filter(link => {
            return link.target.level - link.source.level === 1;
          })
          .sort((alink, blink) => {
            return (
              alink.source.levelPos - blink.source.levelPos ||
              (alink.isReverse ? 1 : 0) - (blink.isReverse ? 1 : 0)
            );
          });
        singleLevelTargetLinks.forEach((link, index) => {
          link.targetPos =
            (((index + 1) / (singleLevelTargetLinkCount + 1) - 0.5) * 0.6 +
              0.5) *
            link.target.nodeWidth;
        });

        if (selfLink) {
          selfLink.sourcePos =
            ((1 / (singleLevelSourceLinkCount + 2) - 0.5) * 0.6 + 0.5) *
            node.nodeWidth;
          selfLink.targetPos =
            ((1 / (singleLevelTargetLinkCount + 2) - 0.5) * 0.6 + 0.5) *
            node.nodeWidth;
        }
      });
      this.nodeLinkByLevelSourceNodeCount.push(count + 1);
    });

    const levelPaddings = [] as any[];
    // 每个层级的间距，index = 0，对应 0 ~ 1 层级的高度
    this.nodesByLevel.forEach((nodelevel, level) => {
      // 最后一层
      if (level === this.nodesByLevel.length - 1) {
        levelPaddings[level] = 0;
      } else {
        // 计算交叉，在这里把 turnY 计算完成，带在 link 里
        // Aone #17817948 source 与 target 完全不同的水平线的重合是不被允许的
        // 本质就是交叉的场景，@Todo 先采用一个简单的避免方案
        const turnYCount = this.getLevelTurnYIndex(level);
        levelPaddings[level] = Math.max(
          (turnYCount + 1) *
            this.config.paddingLineSpace,
          this.config.levelSpace
        );
      }
    });
    return levelPaddings;
  }

  // turnY 确定在哪个位置上
  getLevelTurnYIndex(level: number): number {
    let turnYCount = 0;
    const nodelevel = this.nodesByLevel[level];
    this.turnYMap = new Map();
    nodelevel.forEach((node, index) => {
      node.sourceLinks.forEach((link) => {
        // 值仅代表顺序
        let turnYValue = getRatio(
          link.source.sourceNodeIndex,
          this.nodeLinkByLevelSourceNodeCount[link.source.level]
        );
        if (this.turnYMap.has(turnYValue)) {
          const { allLine, allRecord } = this.turnYMap.get(turnYValue);
          if (!this.config._isLinkMerge && find(allRecord, (item) => {
            // 存在交叉，需要调整 turnY
            return (item.source.pos < link.source.pos
              && item.target.pos > link.target.pos)
              || (item.source.pos > link.source.pos
                && item.target.pos < link.target.pos);
          })) {
            // 遍历 allLine，查看是否有起点或是终点相同的节点，存在即 turnYValue 与其保持一致，没有的话，即 max turnYValue + 0.1
            let maxTurnYValue = -Infinity;
            let flag = false;
            for (let i = 0; i < allLine.length; i++) {
              const line = allLine[i];
              maxTurnYValue = Math.max(line.turnYValue, maxTurnYValue);
              if (line.source.id === link.source.id || line.target.id === link.target.id) {
                turnYValue = line.turnYValue;
                link.turnYValue = turnYValue;
                flag = true;
                break;
              }
            }
            if (!flag) {
              turnYValue = maxTurnYValue + 0.1;
              link.turnYValue = turnYValue;
              turnYCount++;
              allLine.push(link);
            }
          } else {
            link.turnYValue = turnYValue;
          }

          allRecord.push(link);
          this.turnYMap.set(turnYValue, {
            allLine,
            allRecord,
          });
        } else {
          turnYCount++;
          link.turnYValue = turnYValue;
          this.turnYMap.set(turnYValue, {
            allLine: [link],
            allRecord: [link],
          });
        }
      });
    });

    const valueArr: number[] = [...this.turnYMap.keys()].sort();
    nodelevel.forEach((node) => {
      node.sourceLinks.forEach((link) => {
        link.turnYIndex = valueArr.indexOf(link.turnYValue) + 1;
        link.turnYCount = turnYCount;
      });
    });
    return turnYCount;
  }

  getFinalPath(
    link: InternalUpGradeLink<Node, Relation>,
    levelPaddings: number[],
    isLast: boolean,
    isFirst: boolean
  ): Point[] {
    const x0 = link.source.finalPos.x + link.sourcePos;
    const y0 = link.source.finalPos.y + link.source.nodeHeight;
    const x1 = link.target.finalPos.x + link.targetPos;
    const y1 = link.target.finalPos.y;

    // 水平线位置，很重要
    let turnY = y0 + levelPaddings[link.source.level] * (link.turnYIndex / (link.turnYCount + 1));

    if (isLast && !link.isReverse) {
      return [
        { x: x0, y: y0 },
        { x: x0, y: turnY },
        { x: x1, y: turnY },
        { x: x1, y: y1 },
        { x: x1 - 3, y: y1 - 5 },
        { x: x1, y: y1 },
        { x: x1 + 3, y: y1 - 5 },
        { x: x1, y: y1 }
      ];
    }

    if (isFirst && link.isReverse) {
      return [
        { x: x1, y: y1 },
        { x: x1, y: turnY },
        { x: x0, y: turnY },
        { x: x0, y: y0 },
        { x: x0 + 3, y: y0 + 5 },
        { x: x0, y: y0 },
        { x: x0 - 3, y: y0 + 5 },
        { x: x0, y: y0 }
      ];
    }

    return [
      { x: x0, y: y0 },
      { x: x0, y: turnY },
      { x: x1, y: turnY },
      { x: x1, y: y1 }
    ];
  }

  getSelfFinalPath(link: InternalUpGradeLink<Node, Relation>): Point[] {
    const x0 = link.source.finalPos.x + link.sourcePos;
    const y0 = link.source.finalPos.y + link.source.nodeHeight;
    const x1 = link.target.finalPos.x + link.targetPos;
    const y1 = link.target.finalPos.y;

    return [
      { x: x0, y: y0 },
      { x: x0, y: y0 + 12 },
      { x: link.source.finalPos.x - 24, y: y0 + 12 },
      { x: link.source.finalPos.x - 24, y: y1 - 12 },
      { x: x1, y: y1 - 12 },
      { x: x1, y: y1 },
      { x: x1 - 3, y: y1 - 5 },
      { x: x1, y: y1 },
      { x: x1 + 3, y: y1 - 5 },
      { x: x1, y: y1 }
    ];
  }
}

function LinkGenerator(type: LinkType, DiyLine?: any) {
  switch (type) {
    case 'straightLine': {
      return StraightLine;
    }
    case 'polyline': {
      return Polyline;
    }
    case 'diy': {
      return DiyLine;
    }
  }
}

export default LinkGenerator;
