import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatEditor } from '../../components/cat-editor/cat-editor';
@Component({
  selector: 'app-cat-edit-page',
  imports: [CatEditor],
  template: '<app-cat-editor [entityId]="catId" [routed]="true" (saved)="onSaved()" />',
})
export class CatEditPage {
  private readonly router = inject(Router);
  readonly catId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  onSaved(): void {
    this.router.navigate(['/cats']);
  }
}
