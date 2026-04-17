import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  trigger, state, style, transition, animate, keyframes, query, stagger
} from '@angular/animations';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';

@Component({
  selector: 'app-animations',
  imports: [NzCardModule, NzButtonModule, NzGridModule, NzTagModule, NzDividerModule, DecimalPipe],
  templateUrl: './animations.component.html',
  styleUrl: './animations.component.scss',
  animations: [
    trigger('fadeInOut', [
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      state('hidden',  style({ opacity: 0, transform: 'scale(0.8)' })),
      transition('hidden => visible', animate('400ms ease-out')),
      transition('visible => hidden', animate('300ms ease-in')),
    ]),
    trigger('slideIn', [
      state('in',  style({ transform: 'translateX(0)', opacity: 1 })),
      state('out', style({ transform: 'translateX(-100%)', opacity: 0 })),
      transition('out => in',  animate('500ms cubic-bezier(0.35, 0, 0.25, 1)')),
      transition('in => out',  animate('400ms cubic-bezier(0.35, 0, 0.25, 1)')),
    ]),
    trigger('bounce', [
      transition('* => bounce', animate('600ms', keyframes([
        style({ transform: 'translateY(0)',    offset: 0 }),
        style({ transform: 'translateY(-30px)', offset: 0.3 }),
        style({ transform: 'translateY(0)',    offset: 0.6 }),
        style({ transform: 'translateY(-12px)', offset: 0.75 }),
        style({ transform: 'translateY(0)',    offset: 0.9 }),
        style({ transform: 'translateY(-4px)', offset: 0.95 }),
        style({ transform: 'translateY(0)',    offset: 1 }),
      ])))
    ]),
    trigger('rotate', [
      transition(':enter', animate('600ms', keyframes([
        style({ transform: 'rotate(0deg)', offset: 0 }),
        style({ transform: 'rotate(360deg)', offset: 1 }),
      ])))
    ]),
    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-10px)' }),
          stagger(80, [
            animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AnimationsComponent {
  // Fade
  fadeState = 'hidden';
  fadeActive = false;
  toggleFade() {
    this.fadeState = this.fadeActive ? 'hidden' : 'visible';
    this.fadeActive = !this.fadeActive;
  }

  // Slide
  slideState = 'out';
  slideActive = false;
  toggleSlide() {
    this.slideState = this.slideActive ? 'out' : 'in';
    this.slideActive = !this.slideActive;
  }

  // Bounce
  bounceState = '';
  doBounce() { this.bounceState = 'bounce'; }
  onBounceDone() { this.bounceState = ''; }

  // Counter
  counterValue = 0;
  counterTarget = 2568;
  counterRunning = false;
  runCounter() {
    if (this.counterRunning) return;
    this.counterRunning = true;
    this.counterValue = 0;
    const step = Math.ceil(this.counterTarget / 60);
    const timer = setInterval(() => {
      this.counterValue = Math.min(this.counterValue + step, this.counterTarget);
      if (this.counterValue >= this.counterTarget) {
        clearInterval(timer);
        this.counterRunning = false;
      }
    }, 16);
  }

  // Stagger list
  listItems: string[] = [];
  listVisible = false;
  toggleList() {
    this.listVisible = !this.listVisible;
    this.listItems = this.listVisible
      ? ['Angular 19 Signals', 'ng-zorro-antd v19', 'ECharts 5.x', 'Standalone Components', 'Lazy Loading Routes', 'Reactive Forms']
      : [];
  }

  // Spinner
  spinnerAngle = 0;
  spinnerRunning = false;
  spinnerInterval: any;
  toggleSpinner() {
    this.spinnerRunning = !this.spinnerRunning;
    if (this.spinnerRunning) {
      this.spinnerInterval = setInterval(() => this.spinnerAngle += 6, 16);
    } else {
      clearInterval(this.spinnerInterval);
    }
  }
}
