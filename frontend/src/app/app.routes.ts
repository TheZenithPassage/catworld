import { Routes } from '@angular/router';
import { DashboardPage } from './features/dashboard/pages/dashboard-page/dashboard-page';
import { CalendarPage } from './features/calendar/pages/calendar-page/calendar-page';
import { OwnerCreatePage } from './features/owners/pages/owner-create-page/owner-create-page';
import { OwnerEditPage } from './features/owners/pages/owner-edit-page/owner-edit-page';
import { CatCreatePage } from './features/cats/pages/cat-create-page/cat-create-page';
import { CatEditPage } from './features/cats/pages/cat-edit-page/cat-edit-page';
import { VetCreatePage } from './features/vets/pages/vet-create-page/vet-create-page';
import { VetEditPage } from './features/vets/pages/vet-edit-page/vet-edit-page';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { authGuard } from './core/auth/auth.guard';
import { StayEditPage } from './features/stays/pages/stay-edit-page/stay-edit-page';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: '',
    canActivate: [authGuard],
    component: DashboardPage,
  },
  {
    path: 'stays',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/stays/pages/stays-overview-page/stays-overview-page').then(
        (m) => m.StaysOverviewPage,
      ),
  },
  {
    path: 'stays/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/stays/pages/stay-create-page/stay-create-page').then(
        (m) => m.StayCreatePage,
      ),
  },
  {
    path: 'stays/:id/edit',
    canActivate: [authGuard],
    component: StayEditPage,
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    component: CalendarPage,
  },
  {
    path: 'owners',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/owners/pages/owners-overview-page/owners-overview-page').then(
        (m) => m.OwnersOverviewPage,
      ),
  },
  {
    path: 'owners/new',
    canActivate: [authGuard],
    component: OwnerCreatePage,
  },
  {
    path: 'owners/:id/edit',
    canActivate: [authGuard],
    component: OwnerEditPage,
  },
  {
    path: 'cats',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cats/pages/cats-overview-page/cats-overview-page').then(
        (m) => m.CatsOverviewPage,
      ),
  },
  {
    path: 'cats/new',
    canActivate: [authGuard],
    component: CatCreatePage,
  },
  {
    path: 'cats/:id/edit',
    canActivate: [authGuard],
    component: CatEditPage,
  },
  {
    path: 'vets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/vets/pages/vets-overview-page/vets-overview-page').then(
        (m) => m.VetsOverviewPage,
      ),
  },
  {
    path: 'vets/new',
    canActivate: [authGuard],
    component: VetCreatePage,
  },
  {
    path: 'vets/:id/edit',
    canActivate: [authGuard],
    component: VetEditPage,
  },
  {
    path: 'accounts',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/accounts/pages/account-management-page/account-management-page').then(
        (m) => m.AccountManagementPage,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
