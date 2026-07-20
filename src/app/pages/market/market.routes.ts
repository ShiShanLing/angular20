import { Routes } from '@angular/router';
import { MarketListComponent } from './market-list.component';
import { MarketDetailComponent } from './market-detail/market-detail.component';

export const MARKET_ROUTES: Routes = [
  { path: '', component: MarketListComponent },
  { path: 'detail', component: MarketDetailComponent },
];
