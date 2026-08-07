import { routes } from './app.routes';
import { adminGuard } from './core/auth/admin.guard';

describe('application routes', () => {
  it('protects the sensitive activity route with the admin guard', () => {
    const route = routes.find((candidate) => candidate.path === 'sensitive-activity');
    expect(route).toBeDefined();
    expect(route?.canActivate).toEqual([adminGuard]);
    expect(route?.loadComponent).toBeDefined();
  });
});
