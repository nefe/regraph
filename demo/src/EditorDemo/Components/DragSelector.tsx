/**
 * @file 圈选器组件
 * @author perkinJ
 */

import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import useDragSelect, { ShapeProps } from '../utils/useDragSelect';
import { StyleProps } from '../utils/types';
import './DragSelector.scss';

const { useRef, useCallback, useMemo } = React;

class DragSeletorProps {
  /** 长度 */
  width: number;

  /** 高度 */
  height: number;

  /** 蒙层的颜色 */
  overlayColor?: string;

  /** 选择器的样式 */
  selectorStyle?: StyleProps;

  /** 是否展示 */
  visible: boolean;

  /** 关闭 */
  onClose?: (selectProps: ShapeProps) => void;
}

export default function DragSeletor(props: DragSeletorProps) {
  const { width, height, overlayColor, selectorStyle, visible, onClose } = props;
  const dragSelectContainerRef = useRef(null);

  const { shapeProps, pathData } = useDragSelect(dragSelectContainerRef, 'rect');

  const handleClick = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();
      if (onClose) {
        onClose(shapeProps);
      }
    },
    [onClose, shapeProps],
  );

  return useMemo(() => {
    const classes = classNames('drag-select-container', { 'drag-select-hidden': !visible });

    return (
      <svg
        ref={dragSelectContainerRef}
        className={classes}
        width={width}
        height={height}
        style={{ background: overlayColor }}
        xmlns="http://www.w3.org/2000/svg"
        onDrag={event => {
          event.preventDefault();
        }}
        onClick={handleClick}
      >
        <g>
          {/** 可支持多个图形，矩形，圆形，自定义路径等 */}
          <path d={pathData} style={{ ...selectorStyle }} />
        </g>
      </svg>
    );
  }, [overlayColor, handleClick, width, height, selectorStyle, visible, pathData]);
}

export { ShapeProps };
