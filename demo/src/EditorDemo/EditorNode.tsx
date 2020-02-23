/**
 * @file 业务组件，基于Node的管道组件卡片
 * @author perkinJ
 */

import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Menu } from 'antd';
import { Node as NodeContainer } from './Components';
import { ContextMenu } from './ContextMenu';
import { Node, OperateType } from './defines';
import { useClickAway } from './Store/useClickAway';
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
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });

  useClickAway(
    () => {
      setMenuShow(false);
    },
    () => document.querySelector('.editorNode-box-menu'),
    'contextmenu'
  );
  
  const menuRef = useClickAway(() => {
    setMenuShow(false);
  });

  const editorNodeRef = useRef(null);

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
    'editorNode-box',
    borderColor,
    {
      dragging: isDragged
    },
    { 'editorNode-circle': isCircle }
  );

  const menuList = [
    {
      name: '删除',
      key: OperateType.delete,
      disabled: false
    }
  ];

  const onContextMenu = (position: { left: number; top: number }, event: React.MouseEvent<any>) => {
    event.stopPropagation();
    event.preventDefault();
    // 根据业务场景处理菜单的位置
    const newPosition = {
      left: position.left,
      top: position.top
    };
    setMenuPos(newPosition);
    setMenuShow(true);
    if (props.onContextMenu) {
      props.onContextMenu(event);
    }
  };

  /** 点击菜单项 */
  const handleClickMenu = ({ key }) => {
    onSelect(currentNode, key);
    setMenuShow(false);
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
      onContextMenu={interactive ? onContextMenu : null}>
      <div className="editorNode" ref={editorNodeRef}>
        <div className={borderClass}>
          <div className="editorNode-box-property">
            <div className="editorNode-name">{currentNode.name}</div>
          </div>
          <div className="editorNode-box-menu" ref={menuRef}>
            <ContextMenu id={currentNode.id} visible={menuShow} left={menuPos.left} top={menuPos.top}>
              <Menu getPopupContainer={(triggerNode: any) => triggerNode.parentNode}>
                {menuList.map(child => {
                  return (
                    <Menu.Item key={child.key} onClick={handleClickMenu}>
                      {child.name}
                    </Menu.Item>
                  );
                })}
              </Menu>
            </ContextMenu>
          </div>
        </div>
      </div>
    </NodeContainer>
  );
}
