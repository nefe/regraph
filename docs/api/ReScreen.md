---
order: 2
chinese: ReScreen API
english: ReScreen API
---

# ReScreen 组件说明

ReScreen 组件统一封装了画布的操作和缩略图功能，支持对画布的全屏、复位、显示所有、重置、平移缩放等常见功能。

组件使用上比较灵活，支持以下各种情况：

- 画布内容为 SVG，或者原生 DOM，目前暂未支持 Canvas 情况
- 支持只显示缩略图，或者只显示画布的控制按钮，或者两个都显示
- 支持控制按钮的自定义
- 支持缩略图的自定义传入，默认使用画布的缩小版
- 支持缩略图的位置、大小、间距等样式设置
- 支持是否启动鼠标滚动缩放
- 支持缩放的范围设置
- 支持锁定某一方向的拖拽
- 支持缩略图的点击聚焦操作
- 支持外部传入缩放比例控制

## 1. 调用方法

```js
import { ReScreen } from 'ReGraph';

<ReScreen>
  <svg>
    <g>
      <circle cx={0} cy={0} r={500} fill="yellow" />
    </g>
  </svg>
</ReScreen>;
```

## 2. Demo

\${ReScreenDemo}

## 3. API

```javascript
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
  /** 支持自定义传入缩略图组件 */
  Minimap?: React.ReactElement<any>;
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
  getScreenHandler?: any;
```

## 4、注意事项

- SVG 元素请用 g 将元素包裹起来
- 自定义的按钮组件默认提供以下事件：

```javascript
class ButtonsProps {
  handleFullScreen: () => void;
  handleResetPosition: () => void;
  handleShowAll: () => void;
  handleResetStatus: () => void;
  handleResize: (isLarge: boolean) => void;
  handleResizeTo: (scale: number) => void;
  handleFocusTarget: (evt: any) => void;
  handleApplyTransform: (transform: any) => void;
}
```

所以，按钮组件可以调用这些现成的画布操作方法。
