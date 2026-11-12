import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../core/i18n/i18n.service';
import { GalleryPublicationApi } from './gallery-publication-api.service';
import { GalleryPublicationPage } from './gallery-publication-page';

const draft = {
  id: 'draft-id',
  name: 'Nube',
  description: null,
  kind: 'GUEST',
  publishedAt: null,
  version: 4,
} as const;

describe('GalleryPublicationPage', () => {
  let fixture: ComponentFixture<GalleryPublicationPage>;
  const publish = vi.fn();

  beforeEach(async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:gallery-preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    publish.mockReturnValue(of({ ...draft, publishedAt: '2026-11-12T12:00:00Z', version: 5 }));
    await TestBed.configureTestingModule({
      imports: [GalleryPublicationPage],
      providers: [
        {
          provide: GalleryPublicationApi,
          useValue: {
            list: () => of([draft]),
            preview: () => of(new Blob(['jpeg'], { type: 'image/jpeg' })),
            publish,
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).language.set('en');
    fixture = TestBed.createComponent(GalleryPublicationPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    publish.mockReset();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('requires guest confirmation for the saved version and disables publish while edits are unsaved', async () => {
    const root = fixture.nativeElement as HTMLElement;
    function button(label: string): HTMLButtonElement {
      return [...root.querySelectorAll('button')].find(
        (element) => element.textContent?.trim() === label,
      )!;
    }

    button('Open').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(button('Publish').disabled).toBe(true);

    const permission = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    permission.click();
    fixture.detectChanges();
    expect(button('Publish').disabled).toBe(false);

    const name = root.querySelector<HTMLInputElement>('input[name="name"]')!;
    name.value = 'Unsaved name';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(button('Publish').disabled).toBe(true);
    expect(publish).not.toHaveBeenCalled();

    name.value = draft.name;
    name.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    button('Publish').click();
    fixture.detectChanges();

    expect(publish).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledWith(draft.id, 4, true);
    expect(button('Hide')).toBeTruthy();
  });
});
