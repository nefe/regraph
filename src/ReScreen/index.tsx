/**
 * @file 画布操作的统一封装，包括平移、缩放、全屏、居中、恢复默认状态等，还有缩略图功能
 */
import * as React from 'react';
import { zoom, zoomIdentity, ZoomTransform, ZoomBehavior } from 'd3-zoom';
import * as d3Select from 'd3-selection';
import { isValidSVG, exitFullscreen, requestFullscreen, getContainerStyle, getMapStyle } from './utils';
import './ReScreen.css';
import { Point } from '../Utils/graph';

/** 缩略图留白 */
const MINI_MAP_RATIO = 0.9;
/** 动画时间 ms */
const ANIMATION_TIME = 500;

export class ButtonsProps {
  handleFullScreen: () => void;
  handleResetPosition: () => void;
  handleShowAll: () => void;
  handleResetStatus: () => void;
  handleResize: (isLarge: boolean) => void;
  handleResizeTo: (scale: number) => void;
  handleFocusTarget: (evt: any, focusEnabled: number) => void;
  handleApplyTransform: (transform: ZoomTransform) => void;
  handleLocation: (point: Point) => void;
  handleAdapt: () => void;
  handleSyncMiniMapView: () => void;
  screenWidth: number;
  screenHeight: number;
}

class MiniMapProps {
  screenToMapTransform: ZoomTransform;
  transform: ZoomTransform;
}

class Props {
  /** 画布内容的类型，默认为SVG */
  type?: 'SVG' | 'DOM' | 'CANVAS';
  /** 组件整体的尺寸，支持传入百分数 */
  height?: number | string;
  width?: number | string;
  /** 是否启动鼠标滚动缩放画布，默认为true */
  zoomEnabled?: boolean;
  /** 是否启动聚焦功能，0表示不启动，1表示单击触发，2表示双击触发 */
  focusEnabled?: number;
  /** 缩放范围 */
  minZoom?: number;
  maxZoom?: number;
  /** 拖拽方向的锁定，默认为ALL */
  dragDirection?: 'ALL' | 'HOR' | 'VER';
  /** 是否需要缩略图，默认为true */
  needMinimap?: boolean;
  /** 缩略图是否启动鼠标滚动缩放，默认为 false */
  miniMapZoomEnabled?: boolean;
  /** 是否需要自动隐藏缩略图, 默认为 false */
  autoHideMiniMap?: boolean;
  /** 自动隐藏与展现时的回调 */
  onMiniMapShowAndHide?: (show: boolean) => void;
  /** 底层图的坐标矩阵范围，1. 缩略图需要使用 2. 适用画布需要使用 */
  contentRange?: [Point, Point];
  /** 支持自定义传入缩略图组件 */
  minimap?: (props: MiniMapProps) => React.ReactElement<any> | React.ReactElement<MiniMapProps>;
  /** 缩略图位置，默认为RT，右上角；-IN表示在画布的内部 */
  mapPosition?: 'RT' | 'RB' | 'LT' | 'LB' | 'RT-IN' | 'RB-IN' | 'LT-IN' | 'LB-IN';
  /** 缩略图和原图之间的大小，默认为20 */
  mapPadding?: number;
  /** 缩略图大小，默认为100px */
  mapWidth?: number;
  mapHeight?: number;
  /** 缩略图矩形的样式，svg语法 */
  mapRectStyle?: object;
  /** 按钮组件，如果不需要就不传 */
  Buttons?: React.ReactElement<any>;
  /** 由于画布元素的变化而引起的视图变化 */
  needRefresh?: boolean;
  /** 通知外层重置needRefresh为false */
  resetNeedRefresh?: () => void;
  /** 画布发生变化时的回调，对外暴露当前的缩放信息 */
  onScreenChange?: (transform: ZoomTransform) => void;
  /** 对外暴露画布操作函数 */
  getScreenHandler?: (params: ButtonsProps) => void;
  /** 对外暴露控制容器的高度 */
  screenHeight?: number | string;
  /** scale 限制 */
  scaleExtent?: [number, number];
  /** translate 限制 */
  translateExtent?: [[number, number], [number, number]];
  /** 画布点击事件 */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void = () => {};
  /** 画布右击事件 */
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void = () => {};
  /** 画布拖动覆盖事件 */
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void = () => {};
  /** 画布拖动响应事件 */
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void = () => {};
  /** 是否支持拖拽 */
  draggable?: boolean;
}

class State {
  /** 画布到缩略图的变换关系，只有当画布内容变化时才变化 */
  screenToMapTransform: ZoomTransform;
  /** 是否需要添加动画，外部平移缩放时生效 */
  animation: boolean;
  /** 自动显示隐藏缩略图 */
  showMiniMap: boolean;
}

export default class ReScreen extends React.Component<Props, State> {
  static defaultProps = {
    type: 'SVG',
    width: '100%',
    height: '100%',
    needMinimap: true,
    zoomEnabled: true,
    minZoom: 0.01,
    maxZoom: 100,
    dragDirection: 'ALL',
    mapPosition: 'RT',
    mapWidth: 100,
    mapHeight: 100,
    mapPadding: 20,
    autoHideMiniMap: false,
    miniMapZoomEnabled: false,
    draggable: true
  };

  /** 考虑到缩略图的宽高度和画布的不一致，是否以缩略图的宽度为计算标准 */
  useMapWidth = true;
  ReScreenDOM: any;
  /** 外层元素，用来获取整体画布的大小以及全屏操作 */
  screenDOM: any;
  /** d3化的元素，外层 */
  screen: any;
  /** 视口大小 */
  screenWidth = 0;
  screenHeight = 0;
  /** d3化的元素，内层 */
  screenContent: any;
  /** d3化的元素，缩略图的可视化区域 */
  minimap: any;

  /** 画布的zoom对象 */
  screenZoom: ZoomBehavior<any, any>;
  /** 缩略图的zoom对象 */
  mapZoom: ZoomBehavior<any, any>;

  /** 画布内容的变换 */
  screenTransform: ZoomTransform = zoomIdentity;
  /** 缩略图的变换 */
  minimapTransform: ZoomTransform = zoomIdentity;
  /** 画布的变换关系，包含了画布本身的变化和缩略图的变化，是screenTransform*invert(minimapTransform) */
  transform: ZoomTransform = zoomIdentity;
  handleBrowserResizeFn: any;

  state = {
    /** 画布到缩略图的变换关系，只有当画布内容变化时才变化 */
    screenToMapTransform: zoomIdentity,
    animation: false,
    showMiniMap: false
  };
  rectRef: any;

  constructor(props: Props) {
    super(props);
    this.rectRef = React.createRef();
  }

  componentDidMount() {
    this.init();
    this.initEvent();
    this.bindZoom();
    this.getScreenHandler();
    this.setState({
      showMiniMap: this.checkShowMiniMap()
    });
  }

  componentWillReceiveProps(nextProps: Props) {
    // 得到通知，画布大小发生变化，重新计算
    if (nextProps.needRefresh) {
      this.getScreenToMapTransform();
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // showMiniMap 改变时，触发 onMiniMapShowAndHide 回调
    if (this.state.showMiniMap !== prevState.showMiniMap) {
      if (this.props.autoHideMiniMap && this.props.onMiniMapShowAndHide) {
        this.props.onMiniMapShowAndHide(this.state.showMiniMap);
      }
    }
    // 当 contentRange 发生变化时，缩略图需要发生变化
    if (
      this.props.contentRange &&
      this.props.contentRange.length &&
      (prevProps.contentRange.length !== this.props.contentRange.length ||
        prevProps.contentRange[0].x !== this.props.contentRange[0].x ||
        prevProps.contentRange[0].y !== this.props.contentRange[0].y ||
        prevProps.contentRange[1].x !== this.props.contentRange[1].x ||
        prevProps.contentRange[1].y !== this.props.contentRange[1].y)
    ) {
      this.getScreenToMapTransform();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleBrowserResizeFn);
  }

  init() {
    this.getScreenSize();
    this.getScreenToMapTransform();
  }

  initEvent() {
    this.handleBrowserResizeFn = this.init.bind(this);
    window.addEventListener('resize', this.handleBrowserResizeFn);
  }

  handleSyncMiniMapView = () => {
    this.getScreenToMapTransform();
  };

  getScreenHandler() {
    const { getScreenHandler } = this.props;
    if (getScreenHandler) {
      getScreenHandler({
        handleFullScreen: this.handleFullScreen,
        handleResetPosition: this.handleResetPosition,
        handleShowAll: this.handleShowAll,
        handleResetStatus: this.handleResetStatus,
        handleResize: this.handleResize,
        handleResizeTo: this.handleResizeTo,
        handleFocusTarget: this.handleFocusTarget,
        handleApplyTransform: this.handleApplyTransform,
        handleAdapt: this.handleAdapt,
        handleLocation: this.handleLocation,
        screenWidth: this.screenWidth,
        screenHeight: this.screenHeight,
        handleSyncMiniMapView: this.handleSyncMiniMapView
      });
    }
  }

  // zoom的过滤事件，当不启用滚轮缩放时，过滤滚轮事件
  filter(isMiniMap: boolean) {
    const enabled = isMiniMap ? this.props.miniMapZoomEnabled : this.props.zoomEnabled;
    if (!enabled) {
      return d3Select.event.type !== 'wheel';
    }
    return !d3Select.event.button;
  }

  bindZoom() {
    const { scaleExtent, translateExtent, draggable } = this.props;
    this.screenZoom = zoom()
      .filter(this.filter.bind(this, false))
      .scaleExtent(scaleExtent ? scaleExtent : [0, Infinity])
      .translateExtent(
        translateExtent
          ? translateExtent
          : [
              [-Infinity, -Infinity],
              [Infinity, Infinity]
            ]
      )
      .on('zoom', () => {
        const scale = d3Select.event.transform.k / this.minimapTransform.k;
        if (!this.isZoomValid(scale)) {
          // 如果禁止缩放了，值重置为缩放前
          return this.screen.call(this.screenZoom.transform, this.screenTransform);
        }
        if (draggable) {
          this.screenTransform = d3Select.event.transform;
          this.handleScreenChange();
        }
      });
    this.screen && this.screen.call(this.screenZoom).on('dblclick.zoom', null);

    if (this.props.needMinimap) {
      this.mapZoom = zoom()
        .filter(this.filter.bind(this, true))
        .on('zoom', () => {
          const scale = this.screenTransform.k / d3Select.event.transform.k;
          if (!this.isZoomValid(scale)) {
            return this.minimap.call(this.mapZoom.transform, this.minimapTransform);
          }
          if (draggable) {
            this.minimapTransform = d3Select.event.transform;
            this.handleScreenChange();
          }
        });
      this.minimap && this.minimap.call(this.mapZoom).on('dblclick.zoom', null);
    }
  }

  // 是否还可以缩放，是否超过设置缩放范围; 缩略图的缩放判断是相反的。
  isZoomValid(newScale: any) {
    const currentScale = this.transform.k;
    // 如果小于最小范围，禁止缩小
    if (newScale <= this.props.minZoom && newScale < currentScale) {
      return false;
    }

    // 如果超过最大范围，禁止放大
    if (newScale >= this.props.maxZoom && newScale > currentScale) {
      return false;
    }
    return true;
  }

  getScreenSize() {
    // 保险起见做的判断
    if (!this.ReScreenDOM) {
      return;
    }

    const ReScreenWidth = this.ReScreenDOM.clientWidth;
    const ReScreenHeight = this.ReScreenDOM.clientHeight;

    const { needMinimap, mapPosition, mapWidth, mapHeight, mapPadding } = this.props;
    // 如果缩略图设置在画布内侧，那么传入的宽高就是画布的宽高
    if (mapPosition.includes('IN')) {
      this.screenWidth = ReScreenWidth;
      this.screenHeight = ReScreenHeight;
    } else {
      this.screenWidth = needMinimap ? ReScreenWidth - mapWidth - mapPadding : ReScreenWidth;
      this.screenHeight = ReScreenHeight;
    }

    if (this.screenWidth < 0) {
      this.screenWidth = 0;
    }
  }

  getBBox() {
    const { type, contentRange } = this.props;
    if (contentRange && contentRange.length === 2) {
      return {
        x: contentRange[0].x,
        y: contentRange[0].y,
        width: contentRange[1].x - contentRange[0].x,
        height: contentRange[1].y - contentRange[0].y
      };
    }
    if (type === 'SVG') {
      return this.screenDOM && this.screenDOM.getBBox();
    } else if (type === 'DOM') {
      return {
        x: 0,
        y: 0,
        width: this.screenDOM.firstChild.scrollWidth,
        height: this.screenDOM.firstChild.scrollHeight
      };
    }
  }

  getScreenToMapTransform = () => {
    /** 获取元素的包围盒 */
    const BBox = this.getBBox();
    const { type, mapWidth, mapHeight, contentRange } = this.props;
    const x = BBox.x;
    const y = BBox.y;
    this.useMapWidth = (mapWidth / BBox.width) * BBox.height < mapHeight;
    // MINI_MAP_RATIO 为了留白
    const k = (this.useMapWidth ? mapWidth / BBox.width : mapHeight / BBox.height) * MINI_MAP_RATIO;
    let screenToMapTransform;

    if (contentRange && contentRange.length === 2) {
      const x = mapWidth / 2 - (contentRange[0].x + contentRange[1].x) / 2;
      const y = mapHeight / 2 - (contentRange[0].y + contentRange[1].y) / 2;

      const P0 = [mapWidth / 2, mapHeight / 2] as [number, number];
      const P1 = zoomIdentity
        .translate(x, y)
        .scale(1)
        .invert(P0);
      screenToMapTransform = zoomIdentity.translate(P0[0] - P1[0] * k, P0[1] - P1[1] * k).scale(k);
    } else if (type === 'SVG') {
      const xx = -1 * this.transform.invertX(x);
      const yy = -1 * this.transform.invertY(y);
      screenToMapTransform = zoomIdentity.translate(xx, yy).scale(k * this.transform.k);
    } else if (type === 'DOM') {
      screenToMapTransform = zoomIdentity.translate(-x, -y).scale(k);
    }

    this.setState(
      {
        screenToMapTransform
      },
      this.props.resetNeedRefresh
    );
    this.props.needMinimap && this.clReScreenContent(screenToMapTransform);
  };

  /** 回调，缩略图与底图关联, 所有平移、缩放最终都会收敛到这里 */
  handleScreenChange() {
    const screenTransform = this.screenTransform;
    const minimapTransform = this.minimapTransform;

    const transform = zoomIdentity
      .translate(screenTransform.x, screenTransform.y)
      .scale(screenTransform.k)
      // 除以minimapTransform.k是为了在缩略图中防止鼠标和矩形路径偏移问题
      .translate((-1 * minimapTransform.x) / minimapTransform.k, (-1 * minimapTransform.y) / minimapTransform.k)
      .scale(1 / minimapTransform.k);
    // 如果传入dragDirection，只限制在某个方向移动
    let finalTransform: ZoomTransform;
    if (this.props.dragDirection === 'HOR') {
      finalTransform = zoomIdentity.translate(transform.x, 0).scale(transform.k);
    } else if (this.props.dragDirection === 'VER') {
      finalTransform = zoomIdentity.translate(0, transform.y).scale(transform.k);
    } else {
      finalTransform = transform;
    }

    // 画布的最终变化效果是自身变化加上缩略图变化的效果
    const { onScreenChange } = this.props;
    this.applyTransform(finalTransform);
    onScreenChange && onScreenChange(finalTransform);
  }

  /** 连续触发的场景不会使用 animation */
  cancelAnimation() {
    setTimeout(() => {
      this.setState({
        animation: false
      });
    }, ANIMATION_TIME);
  }

  applyTransform = (transform: any) => {
    const { type, mapRectStyle } = this.props;
    const { screenToMapTransform } = this.state;
    // 画布内容缩放变化
    if (type === 'SVG') {
      this.screenContent &&
        this.screenContent.attr('transform', `translate(${transform.x}, ${transform.y}) scale(${transform.k})`);
    } else if (type === 'DOM') {
      this.screenContent &&
        this.screenContent.style('transform', `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`);
      this.screenContent && this.screenContent.style('transform-origin', '0 0');
    }

    this.transform = zoomIdentity.translate(transform.x, transform.y).scale(transform.k);

    if (this.rectRef.current) {
      // strokeWidth 要做特殊处理，因为会被缩放
      const strokeWidth = (mapRectStyle || ({} as any)).strokeWidth;
      this.rectRef.current.style.x = -this.transform.x;
      this.rectRef.current.style.y = -this.transform.y;
      this.rectRef.current.style.transform = `scale(${1 / transform.k})`;
      this.rectRef.current.style.strokeWidth =
        strokeWidth !== undefined ? strokeWidth * (1 / screenToMapTransform.k) * transform.k : undefined;
    }

    const showMiniMap = this.checkShowMiniMap();

    if (showMiniMap !== this.state.showMiniMap) {
      // 缩略图缩放变化
      this.setState(
        {
          showMiniMap
        },
        () => {
          this.cancelAnimation();
        }
      );
    }
  };

  handleApplyTransform = (transform: ZoomTransform) => {
    this.screen.call(this.screenZoom.transform, zoomIdentity.translate(transform.x, transform.y).scale(transform.k));
    this.minimap && this.minimap.call(this.mapZoom.transform, zoomIdentity);
  };

  /** 按钮事件，全屏操作 */
  handleFullScreen = () => {
    const isFull = document.fullscreenElement || (document as any).webkitFullscreenElement;
    if (isFull) {
      exitFullscreen();
    } else {
      requestFullscreen(this.screenDOM);
    }
  };

  /** 按钮事件，复位操作 */
  handleResetPosition = () => {
    this.screen.call(this.screenZoom.transform, zoomIdentity);
    this.minimap && this.minimap.call(this.mapZoom.transform, zoomIdentity);
  };

  /** 按钮事件，显示所有操作，@Todo 有点奇怪，计划下线 */
  handleShowAll = () => {
    console.warn('handleShowAll 计划下线，适应画布请添加 contentRange 使用 handleAdapt 方法');
    const { mapWidth, mapHeight } = this.props;
    const { screenToMapTransform } = this.state;
    const scale =
      screenToMapTransform.k * (this.useMapWidth ? this.screenWidth / mapWidth : this.screenHeight / mapHeight);
    this.screen.call(
      this.screenZoom.transform,
      zoomIdentity.scale(scale).translate(screenToMapTransform.x, screenToMapTransform.y)
    );
    this.minimap && this.minimap.call(this.mapZoom.transform, zoomIdentity);
  };

  /** 按钮事件，适应画布，ratio 防止节点边与画布边重合 */
  handleAdapt = () => {
    const { contentRange } = this.props;
    if (!(contentRange && contentRange.length === 2)) {
      console.warn('请正确传入 contentRange 值');
      return;
    }

    const componentWidth = contentRange[1].x - contentRange[0].x;
    const componentHeight = contentRange[1].y - contentRange[0].y;

    // 先在不缩放的场景下，平移到画布中点
    const x = this.screenWidth / 2 - (contentRange[0].x + contentRange[1].x) / 2;
    const y = this.screenHeight / 2 - (contentRange[0].y + contentRange[1].y) / 2;

    // 适应画布最大100%，保证在节点少的情况下不发生放大
    // @Todo MINI_MAP_RATIO 暂不支持配置，如果开放要作为 props 参数
    const scale = Math.min(
      (this.screenWidth / componentWidth) * MINI_MAP_RATIO,
      (this.screenHeight / componentHeight) * MINI_MAP_RATIO,
      1
    );

    // P0 是缩放中点
    const P0 = [this.screenWidth / 2, this.screenHeight / 2] as [number, number];
    const P1 = zoomIdentity
      .translate(x, y)
      .scale(1)
      .invert(P0);
    const newTransform = zoomIdentity.translate(P0[0] - P1[0] * scale, P0[1] - P1[1] * scale).scale(scale);
    this.handleApplyTransform(newTransform);
  };

  /** 按钮事件，重置操作 */
  handleResetStatus = () => {
    setTimeout(() => {
      this.getScreenToMapTransform();
      this.handleResetPosition();
    }, 100);
  };

  handleResize = (isLarger?: boolean) => {
    const RATE = isLarger ? 1.2 : 0.8;
    const newScale = this.transform.k * RATE;
    this.handleResizeTo(newScale / this.minimapTransform.k);
  };

  /** newScale为最终的缩放比例，不是screenTransform的值; P0为指定缩放中心 */
  handleResizeTo = (newScale: number, P0?: [number, number]) => {
    const screenScale = newScale * this.minimapTransform.k;
    /** 如果未指定缩放中心，则默认为画布中心点 */
    if (!P0) {
      P0 = [this.screenWidth / 2, this.screenHeight / 2];
    }
    /** 画布中心点对应到变化之前的点坐标 */
    const P1 = this.transform.invert(P0);

    this.screen.call(
      this.screenZoom.transform,
      zoomIdentity
        /** 平移量为以原点为中心时的平移量减去最终要以的中心点 */
        .translate(P0[0] - P1[0] * screenScale, P0[1] - P1[1] * screenScale)
        .scale(screenScale)
    );
    this.minimap && this.minimap.call(this.mapZoom.transform, zoomIdentity);
  };

  /** 图上坐标居中，执行动画 */
  handleLocation = (point: Point) => {
    this.setState(
      {
        animation: true
      },
      () => {
        const { k } = this.transform;

        const newTransform = zoomIdentity
          .translate(-point.x * k + this.screenWidth / 2, -point.y * k + this.screenHeight / 2)
          .scale(k);
        this.handleApplyTransform(newTransform);
      }
    );
  };

  handleFocusTarget = (evt: any, focusEnabled: number) => {
    if (this.props.focusEnabled !== focusEnabled) {
      return;
    }
    let e = evt.currentTarget;
    let dim = e.getBoundingClientRect();
    /** 在缩略图中的坐标 */
    let x = evt.clientX - dim.left;
    let y = evt.clientY - dim.top;
    const { x: tx, y: ty, k } = this.state.screenToMapTransform;
    /** 转化到画布中的坐标位置 */
    const cx = x / k - tx;
    const cy = y / k - ty;
    /** 把变化效果全部赋值给screenTransform，方便计算 */

    this.minimap.call(this.mapZoom.transform, zoomIdentity);
    this.screenTransform = this.transform;
    /** 在当前缩放下，画布中心移动到cx，cy点需要做的平移 */

    const tx1 = this.screenWidth / 2 - this.transform.k * cx;
    const ty1 = this.screenHeight / 2 - this.transform.k * cy;
    this.screen.call(this.screenZoom.transform, zoomIdentity.translate(tx1, ty1).scale(this.transform.k));
  };

  renderButtons(Buttons: React.ReactElement<any>) {
    return React.cloneElement(Buttons, {
      handleFullScreen: this.handleFullScreen,
      handleResetPosition: this.handleResetPosition,
      handleShowAll: this.handleShowAll,
      handleResetStatus: this.handleResetStatus,
      handleResize: this.handleResize,
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight
    });
  }

  // 实时拷贝画布内容到缩略图位置
  clReScreenContent(screenToMapTransform: any) {
    if (this.props.minimap || !this.screenDOM) {
      return;
    }
    const screenToMap = `scale(${screenToMapTransform.k}) translate(${screenToMapTransform.x}, ${screenToMapTransform.y})`;
    const screenContent = this.screenDOM.cloneNode(true);
    screenContent.style.height = '100%';
    screenContent.style.width = '100%';

    if (this.props.type === 'SVG') {
      screenContent.firstChild.setAttribute('transform', screenToMap);
    } else {
      screenContent.firstChild.style.transform = `translate(${screenToMapTransform.x}px, ${screenToMapTransform.y}px) scale(${screenToMapTransform.k})`;
      screenContent.firstChild.style.transformOrigin = '0 0';
    }
    const targetNode = document.getElementById('minimap');
    targetNode.innerHTML = '';
    targetNode.appendChild(screenContent);
  }

  renderCustomMiniMap() {
    const { screenToMapTransform } = this.state;
    const { transform } = this;
    const screenToMap = `translate(${screenToMapTransform.x}px, ${screenToMapTransform.y}px) scale(${screenToMapTransform.k})`;
    if (!this.props.minimap) {
      return null;
    }
    return (
      <div
        style={{
          transform: screenToMap,
          transformOrigin: '0 0'
        }}>
        {typeof this.props.minimap === 'function'
          ? this.props.minimap({
              screenToMapTransform,
              transform
            })
          : React.cloneElement(this.props.minimap, {
              screenToMapTransform,
              transform
            })}
        >
      </div>
    );
  }

  /**
   * 是否当前图已经被全部显示出来，不需要缩略图
   */
  checkShowMiniMap() {
    const { contentRange, autoHideMiniMap, needMinimap } = this.props;
    const { transform } = this;

    if (!needMinimap) {
      return false;
    }

    if (!(contentRange && contentRange.length === 2)) {
      console.warn('请正确传入 contentRange 值');
      return true;
    }

    // 不自动隐藏，永远返回 true，显示缩略图
    if (!autoHideMiniMap) {
      return true;
    }

    const { k, x, y } = transform;

    const currRange = [
      { x: (0 - x) / k, y: (0 - y) / k },
      { x: (this.screenWidth - x) / k, y: (this.screenHeight - y) / k }
    ];

    if (
      currRange[0].x < contentRange[0].x &&
      currRange[0].y < contentRange[0].y &&
      currRange[1].x > contentRange[1].x &&
      currRange[1].y > contentRange[1].y
    ) {
      return false;
    }

    return true;
  }

  renderMinimap(mapWidth: number, mapHeight: number, mapPosition: any) {
    const { screenToMapTransform, showMiniMap } = this.state;

    let className = 'map-ctrl';
    if (!showMiniMap) {
      className += ' map-ctrl-hidden';
    }
    if (this.state.animation) {
      className += ' map-ctrl-animation';
    }

    return (
      <div
        className={className}
        onDoubleClick={e => this.handleFocusTarget(e, 2)}
        onClick={e => this.handleFocusTarget(e, 1)}
        style={{
          width: mapWidth + 'px',
          height: mapHeight + 'px',
          ...getMapStyle(mapPosition)
        }}>
        {/* 如果传入了Minimap组件表示缩略图，就使用传入的组件 */}
        <div id="minimap" style={{ width: '100%', height: '100%' }}>
          {this.renderCustomMiniMap()}
        </div>
        {/** 在 Mac 触摸板滑动时，rect 轨迹存在问题，与 transition 有关 */}
        <svg className="map-visible-rect" width="100%" height="100%">
          <g
            ref={(ele: any) => {
              this.minimap = d3Select.select(ele);
            }}
            transform={`translate(${screenToMapTransform.x}, ${screenToMapTransform.y}) scale(${screenToMapTransform.k})`}>
            {
              <rect
                width={this.screenWidth}
                height={this.screenHeight}
                fill="rgba(200, 200, 200, .5)"
                stroke="none"
                ref={this.rectRef}
                {...this.props.mapRectStyle}
              />
            }
          </g>
        </svg>
      </div>
    );
  }

  renderScreenContent() {
    const { type, screenHeight } = this.props;
    const width = this.screenWidth || '100%';
    const height = screenHeight ? screenHeight : this.screenHeight || '100%';

    if (type === 'SVG') {
      return React.cloneElement(this.props.children as React.ReactElement<any>, {
        ref: (ele: any) => {
          // TODO
          if (this.screen) {
            return;
          }

          this.screenDOM = ele;
          this.screen = d3Select.select(ele);
          if (isValidSVG(this.screen)) {
            this.screenContent = d3Select.select(ele && ele.firstChild);
          } else {
            return console.log('请确保svg内部用g包裹起来！');
          }
        },
        width,
        height
      });
    } else if (type === 'DOM') {
      return (
        <div
          style={{ width, height, overflow: 'hidden' }}
          ref={(ele: any) => {
            if (this.screen) {
              return;
            }
            this.screenDOM = ele;
            this.screen = d3Select.select(ele);
          }}>
          {React.cloneElement(this.props.children as React.ReactElement<any>, {
            ref: (ele: any) => {
              this.screenContent = d3Select.select(ele);
            }
          })}
        </div>
      );
    } else {
      return null;
    }
  }

  render() {
    const { needMinimap, Buttons, width, height, mapWidth, mapHeight, mapPosition } = this.props;

    const className = this.state.animation ? 'screen screen-animation' : 'screen';

    return (
      <div
        className="regraph"
        ref={(ele: any) => {
          this.ReScreenDOM = ele;
        }}
        style={{
          width,
          height,
          ...getContainerStyle(mapPosition)
        }}
        onClick={this.props.onClick}
        onContextMenu={this.props.onContextMenu}
        onDrop={this.props.onDrop}
        onDragOver={this.props.onDragOver}>
        <div className={className}>
          {/* 绘制画布内容 */}
          {this.renderScreenContent()}
          {/* 绘制按钮控制 */}
          {Buttons && this.renderButtons(Buttons)}
        </div>
        {/* 绘制缩略图 */}
        {needMinimap && this.renderMinimap(mapWidth, mapHeight, mapPosition)}
      </div>
    );
  }
}
