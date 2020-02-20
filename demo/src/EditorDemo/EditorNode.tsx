/**
 * @file 业务组件，基于Node的管道组件卡片
 * @author 剑决(perkin.pj)
 */

import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import find from 'lodash/find';
import { Node as NodeContainer } from './Components';
import { Tooltip, Icon } from 'antd';
// import { PipelineContextMenu } from './PipelineContextMenu';
import {
  Node,
  // OperateType,
  // getMenuList,
  // initPos,
  NODE_WIDTH,
  NODE_HEIGHT,
  // COMPONENT_CATEGORY,
  CONTEXT_HEIGHT_DIFF
} from './defines';
import './EditorNode.scss';

const { useState, useRef, useMemo, useCallback } = React;

class EditorNodeProps {
  /** 唯一id，用于Contextmenu展示 */
  id?: string;

  /** 节点信息 */
  currentNode: Node;

  /** 选择菜单栏 */
  onSelect?: (currentNode: Node, key: any) => void;

  /** 右键组件 */
  onContextMenu?: (event: React.MouseEvent<HTMLLIElement>) => void;

  /** 是否属性设置完全 */
  isCompleted?: boolean;

  /** 是否有错误数据 */
  hasError?: boolean;

  /** 是否被点击 */
  isSelected?: boolean;

  /** 是否被拖拽 */
  isDragged?: boolean;

  /** 点击卡片 */
  onClick?: (currentNode: Node, event: any) => void;

  /** 是否可交互，区分展示型和交互型 */
  interactive?: boolean;

  /** 外部容器的缩放情况 */
  currTrans?: any;

  /** 显示选择器 */
  showSelector?: boolean;

  /** Node容器的ref */
  nodeRef: any;

  /** 改变节点大小 */
  onResize?: (width: number, height: number, x: number, y: number) => void;
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

export function EditorNode(props: EditorNodeProps) {
  const {
    currentNode,
    onSelect,
    hasError,
    isSelected,
    isDragged,
    onClick,
    interactive = true,
    currTrans,
    nodeRef,
    onResize,
    showSelector,
    id
  } = props;
  // 组件内状态，与业务无关
  const [menuShow, setMenuShow] = useState(false);
  const [propertyBtnShow, setPropertyBtnShow] = useState(false);

  const EditorNodeRef = useRef(null);

  // const [pos, setPos] = useState(initPos);
  // 边框颜色
  let borderColor = '';
  if (isSelected) {
    borderColor = `selected ${currentNode.key}-clicked ${currentNode.key}-border`;
  } else {
    borderColor = `${currentNode.key}-border`;
  }

   // 是否是圆形，TODO: 后续放开多边形
   const isCircle = currentNode.key === 'circle';

  const borderClass = classNames(
    'EditorNode-box',
    borderColor,
    {
      dragging: isDragged
    },
    { 'EditorNode-circle': isCircle }
  );

 

  // const onContextMenu = (position: { left: number; top: number }, event: React.MouseEvent<any>) => {
  //   // 根据业务场景处理菜单的位置
  //   const newPosition = {
  //     left: position.left + NODE_WIDTH * currTrans.k + 5,
  //     top: position.top + NODE_HEIGHT * currTrans.k + 25,
  //   };
  //   setPos(newPosition);
  //   setMenuShow(true);
  //   if (props.onContextMenu) {
  //     props.onContextMenu(event);
  //   }
  // };

  /** 点击菜单项 */
  const handleClickMenu = (node: Node, { key }) => {
    onSelect(node, key);
  };

  /** 点击组件 */
  const handleClickNode = useCallback(
    event => {
      if (interactive && onClick) {
        onClick(currentNode, event);
      }
    },
    [interactive, onClick, currentNode]
  );

  return (
    <NodeContainer
      id={currentNode.id}
      x={currentNode.x}
      y={currentNode.y}
      width={currentNode.width}
      height={currentNode.height}
      currTrans={currTrans}
      ref={nodeRef}
      isSelected={isSelected}
      onClick={handleClickNode}
      onResize={onResize}
      // onContextMenu={interactive ? onContextMenu : null}
    >
      <div className="EditorNode" ref={EditorNodeRef}>
        <div className={borderClass}>
          {/* <div className="EditorNode-box-icon">{icon}</div> */}
          <div className="EditorNode-box-property">
            <div className="EditorNode-name">{currentNode.name}</div>
          </div>
          <div className="EditorNode-box-more">
            {/* {interactive && (
              <a href="javascript:void(0)" draggable={false} onClick={handleClickMore}>
                ...
              </a>
            )} */}
            {/* <PipelineContextMenu
              id={id}
              visible={menuShow}
              onHide={() => {
                setMenuShow(false);
              }}
              pos={pos}
              onClick={handleClickMenu.bind(null, currentNode)}
              menuList={menuList}
              distribute={currentNode.distribute}
              mainOutput={currentNode.mainOutput}
            /> */}
          </div>
          {/* <div className="EditorNode-box-rightIcon" >
              <Icon type="one-icon icon-zujianlianjieanniu anticon-dpicon" data-type="edge" />
            </div> */}
        </div>
      </div>
    </NodeContainer>
  );
}
