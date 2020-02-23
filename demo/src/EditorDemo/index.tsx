import * as React from 'react';
import * as _ from 'lodash';
import * as uuid from 'uuid';
import { Toolbar, NodePanel } from './Components';
import CanvasContent from './CanvasContent';
import { useEditorStore } from './Store/useEditorStore';
import { useKeyPress } from './Store/useKeyPress';
import './index.scss';

const { useState, useRef, useEffect } = React;

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
    updateNodes,
    updateLinks,
    copiedNodes,
    setCopiedNodes
  } = useEditorStore();

  // 画布容器
  const screenRef = useRef(null);

  // 画布 ref
  const canvasRef = useRef({
    getWrappedInstance: () => Object
  } as any);

  const canvasInstance = canvasRef.current;

  /** 删除组件 */
  const handleDeleteNodes = (ids: string[]) => {
    if (!ids) {
      return;
    }
    // 删除与组件相连的连线，不论上游或下游

    const newLinks = _.cloneDeep(links);
    ids.forEach(id => {
      // 删除与节点连接的任意边
      _.remove(newLinks, link => link.source === id || link.target === id);
    });
    // 更新连线
    setLinks(newLinks);

    // 剔除components
    const cloneNodes = _.cloneDeep(nodes);
    const newNodes = _.remove(cloneNodes, item => !ids.includes(item.id));

    setNodes(newNodes);

    // 清空高亮状态
    setSelectedLinks([]);
    setSelectedNodes([]);
  };

  /** 删除连线 */
  const handleDeleteLinks = (activeLinks: string[]) => {
    if (!activeLinks) {
      return;
    }
    const linkList = links.map(link => link.id);
    const diffLinks = _.difference(linkList, activeLinks);
    const newLinks = diffLinks ? diffLinks.map(link => _.find(links, item => item.id === link)) : [];
    setLinks(newLinks);
  };

  /** 复制节点 */
  const handleNodesCopy = (ids: string[]) => {
    const newCopiedNodes = ids.map(id => {
      return _.find(nodes, item => item.id === id);
    });

    setCopiedNodes(newCopiedNodes);
  };

  /** 粘贴节点 */
  const handleNodesPaste = () => {
    if (copiedNodes) {
      const currentCopied = copiedNodes.map(node => {
        return {
          ...node,
          id: uuid.v4(),
          /**  @todo 后续可优化布局算法 */
          x: node.x + node.width + 20,
          ref: React.createRef()
        };
      });
      setCopiedNodes(currentCopied);
      setNodes([...nodes, ...currentCopied]);
    }
  };

  useKeyPress(
    'delete',
    () => {
      if (selectedNodes) {
        handleDeleteNodes(selectedNodes);
      }
      if (selectedLinks) {
        handleDeleteLinks(selectedLinks);
      }
    },
    {
      events: ['keydown', 'keyup']
    }
  );

  const isMac = navigator.platform.startsWith('Mac');

  useKeyPress(isMac ? ['meta.c'] : ['ctrl.c'], () => {
    if (selectedNodes) {
      handleNodesCopy(selectedNodes);
    }
  });

  useKeyPress(isMac ? ['meta.v'] : ['ctrl.v'], () => {
    if (copiedNodes) {
      handleNodesPaste();
    }
  });

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
  const renderNodePanel = (
    <div className="editor-nodePanel">
      <NodePanel onDrag={setDragNode} />
    </div>
  );

  /** 渲染中间画布区 */
  const renderCanvas = (
    <div className="editor-canvas">
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
        updateLinks={updateLinks}
        deleteNodes={handleDeleteNodes}
        deleteLinks={handleDeleteLinks}
        copiedNodes={copiedNodes}
        setCopiedNodes={setCopiedNodes}
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
