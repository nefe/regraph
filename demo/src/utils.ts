/**
 * @file demo公共方法
 * @author perkinJ
 */

/**
 * 全屏某一个元素
 * @param element
 */
function launchFullscreen(element: any) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
}
/**
 * 退出全屏
 */
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
  }
}

/**
 * 判断是否处于全屏状态
 */
function isFull() {
  const doc = document as any;
  return doc.fullscreenElement || doc.webkitFullscreenElement;
}

/**
 * 获取元素相对于页面的绝对位置
 */
function getOffset(domNode: any) {
  let offsetTop = 0;
  let offsetLeft = 0;
  let targetDomNode = domNode;
  while (targetDomNode !== window.document.body && targetDomNode != null) {
    offsetLeft = offsetLeft + targetDomNode.offsetLeft;
    offsetTop = offsetTop + targetDomNode.offsetTop;
    targetDomNode = targetDomNode.offsetParent;
  }
  return {
    offsetTop,
    offsetLeft
  };
}

export { launchFullscreen, exitFullscreen, isFull, getOffset };
