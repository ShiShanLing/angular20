import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** 兜底页：当前账号没有任何可访问功能，或访问了不可访问页面。 */
@Component({
  selector: 'app-no-access',
  imports: [RouterLink],
  templateUrl: './no-access.component.html',
  styleUrl: './no-access.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoAccessComponent {}

