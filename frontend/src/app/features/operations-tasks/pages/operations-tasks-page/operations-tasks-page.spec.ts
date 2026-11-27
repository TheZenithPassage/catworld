import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EMPTY } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import {
  OperationsTask,
  OperationsTaskBucket,
} from '../../data-access/operations-task-api.service';
import { OperationsTasksPage } from './operations-tasks-page';

describe('OperationsTasksPage', () => {
  const url = '/api/operations/tasks';
  const owner = {
    id: '00000000-0000-0000-0000-000000000011',
    fullName: 'Example Owner',
    currentCats: [{ id: '00000000-0000-0000-0000-000000000012', name: 'Clementine' }],
  };
  const stay = {
    id: '00000000-0000-0000-0000-000000000013',
    startAt: '2026-11-14T12:00',
    endAt: '2026-11-15T12:00',
    status: 'RESERVED',
    ownerName: owner.fullName,
    ownerDeceased: false,
    cats: owner.currentCats,
  };
  const task: OperationsTask = {
    id: '00000000-0000-0000-0000-000000000014',
    description: 'Prepare a clean carrier',
    dueDate: '2026-11-14',
    stayId: stay.id,
    ownerId: null,
    catId: null,
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
  let overlay: HTMLElement;
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
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    fixture = TestBed.createComponent(OperationsTasksPage);
    host = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
    http.verify();
    localStorage.removeItem('catworld.language');
  });

  it('starts with open tasks grouped and filters each of the six tabs', () => {
    const examples: [string, OperationsTaskBucket][] = [
      ['Today', 'TODAY'],
      ['Overdue', 'OVERDUE'],
      ['Upcoming', 'UPCOMING'],
      ['No due date', 'UNDATED'],
      ['Resolved', 'RESOLVED'],
    ];
    expectList(
      examples.map(([label, bucket]) => ({
        ...task,
        id: bucket,
        description: 'Example ' + label,
        bucket,
      })),
    );

    expect(tabs().map((tab) => tab.textContent!.trim())).toEqual([
      'All',
      ...examples.map(([label]) => label),
    ]);
    expect(activeTab()).toBe('All');
    expect(host.querySelector('form')).toBeNull();
    expect(host.textContent).not.toContain('Example Resolved');
    expect(host.querySelector('#task-group-OVERDUE')?.parentElement?.textContent).toContain(
      'Example Overdue',
    );

    for (const [label] of examples) {
      selectTab(label);
      expect(host.textContent).toContain('Example ' + label);
      expect(host.querySelectorAll('.task-item')).toHaveLength(1);
    }
    http.expectNone({ method: 'GET', url });
  });

  it('creates a linked task in the modal and opens its existing stay detail', async () => {
    expectList([]);
    const dialog = await openTaskDialog();
    const linkInput = dialog.querySelector<HTMLInputElement>('input[name="taskLinkLookup"]')!;
    linkInput.focus();
    input(dialog, 'input[name="taskLinkLookup"]', 'Clementine');
    expect(dialog.querySelector('[role="status"]')?.textContent).toContain('Searching…');
    expect(linkInput.getAttribute('aria-expanded')).toBe('false');
    const lookup = await vi.waitFor(() =>
      http.expectOne(
        (request) =>
          request.url === url + '/link-options' && request.params.get('q') === 'Clementine',
      ),
    );
    lookup.flush({
      owners: { items: [owner], hasMore: false },
      cats: {
        items: [{ ...owner.currentCats[0], ownerId: owner.id, ownerName: owner.fullName }],
        hasMore: false,
      },
      stays: { items: [stay], hasMore: true },
      ownersFirst: false,
    });
    TestBed.tick();
    expect(
      Array.from(overlay.querySelectorAll('.mat-mdc-optgroup-label')).map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual(['Cats', 'Owners', 'Stays']);
    expect(overlay.querySelector('mat-optgroup:last-of-type .link-option')?.textContent).toContain(
      '12:00',
    );
    const panel = overlay.querySelector('.operations-task-link-options');
    expect(panel).not.toBeNull();
    overlay.querySelector<HTMLElement>('.link-more')!.click();
    http
      .expectOne(
        (request) =>
          request.url === url + '/link-options' &&
          request.params.get('group') === 'STAY' &&
          request.params.get('page') === '1',
      )
      .flush({
        stays: { items: [{ ...stay, id: 'older-stay', status: 'CHECKED_OUT' }], hasMore: false },
      });
    await vi.waitFor(() => {
      TestBed.tick();
      expect(overlay.querySelectorAll('mat-optgroup:last-of-type [role="option"]')).toHaveLength(2);
    });
    expect(overlay.querySelector('.operations-task-link-options')).toBe(panel);
    overlay.querySelector<HTMLElement>('mat-optgroup:last-of-type [role="option"]')!.click();
    TestBed.tick();
    expect(dialog.querySelector<HTMLInputElement>('input[name="taskLinkLookup"]')!.value).toContain(
      'Stay ·',
    );

    input(dialog, 'textarea', '  Prepare a clean carrier  ');
    input(dialog, 'input[name="dueDate"]', '2026-11-14');
    submit(dialog);

    const request = http.expectOne({ method: 'POST', url });
    expect(request.request.body).toEqual({
      description: task.description,
      dueDate: task.dueDate,
      stayId: stay.id,
      ownerId: null,
      catId: null,
    });
    request.flush(task, { status: 201, statusText: 'Created' });
    await vi.waitFor(() => expect(overlay.querySelector('[role="dialog"]')).toBeNull());
    expectList([task]);

    expect(activeTab()).toBe('All');
    expect(host.textContent).toContain(task.description);
    clickAction('View stay');
    expect(openDetail).toHaveBeenCalledWith({ entityType: 'stay', entityId: stay.id });
  });

  it('opens the existing owner and cat detail dialogs for direct links', () => {
    expectList([
      { ...task, id: 'owner-task', stayId: null, ownerId: owner.id },
      { ...task, id: 'cat-task', stayId: null, catId: owner.currentCats[0].id },
    ]);
    clickAction('View owner');
    expect(openDetail).toHaveBeenCalledWith({ entityType: 'owner', entityId: owner.id });
    clickAction('View cat');
    expect(openDetail).toHaveBeenCalledWith({
      entityType: 'cat',
      entityId: owner.currentCats[0].id,
    });
  });

  it('keeps the failed draft and switches tabs when the new task would be filtered out', async () => {
    expectList([]);
    selectTab('Today');
    const dialog = await openTaskDialog();
    input(dialog, 'textarea', 'Call the family');
    submit(dialog);

    const request = http.expectOne({ method: 'POST', url });
    expect(request.request.body).toEqual({
      description: 'Call the family',
      dueDate: null,
      stayId: null,
      ownerId: null,
      catId: null,
    });
    request.flush(null, { status: 500, statusText: 'Failed' });
    TestBed.tick();
    expect(dialog.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('Call the family');
    expect(dialog.textContent).toContain('Could not create the task.');

    submit(dialog);
    const undated: OperationsTask = {
      ...task,
      description: 'Call the family',
      dueDate: null,
      stayId: null,
      bucket: 'UNDATED',
    };
    http.expectOne({ method: 'POST', url }).flush(undated);
    await vi.waitFor(() => expect(overlay.querySelector('[role="dialog"]')).toBeNull());
    expectList([undated]);
    expect(activeTab()).toBe('No due date');
    expect(host.textContent).toContain(undated.description);
  });

  it('keeps the selected tab while resolving and reopening with the current revision', () => {
    expectList([task]);
    selectTab('Today');
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
    expect(activeTab()).toBe('Today');
    expect(host.textContent).not.toContain(task.description);

    selectTab('Resolved');
    expect(host.textContent).toContain('Resolved by admin-example');
    clickAction('Reopen');
    const reopen = http.expectOne({ method: 'PUT', url: resolutionUrl });
    expect(reopen.request.body).toEqual({ resolved: false, revision: 1 });
    const reopened = { ...task, revision: 2, lastTransition: task.created };
    reopen.flush(reopened);
    expectList([reopened]);
    expect(activeTab()).toBe('Resolved');
    selectTab('Today');
    expect(host.textContent).toContain('Reopened by staff-example');
  });

  it('refreshes the task after a stale resolution', () => {
    expectList([task]);
    clickAction('Resolve');
    http.expectOne({ method: 'PUT', url: url + '/' + task.id + '/resolution' }).flush(null, {
      status: 409,
      statusText: 'Conflict',
    });
    expectList([{ ...task, revision: 2, lastTransition: task.created }]);
    expect(host.textContent).toContain('The task changed. Review the updated list.');
  });

  it('shows the description error only on submission and clears it while editing', async () => {
    expectList([]);
    const dialog = await openTaskDialog();
    const description = dialog.querySelector<HTMLTextAreaElement>('textarea')!;

    description.dispatchEvent(new Event('blur'));
    TestBed.tick();
    expect(description.getAttribute('aria-invalid')).not.toBe('true');
    expect(dialog.querySelector('mat-error')).toBeNull();

    input(dialog, 'textarea', '   ');
    submit(dialog);
    TestBed.tick();
    expect(description.getAttribute('aria-invalid')).toBe('true');
    expect(dialog.querySelector('mat-error')?.textContent).toContain('Enter what needs doing.');
    http.expectNone({ method: 'POST', url });

    input(dialog, 'textarea', 'Call the family');
    expect(description.getAttribute('aria-invalid')).not.toBe('true');
    expect(dialog.querySelector('mat-error')).toBeNull();
  });

  it('creates an unlinked task even when an optional search has typed text', async () => {
    expectList([]);
    const dialog = await openTaskDialog();
    input(dialog, 'input[name="taskLinkLookup"]', 'Example');
    input(dialog, 'textarea', 'Check the carrier');
    submit(dialog);

    const request = http.expectOne({ method: 'POST', url });
    expect(request.request.body).toEqual({
      description: 'Check the carrier',
      dueDate: null,
      stayId: null,
      ownerId: null,
      catId: null,
    });
    request.flush({ ...task, description: 'Check the carrier', stayId: null, bucket: 'UNDATED' });
    await vi.waitFor(() => expect(overlay.querySelector('[role="dialog"]')).toBeNull());
    expectList([]);
  });

  it('refreshes a visible list every minute and on return, keeping the list during errors', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    expectList([task]);

    selectTab('Today');
    vi.advanceTimersByTime(59_999);
    http.expectNone({ method: 'GET', url });
    vi.advanceTimersByTime(1);
    const background = http.expectOne({ method: 'GET', url });
    vi.advanceTimersByTime(60_000);
    http.expectNone({ method: 'GET', url });
    background.flush(null, { status: 500, statusText: 'Failed' });
    fixture.detectChanges();

    expect(host.textContent).toContain(task.description);
    const retry = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Retry',
    )!;
    retry.click();
    expectList([{ ...task, description: 'Updated elsewhere' }]);
    expect(host.textContent).toContain('Updated elsewhere');
    expect(activeTab()).toBe('Today');

    visibility.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(120_000);
    http.expectNone({ method: 'GET', url });
    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expectList([{ ...task, description: 'Changed in another session' }]);
    expect(host.textContent).toContain('Changed in another session');
  });

  async function openTaskDialog(): Promise<HTMLElement> {
    const open = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'New task',
    );
    expect(open).toBeDefined();
    open!.click();
    TestBed.tick();
    await fixture.whenStable();
    const dialog = overlay.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    return dialog;
  }

  function expectList(tasks: OperationsTask[]): void {
    http.expectOne({ method: 'GET', url }).flush(tasks);
    fixture.detectChanges();
  }

  function tabs(): HTMLButtonElement[] {
    return Array.from(host.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  }

  function activeTab(): string {
    return tabs()
      .find((tab) => tab.getAttribute('aria-selected') === 'true')!
      .textContent!.trim();
  }

  function selectTab(label: string): void {
    tabs()
      .find((tab) => tab.textContent?.trim() === label)!
      .click();
    fixture.detectChanges();
  }

  function clickAction(action: string): void {
    Array.from(host.querySelectorAll('button'))
      .find((button) => button.getAttribute('aria-label') === action + ' · ' + task.description)!
      .click();
  }

  function input(container: HTMLElement, selector: string, value: string): void {
    const element = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    TestBed.tick();
  }

  function submit(container: HTMLElement): void {
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
});
