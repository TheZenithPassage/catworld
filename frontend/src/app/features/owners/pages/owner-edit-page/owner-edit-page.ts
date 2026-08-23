import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OwnerEditor } from '../../components/owner-editor/owner-editor';

@Component({
  selector: 'app-owner-edit-page',
  imports: [OwnerEditor],
  template: '<app-owner-editor [entityId]="ownerId" [routed]="true" (saved)="onSaved()" />',
})
export class OwnerEditPage {
  private readonly router = inject(Router);
  readonly ownerId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  onSaved(): void {
    this.router.navigate(['/owners']);
  }
}
