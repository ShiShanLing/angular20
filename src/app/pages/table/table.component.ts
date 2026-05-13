import { Component, OnInit } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  score: number;
  joined: string;
}

/** 表格示例：本地模拟数据、关键词筛选、排序与删除/详情弹窗。 */
@Component({
  selector: 'app-table',
  imports: [
    NzTableModule,
    NzInputModule,
    NzButtonModule,
    NzTagModule,
    NzCardModule,
    NzIconModule,
    FormsModule
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent implements OnInit {
  searchText = '';
  sortName: string | null = null;
  sortValue: string | null = null;

  allData: User[] = [];
  displayData: User[] = [];

  statusColorMap: Record<string, string> = {
    active: 'green',
    inactive: 'default',
    pending: 'gold'
  };
  statusLabelMap: Record<string, string> = {
    active: '活跃',
    inactive: '停用',
    pending: '待审'
  };

  constructor(private modal: NzModalService, private msg: NzMessageService) {}

  /** 生成示例用户列表并应用当前筛选/排序。 */
  ngOnInit() {
    const names = ['张伟','李娜','王芳','刘洋','陈静','杨帆','赵磊','黄敏','吴浩','周婷',
                   '孙凯','徐梦','马超','朱玲','郭强','何秀','罗博','梁艺','宋涛','曾丽'];
    const roles = ['管理员','开发者','设计师','测试工程师','产品经理'];
    const statuses: Array<'active' | 'inactive' | 'pending'> = ['active', 'inactive', 'pending'];

    this.allData = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: names[i],
      email: `user${i + 1}@company.com`,
      role: roles[i % roles.length],
      status: statuses[i % statuses.length],
      score: Math.floor(Math.random() * 41) + 60,
      joined: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
    }));
    this.applyFilter();
  }

  /** 按搜索词与子段排序更新 `displayData`。 */
  applyFilter() {
    let data = [...this.allData];
    if (this.searchText.trim()) {
      const kw = this.searchText.toLowerCase();
      data = data.filter(u =>
        u.name.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw) ||
        u.role.toLowerCase().includes(kw)
      );
    }
    if (this.sortName && this.sortValue) {
      data = data.sort((a: any, b: any) => {
        const res = a[this.sortName!] > b[this.sortName!] ? 1 : -1;
        return this.sortValue === 'ascend' ? res : -res;
      });
    }
    this.displayData = data;
  }

  /** 表格列排序变更回调。 */
  onSort(sortInfo: { key: string; value: string }) {
    this.sortName = sortInfo.key;
    this.sortValue = sortInfo.value;
    this.applyFilter();
  }

  /** 删除前弹出确认框，成功后更新列表并提示。 */
  deleteUser(user: User) {
    this.modal.confirm({
      nzTitle: `确定要删除用户「${user.name}」吗？`,
      nzContent: '此操作不可撤销。',
      nzOkDanger: true,
      nzOkText: '确认删除',
      nzOnOk: () => {
        this.allData = this.allData.filter(u => u.id !== user.id);
        this.applyFilter();
        this.msg.success(`已成功删除用户「${user.name}」`);
      }
    });
  }

  /** 只读展示用户字段。 */
  viewUser(user: User) {
    this.modal.info({
      nzTitle: `用户详情 — ${user.name}`,
      nzContent: `
        <p><strong>ID：</strong>${user.id}</p>
        <p><strong>邮箱：</strong>${user.email}</p>
        <p><strong>角色：</strong>${user.role}</p>
        <p><strong>状态：</strong>${this.statusLabelMap[user.status]}</p>
        <p><strong>评分：</strong>${user.score}</p>
        <p><strong>加入日期：</strong>${user.joined}</p>
      `
    });
  }
}
