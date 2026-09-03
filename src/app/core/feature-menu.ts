export interface FeatureMenuItem {
  label: string;
  icon?: string;
  path?: string;
  permission?: string;
  activationCode?: string;
  children?: FeatureMenuItem[];
}

/** 统一菜单定义：供布局渲染、权限判定、路由守卫共享。 */
export const FEATURE_MENU_ITEMS: FeatureMenuItem[] = [
  {
    label: '效率工具',
    icon: 'thunderbolt',
    children: [
      { path: '/tools/time', label: '时间效率', permission: 'tools.time' },
      { path: '/tools/weather', label: '天气预报', permission: 'tools.weather' },
      { path: '/tools/calendar', label: '万年历', permission: 'tools.calendar' },
      { path: '/tools/text', label: '文本处理', permission: 'tools.text' },
      { path: '/tools/qrcode', label: '二维码', permission: 'tools.qrcode' },
      { path: '/tools/notes', label: '记事本', permission: 'tools.notes' },
      { path: '/tools/dev', label: '开发助手', permission: 'tools.dev' },
    ]
  },
  {
    label: '学习',
    icon: 'book',
    children: [
      {
        label: 'iOS',
        icon: 'book',
        children: [
          { path: '/ios-learning', label: '每日学习', permission: 'practice.view' },
          { path: '/ios-learning/review', label: '复习', permission: 'practice.view' },
          { path: '/ios-learning/history', label: '成绩走势', permission: 'practice.view' },
        ]
      },
      {
        label: 'Android',
        icon: 'appstore',
        children: [
          { path: '/android-learning', label: '每日学习', permission: 'practice.view' },
          { path: '/android-learning/review', label: '复习', permission: 'practice.view' },
          { path: '/android-learning/history', label: '成绩走势', permission: 'practice.view' },
        ]
      },
      {
        label: 'Angular',
        icon: 'block',
        children: [
          { path: '/angular-learning', label: '每日学习', permission: 'practice.view' },
          { path: '/angular-learning/review', label: '复习', permission: 'practice.view' },
          { path: '/angular-learning/history', label: '成绩走势', permission: 'practice.view' },
        ]
      },
      {
        label: 'TS',
        icon: 'experiment',
        children: [
          { path: '/ts-learning', label: '每日学习', permission: 'practice.view' },
          { path: '/ts-learning/review', label: '复习', permission: 'practice.view' },
          { path: '/ts-learning/history', label: '成绩走势', permission: 'practice.view' },
        ]
      },
      { path: '/practice', label: '知识刷题', permission: 'practice.view' },
      { path: '/practice/history', label: '刷题成绩', permission: 'practice.view' },
      { path: '/practice-list', label: '列表刷题', permission: 'practice.view' },
    ]
  },
  {
    label: '身体健康',
    icon: 'heart',
    children: [
      { path: '/tools/bmi', label: 'BMI/体脂', permission: 'tools.bmi' },
      { path: '/tools/water', label: '饮水提醒', permission: 'tools.water' },
      { path: '/tools/weight', label: '体重追踪', permission: 'tools.weight' },
      { path: '/tools/sleep', label: '睡眠分析', permission: 'tools.sleep' },
    ]
  },
  {
    label: '财务工具',
    icon: 'money-collect',
    children: [
      { path: '/tools/mortgage', label: '房贷计算', permission: 'tools.mortgage' },
      { path: '/tools/salary', label: '个税计算', permission: 'tools.salary' },
      { path: '/tools/accounting', label: '记账分期', permission: 'tools.accounting' },
      { path: '/tools/subscription', label: '订阅管理', permission: 'tools.subscription' },
      { path: '/tools/saving', label: '攒钱计划', permission: 'tools.saving' },
      { path: '/tools/fire', label: 'FIRE 计算器', permission: 'tools.fire' },
      { path: '/tools/anhui-pension', label: '安徽农村养老金', permission: 'tools.anhui-pension' },
    ]
  },
  {
    label: '休闲游戏',
    icon: 'customer-service',
    children: [
      { path: '/snake', label: '贪吃蛇', permission: 'snake.play' },
      { path: '/tetris', label: '俄罗斯方块', permission: 'tetris.play' },
    ]
  },
  {
    label: '数据演示',
    icon: 'bar-chart',
    children: [
      { path: '/chart-showcase', label: '炫酷图表', permission: 'chart.showcase' },
      { path: '/html-preview', label: '条款预览' }
    ]
  },
  {
    label: '数据分析',
    icon: 'stock',
    children: [
      { path: '/market', label: '市场情绪', permission: 'market.view' },
    ]
  }
];
