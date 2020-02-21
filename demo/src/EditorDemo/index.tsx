import * as React from 'react';
import { Toolbar, NodePanel } from './Components';
import CanvasContent from './CanvasContent';
import { useEditorStore } from './Store/useEditorStore';
import './index.scss';

const { useState, useRef } = React;

export default function EditorDemo(props) {
  const [screenScale, changeScreenScale] = useState(100);
  const {
    nodes,
    links,
    setNodes,
    setLinks,
    selectedLinks,
    setSelectedLinks,
    dragNode,
    setDragNode,
    selectedNodes,
    setSelectedNodes,
    updateNodes
  } = useEditorStore();

  // 画布容器
  const screenRef = useRef(null);

  // 画布 ref
  const canvasRef = useRef({
    getWrappedInstance: () => Object
  } as any);

  const canvasInstance = canvasRef.current;

  /** 操作区 */
  const renderOperation = (
    <div>
      <Toolbar
        ref={screenRef}
        screenScale={screenScale}
        changeScreenScale={changeScreenScale}
        handleResizeTo={canvasInstance && canvasInstance.handleResizeTo}
        items={['fullscreen', 'zoom', 'adapt', 'format', 'ratio']}
        layout={canvasInstance && canvasInstance.layout}
      />
    </div>
  );
  /** 渲染节点选择区 */
  const renderNodePanel = <div className="editor-nodePanel">
  <NodePanel onDrag={setDragNode} />
</div>

  /** 渲染中间画布区 */
  const renderCanvas = (
    <div className="editor-canvas" >
      <CanvasContent
        dragNode={dragNode}
        ref={canvasRef}
        nodes={nodes}
        links={links}
        setNodes={setNodes}
        setLinks={setLinks}
        selectedLinks={selectedLinks}
        setSelectedLinks={setSelectedLinks}
        selectedNodes={selectedNodes}
        setSelectedNodes={setSelectedNodes}
        updateNodes={updateNodes}
      />
    </div>
  );

  /** 渲染配置区 */
  const renderProperty = <div className="editor-property"></div>;

  return (
    <div className="editor-demo" ref={screenRef}>
      <div className="editor-operation">{renderOperation}</div>
      <div className="editor-container">
        {renderNodePanel}
        {renderCanvas}
        {renderProperty}
      </div>
    </div>
  );
}
