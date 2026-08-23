import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VetEditor } from '../../components/vet-editor/vet-editor';
@Component({
  selector: 'app-vet-edit-page',
  imports: [VetEditor],
  template: '<app-vet-editor [entityId]="vetId" [routed]="true" (saved)="onSaved()" />',
})
export class VetEditPage {
  private readonly router = inject(Router);
  readonly vetId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  onSaved(): void {
    this.router.navigate(['/vets']);
  }
}
