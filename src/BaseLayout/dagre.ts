import * as dagre from 'dagre';

import { Vertex, BaseVertex, Edge, BaseEdge, VertexGroup } from '../type';
import { Point } from '../Utils/graph';
import { find, findIndex } from '../Utils/utils';
import { BaseGroupLayout } from './base';

export interface LayoutVertex extends BaseVertex {
  name?: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMount?: boolean;
  opacity?: number;

  widthPath?: number[];
  heightPath?: number[];
  xPath?: number[];
  yPath?: number[];
  opacityPath?: number[];
}

export interface LayoutGroupVertex extends BaseVertex {
  name: string;
  expand: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  isMount?: boolean;
  opacity?: number;

  widthPath?: number[];
  heightPath?: number[];
  xPath?: number[];
  yPath?: number[];
  opacityPath?: number[];
}

export interface LayoutEdge extends BaseEdge {
  points?: Point[];
  isMount?: boolean;
  opacity?: number;

  opacityPath?: number[];
}

/**
 * 普通图布局
 */
export class GraphLayout<
  N extends LayoutVertex,
  NL extends LayoutEdge
> extends BaseGroupLayout<N, NL, any> {
  config: dagre.GraphLabel;

  constructor(
    /** 节点 */
    nodes: Array<Vertex<N>>,
    /** 节点连线 */
    links: Array<Edge<NL>>,
    /** 图配置 */
    config: dagre.GraphLabel
  ) {
    super();
    this.nodes = this.getNodes(nodes);
    this.links = links;
    this.config = config;
    this.init();
  }

  init() {
    this.g = new dagre.graphlib.Graph();
    // 配置
    this.g.setGraph(this.config);
    // Default to assigning a new object as a label for each new edge.
    this.g.setDefaultEdgeLabel(function() {
      return {};
    });
  }

  layout(): {
    nodes: Vertex<N>[];
    links: Edge<NL>[];
  } {
    this.nodes.forEach(node => {
      const { id, width, height } = node;
      this.g.setNode(id, { id, width, height });
    });

    this.links.forEach(link => {
      const { u, v } = link;
      this.g.setEdge(u, v);
    });

    dagre.layout(this.g);

    return {
      nodes: this.nodes.map(node => {
        const { x, y } = this.g.node(node.id);
        return {
          ...(node as object),
          x,
          y
        } as N;
      }),
      links: this.links.map(link => {
        const { points } = this.g.edge({
          v: link.u,
          w: link.v
        });
        return {
          ...(link as object),
          u: link.u,
          v: link.v,
          points
        } as NL;
      })
    };
  }
}

interface GroupConfig {
  /** dagre 配置 */
  dagreConfig: dagre.GraphLabel;
  /** 组宽度 */
  defaultGroupWidth: number;
  /** 组高度 */
  defaultGroupHeight: number;
  /** group padding */
  groupPadding: number[];
}

/**
 * 带组布局
 */
export class GroupGraphLayout<
  N extends LayoutVertex,
  NL extends LayoutEdge,
  G extends LayoutGroupVertex,
  GL extends LayoutEdge
> extends BaseGroupLayout<N, NL, G> {
  groupLinks: Edge<GL>[];
  groupNodeMap: Map<string, VertexGroup<N, G>>;
  groupLinkMap: Map<string, NL[]>;
  config: GroupConfig;
  /** 渲染结果 */
  renderGroups: VertexGroup<N, G>[] = [];
  renderNodes: Vertex<N>[] = [];
  renderNodeLinks: Edge<NL>[] = [];
  renderGroupLinks: Edge<NL & {
    uGroupId: string;
    vGroupId: string;
    groupPoints: [Point[], Point[], Point[]]
  }>[] = [];
  preRenderGroups: VertexGroup<N, G>[] = [];
  preRenderNodes: Vertex<N>[] = [];
  preRenderNodeLinks: Edge<NL>[] = [];
  preRenderGroupLinks: Edge<NL & {
    uGroupId: string;
    vGroupId: string;
    groupPoints: [Point[], Point[], Point[]]
  }>[] = [];

  constructor(
    /** 节点 */
    nodes: Array<Vertex<N>>,
    /** 节点连线 */
    links: Array<Edge<NL>>,
    /** 组 */
    groups: Array<VertexGroup<N, G>>,
    /** 组连线 */
    groupLinks: Array<Edge<GL>>,
    /** 图配置 */
    config: GroupConfig
  ) {
    super();
    this.init(nodes, links, groups, groupLinks, config);
  }

  init(
    /** 节点 */
    nodes: Array<Vertex<N>>,
    /** 节点连线 */
    links: Array<Edge<NL>>,
    /** 组 */
    groups: Array<VertexGroup<N, G>>,
    /** 组连线 */
    groupLinks: Array<Edge<GL>>,
    /** 图配置 */
    config: GroupConfig
  ) {
    // node 与 group 要保证顺序稳定，这样布局才能稳定
    this.nodes = this.getNodes(nodes);
    this.links = links;
    this.groups = this.getGroups(groups);
    this.groupLinks = groupLinks;
    this.config = config;
    // 生成组与点的对应关系
    this.groupNodeMap = new Map();
    this.groupLinkMap = new Map();

    this.getGroupNodeMap();
  }

  getGroupNodeMap() {
    this.groups.forEach(group => {
      group.vertexes.forEach(vertex => {
        this.groupNodeMap.set(vertex.id, group);
      });
    });
  }

  getDownGroup(groupId: string): Array<VertexGroup<N, G>> {
    return this.groupLinks
      .filter(link => {
        return link.u === groupId;
      })
      .map(link => {
        const { v } = link;
        return find(this.groups, group => {
          return group.id === v;
        });
      });
  }

  /** 处理一个 group 与其下游组及组内节点连通 */
  processGroupConnect(g: dagre.graphlib.Graph, groupId: string, nodeId: string = '', forceNoExpand: boolean = false) {
    const downGroups = this.getDownGroup(groupId);
    const connectId = nodeId || groupId;
    downGroups.forEach(downGroup => {
      if (downGroup.vertexes.length === 1) {
        g.setEdge(connectId, downGroup.vertexes[0].id);
      } else if (downGroup.expand && !forceNoExpand) {
        // 展开就相关节点相连
        const downGroupNodeIds = downGroup.vertexes.map(vertex => vertex.id);
        this.links
          .filter(link => {
            return link.u === connectId && downGroupNodeIds.includes(link.v);
          })
          .forEach(link => {
            g.setEdge(link.u, link.v);
          });
      } else {
        // 未展开就两个 group 相连
        g.setEdge(connectId, downGroup.id);
      }
    });
  }

  getLayoutInGroup(group: VertexGroup<N, G>) {
    const g = new dagre.graphlib.Graph();
    // 配置
    g.setGraph(this.config.dagreConfig);
    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(function() {
      return {};
    });

    const groupNodeIds = group.vertexes.map(vertex => vertex.id);
    const links: Edge<NL>[] = [];
    groupNodeIds.forEach(nodeId => {
      const node = find(this.nodes, n => {
        return n.id === nodeId;
      });
      g.setNode(nodeId, {
        id: nodeId,
        width: node.width,
        height: node.height
      });

      // 组内节点连接
      this.links
        .filter(link => {
          if (link.u === nodeId && this.groupNodeMap.has(link.v)) {
            const nodeGroup = this.groupNodeMap.get(link.v);
            return nodeGroup.id === group.id;
          }
          return false;
        })
        .forEach(link => {
          links.push(link);
          g.setEdge(nodeId, link.v);
        });
    });

    dagre.layout(g);

    return {
      vertexes: group.vertexes.map(vertex => {
        if (g.hasNode(vertex.id)) {
          const { x, y, width, height } = g.node(vertex.id);
          return {
            ...(vertex as object),
            x,
            y,
            width,
            height
          } as N;
        }
        return vertex;
      }),
      edges: links.map(link => {
        const { points } = g.edge({
          v: link.u,
          w: link.v
        });
        return {
          ...(link as object),
          u: link.u,
          v: link.v,
          points
        } as NL;
      })
    };
  }

  /**
   * 先获取 Group 的大小，以及 Group 中 node 在 Group 中的位置
   */
  getGroupSize() {
    const { groupPadding } = this.config;

    this.groups = this.groups.map(group => {
      // 当组内只有一个节点时，直接显示节点，没有展开关闭状态
      // 对于展开的组的内部节点进行布局
      if (group.vertexes.length !== 1 && group.expand) {
        let maxChildX = -Infinity;
        let maxChildY = -Infinity;
        let minChildX = Infinity;
        let minChildY = Infinity;

        const { vertexes, edges } = this.getLayoutInGroup(group);

        vertexes.forEach(vertex => {
          const { x, y, width, height } = vertex;

          if (maxChildX < x + width / 2 + groupPadding[1]) {
            maxChildX = x + width / 2 + groupPadding[1];
          }
          if (maxChildY < y + height / 2 + groupPadding[2]) {
            maxChildY = y + height / 2 + groupPadding[2];
          }
          if (minChildX > x - width / 2 - groupPadding[3]) {
            minChildX = x - width / 2 - groupPadding[3];
          }
          if (minChildY > y - height / 2 - groupPadding[0]) {
            minChildY = y - height / 2 - groupPadding[0];
          }
        });

        const links: NL[] = edges.map(edge => {
          const points = edge.points.map(point => {
            return { x: point.x - minChildX, y: point.y - minChildY };
          });

          return {
            ...(edge as object),
            points
          } as NL;
        });

        this.groupLinkMap.set(group.id, links);

        const groupWidth = maxChildX - minChildX;
        const groupHeight = maxChildY - minChildY;

        return {
          ...(group as object),
          width: groupWidth,
          height: groupHeight,
          vertexes: vertexes.map(vertex => {
            const { x, y, width, height } = vertex;
            return {
              ...(vertex as object),
              x: x - width / 2 - minChildX,
              y: y - height / 2 - minChildY
            } as N;
          })
        } as VertexGroup<N, G>;
      }

      return group;
    });
  }

  /**
   * 对 group 进行布局
   */
  groupLayout() {
    const nodeLinks: NL[] = [];
    const g = new dagre.graphlib.Graph({});
    // 配置
    g.setGraph(this.config.dagreConfig);
    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(function() {
      return {};
    });

    this.groups.forEach(group => {
      const groupId = group.id;
      if (group.vertexes.length === 1) {
        // 当组内只有一个节点时，直接显示节点，没有展开关闭状态
        const { id, width, height } = group.vertexes[0];
        g.setNode(String(id), { id, width, height });
        this.processGroupConnect(g, groupId, String(id), true);
      } else if (!group.expand) {
        // 没有展开，取组的默认宽高
        g.setNode(groupId, {
          id: groupId,
          width: this.config.defaultGroupWidth,
          height: this.config.defaultGroupHeight
        });
        this.processGroupConnect(g, groupId, '', true);
      } else {
        g.setNode(groupId, {
          id: groupId,
          width: group.width,
          height: group.height
        });
        this.processGroupConnect(g, groupId, '', true);
      }
    });

    dagre.layout(g);

    this.groups = this.groups.map(group => {
      const groupId = group.id;
      if (g.hasNode(group.id)) {
        const { x, y, width, height } = g.node(groupId);

        const vertexes = group.vertexes.map(vertex => {
          return {
            ...(vertex as object),
            x: x - width / 2 + vertex.x + vertex.width / 2,
            y: y - height / 2 + vertex.y + vertex.height / 2
          } as Vertex<N>;
        });

        const edges = this.groupLinkMap.get(groupId) || [];

        edges.forEach(edge => {
          const points = edge.points.map(point => {
            return {
              x: point.x + (x - width / 2),
              y: point.y + (y - height / 2)
            };
          });

          nodeLinks.push({
            ...(edge as object),
            points
          } as NL);
        });

        return {
          ...(group as object),
          x,
          y,
          vertexes
        } as VertexGroup<N, G>;
      }

      return {
        ...(group as object),
        vertexes: group.vertexes.map(vertex => {
          if (g.hasNode(vertex.id)) {
            const { x, y } = g.node(vertex.id);
            return {
              ...(vertex as object),
              x,
              y
            };
          }
          return vertex;
        })
      } as VertexGroup<N, G>;
    });

    const nodes = this.groups.reduce((pre, cur) => {
      if (cur.expand || cur.vertexes.length === 1) {
        return [...pre, ...cur.vertexes];
      }
      return pre;
    }, []);
    this.getGroupNodeMap();

    // 先绘制组与组之间的连线，然后在根据组与组之间的连线来绘制节点与节点之间的连线
    // 一个组与一个组之间，最多只有一条连线，如果一个组内有多条线到另一个组，需要在组内合并

    // 确定组与组之间的连线路径，同时确定组的点位
    this.groupLinks = this.groupLinks.map(groupLink => {
      const { u, v } = groupLink;

      // 第二段起始点
      let startPoint: Point;
      // 第二段终止点
      let endPoint: Point;

      const uGroup = find(this.groups, (group) => group.id === u);
      const vGroup = find(this.groups, (group) => group.id === v);

      // uGroup，有几条出边
      const uGroupLink = this.groupLinks.filter(gl => {
        return gl.u === u;
      }).sort((glA, glB) => {
        const glAGroup = find(this.groups, (group) => group.id === glA.v);
        const glBGroup = find(this.groups, (group) => group.id === glB.v);

        const { points: glAGroupPoint } = g.edge({
          v: uGroup.vertexes.length === 1 ? uGroup.vertexes[0].id : uGroup.id,
          w: glAGroup.vertexes.length === 1 ? glAGroup.vertexes[0].id : glAGroup.id,
        });

        const { points: glBGroupPoint } = g.edge({
          v: uGroup.vertexes.length === 1 ? uGroup.vertexes[0].id : uGroup.id,
          w: glBGroup.vertexes.length === 1 ? glBGroup.vertexes[0].id : glBGroup.id,
        });

        if (glAGroupPoint[0].y < glBGroupPoint[0].y) {
          return -1;
        }
        return 1;
      });

      const uIndex = findIndex(uGroupLink, link => link.v === v);

      if (uGroup.vertexes.length === 1) {
        // 如果当前组只有一个节点，那么
        const vertex = uGroup.vertexes[0];
        startPoint = {
          x: vertex.x + vertex.width / 2,
          y: vertex.y - vertex.height / 2 + ((uIndex + 1) / (uGroupLink.length + 1)) * vertex.height,
        };
      } else {
        startPoint = {
          x: uGroup.x + uGroup.width / 2,
          y: uGroup.y - uGroup.height / 2 + ((uIndex + 1) / (uGroupLink.length + 1)) * uGroup.height,
        };
      }

      // vGroup，有几条入边
      const vGroupLink = this.groupLinks.filter(gl => {
        return gl.v === v;
      }).sort((glA, glB) => {
        const glAGroup = find(this.groups, (group) => group.id === glA.u);
        const glBGroup = find(this.groups, (group) => group.id === glB.u);

        const { points: glAGroupPoint } = g.edge({
          v: glAGroup.vertexes.length === 1 ? glAGroup.vertexes[0].id : glAGroup.id,
          w: vGroup.vertexes.length === 1 ? vGroup.vertexes[0].id : vGroup.id,
        });

        const { points: glBGroupPoint } = g.edge({
          v: glBGroup.vertexes.length === 1 ? glBGroup.vertexes[0].id : glBGroup.id,
          w: vGroup.vertexes.length === 1 ? vGroup.vertexes[0].id : vGroup.id,
        });
        
        if (glAGroupPoint[0].y < glBGroupPoint[0].y) {
          return -1;
        }
        return 1;
      });

      const vIndex = findIndex(vGroupLink, link => link.u === u);
      
      if (vGroup.vertexes.length === 1) {
        // 如果当前组只有一个节点，那么
        const vertex = vGroup.vertexes[0];
        endPoint = {
          x: vertex.x - vertex.width / 2,
          y: vertex.y - vertex.height / 2 + ((vIndex + 1) / (vGroupLink.length + 1)) * vertex.height,
        };
      } else {
        endPoint = {
          x: vGroup.x - vGroup.width / 2,
          y: vGroup.y - vGroup.height / 2 + ((vIndex + 1) / (vGroupLink.length + 1)) * vGroup.height,
        }
      }

      const { points } = g.edge({
        v: uGroup.vertexes.length === 1 ? uGroup.vertexes[0].id : uGroup.id,
        w: vGroup.vertexes.length === 1 ? vGroup.vertexes[0].id : vGroup.id,
      });

      let middlePoints = points.slice(1, points.length - 1);
      
      // 防止节点出现突转
      if (middlePoints.length === 1) {
        middlePoints = [{ x: middlePoints[0].x, y: endPoint.y }];
      }

      return {
        ...(groupLink as object),
        points: [
          startPoint,
          { x: startPoint.x + 10, y: startPoint.y },
          ...middlePoints,
          { x: endPoint.x - 20, y: endPoint.y },
          endPoint
        ]
      } as Edge<GL>;
    });

    const groupLinks: (NL & {
      uGroupId: string;
      vGroupId: string;
      groupPoints: [Point[], Point[], Point[]]
    })[] = [];
    
    this.links
      .filter(link => {
        const uGroup = this.groupNodeMap.get(link.u);
        const vGroup = this.groupNodeMap.get(link.v);
        return uGroup.id !== vGroup.id;
      }).forEach(link => {
        const { u, v } = link;

        const uGroup = this.groupNodeMap.get(u);
        const vGroup = this.groupNodeMap.get(v);
        const uNode = find(nodes, node => node.id === u);
        const vNode = find(nodes, node => node.id === v);

        const groupLink = find(this.groupLinks, (link) => {
          return link.u === uGroup.id && link.v === vGroup.id;
        });

        const startPoint = groupLink.points[0];
        const endPoint = groupLink.points[groupLink.points.length - 1];

        let point_1: Point[] = [];
        if (uGroup.expand) {
          point_1 = [
            { x: uNode.x + uNode.width / 2, y: uNode.y },
            { x: uNode.x + uNode.width / 2 + 10, y: uNode.y },
            { x: startPoint.x - 20, y: startPoint.y },
            startPoint
          ];
        }

        let point_3: Point[] = [];
        if (vGroup.expand) {
          point_3 = [
            endPoint,
            { x: endPoint.x + 10, y: endPoint.y },
            { x: vNode.x - vNode.width / 2 - 20, y: vNode.y },
            { x: vNode.x - vNode.width / 2, y: vNode.y },
          ];
        }

        groupLinks.push({
          ...(link as object),
          uGroupId: uGroup.vertexes.length === 1 ? uGroup.vertexes[0].id : uGroup.id,
          vGroupId: vGroup.vertexes.length === 1 ? vGroup.vertexes[0].id : vGroup.id,
          groupPoints: [point_1, groupLink.points, point_3],
        } as (NL & {
          uGroupId: string;
          vGroupId: string;
          groupPoints: [Point[], Point[], Point[]]
        }));
      });

    return {
      nodes,
      nodeLinks,
      groupLinks
    };
  }

  getTween(start: number, end: number) {
    const duration = 100;
    const times = Math.floor(duration / 16);

    const paths = [];
    const interval = (end - start) / times;
    for (let i = 0; i <= times; i++) {
      paths.push(start + interval * i);
    }

    return paths;
  }

  getAnimationPath(pre: LayoutVertex | LayoutGroupVertex, current: LayoutVertex | LayoutGroupVertex) {
    const preWidth = pre.width;
    const preHeight = pre.height;
    const preX = pre.x;
    const preY = pre.y;
    const currentWidth = current.width;
    const currentHeight = current.height;
    const currentX = current.x;
    const currentY = current.y;

    return {
      widthPath: this.getTween(preWidth, currentWidth),
      heightPath: this.getTween(preHeight, currentHeight),
      xPath: this.getTween(preX, currentX),
      yPath: this.getTween(preY, currentY)
    };
  }

  animation() {
    this.renderNodes = this.renderNodes.map(renderNode => {
      const preRenderNode = find(this.preRenderNodes, node => node.id === renderNode.id);
      // 之前存在
      if (preRenderNode) {
        const { widthPath, heightPath, xPath, yPath } = this.getAnimationPath(preRenderNode, renderNode);
        return {
          ...(renderNode as object),
          widthPath,
          heightPath,
          xPath,
          yPath,
          isMount: false,
          width: preRenderNode.width,
          height: preRenderNode.height,
          x: preRenderNode.x,
          y: preRenderNode.y,
          opacity: 1
        } as N;
      }
      return {
        ...(renderNode as object),
        isMount: true,
        opacity: 0,
        opacityPath: this.getTween(0, 1)
      } as N;
    });
    this.renderGroups = this.renderGroups.map(renderGroup => {
      const preRenderGroup = find(this.preRenderGroups, group => group.id === renderGroup.id);
      // 之前存在
      if (preRenderGroup) {
        const { widthPath, heightPath, xPath, yPath } = this.getAnimationPath(preRenderGroup, renderGroup);
        return {
          ...(renderGroup as object),
          widthPath,
          heightPath,
          xPath,
          yPath,
          isMount: false,
          width: preRenderGroup.width,
          height: preRenderGroup.height,
          x: preRenderGroup.x,
          y: preRenderGroup.y,
          opacity: 1
        } as VertexGroup<N, G>;
      }
      return {
        ...(renderGroup as object),
        isMount: true,
        opacity: 0,
        opacityPath: this.getTween(0, 1)
      } as VertexGroup<N, G>;
    });
    this.renderNodeLinks = this.renderNodeLinks.map(renderNodeLink => {
      const preNodeRenderLink = find(this.renderNodeLinks, link => link.u === renderNodeLink.u && link.v === renderNodeLink.v);
      if (preNodeRenderLink) {
        return {
          ...(renderNodeLink as object),
          isMount: false,
          opacity: 1
        } as Edge<NL>;
      }
      return {
        ...(renderNodeLink as object),
        isMount: true,
        opacity: 0,
        opacityPath: this.getTween(0, 1)
      } as Edge<NL>;
    });
    this.renderGroupLinks = this.renderGroupLinks.map(renderGroupLink => {
      const preGroupRenderLink = find(this.renderGroupLinks, link => link.u === renderGroupLink.u && link.v === renderGroupLink.v);
      if (preGroupRenderLink) {
        return {
          ...(renderGroupLink as object),
          isMount: false,
          opacity: 1
        } as Edge<NL & {
          uGroupId: string;
          vGroupId: string;
          groupPoints: [Point[], Point[], Point[]]
        }>;
      }
      return {
        ...(renderGroupLink as object),
        isMount: true,
        opacity: 0,
        opacityPath: this.getTween(0, 1)
      } as Edge<NL & {
        uGroupId: string;
        vGroupId: string;
        groupPoints: [Point[], Point[], Point[]]
      }>;
    });
  }

  update(
    /** 节点 */
    nodes: Array<Vertex<N>>,
    /** 节点连线 */
    links: Array<Edge<NL>>,
    /** 组 */
    groups: Array<VertexGroup<N, G>>,
    /** 组连线 */
    groupLinks: Array<Edge<GL>>,
    /** 图配置 */
    config: GroupConfig
  ) {
    this.init(nodes, links, groups, groupLinks, config);
  }

  /**
   * 布局生成
   * 当组内只有一个节点时，直接显示节点
   * 当前组展开时，内部节点与外部组或节点相连接
   * 当组闭合时，组与相关节点/组连接
   * 返回组数据，用于渲染
   * 算法：组内节点独自布局，获得节点在组中的位置以及组的位置，然后组布局
   */
  layout(): {
    renderGroups: VertexGroup<N, G>[];
    renderNodes: Vertex<N>[];
    renderNodeLinks: Edge<NL>[];
    renderGroupLinks: Edge<NL & {
      uGroupId: string;
      vGroupId: string;
      groupPoints: [Point[], Point[], Point[]]
    }>[];
  } {
    this.preRenderNodes = this.renderNodes.map(node => {
      const { isMount, widthPath, heightPath, xPath, yPath } = node;
      if (isMount) {
        return node;
      }
      return {
        ...(node as object),
        width: widthPath[widthPath.length - 1],
        height: heightPath[heightPath.length - 1],
        x: xPath[xPath.length - 1],
        y: yPath[yPath.length - 1]
      } as N;
    });
    this.preRenderGroups = this.renderGroups.map(group => {
      const { isMount, widthPath, heightPath, xPath, yPath } = group;
      if (isMount) {
        return group;
      }
      return {
        ...(group as object),
        width: widthPath[widthPath.length - 1],
        height: heightPath[heightPath.length - 1],
        x: xPath[xPath.length - 1],
        y: yPath[yPath.length - 1]
      } as VertexGroup<N, G>;
    });
    this.preRenderNodeLinks = this.renderNodeLinks;
    this.preRenderGroupLinks = this.renderGroupLinks;

    this.getGroupSize();
    const { nodeLinks, nodes, groupLinks } = this.groupLayout();

    this.renderGroups = this.groups.filter((group) => {
      return group.vertexes.length !== 1;
    });
    
    this.renderNodes = this.groups.reduce((pre, cur) => {
      if (cur.expand || cur.vertexes.length === 1) {
        return [
          ...pre,
          ...cur.vertexes,
        ];
      }
      return pre;
    }, []);

    this.renderNodeLinks = nodeLinks.map(link => {
      const { u, v } = link;

      const uNode = find(nodes, node => node.id === u);
      const vNode = find(nodes, node => node.id === v);

      const uLinks = nodeLinks
        .filter(link => link.u === u)
        .sort((linkA, linkB) => {
          const linkAStartPointY = linkA.points[0].y;
          const linkBStartPointY = linkB.points[0].y;
          if (linkAStartPointY < linkBStartPointY) {
            return -1;
          }
          return 1;
        });

      const uNodeIndex = findIndex(uLinks, link => link.v === v);
      const startPoint = {
        x: uNode.x + uNode.width / 2,
        y: uNode.y - uNode.height / 2 + ((uNodeIndex + 1) / (uLinks.length + 1)) * uNode.height
      };

      const vLinks = nodeLinks
        .filter(link => link.v === v)
        .sort((linkA, linkB) => {
          const linkAEndPointY = linkA.points[linkA.points.length - 1].y;
          const linkBEndPointY = linkB.points[linkB.points.length - 1].y;
          if (linkAEndPointY < linkBEndPointY) {
            return -1;
          }
          return 1;
        });

      const vNodeIndex = findIndex(vLinks, link => link.u === u);
      const endPoint = {
        x: vNode.x - vNode.width / 2,
        y: vNode.y - vNode.height / 2 + ((vNodeIndex + 1) / (vLinks.length + 1)) * vNode.height
      };

      const points = [
        startPoint,
        { x: startPoint.x + 10, y: startPoint.y },
        ...link.points.slice(1, link.points.length - 1),
        { x: endPoint.x - 20, y: endPoint.y },
        endPoint
      ];

      return {
        ...(link as object),
        points
      } as NL;
    });

    this.renderGroupLinks = groupLinks;
    this.animation();

    return {
      renderGroups: this.renderGroups,
      renderNodes: this.renderNodes,
      renderNodeLinks: this.renderNodeLinks,
      renderGroupLinks: this.renderGroupLinks,
    };
  }
}