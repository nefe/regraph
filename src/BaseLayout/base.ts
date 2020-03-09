import * as dagre from 'dagre';
import { Vertex, BaseVertex, Edge, BaseEdge, VertexGroup } from '../type';
import { findIndex } from '../Utils/utils';

export class BaseGroupLayout<
  N extends BaseVertex & { width: number; height: number },
  NL extends BaseEdge,
  G extends BaseVertex & { expand: boolean; width?: number; height?: number },
> {
  g: dagre.graphlib.Graph;
  nodes: Vertex<N>[];
  links: Edge<NL>[];
  groups: VertexGroup<N, G>[];

  getNodes(nodes: Array<Vertex<N>>) {
    // node 根据 id 排序，@Todo 暂时转化成 Number，后续可以开放配置项
    return nodes.slice().sort((nodeA, nodeB) => {
      const nodeAId = Number(nodeA.id);
      const nodeBId = Number(nodeB.id);
      if (nodeAId < nodeBId) {
        return -1;
      } else if (nodeAId > nodeBId) {
        return 1;
      }
      return 0;
    });
  }

  getGroups(groups: Array<VertexGroup<N, G>>) {
    // group 根据 node 序列排序
    return groups.slice().sort((groupA, groupB) => {
      const minNodeIdInGroupA = Math.min(
        ...groupA.vertexes.map(vertex => {
          return findIndex(this.nodes, node => node.id === vertex.id);
        })
      );
      const minNodeIdInGroupB = Math.min(
        ...groupB.vertexes.map(vertex => {
          return findIndex(this.nodes, node => node.id === vertex.id);
        })
      );
      if (minNodeIdInGroupA < minNodeIdInGroupB) {
        return -1;
      } else if (minNodeIdInGroupA > minNodeIdInGroupB) {
        return 1;
      }
      return 0;
    });
  }
}