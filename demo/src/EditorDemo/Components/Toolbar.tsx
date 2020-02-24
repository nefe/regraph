/**
 * @file 画布操作导航
 * @author perkinJ
 */

import * as React from 'react';
import { Icon } from 'antd';
import * as classNames from 'classnames';
import { launchFullscreen, exitFullscreen, isFull } from '../utils/FullsreenUtils';
import { MIN_SCALE, MAX_SCALE } from '../defines';
import './Toolbar.scss';

/** 操作面板，支持全屏、缩放、自适应画布、格式化、显示比例 */

export type ToolbarType = 'fullscreen' | 'zoom' | 'adapt' | 'format' | 'ratio' | 'shear' | 'copy' | 'paste' | 'delete';

export class ToolbarProps {
  /** 适应画布 */
  handleShowAll?: () => void;

  /** 缩放 */
  handleResizeTo?: (scale: number) => void;

  /** 改变屏幕缩放大小 */
  changeScreenScale?: (scale: number) => void;

  /** 缩放大小 */
  screenScale?: number;

  /** 格式化布局 */
  layout?: () => void;

  onShear?: () => void;

  onCopy?: () => void;

  onPaste?: () => void;

  onDelete?: () => void;

  /** 处理全屏 */
  // handleFullScreen?: () => void;
  /** Toolbar选项 */
  items?: ToolbarType[];

  /**  */
}

const Toolbar = React.forwardRef((props: ToolbarProps, ref: any) => {
  const { screenScale, changeScreenScale, handleResizeTo, items, onShear, onCopy, onPaste, onDelete } = props;
  const scale = String(Math.round(screenScale));

  /** 是否支持全屏 */

  const isFullScreen = items.includes('fullscreen');

  /** 是否支持缩放 */
  const isZoom = items.includes('zoom');

  /** 是否支持适应画布 */
  const isAdapt = items.includes('adapt');

  /** 是否支持格式化 */
  const isFormat = items.includes('format');

  /** 剪切 */
  const isShear = items.includes('shear');
  /** 是否支持复制 */
  const isCopy = items.includes('copy');

  const isPaste = items.includes('paste');

  const isDelete = items.includes('delete');

  /** 当前是否是全屏状态 */

  const fullscreenStatus = isFull();

  /** 缩放操作 */
  const handleResize = (isLager?: boolean) => {
    let value = screenScale;
    if (isLager) {
      value = screenScale + 10;
      if (value > MAX_SCALE) {
        value = MAX_SCALE;
      }
    } else {
      value = screenScale - 10;
      if (value < MIN_SCALE) {
        value = MIN_SCALE;
      }
    }
    handleResizeTo(value / 100);
    changeScreenScale(value);
  };

  /** 处理全屏事件 */
  const handleFullScreen = () => {
    const isfull = isFull();
    if (isfull) {
      exitFullscreen();
    } else {
      launchFullscreen(ref.current);
    }
  };

  // 渲染按钮
  const renderButtons = () => {
    const fullScreenClassName = classNames({
      fullscreen: !fullscreenStatus,
      'fullscreen-exit': fullscreenStatus
    });

    return (
      <>
        {isZoom && (
          <>
            <div className="toolbar-btn">
              <Icon type="zoom-in" onClick={handleResize.bind(null, true)} />
            </div>
            <div className="toolbar-btn">
              <Icon type="zoom-out" onClick={handleResize.bind(null, false)} />
            </div>
          </>
        )}

        {/* {isAdapt && (
          <div className="adapt">
            <Tooltip placement="top" title={I18N.DAG.DAGScreen.adapt}>
              <Icon
                type="dpicon icon-adapt"
                onClick={() => {
                  props.handleShowAll();
                }}
              />
            </Tooltip>
          </div>
        )}
        {isFormat && (
          <div className="format">
            <Tooltip placement="top" title={I18N.PipelineCanvas.utils.format}>
              <Icon
                type="one-icon icon-geshihuabuju anticon-dpicon"
                onClick={() => {
                  props.layout();
                }}
              />
            </Tooltip>
          </div>
        )} */}
        {isFullScreen && (
          <div className="toolbar-btn">
            <Icon type={fullScreenClassName} onClick={handleFullScreen} />
          </div>
        )}

        {isShear && (
          <div className="toolbar-btn">
            <Icon type="scissor" onClick={onShear} />
          </div>
        )}

        {isCopy && (
          <div className="toolbar-btn">
            <Icon type="copy" onClick={onCopy} />
          </div>
        )}

        {isPaste && (
          <div className="toolbar-btn">
            <Icon type="snippets" onClick={onPaste} />
          </div>
        )}
        {isDelete && (
          <div className="toolbar-btn">
            <Icon type="delete" onClick={onDelete} />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="toolbar">
      <div className="toolbar-scale">{scale}%</div>
      <div className="toolbar-button">{renderButtons()}</div>
    </div>
  );
});

export default Toolbar;
