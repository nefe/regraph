/**
 * @file 画布底层位置计算相关方法
 * @author 剑决(perkin.pj)
 */

import * as _ from 'lodash';
import { Point, Shape, ShapeProps } from './types';
/**
 * 两点间直线距离
 * @param sourcePoint
 * @param targetPoint
 */
export function distance(sourcePoint: Point, targetPoint: Point) {
  const x = sourcePoint.x - targetPoint.x;
  const y = sourcePoint.y - targetPoint.y;
  return Math.sqrt(x * x + y * y);
}

/**
 * 两点间曲线
 * @param sourcePoint
 * @param targetPoint
 */
export const quadratic = (sourcePoint: Point, targetPoint: Point): string => {
  const centerX = (sourcePoint.x + targetPoint.x) / 2;
  const centerY = (sourcePoint.y + targetPoint.y) / 2;
  let tolerance = 30;

  const sub = targetPoint.y - sourcePoint.y;

  if (sub > -100 && sub < 100) {
    tolerance = Math.max(Math.abs(targetPoint.y - sourcePoint.y) / 2, 20);
  }

  return [
    'M',
    sourcePoint.x,
    sourcePoint.y,
    'Q',
    /** 横向与竖向有区别 */
    sourcePoint.x + tolerance,
    sourcePoint.y,
    centerX,
    centerY,
    'T',
    targetPoint.x - 6,
    targetPoint.y - 2
  ].join(' ');
};

/**
 * 计算连线的位置
 * @param node 与线相连的节点
 */
export function calcLinkPosition(node, position) {
  let x = node.x + node.width;
  let y = node.y + node.height / 2;
  if (position === 'left') {
    x = node.x;
    y = node.y + node.height / 2;
  } else if (position === 'right') {
    x = node.x + node.width;
    y = node.y + node.height / 2;
  } else if (position === 'top') {
    x = node.x + node.width / 2;
    y = node.y;
  } else if (position === 'bottom') {
    x = node.x + node.width / 2;
    y = node.y + node.height;
  }

  return {
    x,
    y
  };
}

/**
 * 获取元素相对于页面的绝对位置
 */
export function getOffset(domNode: any) {
  let offsetTop = 0;
  let offsetLeft = 0;
  let targetDomNode = domNode;
  while (targetDomNode !== window.document.body && targetDomNode != null) {
    offsetLeft += targetDomNode.offsetLeft;
    offsetTop += targetDomNode.offsetTop;
    targetDomNode = targetDomNode.offsetParent;
  }
  return {
    offsetTop,
    offsetLeft
  };
}

/** 获取元素在页面上占据的高度 */
export function getHeight(dom: HTMLElement) {
  if (!dom) {
    return 0;
  }
  const style = window.getComputedStyle(dom);
  return (
    dom.getBoundingClientRect().height +
    Number(style.marginTop.match(/\d+/g)) +
    Number(style.marginBottom.match(/\d+/g))
  );
}

// 获取元素在页面上占据的宽度
export function getWidth(dom: HTMLElement) {
  if (!dom) {
    return 0;
  }
  const style = window.getComputedStyle(dom);
  return (
    dom.getBoundingClientRect().width + Number(style.marginLeft.match(/\d+/g)) + Number(style.marginRight.match(/\d+/g))
  );
}

// 处理不同图形的path数据
export function handlePathData(shape: Shape, shapeProps: ShapeProps): string {
  const { x, y, width, height, direction } = shapeProps;
  let pathData = '';
  if (shape === 'rect') {
    pathData = `M${x} ${y} h ${width} v ${height} h -${width} Z`;
    if (direction === 'right') {
      pathData = `M${x} ${y} h -${width} v -${height} h ${width} Z`;
    }
  }
  return pathData;
}
