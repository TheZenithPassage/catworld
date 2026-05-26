import { Routes } from '@angular/router';
import { DashboardPage } from './features/dashboard/pages/dashboard-page/dashboard-page';
import { StaysOverviewPage } from './features/stays/pages/stays-overview-page/stays-overview-page';
import { StayCreatePage } from './features/stays/pages/stay-create-page/stay-create-page';

export const routes: Routes = [
  {
    path: '',
    component: DashboardPage
  },
  {
    path: 'stays',
    component: StaysOverviewPage
  },
  {
    path: 'stays/new',
    component: StayCreatePage
  }
];
