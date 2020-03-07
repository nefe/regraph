/**
 * @file 画布底层位置计算相关方法
 * @author perkinJ
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
  const ratio = detectZoom();
  const sourceX = sourcePoint.x * ratio;
  const targetX = targetPoint.x * ratio;

  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourcePoint.y + targetPoint.y) / 2;
  let tolerance = 30;

  const sub = targetPoint.y - sourcePoint.y;

  if (sub > -100 && sub < 100) {
    tolerance = Math.max(Math.abs(targetPoint.y - sourcePoint.y) / 2, 20);
  }

  return [
    'M',
    sourceX,
    sourcePoint.y,
    'Q',
    /** 横向与竖向有区别 */
    sourceX + tolerance,
    sourcePoint.y,
    centerX,
    centerY,
    'T',
    targetX - 6,
    targetPoint.y - 2,
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
 * 计算屏幕缩放比例
 */
export function detectZoom() {
  let ratio = window.outerWidth / window.innerWidth;
  const screen = window.screen;
  const ua = navigator.userAgent.toLowerCase();

  if (window.devicePixelRatio !== undefined) {
    // 由于mac retina屏幕devicePixelRatio会扩大2倍，这里mac统一用window.outerWidth / window.innerWidth表示ratio
    const isMac = /macintosh|mac os x/i.test(ua);

    ratio = isMac ? window.outerWidth / window.innerWidth : window.devicePixelRatio;
  } else if (ua.indexOf('msie') > -1) {
    if ((screen as any).deviceXDPI && (screen as any).logicalXDPI) {
      ratio = (screen as any).deviceXDPI / (screen as any).logicalXDPI;
    }
  } else if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
    ratio = window.outerWidth / window.innerWidth;
  }

  if (ratio) {
    ratio = Math.round(ratio * 100) / 100;
  }

  return ratio;
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
