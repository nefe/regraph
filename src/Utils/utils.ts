/**
 * @file 统一工具方法，简版 lodash
 */

type fn<T, TResult> = (item: T) => TResult

/**
 * 简版 lodash.find 
 * @param array 目标数组
 * @param func 查找函数
 */
export function find<T>(array: T[], func: fn<T, boolean>): T | undefined {
  for (let i = 0; i < array.length; i++) {
    if (func(array[i])) {
      return array[i];
    }
  }
  return undefined;
}

/**
 * 简版 lodash.findIndex
 * @param array 目标数组
 * @param func 查找函数
 */
export function findIndex<T>(array: T[], func: fn<T, boolean>): number {
  for (let i = 0; i < array.length; i++) {
    if (func(array[i])) {
      return i;
    }
  }
  return -1;
}

export function minBy<T, U>(array: T[], fn: fn<T, U>): T | undefined {
  return array.reduce((pre, cur) => {
    if (!pre) return cur;
    if (fn(cur) < fn(pre)) return cur;
    return pre;
  }, undefined);
}

export function maxBy<T, U>(array: T[], fn: fn<T, U>): T | undefined {
  return array.reduce((pre, cur) => {
    if (!pre) return cur;
    if (fn(cur) > fn(pre)) return cur;
    return pre;
  }, undefined);
}

export function sumBy<T>(array: T[], fn: fn<T, number>): number {
  return array.reduce((pre, cur) => {
    return pre + (fn(cur) || 0);
  }, 0);
}

export function reverseArray<T>(array: T[], func: (data: T, index: number) => T): T[] {
  const tmpArray = [];
  for (let i = array.length - 1; i >= 0; i--) {
    tmpArray.push(func(array[i], array.length - i - 1));
  }
  return tmpArray;
}

export function getObjectMaxMin(obj: any) {
  let minValue = Number.MAX_SAFE_INTEGER;
  let maxValue = Number.MIN_SAFE_INTEGER;
  for (let key in obj) {
    const value = obj[key];
    if (value > maxValue) maxValue = value;
    if (value < minValue) minValue = value;
  }
  return {
    maxValue,
    minValue,
  }
}