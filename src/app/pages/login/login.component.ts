import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/auth.service';

/** 登录页：统一跳转 Agent 账号，或进入游客模式 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly message = inject(NzMessageService);

  readonly loading = signal(false);

  constructor() {
    if (this.authService.isLoggedIn()) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
      void this.router.navigateByUrl(returnUrl);
    }
  }

  onAgentLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    this.authService.goToAgentLogin(returnUrl);
  }

  onGuestEnter(): void {
    this.authService.enterAsGuest();
    this.message.success('已进入游客模式（使用记录不会保存）');
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    void this.router.navigateByUrl(returnUrl);
  }
}
