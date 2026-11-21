import { inject, Injector } from '@angular/core';
import { CanDeactivateFn, Route, Routes } from '@angular/router';
import { from, of, switchMap } from 'rxjs';
import { OwnerCreatePage } from './features/owners/pages/owner-create-page/owner-create-page';
import { OwnerEditPage } from './features/owners/pages/owner-edit-page/owner-edit-page';
import { VetCreatePage } from './features/vets/pages/vet-create-page/vet-create-page';
import { VetEditPage } from './features/vets/pages/vet-edit-page/vet-edit-page';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const confirmCatDraftNavigation: CanDeactivateFn<unknown> = (
  _component,
  _route,
  _current,
  next,
) => {
  const injector = inject(Injector);
  return from(import('./shared/entity-detail/entity-detail-dialog.service')).pipe(
    switchMap(({ EntityDetailDialogService }) => {
      const decision = injector.get(EntityDetailDialogService).confirmCatDraftNavigation(next.url);
      return typeof decision === 'boolean' ? of(decision) : decision;
    }),
  );
};

// Entity details can open from these routes without changing the URL.
const canLeaveCatDetails = {
  canDeactivate: [confirmCatDraftNavigation],
  runGuardsAndResolvers: 'always',
} satisfies Partial<Route>;

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page').then(
        (m) => m.DashboardPage,
      ),
  },
  {
    path: 'operations/arrivals',
    ...canLeaveCatDetails,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/operations/pages/arrivals-page/arrivals-page').then((m) => m.ArrivalsPage),
  },
  {
    path: 'stays',
    ...canLeaveCatDetails,
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
    path: 'stays/:id/pricing',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/stays/pages/stay-pricing-page/stay-pricing-page').then(
        (m) => m.StayPricingPage,
      ),
  },
  {
    path: 'calendar',
    ...canLeaveCatDetails,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/calendar/pages/calendar-page/calendar-page').then((m) => m.CalendarPage),
  },
  {
    path: 'owners',
    ...canLeaveCatDetails,
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
    ...canLeaveCatDetails,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cats/pages/cats-overview-page/cats-overview-page').then(
        (m) => m.CatsOverviewPage,
      ),
  },
  {
    path: 'cats/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cats/pages/cat-create-page/cat-create-page').then((m) => m.CatCreatePage),
  },
  {
    path: 'cats/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cats/pages/cat-edit-page/cat-edit-page').then((m) => m.CatEditPage),
  },
  {
    path: 'vets',
    ...canLeaveCatDetails,
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
    path: 'nightly-rates',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/nightly-rates/pages/nightly-rate-management-page/nightly-rate-management-page').then(
        (m) => m.NightlyRateManagementPage,
      ),
  },
  {
    path: 'catalogs',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/catalogs/catalog-management').then((m) => m.CatalogManagement),
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
    path: 'cat-intake',
    ...canLeaveCatDetails,
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/cat-intake/cat-intake-review').then((m) => m.CatIntakeReview),
  },
  {
    path: 'payments',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/payments/pages/monthly-payments-page/monthly-payments-page').then(
        (m) => m.MonthlyPaymentsPage,
      ),
  },
  {
    path: 'sensitive-activity',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/sensitive-activity/pages/sensitive-activity-page/sensitive-activity-page').then(
        (m) => m.SensitiveActivityPage,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
