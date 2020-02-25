---
order: 0
chinese: ReScreen 示例
english: ReScreen Demo
---

```jsx
import * as React from 'react';
import { ReScreen } from '../../../../src';
import { ButtonsProps } from '../../../../src/ReScreen';
import './ReScreenDemo.scss';
import { zoomIdentity } from 'd3-zoom';

const TYPE: 'DOM' | 'SVG' | 'CANVAS' = 'DOM';

class Btn extends React.Component<any, any> {
  render() {
    return (
      <div className={`my-btn`}>
        <button onClick={this.props.handleFullScreen}> 全屏 </button>
        <button onClick={this.props.handleResetPosition}> 复位 </button>
        <button onClick={this.props.handleShowAll}> 显示所有 </button>
        <button
          onClick={() => {
            this.props.resetScreenContent();
            // 触发画布的变化
            this.props.handleResetStatus();
          }}>
          重置
        </button>
        <button onClick={() => this.props.handleResize(true)}> 放大 </button>
        <button onClick={() => this.props.handleResize(false)}> 缩小 </button>
        <button onClick={this.props.handleRevert}> 撤销 </button>
      </div>
    );
  }
}

class App extends React.Component<any, any> {
  state = {
    width: 1000,
    height: 800,
    cx: 250,
    cy: 250,
    scale: 1,
    currTrans: {
      k: 1,
      x: 0,
      y: 0
    },
    k: 1,
    x: 0,
    y: 0,
    needRefresh: false
  };

  resetStatus = () => {
    this.setState({
      cx: 250,
      cy: 250,
      width: 1000,
      height: 800
    });
  };

  handleClick = () => {
    this.setState({
      cx: Math.random() * 250,
      cy: Math.random() * 1000,
      width: Math.random() * 1000,
      height: Math.random() * 1000
    });

    // 这里是为了在下一轮的state中再更新
    setTimeout(() => {
      this.setState({
        needRefresh: true
      });
    }, 0);
  };

  handleTransform = () => {
    const { k, x, y } = this.state;
    const trans = zoomIdentity.translate(x, y).scale(k);
    funMap.handleApplyTransform(trans);
  };

  handleResize = () => {
    funMap.handleResizeTo(this.state.scale);
  };

  // 可以看成OneScreen画布缩放之后的回调
  getTransformInfo = currTrans => {
    this.setState({
      currTrans
    });
  };

  inputChange = (event, key) => {
    let value = event.target.value;
    this.setState({
      [key]: Number(value)
    });
  };

  getScreenHandler(handleMap) {
    funMap = handleMap;
    const { screenWidth, screenHeight } = funMap;
    const trans = zoomIdentity.translate(100, 100).scale(1);
    funMap.handleApplyTransform(trans);
  }

  resetNeedRefresh = () => {
    this.setState({
      needRefresh: false
    });
  };
  render() {
    const { cx, cy, needRefresh, height, width, currTrans, scale, k, x, y } = this.state;
    return (
      <div className="app">
        <h1>OneScreen Demo</h1>
        <p>操作说明：点击画布，可以模拟画布内容变化；点击缩略图，可以聚焦，配置项为focusEnabled。</p>
        <p>【显示所有】功能有时候会受缩放范围的限制不生效，如果需要【显示所有】功能，建议不要开启缩放范围设置。</p>
        <div className="status">
          当前缩放为：
          {JSON.stringify(currTrans)}
        </div>
        <ReScreen
          type={TYPE}
          height={500}
          width={500}
          mapRectStyle={{ stroke: 'black', strokeWidth: '4' }}
          mapWidth={200}
          mapHeight={200}
          mapPosition="RT-IN"
          mapPadding={20}
          focusEnabled={2}
          getScreenHandler={this.getScreenHandler}
          onScreenChange={this.getTransformInfo}
          needRefresh={needRefresh}
          resetNeedRefresh={this.resetNeedRefresh}
          Buttons={<Btn handleRevert={this.handleRevert} resetScreenContent={this.resetStatus} />}>
          {TYPE === 'SVG' ? (
            <svg id="svg" onClick={this.handleClick}>
              <g>
                <circle cx={0} cy={0} r={500} fill="yellow" />
                <circle cx={cx} cy={cy} r={250} fill="red" />
              </g>
            </svg>
          ) : (
            <div className="dom-content" style={{ width, height }} onClick={this.handleClick}>
              <div className="dom-div-1" />
              <div className="dom-div-2" />
              <div className="dom-div-3" />
            </div>
          )}
        </ReScreen>
      </div>
    );
  }
}

ReactDOM.render(<App />, mountNode);
```
