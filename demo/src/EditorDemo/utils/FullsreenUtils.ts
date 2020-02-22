/**
 * @file 全屏工具类
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
export { launchFullscreen, exitFullscreen, isFull };
