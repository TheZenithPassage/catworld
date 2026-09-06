import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import {
  EntityLookupAdapter,
  EntityLookupPage,
} from '../../../shared/entity-lookup/entity-lookup.models';

export interface AccountLookup {
  id: string;
  username: string;
}
export interface StayLookup {
  stayId: string;
  startAt: string;
  endAt: string;
  owner: { id: string; fullName: string };
  cats: { id: string; name: string }[];
}
export interface StayLookupCriteria {
  ownerId?: string;
  catId?: string;
  from?: string;
  to?: string;
}
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const id = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function account(v: unknown): v is AccountLookup {
  return record(v) && id(v['id']) && typeof v['username'] === 'string';
}
function stay(v: unknown): v is StayLookup {
  return (
    record(v) &&
    id(v['stayId']) &&
    typeof v['startAt'] === 'string' &&
    typeof v['endAt'] === 'string' &&
    /^\d{4}-\d{2}-\d{2}T/.test(v['startAt']) &&
    /^\d{4}-\d{2}-\d{2}T/.test(v['endAt']) &&
    record(v['owner']) &&
    id(v['owner']['id']) &&
    typeof v['owner']['fullName'] === 'string' &&
    Array.isArray(v['cats']) &&
    v['cats'].every((c) => record(c) && id(c['id']) && typeof c['name'] === 'string')
  );
}
function item<T>(value: unknown, valid: (v: unknown) => v is T): T {
  if (!valid(value)) throw new Error('Malformed lookup response');
  return value;
}
function page<T>(
  value: unknown,
  requested: number,
  valid: (v: unknown) => v is T,
): EntityLookupPage<T> {
  if (
    !record(value) ||
    value['page'] !== requested ||
    value['pageSize'] !== 5 ||
    !Number.isSafeInteger(value['totalElements']) ||
    (value['totalElements'] as number) < 0 ||
    !Array.isArray(value['items']) ||
    value['items'].length > 5 ||
    !value['items'].every(valid)
  ) {
    throw new Error('Malformed lookup page');
  }
  return value as unknown as EntityLookupPage<T>;
}
@Injectable({ providedIn: 'root' })
export class ActivityLookupService implements EntityLookupAdapter<AccountLookup> {
  private readonly http = inject(HttpClient);
  search(q: string, requested = 0) {
    return this.http
      .get<unknown>(API_BASE_URL + '/users/search', { params: { q: q.trim(), page: requested } })
      .pipe(map((v) => page(v, requested, account)));
  }
  resolve(value: string) {
    return this.http
      .get<unknown>(API_BASE_URL + '/users/' + value + '/lookup')
      .pipe(map((v) => item(v, account)));
  }
  id(value: AccountLookup) {
    return value.id;
  }
  present(value: AccountLookup) {
    return { primary: value.username, selected: value.username };
  }
  searchStays(criteria: StayLookupCriteria, requested = 0) {
    const params = Object.fromEntries(
      Object.entries(criteria).filter(([, value]) => !!value),
    ) as Record<string, string>;
    return this.http
      .get<unknown>(API_BASE_URL + '/stays/search', { params: { ...params, page: requested } })
      .pipe(map((v) => page(v, requested, stay)));
  }
  resolveStay(value: string) {
    return this.http
      .get<unknown>(API_BASE_URL + '/stays/' + value + '/lookup')
      .pipe(map((v) => item(v, stay)));
  }
}
