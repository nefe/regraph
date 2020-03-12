/**
 * @description 公共定义
 */

export class Interval {
  l: number;
  r: number;
}

export class Point {
  x: number;
  y: number;
}

export class Node {
  id: string;
  radius?: number;
  value: string;
  name: string;
  siblings?: Node[];
}

export class Matrix {
  node: Node;
  widthRange: Interval;
  heightRange: Interval;
  center: Point;
  radius: number;
  rowIndex: number;
  columnIndex: number;
}

export class LinkInfo {
  start: Point;
  end: Point;
  control: Point;
  u: string;
  v: string;
  bothway: boolean;
}

export class Edge {
  u: string;
  v: string;
  bothway: boolean;
}

