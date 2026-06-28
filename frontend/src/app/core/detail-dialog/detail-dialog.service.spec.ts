import { Dialog } from '@angular/cdk/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, input, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { DetailDialogService } from './detail-dialog.service';

@Component({
  selector: 'app-test-owner-detail',
  template: `
    <p id="owner-detail-body">{{ label() }}</p>
    <button type="button" id="open-related-detail" (click)="openRelatedDetail()">
      Open related detail
    </button>
  `,
})
class TestOwnerDetailComponent {
  private readonly detailDialogService = inject(DetailDialogService);

  readonly label = input.required<string>();

  openRelatedDetail(): void {
    this.detailDialogService.replace(
      {
        title: 'Cat Luna',
        bodyComponent: TestCatDetailComponent,
        bodyInputs: {
          label: 'Cat detail content',
        },
        editCommands: ['/cats', 'cat-1', 'edit'],
      },
      {
        routeSync: {
          queryParams: {
            detail: 'cat:cat-1',
          },
        },
      },
    );
  }
}

@Component({
  selector: 'app-test-cat-detail',
  template: '<p id="cat-detail-body">{{ label() }}</p>',
})
class TestCatDetailComponent {
  readonly label = input.required<string>();
}

@Component({
  selector: 'app-test-host',
  template: `
    <button type="button" id="open-owner-detail" (click)="openOwnerDetail()">
      Open owner detail
    </button>
  `,
})
class TestHostComponent {
  private readonly detailDialogService = inject(DetailDialogService);
  private readonly route = inject(ActivatedRoute);

  openOwnerDetail(): void {
    this.detailDialogService.open(
      {
        title: 'Owner Ada',
        bodyComponent: TestOwnerDetailComponent,
        bodyInputs: {
          label: 'Owner detail content',
        },
        editCommands: ['/owners', 'owner-1', 'edit'],
      },
      {
        routeSync: {
          relativeTo: this.route,
          queryParams: {
            detail: 'owner:owner-1',
          },
        },
      },
    );
  }
}

@Component({
  selector: 'app-empty-route',
  template: '',
})
class EmptyRouteComponent {}

describe('DetailDialogService', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let overlayContainer: OverlayContainer;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        Dialog,
        provideRouter([
          {
            path: 'owners/:id/edit',
            component: EmptyRouteComponent,
          },
          {
            path: 'cats/:id/edit',
            component: EmptyRouteComponent,
          },
        ]),
      ],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
    TestBed.resetTestingModule();
  });

  it('opens one accessible shell with the configured title, actions and body content', async () => {
    await openOwnerDetail();

    expect(dialogText()).toContain('Owner Ada');
    expect(dialogText()).toContain('Owner detail content');
    expect(dialogElement()?.getAttribute('role')).toBe('dialog');
    expect(dialogElement()?.getAttribute('aria-labelledby')).toBe('detail-dialog-title');
    expect(overlayElement().querySelectorAll('.detail-dialog-shell')).toHaveLength(1);
    expect(dialogText()).toContain('Edit');
  });

  it('replaces the current detail without opening another dialog and returns to the previous detail', async () => {
    await openOwnerDetail();

    await clickInDialog('#open-related-detail');

    expect(overlayElement().querySelectorAll('.detail-dialog-shell')).toHaveLength(1);
    expect(dialogText()).toContain('Cat Luna');
    expect(dialogText()).toContain('Cat detail content');

    await clickInDialog('.detail-dialog-back');

    expect(dialogText()).toContain('Owner Ada');
    expect(dialogText()).toContain('Owner detail content');
  });

  it('syncs route query parameters while opening, replacing, going back and closing', async () => {
    await openOwnerDetail();

    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: expect.any(ActivatedRoute),
      queryParams: {
        detail: 'owner:owner-1',
      },
      queryParamsHandling: 'merge',
      replaceUrl: false,
    });

    await clickInDialog('#open-related-detail');

    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: undefined,
      queryParams: {
        detail: 'cat:cat-1',
      },
      queryParamsHandling: 'merge',
      replaceUrl: false,
    });

    await clickInDialog('.detail-dialog-back');

    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: expect.any(ActivatedRoute),
      queryParams: {
        detail: 'owner:owner-1',
      },
      queryParamsHandling: 'merge',
      replaceUrl: false,
    });

    await clickInDialog('.detail-dialog-close');

    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: expect.any(ActivatedRoute),
      queryParams: {
        detail: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('uses browser-style route changes to move backward and forward through known details', async () => {
    await openOwnerDetail();
    await clickInDialog('#open-related-detail');

    expect(dialogText()).toContain('Cat Luna');

    await router.navigate([], {
      queryParams: {
        detail: 'owner:owner-1',
      },
      queryParamsHandling: 'merge',
    });
    fixture.detectChanges();

    expect(dialogText()).toContain('Owner Ada');
    expect(dialogText()).toContain('Owner detail content');

    await router.navigate([], {
      queryParams: {
        detail: 'cat:cat-1',
      },
      queryParamsHandling: 'merge',
    });
    fixture.detectChanges();

    expect(dialogText()).toContain('Cat Luna');
    expect(dialogText()).toContain('Cat detail content');
  });

  it('uses one edit navigation and does not also run close-route cleanup', async () => {
    await openOwnerDetail();
    vi.mocked(router.navigate).mockClear();

    await clickInDialog('.detail-dialog-actions .secondary-action');

    expect(router.navigate).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/owners', 'owner-1', 'edit'], {
      queryParams: undefined,
    });
    expect(overlayElement().querySelector('.detail-dialog-shell')).toBeNull();
  });

  it('returns focus to the triggering control when the dialog closes through the shell', async () => {
    const trigger = fixture.nativeElement.querySelector('#open-owner-detail') as HTMLButtonElement;
    trigger.focus();
    await openOwnerDetail();

    await clickInDialog('.detail-dialog-close');

    expect(document.activeElement).toBe(trigger);
  });

  async function openOwnerDetail(): Promise<void> {
    clickElement(fixture.nativeElement.querySelector('#open-owner-detail') as HTMLButtonElement);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function clickInDialog(selector: string): Promise<void> {
    clickElement(overlayElement().querySelector(selector) as HTMLElement);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function clickElement(element: HTMLElement): void {
    element.click();
  }

  function dialogElement(): HTMLElement | null {
    return overlayElement().querySelector('[role="dialog"]');
  }

  function overlayElement(): HTMLElement {
    return overlayContainer.getContainerElement();
  }

  function dialogText(): string {
    return overlayElement().textContent ?? '';
  }
});
