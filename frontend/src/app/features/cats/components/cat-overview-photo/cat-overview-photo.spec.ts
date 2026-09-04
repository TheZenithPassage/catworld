import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CatApiService } from '../../services/cat-api.service';
import { CatOverviewPhoto } from './cat-overview-photo';

describe('CatOverviewPhoto', () => {
  const api = { getCatPhoto: vi.fn<() => Observable<Blob>>() };
  const createObjectURL = vi.fn((blob: Blob) => `blob:${blob.size}`);
  const revokeObjectURL = vi.fn();
  let fixture: ComponentFixture<CatOverviewPhoto>;

  beforeEach(async () => {
    vi.resetAllMocks();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    await TestBed.configureTestingModule({
      imports: [CatOverviewPhoto],
      providers: [{ provide: CatApiService, useValue: api }],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  function createComponent(hasPhoto: boolean, catId = 'cat-1'): void {
    fixture = TestBed.createComponent(CatOverviewPhoto);
    fixture.componentRef.setInput('catId', catId);
    fixture.componentRef.setInput('catName', 'Milo');
    fixture.componentRef.setInput('hasPhoto', hasPhoto);
    fixture.detectChanges();
  }

  it('loads an authenticated photo and revokes its object URL on destroy', () => {
    api.getCatPhoto.mockReturnValue(of(new Blob(['photo'])));

    createComponent(true);

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image.src).toContain('blob:5');
    expect(image.alt).toBe(fixture.componentInstance.text().cats.detail.photoAlt('Milo'));

    fixture.destroy();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:5');
  });

  it('uses the accessible fallback when a photo is absent or fails', () => {
    createComponent(false);
    expect(api.getCatPhoto).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      fixture.componentInstance.text().cats.detail.photoMissing,
    );

    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('ignores a stale photo completion after the cat changes', () => {
    const first = new Subject<Blob>();
    api.getCatPhoto.mockReturnValueOnce(first).mockReturnValueOnce(throwError(() => new Error()));
    createComponent(true);

    fixture.componentRef.setInput('catId', 'cat-2');
    fixture.detectChanges();
    first.next(new Blob(['stale']));
    fixture.detectChanges();

    expect(createObjectURL).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
});
