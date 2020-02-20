export const mockData = {
  /**
   * 主键ID
   */
  id: '111',
  /**
   * 管道名称/管道文件名
   */

  name: '测试管道数据',
  /**
   * 管道ID/管道文件ID
   */

  fileId: 'sdhsd',

  /**
   * 租户ID
   */
  tenantId: '168208',
  /**
   * 项目ID
   */

  projectId: '9987',
  /**
   * 用户ID
   */
  userId: '168208',
  /**
   * 节点onwer
   */
  owner: '剑决',
  /**
   * owner展示名
   */
  ownerName: '剑决',
  /**
   * 节点创建时间
   */
  createTime: '2019-12-10',

  /**
   * 节点的最后修改者(id)
   */
  lastModifier: '168208',
  /**
   * 修改者展示名
   */
  lastModifierName: '剑决',
  /**
   * 最后修改时间
   */
  lastModifyTime: '2019-12-10',

  /**
   * 节点的调度配置,复用已存在的功能
   */
  nodeConfig: {
    /**
     * 节点id
     */
    nodeId: 'n_123',
    /**
     * 节点名称
     */
    nodeName: '节点名称',

    nodeOutputNameList: ['Data_distill.id_mapping_dy_1'],

    nodeDesc: 'test',
    nodeType: 30,
    operatorType: 30,
    cronExpression: '0 1 0 * * ?',
    nodeContent:
      'create table if not exists id_mapping_dy_1 (↵    key_type string,↵    key_id string, ↵    oneid string↵) partitioned by (ds string);',
    remark: 'test',
    params: null,
    /**
     * 数据源配置
     */
    dsConfig: { dsId: '120104' },
    /**
     * 所属的dagId
     */
    dagId: 'd_767389365932195840',
    /**
     * 是否可以重跑
     */
    rerunable: null,
    /**
     * 有效时间区间
     */
    validPeriod: null,
    /**
     * 优先级, 1-最高, 数字越大优先级越低
     * 是{@link Priority}的code
     */
    priority: null,
    /**
     * 节点状态, 1-正常,2-暂停,3-空跑
     * 是{@link NodeStatusEnum}的code
     */
    nodeStatus: 1,
    /**
     * 是否是暂停状态
     */
    paused: null,
    /**
     * 上游依赖
     * 注意这里的上游依赖{@link NodeRelation}只需要写sourceNodeOutputName和具体的依赖关系(如跨周期/跨天等)即可
     */
    upstreams: [
      {
        dayDiff: null,
        periodDiff: 0,
        sourceNodeId: 'n_767389365932195841',
        sourceNodeOutputName: 'virtual_root_node_767389365932195840',
        targetNodeId: null,
        targetNodeOutputName: null
      }
    ],
    /**
     * 标识节点是由某个组织或应用创建的
     */
    nodeFrom: null,
    nodeOwner: '168208',
    /**
     * 节点的标签信息
     * 建议格式A: tagName=tagValue, tagName_2=tagValue_2
     * 建议格式B: tag1, tag2
     *
     * @since v2.5.x
     */
    tags: []
  },
  faultTolerantConfig: {
    errorCount: 10,
    errorRate: 0.3,
    readCount: 20
  },
  hops: [
    {
      id: '80bebab7-307a-4bf8-9545-c17e086a897e_05d35f38-8df0-4c5c-a917-036ef0bfca65',
      source: '80bebab7-307a-4bf8-9545-c17e086a897e',
      target: '05d35f38-8df0-4c5c-a917-036ef0bfca65',
      sourcePos: 'right',
      targetPos: 'top'
    },
    // {
    //   id: '80bebab7-307a-4bf8-9545-c17e086a897e_9d421eeb-84d6-4069-b42b-ce878e7b8efd',
    //   source: '80bebab7-307a-4bf8-9545-c17e086a897e',
    //   target: '9d421eeb-84d6-4069-b42b-ce878e7b8efd',
    //   sourcePos: 'left',
    //   targetPos: 'bottom'
    // }
  ],
  steps: [
    {
      id: '80bebab7-307a-4bf8-9545-c17e086a897e',
      key: 'rect',
      type: 'common',
      name: '测试组件',
      x: 241,
      y: 95,
      width: 100,
      height: 100,
      distribute: true,
      parallel: 2
    },
    {
      id: '05d35f38-8df0-4c5c-a917-036ef0bfca65',
      key: 'circle',
      name: 'MySQL_1',
      type: 'common',
      width: 250,
      height: 100,
      x: 449,
      y: 259
    }
  ]
};
