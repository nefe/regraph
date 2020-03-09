import { InternalUpGradeNode } from './types';

// 对于 sortNodelevel 进行排序按照 _median 排序，排序结果存储于 _levelPos，对于 -1 不改变位置(levelPos)
function sortNodelevel<T extends {
  _median?: number; // 中位数结果
  levelPos?: number; // 目前位置
  _levelPos?: number; // 临时位置
}>(nodelevel: T[]): T[] {
  const noChangeList: T[] = [];
  const internalNodeLevel = nodelevel.filter(node => {
    if (node._median === -1) {
      noChangeList.push(node);
    }
    return node._median !== -1;
  });

  internalNodeLevel.sort((node1, node2) => {
    return node1._median - node2._median;
  });

  noChangeList.sort((node1, node2) => {
    return node1.levelPos - node2.levelPos;
  });

  noChangeList.forEach(node => {
    const pos = node.levelPos;
    internalNodeLevel.splice(pos, 0, node);
  });

  internalNodeLevel.forEach((node, i) => node._levelPos = i);
  return internalNodeLevel;
}

/* 计算两个层级间边交叉数量
 * 上游节点可能没有下游，但下游一定有上游
 * Simple and Efficient Bilayer Cross Counting
 * 一种优化方式，通过树状数组来降低求解复杂度
 */
function crossing<ON, OL>(
  upNodes: InternalUpGradeNode<ON, OL>[],
  downNodes: InternalUpGradeNode<ON, OL>[]
): number {
  const pieNodeList: InternalUpGradeNode<ON, OL>[] = [];
  // 遍历上游节点，获取所有与下一相邻层极的联通边、
  upNodes.forEach(node => {
    // 同一个节点的下游节点，需要按照 _levelPos 来排序
    node.sourceLinks.sort((link1, link2) => {
      return link1.target._levelPos - link2.target._levelPos;
    });
    node.sourceLinks.forEach(link => {
      if (link.target.level - link.source.level === 1) {
        pieNodeList.push(link.target);
      }
    });
  });
  const q = downNodes.length;
  let firstIndex = 1;
  while (firstIndex < q) firstIndex *= 2;
  const treesize = 2 * firstIndex - 1;
  firstIndex -= 1;
  const tree = (new Array(treesize)).fill(0);

  let crossCount = 0;
  pieNodeList.map(node => {
    let index = node._levelPos + firstIndex;
    tree[index]++;
    while (index > 0) {
      if (index % 2) crossCount += tree[index + 1];
      index = Math.floor((index - 1) / 2);
      tree[index]++;
    }
  });
  return crossCount;
}

function getRatio(idx: number, length: number) {
  const range = [0, 1];
  const count = Math.ceil(length / 2) + 1;
  const interval = (range[1] - range[0]) / count;
  // 存在中位数的情况
  if (length % 2 === 1) {
    const median = (length - 1) / 2;
    return interval * (Math.abs(median - idx) + 1)
  }
  const median = [length / 2 - 1, length / 2];
  if (idx <= median[0]) {
    return interval * (Math.abs(median[0] - idx) + 1);
  }
  return interval * (Math.abs(median[1] - idx) + 1);
}

export {
  getRatio,
  sortNodelevel,
  crossing,
}