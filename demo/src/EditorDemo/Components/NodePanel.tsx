/**
 * @file 画布侧边栏组件库面板
 * @author 剑决(perkin.pj)
 */

import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { Collapse } from 'antd';
import { ComponentType, ComponentMap, COMPONENT_CATEGORY, Node } from '../defines';
import './NodePanel.scss';

const { useState, useEffect } = React;
const Panel = Collapse.Panel;

interface NodePanelProps {
  visible?: boolean;
  onDrag?: (item: Node) => void;
}

export default function NodePanel(props: NodePanelProps) {
  const componnetList = Object.values(ComponentType);
  const { onDrag, visible = false } = props;

  // 默认取第一个
  const [collapseKey, setCollapseKey] = useState<string[]>([componnetList[0]]);

  const boxClass = classNames('nodePanel-box', { 'nodePanel-box-visible': visible });

  /** 处理Collapse展开 */
  const handleCollapseKey = (items: string[] | string) => {
    setCollapseKey(items as string[]);
  };

  const handleDrag = (item: Node) => {
    if (onDrag) {
      onDrag(item);
    }
  };

  return (
    <div className="nodePanel">
      <div className={boxClass}>
        <div className="nodePanel-box-collapse">
          <Collapse activeKey={collapseKey} onChange={handleCollapseKey} bordered={true} accordion>
            {componnetList.map(item => {
              const total = COMPONENT_CATEGORY[item].length;
              return (
                <Panel key={item} header={<div className="collapse-title">{`${ComponentMap[item]} (${total})`}</div>}>
                  <div className="components-box">
                    {COMPONENT_CATEGORY[item].map(child => {
                      const boxItemClass = classNames('components-box-item', {
                        'components-box-item-disabled no-drop': child.disabled
                      });
                      return (
                        <div
                          className={boxItemClass}
                          key={child.key}
                          draggable={true}
                          onDrag={handleDrag.bind(null, child)}>
                          <div className="components-box-item-icon">{child.icon}</div>
                          {/* {child.name} */}
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              );
            })}
          </Collapse>
        </div>
      </div>
    </div>
  );
}
