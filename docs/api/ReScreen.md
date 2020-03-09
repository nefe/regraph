---
order: 1
chinese: ReScreen使用文档
english: ReScreen document
---

# ReScreen

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

## 调用方法

```js
import { ReScreen } from 'regraph-next';

<ReScreen  
  height = {500}
  width = {500}
  mapWidth = {200}
  mapHeight = {200}
  mapPosition = "RT-IN" >
  <svg>
    <g>
      <circle cx={0} cy={0} r={500} fill="yellow" />
      <circle cx={cx} cy={cy} r={250} fill="red" /> 
    </g>
  </svg> 
</ReScreen>
```

## API
| 参数           | 说明     | 类型         | 默认值                                                                    |
| -------------- | -------- | --------------- | ------------------------------------------------------------------------------ |
| type | 画布内容的类型 | 枚举值，可选值（`SVG` ,`DOM`) | SVG |
| width | 组件整体的尺寸，支持传入百分数 | number/string | - | 
| height | 组件整体的尺寸，支持传入百分数 | number/string | - | 
| zoomEnabled | 是否启动鼠标滚动缩放画布 | boolean | true | 
| focusEnabled | 是否启动聚焦功能，0表示不启动，1表示单击触发，2表示双击触发 | number | 0 | 
| minZoom | 缩放范围，最小值 | number | - |
| maxZoom | 缩放范围，最大值 | number | - |
| dragDirection | `ALL`,`HOR`, `VER` | 拖拽方向的锁定 | `ALL` |
| needMinimap | 是否需要缩略图 | boolean | true |
| minimap | React.ReactElement<any> | 支持自定义传入缩略图组件 | - |
| mapPosition | `RT`, `RB`, `LT`, `LB`,  `RT-IN`, `RB-IN`, `LT-IN`, `LB-IN` | 缩略图位置，右上角；-IN表示在画布的内部 | 默认为`RT` |
| mapPadding | 缩略图和原图之间的大小 | number | 20 | 
| mapWidth | 缩略图大小 | number | 100px | 
| mapHeight | 缩略图大小 | number | 100px | 
| mapRectStyle | 缩略图矩形的样式 | object | - |
| Buttons | 按钮组件 | React.ReactElement<any> | - |
| needRefresh | 由于画布元素的变化而引起的视图变化 | boolean | - |
| resetNeedRefresh | 通知外层重置needRefresh为false | function | - |
| onScreenChange | 画布发生变化时的回调，对外暴露当前的缩放信息 | (transform: ZoomTransform) => void | - |
| getScreenHandler | 对外暴露画布操作函数 | any | - |

## 注意事项

- SVG 元素请用 g 将元素包裹起来
- 当前暂未支持Canvas
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
