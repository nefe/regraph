/**
 * @file 节点，边搜索方法
 * @author perkinJ
 */

import * as _ from 'lodash';
import { Node, Link } from '../defines';
import { distance } from './calc';
import { Point } from './types';
/**
 * 查找单个上游组件
 */
export const findUpstreamNode = (id: string, nodes: Node[], links: Link[]) => {
  const selectedLinks = _.find(links, item => item.target === id);
  if (selectedLinks) {
    const upstreamComponent = _.find(nodes, item => item.id === selectedLinks.source, null);
    return upstreamComponent;
  }
};

/**
 * 查找单个下游组件
 */
export const findDownstreamNode = (id: string, nodes: Node[], links: Link[]) => {
  const selectedLinks = _.find(links, item => item.source === id);
  if (selectedLinks) {
    const downstreamComponent = _.find(nodes, item => item.id === selectedLinks.target, null);
    return downstreamComponent;
  }
};

/** 搜索当前组件的所有的下游组件 */
export const findAllDownstreamNodes = (id: string, nodes: Node[], links: Link[]) => {
  const selectedLinks = _.filter(links, item => item.source === id);
  if (Array.isArray(selectedLinks) && selectedLinks.length > 0) {
    const downstreamComponent = selectedLinks.map(link => _.find(nodes, item => item.id === link.target));
    return downstreamComponent;
  }
  return [];
};

/** 搜索所有的上游组件 */
export const findAllUpstreamNodes = (id: string, nodes: Node[], links: Link[]) => {
  const selectedLinks = _.filter(links, item => item.target === id);
  if (selectedLinks) {
    const upstreamComponent = _.filter(nodes, item => item.id === selectedLinks[0].source);
    return upstreamComponent;
  }
  return [];
};

/** 搜索当前组件的所有上游连线 */
export const findAllUptreamLinks = (id: string, links: Link[]) => {
  const newLinks = _.filter(links, item => item.target === id);
  return newLinks;
};

/** 搜索当前组件的所有下游连线 */
export const findAllDownstreamLinks = (id: string, links: Link[]) => {
  const newLinks = _.filter(links, item => item.source === id);
  return newLinks;
};

/**
 * @desc 查找靠近某个点最近的节点，用于连线
 * @param point 点的坐标
 * @param nodes 节点
 * @param range 最大范围
 */
export const findNearbyNode = (point: Point, nodes: Node[], range: number) => {
  let targetNode: Node = null;
  let minDis = Infinity;
  let targetPos = '';

  nodes.forEach(v => {
    // 1. 比较4个点离初始点最近的点
    let minDistance = Infinity;
    ['left', 'right', 'top', 'bottom'].forEach(item => {
      let targetX;
      let targetY;
      if (item === 'left') {
        targetX = v.x;
        targetY = v.y + v.height / 2;
      } else if (item === 'right') {
        targetX = v.x + v.width;
        targetY = v.y + v.height / 2;
      } else if (item === 'top') {
        targetX = v.x + v.width / 2;
        targetY = v.y;
      } else if (item === 'bottom') {
        targetX = v.x + v.width / 2;
        targetY = v.y + v.height;
      }

      minDistance = distance(
        {
          x: point.x,
          y: point.y
        },
        {
          x: targetX,
          y: targetY
        }
      );

      if (minDis > minDistance) {
        minDis = minDistance;
        targetNode = v;
        targetPos = item;
      }
    });
  });

  if (minDis <= range) {
    return { targetNode, targetPos };
  }
  return null;
};
