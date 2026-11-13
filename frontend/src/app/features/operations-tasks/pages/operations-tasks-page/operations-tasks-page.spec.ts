import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EMPTY } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { OperationsTask } from '../../data-access/operations-task-api.service';
import { OperationsTasksPage } from './operations-tasks-page';

describe('OperationsTasksPage', () => {
  const url = '/api/operations/tasks';
  const owner = {
    id: '00000000-0000-0000-0000-000000000011',
    fullName: 'Example Owner',
    currentCats: [{ id: '00000000-0000-0000-0000-000000000012', name: 'Clementine' }],
  };
  const stay = {
    stayId: '00000000-0000-0000-0000-000000000013',
    startAt: '2026-11-14T12:00',
    endAt: '2026-11-15T12:00',
    owner: { id: owner.id, fullName: owner.fullName },
    cats: owner.currentCats,
  };
  const task: OperationsTask = {
    id: '00000000-0000-0000-0000-000000000014',
    description: 'Prepare a clean carrier',
    dueDate: '2026-11-14',
    stayId: stay.stayId,
    bucket: 'TODAY',
    revision: 0,
    created: {
      actorId: '00000000-0000-0000-0000-000000000015',
      username: 'staff-example',
      at: '2026-11-14T11:00:00Z',
    },
    lastTransition: null,
  };

  let fixture: ComponentFixture<OperationsTasksPage>;
  let http: HttpTestingController;
  let host: HTMLElement;
  let openDetail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    openDetail = vi.fn(() => EMPTY);
    await TestBed.configureTestingModule({
      imports: [OperationsTasksPage],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EntityDetailDialogService, useValue: { open: openDetail } },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).language.set('en');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OperationsTasksPage);
    host = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('catworld.language');
  });

  it('creates a linked task with the selected stay and opens its existing detail', async () => {
    expectList([]);
    expect(host.textContent).toContain('There are no tasks yet.');
    const selector = fixture.debugElement.query(
      By.directive(RemoteEntitySelector),
    ).componentInstance;
    selector.select(owner);
    http.expectOne('/api/stays/search?ownerId=' + owner.id + '&page=0').flush({
      items: [stay],
      page: 0,
      pageSize: 5,
      totalElements: 1,
    });
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('.stay-candidates button')!.click();

    input('textarea', '  Prepare a clean carrier  ');
    input('input[name="dueDate"]', '2026-11-14');
    host
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const request = http.expectOne({ method: 'POST', url });
    expect(request.request.body).toEqual({
      description: task.description,
      dueDate: task.dueDate,
      stayId: stay.stayId,
    });
    request.flush(task, { status: 201, statusText: 'Created' });
    expectList([task]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('');
    expect(host.querySelector('#task-group-TODAY')?.parentElement?.textContent).toContain(
      task.description,
    );
    clickAction('View stay');
    expect(openDetail).toHaveBeenCalledWith({ entityType: 'stay', entityId: stay.stayId });
  });

  it('uses the current revision and refreshes the task after a stale resolution', () => {
    expectList([task]);
    clickAction('Resolve');

    const resolutionUrl = url + '/' + task.id + '/resolution';
    const resolve = http.expectOne({ method: 'PUT', url: resolutionUrl });
    expect(resolve.request.body).toEqual({ resolved: true, revision: 0 });
    const resolved: OperationsTask = {
      ...task,
      bucket: 'RESOLVED',
      revision: 1,
      lastTransition: { ...task.created, username: 'admin-example' },
    };
    resolve.flush(resolved);
    expectList([resolved]);
    expect(host.querySelector('#task-group-RESOLVED')?.parentElement?.textContent).toContain(
      'Resolved by admin-example',
    );

    clickAction('Reopen');
    const reopen = http.expectOne({ method: 'PUT', url: resolutionUrl });
    expect(reopen.request.body).toEqual({ resolved: false, revision: 1 });
    reopen.flush('Operations task has changed', { status: 409, statusText: 'Conflict' });
    expectList([{ ...task, revision: 2, lastTransition: task.created }]);

    expect(host.textContent).toContain('The task changed. Review the updated list.');
    expect(host.querySelector('#task-group-TODAY')?.parentElement?.textContent).toContain(
      'Reopened by staff-example',
    );
  });

  it('opens the stay picker to show the unresolved search on submit', () => {
    expectList([]);
    const picker = host.querySelector<HTMLDetailsElement>('.stay-picker')!;
    picker.open = true;
    input('.stay-picker input', 'Example');
    picker.open = false;
    input('textarea', 'Check the carrier');

    host
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(picker.open).toBe(true);
    http.expectNone({ method: 'POST', url });
  });

  function expectList(tasks: OperationsTask[]): void {
    http.expectOne({ method: 'GET', url }).flush(tasks);
    fixture.detectChanges();
  }

  function clickAction(action: string): void {
    host
      .querySelector<HTMLButtonElement>(`button[aria-label="${action} · ${task.description}"]`)!
      .click();
  }

  function input(selector: string, value: string): void {
    const element = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }
});
