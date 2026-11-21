import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CatApiService } from '../../services/cat-api.service';
import { CatInformationalPhotoGallery } from './cat-informational-photo-gallery';

describe('CatInformationalPhotoGallery', () => {
  let fixture: ComponentFixture<CatInformationalPhotoGallery>;
  const first = { id: 'photo-1', createdAt: '2026-11-12T08:00:00Z' };
  const api = {
    listInformationalPhotos: vi.fn(),
    addInformationalPhoto: vi.fn(),
    deleteInformationalPhoto: vi.fn(),
  };

  beforeEach(async () => {
    localStorage.clear();
    vi.resetAllMocks();
    api.listInformationalPhotos.mockReturnValue(of([first]));
    await TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      imports: [CatInformationalPhotoGallery],
      providers: [provideNoopAnimations(), { provide: CatApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(CatInformationalPhotoGallery);
    fixture.componentRef.setInput('catId', 'cat-1');
    fixture.detectChanges();
  });

  it('opens the saved photo in read mode and leaves mutation controls in the editor', () => {
    const opened = vi.fn();
    fixture.componentInstance.openPhoto.subscribe(opened);

    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.querySelector('.remove-photo')).toBeNull();
    fixture.nativeElement.querySelector('.view-photo').click();
    expect(opened).toHaveBeenCalledWith(first.id);
  });

  it('only stages a saved photo removal after explicit confirmation', () => {
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();
    const removeButton = () => fixture.nativeElement.querySelector('li button[aria-label]');
    removeButton().click();
    fixture.detectChanges();
    const actions = () => fixture.nativeElement.querySelectorAll('.confirmation-actions button');
    expect(document.activeElement).toBe(actions()[0]);
    actions()[0].click();
    fixture.detectChanges();
    expect(api.deleteInformationalPhoto).not.toHaveBeenCalled();
    expect(fixture.componentInstance.removals()).toEqual([]);
    expect(document.activeElement).toBe(removeButton());

    removeButton().click();
    fixture.detectChanges();
    actions()[1].click();
    fixture.detectChanges();
    expect(api.deleteInformationalPhoto).not.toHaveBeenCalled();
    expect(fixture.componentInstance.removals()).toEqual([first.id]);
    expect(fixture.nativeElement.querySelector('.view-photo')).toBeNull();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('header button'));
    fixture.nativeElement.querySelector('.restore-photo').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.removals()).toEqual([]);
    expect(fixture.nativeElement.querySelector('.view-photo')).not.toBeNull();
    expect(document.activeElement).toBe(removeButton());
  });
});
