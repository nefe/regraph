/**
 * @file 公共类型定义文件
 * @author perkinJ
 */

// 连接符
export const CONNECTOR = '_';

// 点坐标
export class Point {
  x: number;

  y: number;
}

// 节点支持的形状
export type Shape = 'rect' | 'circle' | 'ellipse' | 'poly';

// 方向
export type Direction = 'left' | 'right';

// 圈选器节点属性
export class ShapeProps {
  x: number;

  y: number;

  width: number;

  height: number;

  direction: Direction;
}

// 通用svg元素样式
export class StyleProps {
  /** 填充色 */
  fill?: string;

  /** 边框宽度 */
  strokeWidth?: number;

  /** 颜色 */
  stroke?: string;

  /** 虚线间隔 */
  strokeDasharray?: string;
}
