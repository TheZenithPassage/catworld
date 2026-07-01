import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiStateComponent } from './ui-state';

describe('UiStateComponent', () => {
  let fixture: ComponentFixture<UiStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiStateComponent);
  });

  it('renders loading state as an accessible status with a progress spinner', () => {
    fixture.componentRef.setInput('kind', 'loading');
    fixture.componentRef.setInput('message', 'Loading cats...');

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[role="status"]')?.textContent).toContain('Loading cats...');
    expect(compiled.querySelector('mat-progress-spinner')).not.toBeNull();
  });

  it('renders error state as an alert with the provided message', () => {
    fixture.componentRef.setInput('kind', 'error');
    fixture.componentRef.setInput('message', 'Error loading cats');

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('Error loading cats');
    expect(compiled.querySelector('.ui-state-icon svg')).not.toBeNull();
  });

  it('emits an action when the optional action button is clicked', () => {
    const actionSpy = vi.fn();
    fixture.componentRef.setInput('kind', 'error');
    fixture.componentRef.setInput('message', 'Error loading cats');
    fixture.componentRef.setInput('actionLabel', 'Try again');
    fixture.componentInstance.actionTriggered.subscribe(actionSpy);

    fixture.detectChanges();
    fixture.nativeElement.querySelector('button')?.click();

    expect(actionSpy).toHaveBeenCalledOnce();
  });
});
