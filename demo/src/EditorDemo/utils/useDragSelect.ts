/**
 * @file 圈选器逻辑处理，与视图分离
 * @author perkinJ
 */

import * as React from 'react';

import { handlePathData } from './calc';
import { Shape, ShapeProps } from './types';

const { useCallback, useEffect, useState, useRef } = React;

const initSelectorProps = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  direction: 'left',
} as ShapeProps;

export default function useDragSelect(dragSelectContainerRef: any, shape: Shape) {
  const [shapeProps, setShapeProps] = useState<ShapeProps>(initSelectorProps);

  const [pathData, setPathData] = useState('');

  // 记录mousedown事件的X,Y位置，
  const mousdownX = useRef(0);
  const mousdownY = useRef(0);

  const handleMouseMove = useCallback(
    event => {
      const newX = event.layerX;
      const newY = event.layerY;
      const newWidth = Math.abs(newX - mousdownX.current);
      const newHeight = Math.abs(newY - mousdownY.current);

      const diffX = newX - mousdownX.current;

      const newShapeProps = {
        x: mousdownX.current,
        y: mousdownY.current,
        width: newWidth,
        height: newHeight,
        direction: diffX < 0 ? 'right' : 'left',
      } as ShapeProps;

      const path = handlePathData(shape, newShapeProps);
      setPathData(path);
      setShapeProps(newShapeProps);
    },
    [setShapeProps, shape],
  );

  const handleMouseUp = useCallback(
    event => {
      event.stopPropagation();

      // 清空路径
      setPathData('');

      // 清空初次点击数据
      mousdownX.current = 0;
      mousdownY.current = 0;
      dragSelectContainerRef.current.removeEventListener('mousemove', handleMouseMove);
    },
    [dragSelectContainerRef, handleMouseMove],
  );

  const handleMouseDown = useCallback(
    event => {
      event.stopPropagation();

      mousdownX.current = event.layerX;
      mousdownY.current = event.layerY;

      dragSelectContainerRef.current.addEventListener('mousemove', handleMouseMove);
      dragSelectContainerRef.current.addEventListener('mouseup', handleMouseUp);
    },
    [dragSelectContainerRef, handleMouseMove, handleMouseUp],
  );

  useEffect(() => {
    const drag = dragSelectContainerRef.current;
    drag.addEventListener('mousedown', handleMouseDown);
    return () => {
      drag.removeEventListener('mousedown', handleMouseDown);
    };
  }, [dragSelectContainerRef, handleMouseDown]);

  // 返回选择器坐标位置以及生成的path数据
  return { shapeProps, pathData };
}

export { ShapeProps };
