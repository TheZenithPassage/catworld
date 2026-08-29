import { TestBed } from '@angular/core/testing';
import { DefaultUrlSerializer, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { AuthSessionService } from '../auth/auth-session.service';
import { CreationFlowService } from './creation-flow.service';

describe('CreationFlowService', () => {
  const events = new Subject<NavigationStart>();
  const serializer = new DefaultUrlSerializer();
  let service: CreationFlowService;
  let auth: AuthSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CreationFlowService,
        AuthSessionService,
        {
          provide: Router,
          useValue: { events, parseUrl: (url: string) => serializer.parse(url) },
        },
      ],
    });
    auth = TestBed.inject(AuthSessionService);
    auth.login({ username: 'admin', role: 'ADMIN' }, { username: 'admin', password: 'password' });
    service = TestBed.inject(CreationFlowService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('isolates identity and keeps independent cat and stay frames one-shot', () => {
    const flowId = service.start('stay');
    const photo = new File(['photo'], 'cat.jpg', { type: 'image/jpeg' });
    service.captureStay(flowId, stayDraft());
    service.captureCat(flowId, catDraft(photo));
    service.expectHop(flowId, '/cats/new', '/owners/new');
    navigate(`/owners/new?creationFlowId=${flowId}`);
    service.expectHop(flowId, '/owners/new', '/cats/new');
    navigate(`/cats/new?creationFlowId=${flowId}`);

    expect(service.consumeCat('different')).toBeNull();
    expect(service.consumeCat(flowId)?.photo).toBe(photo);
    expect(service.consumeCat(flowId)).toBeNull();

    service.expectHop(flowId, '/cats/new', '/stays/new');
    navigate(`/stays/new?creationFlowId=${flowId}`);
    expect(service.consumeStay(flowId)).toEqual(stayDraft());
    expect(service.consumeStay(flowId)).toBeNull();
  });

  it('clears on unrelated navigation, browser traversal, and authentication loss', async () => {
    let flowId = service.start('cat');
    service.captureCat(flowId, catDraft(null));
    service.expectHop(flowId, '/cats/new', '/owners/new');
    navigate('/vets/new?creationFlowId=unrelated');
    expect(service.has(flowId)).toBe(false);

    flowId = service.start('cat');
    service.expectHop(flowId, '/cats/new', '/owners/new');
    navigate(`/owners/new?creationFlowId=${flowId}`, 'popstate');
    expect(service.has(flowId)).toBe(false);

    flowId = service.start('cat');
    auth.logout();
    await TestBed.tick();
    expect(service.has(flowId)).toBe(false);
  });

  function navigate(url: string, trigger: 'imperative' | 'popstate' = 'imperative'): void {
    events.next(new NavigationStart(1, url, trigger));
  }
});

function catDraft(photo: File | null) {
  return {
    name: 'Milo',
    birthDate: '2020-01-02',
    sex: 'MALE' as const,
    breed: 'mixed',
    coat: '',
    color: '',
    foodBrand: '',
    litterBrand: '',
    personality: '',
    notes: ' raw notes ',
    lastInternalDewormerName: '',
    lastInternalDewormingDate: '',
    lastExternalDewormerName: '',
    lastExternalDewormingDate: '',
    lastTripleFelineDate: '',
    lastRabiesDate: '',
    ownerId: 'owner-1',
    vetId: 'vet-1',
    photo,
  };
}

function stayDraft() {
  return {
    ownerId: 'owner-1',
    catIds: ['cat-1'],
    startAt: '2026-01-01T10:00',
    endAt: '2026-01-02T10:00',
    notes: 'stay notes',
    agreedAmount: '100',
    pricingReason: '',
    pricingReasonContext: 'untouched' as const,
  };
}
