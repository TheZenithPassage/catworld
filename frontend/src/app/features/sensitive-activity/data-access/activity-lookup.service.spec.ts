import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivityLookupService } from './activity-lookup.service';

describe('ActivityLookupService', () => {
  let api: ActivityLookupService;
  let http: HttpTestingController;
  const id = '11111111-1111-1111-1111-111111111111';
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ActivityLookupService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses lightweight username search and exact resolution', () => {
    const account = { id, username: 'Disabled Actor' };
    const result = vi.fn();
    api.search(' Actor ', 1).subscribe(result);
    const request = http.expectOne((r) => r.url.endsWith('/users/search'));
    expect(request.request.params.get('q')).toBe('Actor');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ items: [account], page: 1, pageSize: 5, totalElements: 6 });
    expect(result).toHaveBeenCalledWith(expect.objectContaining({ items: [account] }));
    api.resolve(id).subscribe(result);
    http.expectOne((r) => r.url.endsWith('/' + id + '/lookup')).flush(account);
    expect(result).toHaveBeenLastCalledWith(account);
  });
  it('sends only explicit Stay criteria and page and rejects malformed candidates', () => {
    const error = vi.fn();
    api.searchStays({ catId: id, from: '2026-08-10', to: '2026-08-12' }, 2).subscribe({ error });
    const request = http.expectOne((r) => r.url.endsWith('/stays/search'));
    expect(
      Object.fromEntries(
        request.request.params.keys().map((k) => [k, request.request.params.get(k)]),
      ),
    ).toEqual({ catId: id, from: '2026-08-10', to: '2026-08-12', page: '2' });
    request.flush({ items: [{ stayId: id }], page: 2, pageSize: 5, totalElements: 11 });
    expect(error).toHaveBeenCalled();
  });
});
