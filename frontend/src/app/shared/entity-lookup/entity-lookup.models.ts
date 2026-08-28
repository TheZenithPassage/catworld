import { Observable } from 'rxjs';

export const ENTITY_LOOKUP_PAGE_SIZE = 5;

export interface EntityLookupPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalElements: number;
}

export interface EntityLookupPresentation {
  primary: string;
  secondary?: string;
  selected: string;
}

export interface EntityLookupInitialSelection {
  id: string;
  label: string;
}

export interface EntityLookupAdapter<T> {
  search(query: string, page: number): Observable<EntityLookupPage<T>>;
  resolve?(id: string): Observable<T>;
  id(value: T): string;
  present(value: T): EntityLookupPresentation;
}

export interface EntityLookupState<T> {
  value: T | null;
  selectedId: string | null;
  rawContentPresent: boolean;
}
