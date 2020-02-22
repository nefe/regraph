import * as React from 'react';

import './ContextMenu.scss';

class ContextMenuProps {
  id: string;
  type: 'vertex' | 'edge';
  visible: boolean;
  left: number;
  top: number;
  // onHide: () => void;
  children: any;
}
const ContextMenu: React.FC<ContextMenuProps> = (props: ContextMenuProps) => {
  const { id, visible, left, top, children } = props;
  return (
    <div
      id={`context-menu-${id}`}
      style={{ display: visible ? 'block' : 'none', left, top }}
      className="contextMenu-layer">
      <div className="contextMenu">{children}</div>
    </div>
  );
};

export { ContextMenu };
