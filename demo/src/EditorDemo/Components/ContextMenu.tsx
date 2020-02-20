/**
 * @file 右侧菜单公共组件
 * @author 剑决(perkin.pj)
 */

import * as React from 'react';
import Portal from '../utils/Portal';
import './ContextMenu.scss';

const { useRef, useLayoutEffect, useMemo } = React;

interface ContextMenuProps {
  id?: string;
  visible: boolean;
  /** 菜单位置 */
  pos: {
    left: number;
    top: number;
  };
  /** 关闭菜单 */
  onHide: () => void;

  children?: React.ReactChild;
}

function ContextMenu(props: ContextMenuProps) {
  const { visible, pos, onHide, children, id } = props;
  const { left, top } = pos;
  const contextMenuRef = useRef(null);
  // 渲染视图
  const renderView = useMemo(() => {
    const style = {
      left,
      top,
    };

    return (
      <div
        ref={contextMenuRef}
        className="contextMenu-layer"
        onClick={(event: any) => {
          if (event.target.className !== 'ant-menu-submenu-title' && onHide) {
            onHide();
          }
        }}
      >
        <div className="contextMenu" style={style}>
          {children}
        </div>
      </div>
    );
  }, [onHide, left, top, children]);

  // 控制菜单栏的显示
  useLayoutEffect(() => {
    const menuContainer = contextMenuRef.current;
    if (menuContainer && menuContainer.parentElement) {
      if (visible) {
        menuContainer.style.display = 'block';
        menuContainer.parentElement.style.display = 'block';
      } else {
        menuContainer.style.display = 'none';
        menuContainer.parentElement.style.display = 'none';
      }
    }
    return () => {
      if (menuContainer) {
        menuContainer.style.display = 'none';
        menuContainer.parentElement.style.display = 'none';
      }
    };
  }, [visible]);

  return (
    <Portal id={`portal-${id}`}>
      <div className="pipeline-portal">{renderView}</div>
    </Portal>
  );
}

export default ContextMenu;
