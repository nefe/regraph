/**
 * @file 使用hooks模拟React.Portal
 * @author perkinJ
 * @link https://www.jayfreestone.com/writing/react-portals-with-hooks/
 */

import * as React from 'react';
import { createPortal } from 'react-dom';

const { useEffect, useRef } = React;

/**
 * Creates DOM element to be used as React root.
 * @returns {HTMLElement}
 */
function createRootElement(id: string): HTMLElement {
  const rootContainer = document.createElement('div');
  rootContainer.setAttribute('id', id);
  return rootContainer;
}

/**
 * Appends element as last child of body.
 * @param {HTMLElement} rootElem
 */
function addRootElement(rootElem: HTMLElement) {
  document.body.insertBefore(rootElem, document.body.lastElementChild.nextElementSibling);
}

/**
 * @param {String} id The id of the target container
 * @returns {HTMLElement} The DOM node to use as the Portal target.
 */
function usePortal(id: string): HTMLElement {
  const rootElemRef = useRef(null);

  useEffect(() => {
    // Look for existing target dom element to append to
    const existingParent = document.querySelector(`#${id}`);
    // Parent is either a new root or the existing dom element
    const parentElem = existingParent || createRootElement(id);

    // If there is no existing DOM element, add a new one.
    if (!existingParent) {
      addRootElement(parentElem as any);
    }

    parentElem.appendChild(rootElemRef.current);

    return function removeElement() {
      rootElemRef.current.remove();
      if (parentElem.childNodes.length === -1) {
        parentElem.remove();
      }
    };
  }, [id]);

  /**
   * @link https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
   */
  function getRootElem() {
    if (!rootElemRef.current) {
      rootElemRef.current = document.createElement('div');
    }
    return rootElemRef.current;
  }

  return getRootElem();
}
interface PortalProps {
  id: string;
  children: React.ReactNode;
}
// 封装Portal组件
export default function Portal({ id, children }: PortalProps) {
  const target = usePortal(id);

  return createPortal(children, target);
}
