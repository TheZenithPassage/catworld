import { Routes } from '@angular/router';
import { DashboardPage } from './features/dashboard/pages/dashboard-page/dashboard-page';
import { StaysOverviewPage } from './features/stays/pages/stays-overview-page/stays-overview-page';
import { StayCreatePage } from './features/stays/pages/stay-create-page/stay-create-page';
import { OwnersOverviewPage } from './features/owners/pages/owners-overview-page/owners-overview-page';
import { OwnerCreatePage } from './features/owners/pages/owner-create-page/owner-create-page';
import { OwnerEditPage } from './features/owners/pages/owner-edit-page/owner-edit-page';
import { CatsOverviewPage } from './features/cats/pages/cats-overview-page/cats-overview-page';
import { CatCreatePage } from './features/cats/pages/cat-create-page/cat-create-page';
import { CatEditPage } from './features/cats/pages/cat-edit-page/cat-edit-page';
import { VetsOverviewPage } from './features/vets/pages/vets-overview-page/vets-overview-page';
import { VetCreatePage } from './features/vets/pages/vet-create-page/vet-create-page';

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
  },
  {
    path: 'owners',
    component: OwnersOverviewPage
  },
  {
    path: 'owners/new',
    component: OwnerCreatePage
  },
  {
    path: 'owners/:id/edit',
    component: OwnerEditPage
  },
  {
    path: 'cats',
    component: CatsOverviewPage
  },
  {
    path: 'cats/new',
    component: CatCreatePage
  },
  {
    path: 'cats/:id/edit',
    component: CatEditPage
  },
  {
    path: 'vets',
    component: VetsOverviewPage
  },
  {
    path: 'vets/new',
    component: VetCreatePage
  }
];
