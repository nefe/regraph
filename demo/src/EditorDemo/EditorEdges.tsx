/**
 * @file 通用边组件
 * @author perkinJ
 */

import * as React from 'react';
import * as _ from 'lodash';
import Edge from './Components/Edge';
import { quadratic,calcLinkPosition } from './utils/calc';
import { Node, Link, ACTIVE, LINK, UNLINK } from './defines';
import './EditorEdges.scss';

class EditorEdgesProps {
  /** 唯一id */
  id?: string;

  /** 边 */
  links: Link[];

  /** 节点 */
  nodes: Node[];

  /** 被点击的连线 */
  selectedLinks?: string[];

  /** 选择某条线 */
  onSelectLink?: (key: string, event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;

  /** 右键某条线 */
  onContextMenu?: (key: string, event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;

  /** 是否连线 */
  isDraggingLink?: boolean;

  /** 拖拽连线属性 */
  dragLink?: {
    /** 源起节点id */
    originId: string;
    /** 源起节点 */
    originX: number;
    originY: number;
    /** 鼠标移动节点 */
    x: number;
    y: number;
  };

  /** 是否可交互 */
  interactive?: boolean;
}

export function EditorEdges(props: EditorEdgesProps) {
  const {
    links,
    nodes,
    selectedLinks,
    onSelectLink,
    onContextMenu,
    isDraggingLink,
    dragLink,
    interactive = true
  } = props;
  const edgesPath = links.map(link => {
    const { source, target, id, sourcePos, targetPos } = link;
    const uNode = _.find(nodes, vertex => {
      return vertex.id === source;
    });
    const vNode = _.find(nodes, vertex => {
      return vertex.id === target;
    });
    const { x: sourceX, y: sourceY } = calcLinkPosition(uNode, sourcePos);
    const { x: targetX, y: targetY } = calcLinkPosition(vNode, targetPos);

    // 自定义路径
    const pathData = quadratic(
      {
        x: sourceX,
        y: sourceY
      },
      {
        x: targetX,
        y: targetY
      }
    );

    // 连线的中点
    // const centerX = (uNode.x + NODE_WIDTH + vNode.x) / 2;
    // const centerY = (uNode.y + NODE_HEIGHT + vNode.y) / 2;

    const isActive = selectedLinks ? selectedLinks.includes(id) : false;
    const fill = isActive ? ACTIVE : LINK;

    const style = {
      fill,
      stroke: fill,
      strokeWidth: 2
    };

    return (
      <Edge
        key={id}
        id={id}
        path={pathData}
        lineAppendWidth={15}
        style={style}
        // onContextMenu={interactive ? onContextMenu.bind(null, id) : null}
        onClick={interactive ? onSelectLink.bind(null, id) : null}
        endArrow={
          <marker
            id={`${id}-endArrow`}
            markerWidth="10"
            markerHeight="10"
            refX="0"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth">
            <path d="M0,0 L0,4 L4,2 z" fill={fill} />
          </marker>
        }
        // object={
        //   (type || _.isBoolean(sendTo)) &&
        //   !iconDisabled && (
        //     <foreignObject
        //       width={LINKICON_WIDTH}
        //       height="60"
        //       x={centerX - LINKICON_WIDTH / 2}
        //       y={centerY - LINKICON_HEIGHT / 2}
        //     >
        //       <div className="link-icon">

        //       </div>
        //     </foreignObject>
        //   )
        // }
      />
    );
  });

  const renderDraggingLink = () => {
    if (isDraggingLink) {
      const { x, y, originX, originY } = dragLink;
      const pathData = quadratic(
        {
          x: originX,
          y: originY
        },
        {
          x,
          y
        }
      );

      return (
        <Edge
          path={pathData}
          endArrow={
            <marker
              id={`${UNLINK}-endArrow`}
              markerWidth="10"
              markerHeight="10"
              refX="0"
              refY="2"
              orient="auto"
              markerUnits="strokeWidth">
              <path d="M0,0 L0,4 L4,2 z" fill={UNLINK} />
            </marker>
          }
          style={{
            fill: UNLINK,
            stroke: UNLINK,
            strokeWidth: 2
          }}
        />
      );
    }

    return null;
  };

  return (
    <svg className="editor-view-svg">
      {links && edgesPath}
      {interactive && renderDraggingLink()}
    </svg>
  );
}
