import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    NzFormModule, NzInputModule, NzButtonModule, NzIconModule, NzTabsModule,
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

  tabIndex = 0;
  loading = false;

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nickname: [''],
  });

  onLogin(): void {
    if (this.loginForm.invalid) {
      Object.values(this.loginForm.controls).forEach((ctrl) => ctrl.markAsDirty());
      return;
    }
    this.loading = true;
    const { username, password } = this.loginForm.getRawValue();
    this.authService.login({ username, password }).subscribe({
      next: () => {
        this.loading = false;
        this.message.success('登录成功');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err.error?.message || '登录失败，请重试');
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      Object.values(this.registerForm.controls).forEach((ctrl) => ctrl.markAsDirty());
      return;
    }
    this.loading = true;
    const { username, password, nickname } = this.registerForm.getRawValue();
    this.authService.register(username, password, nickname).subscribe({
      next: () => {
        this.loading = false;
        this.message.success('注册成功，请登录');
        this.tabIndex = 0;
        this.loginForm.patchValue({ username });
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err.error?.message || '注册失败');
      },
    });
  }
}
