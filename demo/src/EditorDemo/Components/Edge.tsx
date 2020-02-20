/**
 * @file 通用边组件
 * @author 剑决
 */
import * as React from 'react';
import * as _ from 'lodash';
import { CONNECTOR, StyleProps } from '../utils/types';
import './Edge.scss';

export interface EdgeProps {
  /** 元素id，唯一 */
  id?: string;
  /** 线条路径 */
  path?: string;
  /** 起始端的箭头, 为true时为默认的箭头效果，也可以是一个自定义箭头 */
  startArrow?: boolean | React.SVGProps<SVGForeignObjectElement>;
  /** 末尾端的箭头, 为true时为默认的箭头效果，也可以是一个自定义箭头 */
  endArrow?: boolean | React.SVGProps<SVGForeignObjectElement>;
  /** 边的击中范围	 */
  lineAppendWidth?: number;
  /** 元素样式 */
  style?: StyleProps;
  /** 自定义形状 */
  object?: React.SVGProps<SVGForeignObjectElement>;
  /** 鼠标点击事件 */
  onClick?: (event: any) => void;
  /** 右键事件 */
  onContextMenu?: (event: any) => void;
}

export default function Edge(props: EdgeProps) {
  const { id, style, onContextMenu, onClick, object, lineAppendWidth, path, startArrow, endArrow } = props;
  const { fill } = style;

  let markerStart = '';
  if (typeof startArrow === 'boolean') {
    if (startArrow) {
      markerStart = 'url(#flow-startArrow)';
    }
  } else if (React.isValidElement(startArrow)) {
    markerStart = `url(#${(startArrow.props as any).id})`;
  }

  let endStart = '';
  if (typeof endArrow === 'boolean') {
    if (startArrow) {
      endStart = 'url(#flow-startArrow)';
    }
  } else if (React.isValidElement(endArrow)) {
    endStart = `url(#${(endArrow.props as any).id})`;
  }

  return (
    <g key={`${id}${CONNECTOR}`} className="editor-link">
      <defs>
        {React.isValidElement(startArrow) ? (
          React.cloneElement(startArrow)
        ) : (
          <marker
            id="flow-startArrow"
            markerWidth="10"
            markerHeight="10"
            refX="0"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L4,2 z" fill={fill} />
          </marker>
        )}
      </defs>
      <defs>
        {React.isValidElement(endArrow) ? (
          React.cloneElement(endArrow)
        ) : (
          <marker
            id="flow-endArrow"
            markerWidth="10"
            markerHeight="10"
            refX="0"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L4,2 z" fill={fill} />
          </marker>
        )}
      </defs>
      <path
        key={id}
        className="editor-link-path"
        stroke={_.get(style, 'stroke', '')}
        strokeWidth={_.get(style, 'strokeWidth', 0)}
        d={path}
        markerStart={markerStart}
        markerEnd={endStart}
      />
      {/** 这里增加一个虚拟背景，增加连线的两边可点击区域，提高用户体验 */}
      <path
        key={`${id}-background`}
        className="editor-link-path editor-link-path-background"
        style={{ strokeWidth: lineAppendWidth }}
        d={path}
        onContextMenu={onContextMenu}
        onClick={onClick}
      />
      <g>{object}</g>
    </g>
  );
}
