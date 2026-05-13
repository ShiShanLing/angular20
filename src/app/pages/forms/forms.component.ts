import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';

/** 响应式表单示例：多种控件、校验与提交展示。 */
@Component({
  selector: 'app-forms',
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSwitchModule,
    NzSliderModule,
    NzRadioModule,
    NzCheckboxModule,
    NzCardModule,
    NzGridModule,
    NzDividerModule,
    NzTagModule
  ],
  templateUrl: './forms.component.html',
  styleUrl: './forms.component.scss'
})
export class FormsComponent {
  form: FormGroup;
  submitted = false;
  formValues: any = null;

  skills: string[] = ['Angular', 'React', 'Vue'];
  hobbyOptions = ['阅读', '音乐', '旅行', '编程', '摄影'];
  checkboxOptions = this.hobbyOptions.map(h => ({ label: h, value: h }));

  /** 模板中 `f.xxx` 访问各表单控件。 */
  /** 滑块右侧百分比展示。 */
  formatter(value: number): string {
    return `${value}%`;
  }

  constructor(private fb: FormBuilder, private msg: NzMessageService) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['developer', Validators.required],
      birthday: [null],
      skills: [[]],
      level: [50],
      notifications: [true],
      gender: ['male'],
      hobbies: [[]]
    });
  }

  /** 模板中 `f.xxx` 访问各 `AbstractControl`。 */
  get f() { return this.form.controls; }

  /** 动态追加技能选项到下拉数据源。 */
  addSkill(skill: string) {
    if (!this.skills.includes(skill)) {
      this.skills = [...this.skills, skill];
    }
  }

  /** 校验通过后展示表单快照并提示成功。 */
  submitForm() {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      this.msg.error('请检查表单中的错误！');
      return;
    }
    this.submitted = true;
    this.formValues = this.form.value;
    this.msg.success('表单提交成功！🎉');
  }

  /** 恢复默认值并清除提交状态。 */
  resetForm() {
    this.form.reset({
      role: 'developer', level: 50, notifications: true, gender: 'male',
      skills: [], hobbies: []
    });
    this.submitted = false;
    this.formValues = null;
  }
}
