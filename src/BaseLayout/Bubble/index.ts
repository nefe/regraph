/**
* @description Bubble Tree
*/

import { Matrix, LinkInfo, Interval} from './define';
import { getControlPoint,distance } from '../../Utils/graph';
import { BaseEdge, Edge  } from '../../type';

import * as _ from 'lodash';

function calcRadius(maxRadius: number, maxSize: number, minSize: number) {
  if (maxSize === minSize) {
    return () => {
      return maxRadius;
    };
  }
  const minRadius = maxRadius * 0.7;
  const k = (maxSize - minSize) / (maxRadius - minRadius);
  const b = minSize - minRadius * k;
  return (size:number) => {
    return (size - b) / k;
  };
};

function randomNumber(start: number, end: number) {
  return Math.random() * (end - start) + start;
};

class defaultProps {
  data: any;
  width:  number;
  height: number;
  rowCount: number;
  minSize: number;
  maxSize: number;
}

export class Bubble < E extends BaseEdge>{
  // 数据
  private data:any;
  // Bubble模型矩阵
  private matrix: Matrix[] = [];
  // Bubble模型行矩阵
  private matrixRows:Interval[] = [];
  // Bubble模型列矩阵
  private matrixColumns:Interval[] = [];
  // 每一行的高度
  private heightInterval:number;
  // 每一列的宽度
  private widthInterval:number;
  // 行的个数
  private rowCount: number;
  // 列的个数
  private columnCount:number;
  // TODO: 待去除
  // 圆的最大值
  private maxSize:number;
  // 圆的最小值
  private minSize: number;
  // 边
  private edges:Array<Edge<E> & {bothway:boolean}> = [];
  
  constructor({
    data,
    width,
    height,
    rowCount,
    minSize,
    maxSize
  } : defaultProps) {
    // 初始化
    this.init(data,width,height,rowCount,maxSize,minSize);
  }
  private init(data:any, width:number, height:number, rowCount:number, maxSize:number, minSize:number){
    this.data = data;

    this.rowCount = rowCount;
    this.maxSize = maxSize;
    this.minSize = minSize;
    this.columnCount = Math.ceil((data || []).length / rowCount);
    // 每一行的高度
    this.heightInterval = height / rowCount;
    // 每一列的宽度
    this.widthInterval = width / this.columnCount;
   
    // 将画布分割为[row,column]的矩阵
    for (let i = 0; i < rowCount; i++) {
      this.matrixRows.push({ l: i * this.heightInterval , r: (i + 1) * this.heightInterval  });
    }
  
    for (let i = 0; i < this.columnCount; i++) {
      this.matrixColumns.push({ l: i * this.widthInterval, r: (i + 1) * this.widthInterval });
    }
  }

  // 获取节点数据
  public getNodes(): Matrix[]{
    const radiusF = calcRadius(_.min([this.heightInterval  / 2, this.widthInterval / 2]) * 0.9, this.maxSize, this.minSize);
  
    const nodes = (this.data || []).map((node:any) => {
      // 根据权重分配半径
      const radius = radiusF(node.value);
      return {
        id: String(node.id),
        name: node.name,
        value: node.value,
        radius
      };
    });
  
    const allCount = this.rowCount * this.columnCount;
    const countList = Object.keys(Array.from({ length: allCount }))
      .map(item => {
        return +item;
      })
      .sort((a, b) => {
        return Math.random() > 0.5 ? -1 : 1;
      });
    const matrix: Matrix[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const rowIndex = Math.floor(countList[i] / this.columnCount);
      const columnIndex = countList[i] % this.columnCount;
      const radius = nodes[i].radius;
      /** 存在风险，直径长度超过interval时，依赖手动设置行数rowCount */
      const randomX = randomNumber(
        this.matrixColumns[columnIndex].l + radius,
        this.matrixColumns[columnIndex].r - radius
      );
      const randomY = randomNumber(
        this.matrixRows[rowIndex].l + radius,
        this.matrixRows[rowIndex].r - radius
      );
  
      // 标签采用四分位模型
      matrix.push({
        node: nodes[i],
        rowIndex,
        columnIndex,
        widthRange: this.matrixColumns[columnIndex],
        heightRange: this.matrixRows[rowIndex],
        center: {
          x: randomX,
          y: randomY
        },
        radius
      });
    }
    this.matrix = matrix;
    return matrix;
  }
  // 获取边数据
  public getLinks(): LinkInfo[]{
    const dupliEdges = _.flatten(
      (this.data || []).map((edge:any) => {
        return (edge.siblings || []).map((end:any) => ({
          u: String(edge.id),
          v: String(end.id),
          bothway: false
        }));
      })
    );
    dupliEdges.forEach((item: Edge<E> & {bothway:boolean}) => {
      const edge = _.find(this.edges, o => o.u === item.v && o.v === item.u);
      if (!edge) {
        this.edges.push(item);
      } else {
        edge.bothway = true;
      }
    });
    // Bubble模型边信息
    const link: LinkInfo[] = [];
    this.edges.forEach((edge: Edge<E> & {bothway:boolean}) => {
      const { u, v, bothway } = edge;
      const startNode = _.find(this.matrix, (item: Matrix) => {
        return String(item.node.id) === String(u);
      });
      const initStartPoint = startNode.center;
      const endNode = _.find(this.matrix, item => {
        return String(item.node.id) === String(v);
      });
      const initEndPoint = endNode.center;
  
      const initControlPoint = getControlPoint(initStartPoint, initEndPoint, 0.2, 1);
      const startDis = distance(initStartPoint, initControlPoint);
      const startPoint = {
        x: initStartPoint.x + (initControlPoint.x - initStartPoint.x) * (startNode.radius / startDis),
        y: initStartPoint.y + (initControlPoint.y - initStartPoint.y) * (startNode.radius / startDis)
      };
      const endDis = distance(initControlPoint, initEndPoint);
      const endPoint = {
        x: initEndPoint.x + (initControlPoint.x - initEndPoint.x) * (endNode.radius / endDis),
        y: initEndPoint.y + (initControlPoint.y - initEndPoint.y) * (endNode.radius / endDis)
      };
  
      const linkInfo: LinkInfo = {
        start: startPoint,
        end: endPoint,
        control: getControlPoint(startPoint, endPoint, 0.15, 1),
        u,
        v,
        bothway
      };
      link.push(linkInfo);
    });
    return link;
  }
  // 绘制得到节点和连线信息
  public graph(): {
    nodes: Matrix[],
    links: LinkInfo[],
  }{
   const nodes = this.getNodes();
   const links = this.getLinks();
   return {
    nodes,
    links
   }
  }
}


export { Matrix, LinkInfo};