/**
 * @file 通用节点组件
 * @desc 与画布联动，用于计算画布位置、缩放等
 * @author perkinJ
 */

import * as React from 'react';
import { useResize } from '../Store/useResize';
import './Node.scss';

const { useRef, useState, useEffect, useCallback } = React;

class NodeProps {
  /** 节点id */
  id: string;

  /** 节点横坐标 */
  x: number;

  /** 节点纵坐标 */
  y: number;

  width: number;

  height: number;

  /** 点击节点 */
  onClick?: (event) => void;

  /** ContextMenu */
  onContextMenu?: (position: any, event) => void;

  /** 当前节点信息 */
  node?: any;

  /** 外部画布属性 */
  currTrans?: any;

  /** 是否被点击 */
  isSelected: boolean;

  children?: React.ReactNode;

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

const Node = React.forwardRef((props: NodeProps, ref: any) => {
  const { x, y, id, onClick, onContextMenu, children, currTrans, width, height, isSelected, onResize } = props;

  const [showSelector, setShowSelector] = useState(false);
  const containerRef = useRef(null);

  // 获取伸缩的大小
  const { width: resizeWidth, height: resizeHeight, x: resizeX, y: resizeY } = useResize(isSelected, {
    width,
    height,
    x,
    y
  });

  const handleContextMenu = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    event.stopPropagation();
    const container = containerRef.current.getBoundingClientRect();
    container.id = id;
    const { offsetTop, offsetLeft } = getOffset(container.current);

    // The position ⟨x,y⟩ is transformed to ⟨xk + tx,yk + ty⟩
    const screenX = event.clientX - offsetLeft;
    const screenY = event.clientY - offsetTop;

    const newX = (screenX - x) / currTrans.k;
    const newY = (screenY - y) / currTrans.k;

    const currentPos = {
      left: newX,
      top: newY
    };

    if (onContextMenu) {
      onContextMenu(currentPos, event);
    }
  };

  const NODE_SELECTOR = [
    {
      position: 'left',
      style: { left: '-5px', top: `${height / 2 - 5}px` }
    },
    {
      position: 'right',
      style: { right: '-5px', top: `${height / 2 - 5}px` }
    },
    {
      position: 'top',
      style: { left: `${width / 2 - 5}px`, top: '-5px' }
    },
    {
      position: 'bottom',
      style: { left: `${width / 2 - 5}px`, top: `${height - 5}px` }
    }
  ];

  const RESIZE_SELECTOR = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  // 伸缩器
  const renderResize = (
    <div className="resizable">
      <div className="resizers">
        {RESIZE_SELECTOR.map(item => (
          <div key={item} className={`resizer ${item}`} data-type="resize"></div>
        ))}
      </div>
    </div>
  );

  // 连线节点选择器
  const renderNodeSelector = (
    <div className="editor-node-selector" style={{ width, height }}>
      {NODE_SELECTOR.map(item => {
        return (
          <a
            data-type="edge"
            data-position={item.position}
            key={item.position}
            href="javascript:void(0)"
            className={`node-selector`}
            style={item.style}
          />
        );
      })}
    </div>
  );

  useEffect(() => {
    onResize(resizeWidth, resizeHeight, resizeX, resizeY);
  }, [resizeWidth, resizeHeight, resizeX, resizeY]);

  return (
    <div
      className="editor-node"
      style={{
        left: x,
        top: y,
        width,
        height
      }}
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setShowSelector(true)}
      onMouseLeave={() => setShowSelector(false)}
      onContextMenu={handleContextMenu}>
      {(isSelected || showSelector) && renderNodeSelector}
      {isSelected && renderResize}
      {React.cloneElement(children as React.ReactElement<any>, {
        ref: containerRef
      })}
    </div>
  );
});

export default Node;
