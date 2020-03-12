/**
 * @file 统一图方法
 */

export class Point {
  x: number;
  y: number;
}

/** 
 * 节点叉积 p2-p1 * p3-p1
 */
export function crossProduct(p1: Point, p2: Point, p3: Point) {
  const x1 = p2.x - p1.x;
  const y1 = p2.y - p1.y;
  const x2 = p3.x - p1.x;
  const y2 = p3.y - p1.y;
  return x1 * y2 - x2 * y1;
}

/** 求线段与线段间的交点(p1,p2)、(p3,p4) */
export function crossPoint(p1: Point, p2: Point, p3: Point, p4: Point): Point {
  const area1 = crossProduct(p3, p2, p1);
  const area2 = crossProduct(p4, p1, p2);
  const ansx = (p3.x * area2 + p4.x * area1) / (area2 + area1);
  const ansy = (p3.y * area2 + p4.y * area1) / (area2 + area1);
  return {
    x: ansx,
    y: ansy,
  };
}

const ZERO = 1e-9;

export function isCross(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  // (vector_product(AC, AD) * vector_product(BC, BD) <= ZERO) 
  // and(vector_product(CA, CB) * vector_product(DA, DB) <= ZERO)
  if (crossProduct(p1, p3, p4) * crossProduct(p2, p3, p4) <= ZERO
    && crossProduct(p3, p1, p2) * crossProduct(p4, p1, p2) <= ZERO) {
    return true;
  }
  return false;
}

/**
 * 获取两点间的距离
 * @param p1 点1
 * @param p2 点2
 */
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

/**
 * 获取二次贝塞尔曲线的控制点
 * @param from 起点坐标
 * @param to 终点坐标
 */
export const getControlPoint = (from: Point, to: Point, ratio: number, direct = 1): Point => {
  const { x: x1, y: y1 } = from;
  const { x: x2, y: y2 } = to;
  // 中点的横坐标
  const midX = (x1 + x2) / 2;
  // 中点的纵坐标
  const midY = (y1 + y2) / 2;

  if (x1 === x2 && y1 === y2) {
    // 起点和终点重合
    return {
      x: x1,
      y: y2,
    };
  } else if (x1 === x2) {
    // 起点和终点的横坐标相同
    return {
      x: x1 - ratio * Math.abs(y2 - y1),
      y: midY,
    };
  } else if (y1 === y2) {
    // 起点和终点的纵坐标相同
    return {
      x: midX,
      y: y1 + ratio * Math.abs(x2 - x1),
    };
  }

  // 法线的斜率，经过中点的垂直平分线方程 y = normalSlope * (x - midX) + midY
  const normalSlope = -(x2 - x1) / (y2 - y1);
  // 控制点和中点的线段长度
  const delta = ratio * Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  const deltaX = -Math.sign(normalSlope) * delta / Math.sqrt(1 + Math.pow(normalSlope, 2));

  return {
    x: midX + direct * deltaX,
    y: midY + direct * normalSlope * deltaX
  };
};

/**
 * 两点间曲线
 * @param sourcePoint
 * @param targetPoint
 */
export const quadratic = (sourcePoint: Point, targetPoint: Point): string => {
  const centerX = (sourcePoint.x + targetPoint.x) / 2;
  const centerY = (sourcePoint.y + targetPoint.y) / 2;
  let tolerance = 50;

  const sub = targetPoint.y - sourcePoint.y;

  if (sub > -100 && sub < 100) {
    tolerance = Math.max(Math.abs(targetPoint.y - sourcePoint.y) / 2, 30);
  }

  return [
    'M',
    sourcePoint.x,
    sourcePoint.y,
    'Q',
    sourcePoint.x,
    sourcePoint.y + tolerance,
    centerX,
    centerY,
    'T',
    targetPoint.x,
    targetPoint.y
  ].join(' ');
};

/**
 * 求向量夹角
 * @param op1 向量1
 * @param op2 向量2
 */
export const vectorAngle = (o: Point, p1: Point, p2: Point): number => {
  // 向量1
  const va = {
    x: p1.x - o.x,
    y: p1.y - o.y,
  }
  // 向量2
  const vb = {
    x: p2.x - o.x,
    y: p2.y - o.y,
  }

  // 向量的乘积
  const va_vb = (va.x * vb.x) + (va.y * vb.y);
  // 向量a的模
  const va_val = Math.sqrt(va.x * va.x + va.y * va.y);
  // 向量b的模
  const vb_val = Math.sqrt(vb.x * vb.x + vb.y * vb.y);
  // 余弦值
  const cosValue = va_vb / (va_val * vb_val);

  return Math.acos(cosValue) / Math.PI * 180;
}