import React from 'react';
import ticker from 'rc-tween-one/lib/ticker';
import easingTypes from 'tween-functions';

/**
 * check is null
 * @param obj
 * @returns {boolean}
 */
const isNull = function (obj) {
  return obj == null;
};

/**
 * check is number
 * @param val
 * @returns {boolean}
 */
const isNumber = function (val) {
  return (typeof val === 'number') && !isNaN(val);
};

/**
 * 判断是否为对象
 * @param value
 * @returns {boolean}
 */
const isObject = function (value) {
  const type = typeof value;
  return value !== null && (type === 'object' || type === 'function');
};

/**
 * check is function
 * @param value
 * @returns {boolean}
 */
const isFunction = function (value) {
  if (!isObject(value)) {
    return false
  }
  return typeof value === 'function' || (value.constructor !== null && value.constructor === Function)
};

/**
 * is date value
 * @param val
 * @returns {boolean}
 */
const isDate = function (val) {
  return toString.call(val) === '[object Date]'
};

/**
 * 判断是否为合法字符串
 * @param value
 * @returns {boolean}
 */
const isString = function (value) {
  if (value == null) {
    return false
  }
  return typeof value === 'string' || (value.constructor !== null && value.constructor === String)
};

/**
 * merge
 * @param target
 * @returns {*}
 */
const merge = function (target) {
  for (let i = 1, j = arguments.length; i < j; i++) {
    let source = arguments[i] || {};
    for (let prop in source) {
      if (source.hasOwnProperty(prop)) {
        let value = source[prop];
        if (value !== undefined) {
          target[prop] = value;
        }
      }
    }
  }
  return target
};

/**
 * foreach object or array
 * @param obj
 * @param fn
 */
const forEach = function (obj, fn) {
  if (obj === null || typeof obj === 'undefined') {
    return;
  }
  if (typeof obj !== 'object') {
    obj = [obj];
  }
  if (Array.isArray(obj)) {
    for (let i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
};

/**
 * check isEmpty object
 * @param object
 * @returns {boolean}
 */
const isEmpty = function (object) {
  let property;
  for (property in object) {
    return false;
  }
  return !property;
};

/**
 * bind
 * @param fn
 * @param context
 * @returns {Function}
 */
const bind = function (fn, context) {
  const args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
  return function () {
    return fn.apply(context, args || arguments);
  }
};

/**
 * 返回浮点数
 * @param path
 * @param zhCN
 * @returns {string}
 */
function getLocalizedPathname (path, zhCN) {
  const pathname = path.startsWith('/') ? path : `/${path}`;
  if (!zhCN) { // to enUS
    return /\/?index-cn/.test(pathname) ? '/' : pathname.replace('-cn', '');
  } else if (pathname === '/') {
    return '/map-cn';
  } else if (pathname.endsWith('/')) {
    return pathname.replace(/\/$/, '-cn/');
  }
  return `${pathname}-cn`;
}

function toArrayChildren (children) {
  const ret = [];
  React.Children.forEach(children, (c) => {
    ret.push(c);
  });
  return ret;
}

function currentScrollTop () {
  return window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;
}

function scrollTo (number) {
  const scrollTop = currentScrollTop();
  if (scrollTop !== number) {
    const tickerId = `scrollToTop-${Date.now()}`;
    const startFrame = ticker.frame;
    ticker.wake(tickerId, () => {
      const moment = (ticker.frame - startFrame) * ticker.perFrame;
      const ratio = easingTypes.easeInOutCubic(moment, scrollTop, number, 450);
      window.scrollTo(window.scrollX, ratio);
      if (moment >= 450) {
        ticker.clear(tickerId);
      }
    });
  }
}

function scrollClick (e) {
  const id = e.currentTarget.getAttribute('href').split('#')[1];
  const element = document.getElementById(id);
  let toTop;
  if (element) {
    toTop = element.getBoundingClientRect().top;
    const docTop = document.documentElement.getBoundingClientRect().top;
    toTop = Math.round(toTop) - Math.round(docTop);
    scrollTo(toTop);
  }
}

function getMenuItems(moduleData) {
  const menuMeta = moduleData.map(item => item.meta);
  const menuItems = [];
  const sortFn = (a, b) => (a.order || 0) - (b.order || 0);
  menuMeta.sort(sortFn).forEach((meta) => {
    if (!meta.category) {
      menuItems.push(meta);
    } else {
      const category = meta.category;
      let group = menuItems.filter(i => i.title === category)[0];
      if (!group) {
        group = {
          type: 'category',
          title: category,
          children: []
        };
        menuItems.push(group);
      }
      group.children.push(meta);
    }
  });
  return menuItems.map((i) => {
    const item = i;
    if (item.children) {
      item.children = item.children.sort(sortFn);
    }
    return item;
  }).sort(sortFn);
}

function fileNameToPath(filename) {
  const snippets = filename.replace(/(\/index)?((\.zh-CN)|(\.en-US))?\.md$/i, '').split('/');
  return snippets[snippets.length - 1];
}

export {
  bind,
  isDate,
  merge,
  isNull,
  forEach,
  isEmpty,
  isString,
  isObject,
  isNumber,
  isFunction,
  getLocalizedPathname,
  toArrayChildren,
  currentScrollTop,
  scrollTo,
  scrollClick,
  getMenuItems,
  fileNameToPath
}
