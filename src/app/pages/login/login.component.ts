import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { AuthService } from '../../core/auth.service';

/** 登录 / 注册页面 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly message = inject(NzMessageService);

  readonly tabIndex = signal(0);
  readonly loading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    inviteCode: ['', [Validators.required]],
    nickname: [''],
  });

  // MARK: 游客访问
  onGuestEnter(): void {
    this.authService.enterAsGuest();
    this.message.success('已进入游客模式（使用记录不会保存）');
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    void this.router.navigateByUrl(returnUrl);
  }

  // MARK: 提交登录
  // 提交登录表单并跳转回 returnUrl
  onLogin(): void {
    if (this.loginForm.invalid) {
      Object.values(this.loginForm.controls).forEach((ctrl) => ctrl.markAsDirty());
      return;
    }
    this.loading.set(true);
    const { username, password } = this.loginForm.getRawValue();
    this.authService.login({ username, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.message.success('登录成功');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.message.error(err.error?.message || '登录失败，请重试');
      },
    });
  }

  // MARK: 提交注册
  // 提交注册表单，成功后切回登录页
  onRegister(): void {
    if (this.registerForm.invalid) {
      Object.values(this.registerForm.controls).forEach((ctrl) => ctrl.markAsDirty());
      return;
    }
    this.loading.set(true);
    const { username, password, inviteCode, nickname } = this.registerForm.getRawValue();
    this.authService.register(username, password, inviteCode, nickname).subscribe({
      next: () => {
        this.loading.set(false);
        this.message.success('注册成功，请登录');
        this.tabIndex.set(0);
        this.loginForm.patchValue({ username });
      },
      error: (err) => {
        this.loading.set(false);
        this.message.error(err.error?.message || '注册失败');
      },
    });
  }
}
