import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatApiService } from '../../services/cat-api.service';
import { CatInformationalPhotoGallery } from './cat-informational-photo-gallery';

describe('CatInformationalPhotoGallery', () => {
  let fixture: ComponentFixture<CatInformationalPhotoGallery>;
  const first = { id: 'photo-1', createdAt: '2026-11-12T08:00:00Z' };
  const second = { id: 'photo-2', createdAt: '2026-11-12T09:00:00Z' };
  const api = {
    listInformationalPhotos: vi.fn(),
    addInformationalPhoto: vi.fn(),
    deleteInformationalPhoto: vi.fn(),
  };

  beforeEach(async () => {
    localStorage.clear();
    vi.resetAllMocks();
    api.listInformationalPhotos.mockReturnValue(of([first]));
    api.addInformationalPhoto.mockReturnValue(of(second));
    api.deleteInformationalPhoto.mockReturnValue(of(undefined));
    await TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      imports: [CatInformationalPhotoGallery],
      providers: [{ provide: CatApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(CatInformationalPhotoGallery);
    fixture.componentRef.setInput('catId', 'cat-1');
    fixture.detectChanges();
  });

  it('uploads a selected image and lets the user open it', () => {
    const file = new File(['sample'], 'photo.jpg', { type: 'image/jpeg' });
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    const opened = vi.fn();
    fixture.componentInstance.openPhoto.subscribe(opened);
    api.listInformationalPhotos.mockReturnValue(of([second, first]));

    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(api.addInformationalPhoto).toHaveBeenCalledWith('cat-1', file);
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(2);
    fixture.nativeElement.querySelector('.view-photo').click();
    expect(opened).toHaveBeenCalledWith(second.id);
  });

  it('only deletes the selected image after explicit confirmation', () => {
    const removeButton = () => fixture.nativeElement.querySelector('li button[aria-label]');
    removeButton().click();
    fixture.detectChanges();
    const actions = () => fixture.nativeElement.querySelectorAll('.confirmation-actions button');
    expect(document.activeElement).toBe(actions()[0]);
    actions()[0].click();
    fixture.detectChanges();
    expect(api.deleteInformationalPhoto).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(removeButton());

    removeButton().click();
    fixture.detectChanges();
    actions()[1].click();
    fixture.detectChanges();
    expect(api.deleteInformationalPhoto).toHaveBeenCalledWith('cat-1', first.id);
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(0);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('header button'));
  });
});
