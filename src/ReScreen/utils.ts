/**  确保svg内部由g包裹，这样才能实现元素的平移缩放 */
export function isValidSVG(parentNode: any) {
  if (!parentNode) {
    console.log("svg元素不存在");
    return false;
  }
  const node = parentNode.node();
  const childNodes = node.childNodes;
  if (!childNodes) {
    return false;
  } else if (childNodes.length > 1) {
    return false;
  } else {
    const nodeName = childNodes[0].nodeName;
    return nodeName === "g";
  }
}
/**
 * 全屏某一个元素
 * @param element
 */
export function requestFullscreen(element: any) {
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
export function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
  }
}

export function getContainerStyle(mapPositon: "RT" | "RB" | "LT" | "LB" | 'RT-IN' | 'RB-IN' | 'LT-IN' | 'LB-IN'): object {
  switch (mapPositon) {
    case "RB":
      return {
        alignItems: "flex-end"
      };
    case "LT":
      return {
        flexDirection: "row-reverse"
      };
    case "LB":
      return {
        alignItems: "flex-end",
        flexDirection: "row-reverse"
      };  
    default:
      return;
  }
}


export function getMapStyle(mapPositon: "RT" | "RB" | "LT" | "LB" | 'RT-IN' | 'RB-IN' | 'LT-IN' | 'LB-IN'): object {
  switch (mapPositon) { 
    case "RB-IN":
      return {
        position: "absolute",
        right: 0,
        bottom: 0
      };
    case "LT-IN":
      return {
        position: "absolute",
        left: 0,
        top: 0
      };
    case "LB-IN":
      return {
        position: "absolute",
        left: 0,
        bottom: 0
      };
    case "RT-IN": 
      return {
        position: "absolute",
        right: 0,
        top: 0
      } 
    default:
      return;
  }
}
