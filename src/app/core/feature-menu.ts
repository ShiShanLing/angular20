export interface FeatureMenuItem {
  label: string;
  icon?: string;
  path?: string;
  permission?: string;
  children?: FeatureMenuItem[];
}

/** 统一菜单定义：供布局渲染、权限判定、路由守卫共享。 */
export const FEATURE_MENU_ITEMS: FeatureMenuItem[] = [
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
    label: '效率工具',
    icon: 'thunderbolt',
    children: [
      { path: '/tools/time', label: '时间效率', permission: 'tools.time' },
      { path: '/tools/weather', label: '天气预报', permission: 'tools.weather' },
      { path: '/tools/calendar', label: '万年历', permission: 'tools.calendar' },
      { path: '/tools/text', label: '文本处理', permission: 'tools.text' },
      { path: '/tools/dev', label: '开发助手', permission: 'tools.dev' },
      { path: '/practice', label: '面试刷题', permission: 'practice.view' },
      { path: '/ios-learning', label: 'iOS学习', permission: 'practice.view' },
      { path: '/angular-learning', label: 'Angular学习', permission: 'practice.view' },
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
    children: [{ path: '/chart-showcase', label: '炫酷图表', permission: 'chart.showcase' }]
  }
];
