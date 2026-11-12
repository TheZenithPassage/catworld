import { routes } from './app.routes';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';

describe('application routes', () => {
  it('loads operations tasks on demand behind the authentication guard', () => {
    const route = routes.find((candidate) => candidate.path === 'operations/tasks');
    expect(route?.canActivate).toEqual([authGuard]);
    expect(route?.loadComponent).toBeDefined();
  });

  it('protects the sensitive activity route with the admin guard', () => {
    const route = routes.find((candidate) => candidate.path === 'sensitive-activity');
    expect(route).toBeDefined();
    expect(route?.canActivate).toEqual([adminGuard]);
    expect(route?.loadComponent).toBeDefined();
  });

  it('exposes only the authenticated pricing route for post-creation stay economics', () => {
    const pricing = routes.find((candidate) => candidate.path === 'stays/:id/pricing');
    expect(pricing?.canActivate).toEqual([authGuard]);
    expect(pricing?.loadComponent).toBeDefined();
    expect(routes.some((candidate) => candidate.path === 'stays/:id/edit')).toBe(false);
  });
});
