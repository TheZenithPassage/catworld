import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CatPhotoInput } from './cat-photo-input';

describe('CatPhotoInput', () => {
  let fixture: ComponentFixture<CatPhotoInput>;
  let component: CatPhotoInput;
  let createUrl: ReturnType<typeof vi.spyOn>;
  let revokeUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [CatPhotoInput],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(CatPhotoInput);
    component = fixture.componentInstance;
  });

  afterEach(() => vi.restoreAllMocks());

  it('keeps an accepted replacement valid when later candidate selections are rejected', () => {
    const jpeg = new File(['ok'], 'cat.jpg', { type: 'image/jpeg' });
    component.select(change(jpeg));
    expect(component.mutation()).toEqual({ photo: jpeg, removePhoto: false });
    expect(component.previewUrl()).toBe('blob:preview');

    component.select(change(new File(['bad'], 'cat.gif', { type: 'image/gif' })));
    expect(component.mutation().photo).toBe(jpeg);
    expect(component.selectionError()).not.toBeNull();
    expect(component.valid()).toBe(true);

    component.select(change(new File(['tiny'], 'cat.heic', { type: 'image/heic' })));
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview');
    expect(component.previewUrl()).toBeNull();
    expect(component.mutation().photo?.name).toBe('cat.heic');
    expect(createUrl).toHaveBeenCalledTimes(1);

    const oversized = new File(['x'], 'large.png', { type: 'image/png' });
    Object.defineProperty(oversized, 'size', { value: 32 * 1024 * 1024 + 1 });
    component.select(change(oversized));
    expect(component.mutation().photo?.name).toBe('cat.heic');
    expect(component.selectionError()).toBe(component.text().cats.photo.errors.localFileTooLarge);
    expect(component.valid()).toBe(true);

    component.removeSelection();
    expect(component.mutation()).toEqual({ photo: null, removePhoto: false });
    expect(component.valid()).toBe(true);
  });

  it('keeps no-photo and saved-photo intents valid when a candidate is rejected', () => {
    component.select(change(new File(['bad'], 'cat.gif', { type: 'image/gif' })));

    expect(component.mutation()).toEqual({ photo: null, removePhoto: false });
    expect(component.selectionError()).toBe(
      component.text().cats.photo.errors.localUnsupportedFormat,
    );
    expect(component.valid()).toBe(true);

    component.reset();
    fixture.componentRef.setInput('savedHasPhoto', true);
    const oversized = new File(['x'], 'large.png', { type: 'image/png' });
    Object.defineProperty(oversized, 'size', { value: 32 * 1024 * 1024 + 1 });
    component.select(change(oversized));

    expect(component.mutation()).toEqual({ photo: null, removePhoto: false });
    expect(component.selectionError()).toBe(component.text().cats.photo.errors.localFileTooLarge);
    expect(component.valid()).toBe(true);
  });

  it('uses tolerant MIME or extension acceptance and infers generic-MIME previews', () => {
    const genericJpeg = new File(['jpeg'], 'cat.jpg', { type: 'application/octet-stream' });
    component.select(change(genericJpeg));
    expect(component.mutation().photo).toBe(genericJpeg);
    expect(component.previewUrl()).toBe('blob:preview');

    const oddExtensionPng = new File(['png'], 'cat.odd', { type: 'image/png' });
    component.select(change(oddExtensionPng));
    expect(component.mutation().photo).toBe(oddExtensionPng);
    expect(component.valid()).toBe(true);
    expect(component.previewUrl()).toBe('blob:preview');
  });

  it('renders supported native button triggers with focus and disabled behavior', () => {
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const click = vi.spyOn(input, 'click');

    expect(input.hidden).toBe(true);
    expect(input.matches(':focus')).toBe(false);
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger.type).toBe('button');
    expect(trigger.textContent).toContain(component.text().cats.photo.select);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    expect(click).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(trigger.disabled).toBe(true);
    trigger.click();
    expect(click).toHaveBeenCalledOnce();
  });

  it('keeps the replacement action first across saved-photo states', () => {
    fixture.componentRef.setInput('savedHasPhoto', true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click');

    expect(actionLabels()).toEqual([
      component.text().cats.photo.replace,
      component.text().cats.photo.removeSaved,
    ]);
    actionButtons()[0].click();
    expect(click).toHaveBeenCalledOnce();

    component.markSavedPhotoForRemoval();
    fixture.detectChanges();
    expect(actionLabels()).toEqual([
      component.text().cats.photo.replace,
      component.text().cats.photo.undoRemoval,
    ]);
    actionButtons()[0].click();
    expect(click).toHaveBeenCalledTimes(2);

    const replacement = new File(['replacement'], 'replacement.jpg', { type: 'image/jpeg' });
    component.select(change(replacement));
    fixture.detectChanges();
    expect(component.mutation()).toEqual({ photo: replacement, removePhoto: false });
    expect(actionLabels()).toEqual([
      component.text().cats.photo.replace,
      component.text().cats.photo.removeSelection,
    ]);
  });

  it('keeps a selected file but revokes a failed preview exactly once', () => {
    const jpeg = new File(['jpeg'], 'cat.jpg', { type: 'image/jpeg' });
    component.select(change(jpeg));
    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    preview.dispatchEvent(new Event('load'));
    expect(revokeUrl).not.toHaveBeenCalled();
    preview.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(component.mutation().photo).toBe(jpeg);
    expect(component.valid()).toBe(true);
    expect(component.previewUrl()).toBeNull();
    expect(revokeUrl).toHaveBeenCalledTimes(1);
    component.previewFailed('blob:preview');
    expect(revokeUrl).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain(
      component.text().cats.photo.previewUnavailable,
    );
  });

  it('models saved removal, replacement, cleanup, and reset without leaking object URLs', () => {
    fixture.componentRef.setInput('savedHasPhoto', true);
    component.markSavedPhotoForRemoval();
    expect(component.mutation()).toEqual({ photo: null, removePhoto: true });

    const first = new File(['one'], 'one.png', { type: 'image/png' });
    const second = new File(['two'], 'two.webp', { type: 'image/webp' });
    component.select(change(first));
    expect(component.mutation()).toEqual({ photo: first, removePhoto: false });
    createUrl.mockReturnValueOnce('blob:second');
    component.select(change(second));
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview');
    expect(component.mutation()).toEqual({ photo: second, removePhoto: false });
    component.reset();
    expect(revokeUrl).toHaveBeenCalledWith('blob:second');
    expect(component.mutation()).toEqual({ photo: null, removePhoto: false });

    createUrl.mockReturnValueOnce('blob:destroy');
    component.select(change(first));
    fixture.destroy();
    expect(revokeUrl).toHaveBeenCalledWith('blob:destroy');
  });

  function actionButtons(): HTMLButtonElement[] {
    return [...fixture.nativeElement.querySelectorAll('.photo-actions button')];
  }

  function actionLabels(): string[] {
    return actionButtons().map((button) => button.textContent?.trim() ?? '');
  }
});

function change(file: File): Event {
  return { target: { files: [file], value: 'selected' } } as unknown as Event;
}
