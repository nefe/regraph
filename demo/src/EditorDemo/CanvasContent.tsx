/**
 * @file 处理画布内的操作
 */

import * as React from 'react';
import * as _ from 'lodash';
import * as uuid from 'uuid';
import { ZoomTransform, zoomIdentity } from 'd3-zoom';
import { Menu } from 'antd';
import { ReScreen } from '../../../src';
import { EditorNode } from './EditorNode';
import { EditorEdges } from './EditorEdges';
import { Point, distance, quadratic } from '../../../src/Utils/graph';
import { ContextMenu } from './ContextMenu';
import { MenuType, MenuPos, CONNECTOR, OperateType, Link, Node, NODE_WIDTH, NODE_HEIGHT, LINK_AREA } from './defines';
import {
  findUpstreamNode,
  findAllUpstreamNodes,
  findDownstreamNode,
  findAllDownstreamNodes,
  findAllDownstreamLinks,
  findNearbyNode
} from './utils/find';
import { calcLinkPosition } from './utils/calc';
import { exitFullscreen, launchFullscreen, isFull, getOffset } from '../utils';

class CanvasContentProps {
  ref: any;
  nodes: Node[];
  links: Link[];
  setNodes: (nodes: Node[]) => void;
  setLinks: (links: Link[]) => void;
  selectedLinks: string[];
  setSelectedLinks: (links: string[]) => void;
  selectedNodes: string[];
  setSelectedNodes: (links: string[]) => void;
  /** 当前拖拽的节点 */
  dragNode: Node;
  updateNodes: (node: Node) => void;
  updateLinks: (link: Link) => void;
  deleteNodes: (selectedNodes: string[]) => void;
  deleteLinks: (selectedLinks: string[]) => void;
  copiedNodes: Node[];
  setCopiedNodes: (nodes: Node[]) => void;
}

class CanvasContentState {
  /** 拖拽节点 */
  isDraggingNode: boolean;
  /** 拖拽边 */
  isDraggingLink: boolean;
  /** 拖拽节点 */
  dragNode: Node;
  /** 鼠标位置在拖动节点的偏移量 */
  dragNodeOffset: Point;
  /** 移动边 */
  dragLink: {
    /** 源起节点id */
    originId: string;
    /** 源起节点 */
    originX: number;
    originY: number;
    /** 鼠标移动节点 */
    x: number;
    y: number;
    /** 来源边位置 */
  };
  sourcePos: string;
  /** 对话框展示标志位 */
  menuDisplay: boolean;
  /** 对话框的位置信息 */
  menuPos: MenuPos;
  /** 画布的放大倍率 */
  screenScale: number;
  isKeyPressing: boolean;
  /** 当前鼠标悬浮的节点 */
  currentHoverNode: string;
  /** 删除框 */
  deleteVisible: boolean;
}

export default class CanvasContent extends React.Component<CanvasContentProps, CanvasContentState> {
  currTrans: ZoomTransform;
  nodesContainerRef: any;
  container: any;
  handleApplyTransform: (transform: ZoomTransform) => void;
  screenWidth: number;
  screenHeight: number;

  autoVerticalScroller: any = null;
  autoHorizontalScroller: any = null;

  handleResize: (isLarge: boolean) => void;
  handleAdapt: () => void;
  handleResizeTo: (scale: number, P0?: [number, number]) => void;

  constructor(props) {
    super(props);
    this.state = {
      isDraggingNode: false,
      isDraggingLink: false,
      isKeyPressing: false,
      dragNode: null,
      dragLink: null,
      dragNodeOffset: null,
      menuDisplay: false,
      menuPos: {
        id: '',
        x: 0,
        y: 0
      },
      screenScale: 100,
      sourcePos: '',
      currentHoverNode: '',
      deleteVisible: false
    };
    this.nodesContainerRef = React.createRef();
    this.container = React.createRef();
    this.currTrans = zoomIdentity;

    this.openDialog = this.openDialog.bind(this);
  }

  componentDidMount() {
    this.nodesContainerRef.current.addEventListener('mousedown', this.onNodesContainerMouseDown);
    this.container.current.addEventListener('contextmenu', this.openContainerMenu);
    this.container.current.addEventListener('click', this.onContainerMouseDown);
  }

  componentWillUnmount() {
    this.nodesContainerRef.current.removeEventListener('mousedown', this.onNodesContainerMouseDown);
    this.container.current.removeEventListener('contextmenu', this.openContainerMenu);
    this.container.current.removeEventListener('click', this.onContainerMouseDown);
  }

  componentWillUpdate(nextProps: CanvasContentProps, nextState: CanvasContentState) {
    if (this.state.isDraggingNode !== nextState.isDraggingNode) {
      this.toggleDragNode(nextState.isDraggingNode);
    }
    if (this.state.isDraggingLink !== nextState.isDraggingLink) {
      this.toggleDragLink(nextState.isDraggingLink);
    }
  }

  /** 打开全局操作菜单，包括复制，粘贴，删除等 */
  openContainerMenu = (event: any) => {
    event.preventDefault();
  };

  toggleDragNode = (isDraggingNode: Boolean) => {
    if (isDraggingNode) {
      window.addEventListener('mousemove', this.onDragNodeMouseMove);
      window.addEventListener('mouseup', this.onDragNodeMouseUp);
    } else {
      window.removeEventListener('mousemove', this.onDragNodeMouseMove);
      window.removeEventListener('mouseup', this.onDragNodeMouseUp);
    }
  };

  toggleDragLink = (isDraggingLink: Boolean) => {
    if (isDraggingLink) {
      window.addEventListener('mousemove', this.onDragLinkMouseMove);
      window.addEventListener('mouseup', this.onDragLinkMouseUp);
    } else {
      window.removeEventListener('mousemove', this.onDragLinkMouseMove);
      window.removeEventListener('mouseup', this.onDragLinkMouseUp);
    }
  };

  onDragLinkMouseMove = (event: any) => {
    event.stopPropagation();
    event.preventDefault();

    const { offsetTop, offsetLeft } = getOffset(this.container.current);
    const screenX = event.clientX - offsetLeft;
    const screenY = event.clientY - offsetTop;

    const { k, x, y } = this.currTrans;

    this.setState(preState => {
      const { dragLink } = preState;
      return {
        dragLink: {
          ...dragLink,
          x: (screenX - x) / k,
          y: (screenY - y) / k
        }
      };
    });
  };

  /** 监听整个区域，提升性能 */
  onNodesContainerMouseDown = (event: any) => {
    event.stopPropagation();
    const { nodes } = this.props;
    if (nodes && nodes.length > 0) {
      const component = _.find(nodes, c => {
        if (c.ref && c.ref.current) {
          return c.ref.current.contains(event.target);
        }
        return false;
      });

      const type = event.target.dataset && event.target.dataset.type;
      const position = event.target.dataset && event.target.dataset.position;

      if (component) {
        if (type === 'edge' && position) {
          /** 拖拽连线 */
          this.onDragLinkMouseDown(component as any, position);
          return;
        } else if (type === 'resize') {
          return;
        } else {
          /** 拖拽节点，排除resize节点 */
          this.onDragNodeMouseDown(component as any, event);
        }
      }
    }
  };

  /** 监听整个容器click事件 */
  onContainerMouseDown = (event: any) => {
    // event.stopPropagation();

    // 过滤掉节点和边
    const path = event.path;
    const isNodeOrLink = this.hasNodeOrLink(path, 'editor-node', 'editor-link');
    if (!isNodeOrLink) {
      // 清空高亮的节点和边
      this.handleClearActive();
    }
  };

  /** 监听整个容器mousemove 事件 */
  onNodesContainerMouseMove = (event: any) => {
    event.preventDefault();
    const path = event.path;
    const isNodeOrLink = this.hasNodeOrLink(path, 'editor-node', 'editor-link');
    const { nodes } = this.props;

    if (nodes && nodes.length > 0) {
      const currentNode = _.find(nodes, c => {
        if (c.ref && c.ref.current) {
          return c.ref.current.contains(event.target);
        }
        return false;
      }) as Node;

      if (currentNode) {
        if (isNodeOrLink) {
          this.setState({
            currentHoverNode: currentNode.id
          });
        } else {
          this.setState({
            currentHoverNode: ''
          });
        }
      }
    }
  };

  /** 按下节点 */
  onDragNodeMouseDown = (node: Node, event: any) => {
    const { k, x, y } = this.currTrans;

    const { offsetTop, offsetLeft } = getOffset(this.container.current);
    const screenX = event.clientX - offsetLeft;
    const screenY = event.clientY - offsetTop;

    this.setState(preState => {
      // 计算鼠标位置在节点中的偏移量
      return {
        isDraggingNode: true,
        dragNode: node,
        dragNodeOffset: {
          x: (screenX - x) / k - node.x,
          y: (screenY - y) / k - node.y
        }
      };
    });
  };

  /** 鼠标按下，进行连线 */
  onDragLinkMouseDown = (node: Node, position: string) => {
    const { x, y } = calcLinkPosition(node, position);
    this.setState({
      isDraggingLink: true,
      dragLink: {
        originId: node.id,
        originX: x,
        originY: y,
        x,
        y
      },
      sourcePos: position
    });
  };

  /** 鼠标抬起，连线结束 */
  onDragLinkMouseUp = (event: any) => {
    const { setLinks, links, nodes } = this.props;
    const { dragLink } = this.state;
    const { offsetTop, offsetLeft } = getOffset(this.container.current);
    const screenX = event.clientX - offsetLeft;
    const screenY = event.clientY - offsetTop;

    const { k, x, y } = this.currTrans;

    const nearNode = findNearbyNode(
      {
        x: (screenX - x) / k,
        y: (screenY - y) / k
      },
      nodes,
      LINK_AREA
    );

    // 需要找到链接的是哪个节点

    if (nearNode) {
      const { targetNode, targetPos } = nearNode;
      const newLink = {
        id: dragLink.originId + CONNECTOR + targetNode.id + CONNECTOR + targetPos,
        source: dragLink.originId,
        target: targetNode.id,
        sourcePos: this.state.sourcePos,
        targetPos
      };
      setLinks([...links, newLink]);
    }

    this.setState({
      isDraggingLink: false,
      dragLink: null,
      sourcePos: ''
    });
  };

  /** 移动节点 */
  onDragNodeMouseMove = (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    const { setNodes, nodes } = this.props;

    const { k, x, y } = this.currTrans;

    const { offsetTop, offsetLeft } = getOffset(this.container.current);
    const screenX = event.clientX - offsetLeft;
    const screenY = event.clientY - offsetTop;

    // 判断当前节点平移后是否溢出画布
    // const isOver = this.checkNodeIsOverScreen(dragNode, screenX, screenY);

    // if (!isOver) {
    this.setState(preState => {
      const { dragNode, dragNodeOffset } = preState;

      const newX = (screenX - x) / k - dragNodeOffset.x;
      const newY = (screenY - y) / k - dragNodeOffset.y;

      return {
        ...preState,
        dragNode: {
          ...dragNode,
          x: newX,
          y: newY
        }
      };
    });

    const { dragNodeOffset, dragNode } = this.state;

    setNodes(
      nodes.map(c => {
        return c.id === dragNode.id
          ? {
              ...c,
              x: (screenX - x) / k - dragNodeOffset.x,
              y: (screenY - y) / k - dragNodeOffset.y
            }
          : c;
      })
    );
  };

  /** 放开节点 */
  onDragNodeMouseUp = (event: any) => {
    event.stopPropagation();
    // this.moveStop(true);
    // this.moveStop(false);

    this.setState(preState => {
      const { dragNode } = preState;

      return {
        ...preState
      };
    });
    this.setState({
      isDraggingNode: false
    });
  };

  getTransformInfo = (currTrans: ZoomTransform) => {
    this.currTrans = currTrans;
  };

  getScreenHandler = handleMap => {
    this.handleApplyTransform = handleMap.handleApplyTransform;
    this.handleResize = handleMap.handleResize;
    this.handleResizeTo = handleMap.handleResizeTo;
    this.handleAdapt = handleMap.handleAdapt;
    this.screenWidth = handleMap.screenWidth;
    this.screenHeight = handleMap.screenHeight;
  };

  onDrag(event, name: string) {}

  onDrop(event: React.DragEvent<HTMLDivElement>) {
    const { setNodes, nodes, dragNode } = this.props;
    const { offsetTop, offsetLeft } = getOffset(this.container.current);
    const screenX = event.clientX - offsetLeft;
    const screenY = event.clientY - offsetTop;

    const { k, x, y } = this.currTrans;

    if (dragNode) {
      const { key, name, type, width, height } = dragNode;

      const newNode = {
        key,
        name,
        type,
        width,
        height,
        x: (screenX - x) / k - NODE_WIDTH / 2,
        y: (screenY - y) / k - NODE_HEIGHT / 2,
        id: uuid.v4(),
        ref: React.createRef()
      };

      setNodes([...nodes, newNode]);
    }
  }

  /** 点击打开菜单栏 */
  openDialog(id: string, type: MenuType, event: React.MouseEvent<HTMLLIElement>) {
    event.preventDefault();
    event.stopPropagation();
    const { k, x, y } = this.currTrans;
    const { offsetTop, offsetLeft } = getOffset(this.container.current);
    const screenX = event.clientX - offsetLeft;
    const screenY = event.clientY - offsetTop;

    const newX = (screenX - x) / k;
    const newY = (screenY - y) / k;
    this.setState({
      menuDisplay: true,
      menuPos: {
        id,
        x: newX,
        y: newY
      }
    });
  }

  /** 清空高亮组件和连线 */
  handleClearActive = () => {
    this.props.setSelectedLinks([]);
    this.props.setSelectedNodes([]);
  };

  /** 判断点击的节点是否为节点和边 */
  hasNodeOrLink = (array: any[], node?: string, link?: string) => {
    let isNodeOrLink = false;

    for (let i = 0; i < array.length; i++) {
      const inNode = _.includes(array[i].classList, node);
      const inLink = _.includes(array[i].classList, link);

      if (inNode || inLink) {
        isNodeOrLink = true;
        break;
      }
    }
    return isNodeOrLink;
  };

  /** 改变缩放倍率 */
  changeScreenScale = (screenScale: number) => {
    this.setState({
      screenScale
    });
  };

  /** 处理全屏事件 */
  handleFullScreen = () => {
    const fullScreen = isFull();
    if (fullScreen) {
      exitFullscreen();
    } else {
      launchFullscreen(this.container.current);
    }
  };

  renderDragSource() {
    const dragSourceList = ['组件1', '组件2'];

    return (
      <div className="flow-drag-source">
        {dragSourceList.map((name, index) => {
          return (
            <div className="flow-drag-source-item" key={index} draggable onDrag={event => this.onDrag(event, name)}>
              {name}
            </div>
          );
        })}
      </div>
    );
  }

  /** 点击连线 */
  onSelectLink = (key: string) => {
    const { selectedLinks, setSelectedLinks } = this.props;
    if (selectedLinks) {
      // 若连线已高线，则取消高亮状态
      const index = _.findIndex(selectedLinks, link => link === key);
      if (index > -1) {
        setSelectedLinks([...selectedLinks.slice(0, index), ...selectedLinks.slice(index + 1)]);
      } else {
        setSelectedLinks([...selectedLinks, key]);
      }
    } else {
      setSelectedLinks([key]);
    }
  };

  /** 点击节点 */
  onClickNode = (currentNode: Node) => {
    const { selectedNodes, setSelectedNodes } = this.props;
    const { isKeyPressing } = this.state;
    // 区分多选按钮是否按下
    if (isKeyPressing) {
      if (selectedNodes) {
        // 若节点已被点击则清除点击状态
        const index = _.findIndex(selectedNodes, id => id === currentNode.id);
        if (index > -1) {
          setSelectedNodes([...selectedNodes.slice(0, index), ...selectedNodes.slice(index + 1)]);
        } else {
          setSelectedNodes(_.compact([...selectedNodes, currentNode.id]));
        }
      } else {
        setSelectedNodes([currentNode.id]);
      }
    } else {
      this.props.setSelectedNodes([currentNode.id]);
      // 清空高亮的连线
      this.props.setSelectedLinks(null);
    }
  };

  /** 被连线的节点 */
  onSelectNode = (currentNode: Node, key: OperateType) => {
    const { selectedNodes, deleteNodes } = this.props;
    if (key === OperateType.delete) {
      // 删除组件以及删除连线
      // 判断改节点是否在多选区域内
      if (selectedNodes && selectedNodes.includes(currentNode.id)) {
        deleteNodes(_.compact([...selectedNodes, currentNode.id]));
      } else {
        deleteNodes([currentNode.id]);
      }
    }
  };

  /** 右键连线 */
  onContextMenuLink = (key: string, event: React.MouseEvent<SVGPathElement, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.setSelectedLinks([key]);
    // 清空高亮的组件
    this.props.setSelectedNodes(null);

    const currentPos = {
      x: event.clientX,
      y: event.clientY
    };
    this.setState({
      deleteVisible: true,
      menuPos: currentPos
    });
  };

  /** 伸缩节点 */
  onResize = (node: Node, width: number, height: number, x: number, y: number) => {
    const { updateNodes } = this.props;
    const newNode = {
      ...node,
      width,
      height,
      x,
      y
    };
    updateNodes(newNode);
  };

  renderCanvas = () => {
    const { currentHoverNode } = this.state;
    const { nodes, links, selectedNodes, selectedLinks } = this.props;
    return (
      <div className="editor-view">
        <div className="editor-view-content" ref={this.nodesContainerRef}>
          {nodes.map(child => {
            const id = child.id;
            const isSelected = selectedNodes ? selectedNodes.includes(id) : false;
            const showSelector = isSelected || currentHoverNode === id;
            return (
              <EditorNode
                nodeRef={child.ref}
                currentNode={child}
                key={id}
                onClick={this.onClickNode}
                isSelected={isSelected}
                showSelector={showSelector}
                onResize={this.onResize.bind(this, child)}
                currTrans={this.currTrans}
                onSelect={this.onSelectNode}
              />
            );
          })}
          <EditorEdges
            links={links}
            nodes={nodes}
            selectedLinks={selectedLinks}
            onContextMenu={this.onContextMenuLink}
            onSelectLink={this.onSelectLink}
            isDraggingLink={this.state.isDraggingLink}
            dragLink={this.state.dragLink}
          />
        </div>
      </div>
    );
  };

  render() {
    const { deleteVisible, menuPos } = this.state;
    return (
      <div className="canvas-container-content" ref={this.container}>
        <ReScreen
          type="DOM"
          getScreenHandler={this.getScreenHandler}
          needMinimap={true}
          needRefresh={true}
          zoomEnabled={false}
          mapPosition="RB-IN"
          mapWidth={320}
          mapHeight={120}
          onScreenChange={this.getTransformInfo}
          onDragOver={event => {
            event.preventDefault();
          }}
          onDrop={this.onDrop.bind(this)}>
          {this.renderCanvas()}
        </ReScreen>
        {/** 删除连线的菜单 */}
        <ContextMenu
          visible={deleteVisible}
          // onHide={() => {
          //   this.props.setLinks(null);
          //   this.setState({
          //     deleteVisible: false
          //   });
          // }}
          left={menuPos.x}
          top={menuPos.y}
          // onClick={this.handleDeleteLinks.bind(this, selectedLinks)}
        >
          <Menu getPopupContainer={(triggerNode: any) => triggerNode.parentNode}>
            {[
              {
                name: '删除',
                key: OperateType.delete
              }
            ].map(child => {
              return <Menu.Item key={child.key}>{child.name}</Menu.Item>;
            })}
          </Menu>
        </ContextMenu>
      </div>
    );
  }
}
