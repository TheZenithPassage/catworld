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

  it('keeps prior valid state when type or size selection is rejected and accepts HEIC without preview', () => {
    const jpeg = new File(['ok'], 'cat.jpg', { type: 'image/jpeg' });
    component.select(change(jpeg));
    expect(component.mutation()).toEqual({ photo: jpeg, removePhoto: false });
    expect(component.previewUrl()).toBe('blob:preview');

    component.select(change(new File(['bad'], 'cat.gif', { type: 'image/gif' })));
    expect(component.mutation().photo).toBe(jpeg);
    expect(component.selectionError()).not.toBeNull();

    component.select(change(new File(['tiny'], 'cat.heic', { type: 'image/heic' })));
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview');
    expect(component.previewUrl()).toBeNull();
    expect(component.mutation().photo?.name).toBe('cat.heic');
    expect(createUrl).toHaveBeenCalledTimes(1);

    const oversized = new File(['x'], 'large.png', { type: 'image/png' });
    Object.defineProperty(oversized, 'size', { value: 32 * 1024 * 1024 + 1 });
    component.select(change(oversized));
    expect(component.mutation().photo?.name).toBe('cat.heic');
  });

  it('models saved removal, replacement, cleanup, and reset without leaking object URLs', () => {
    fixture.componentRef.setInput('savedHasPhoto', true);
    component.markSavedPhotoForRemoval();
    expect(component.mutation()).toEqual({ photo: null, removePhoto: true });
    component.undoRemoval();
    expect(component.mutation()).toEqual({ photo: null, removePhoto: false });

    const first = new File(['one'], 'one.png', { type: 'image/png' });
    const second = new File(['two'], 'two.webp', { type: 'image/webp' });
    component.select(change(first));
    createUrl.mockReturnValueOnce('blob:second');
    component.select(change(second));
    expect(revokeUrl).toHaveBeenCalledWith('blob:preview');
    expect(component.mutation()).toEqual({ photo: second, removePhoto: false });
    component.reset();
    expect(revokeUrl).toHaveBeenCalledWith('blob:second');
    expect(component.mutation()).toEqual({ photo: null, removePhoto: false });
  });
});

function change(file: File): Event {
  return { target: { files: [file], value: 'selected' } } as unknown as Event;
}
