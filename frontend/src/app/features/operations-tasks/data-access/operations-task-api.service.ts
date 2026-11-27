import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../../../core/config/api.config';
import type { StayRelationshipItem } from '../../../shared/entity-detail/relationship.models';
import type { CatLookup } from '../../cats/models/cat.model';
import type { OwnerLookup, OwnerLookupCat } from '../../owners/models/owner.model';

export type OperationsTaskBucket = 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'UNDATED' | 'RESOLVED';

export interface OperationsTaskAttribution {
  actorId: string;
  username: string;
  at: string;
}

export interface OperationsTask {
  id: string;
  description: string;
  dueDate: string | null;
  stayId: string | null;
  ownerId: string | null;
  catId: string | null;
  bucket: OperationsTaskBucket;
  revision: number;
  created: OperationsTaskAttribution;
  lastTransition: OperationsTaskAttribution | null;
}

export interface CreateOperationsTask {
  description: string;
  dueDate: string | null;
  stayId: string | null;
  ownerId: string | null;
  catId: string | null;
}

export type OperationsTaskLinkKind = 'OWNER' | 'CAT' | 'STAY';

export interface OperationsTaskLinkTarget {
  kind: OperationsTaskLinkKind;
  id: string;
}

export interface OperationsTaskStayLink extends Pick<
  StayRelationshipItem,
  'startAt' | 'endAt' | 'status'
> {
  id: string;
  ownerName: string;
  ownerDeceased: boolean;
  cats: OwnerLookupCat[];
}

export interface OperationsTaskLinkResults<T> {
  items: T[];
  hasMore: boolean;
}

export interface OperationsTaskLinkOptions {
  owners: OperationsTaskLinkResults<OwnerLookup> | null;
  cats: OperationsTaskLinkResults<CatLookup> | null;
  stays: OperationsTaskLinkResults<OperationsTaskStayLink> | null;
  ownersFirst: boolean;
}

@Injectable({ providedIn: 'root' })
export class OperationsTaskApiService {
  private readonly http = inject(HttpClient);
  private readonly url = API_BASE_URL + '/operations/tasks';

  list() {
    return this.http.get<OperationsTask[]>(this.url);
  }

  create(task: CreateOperationsTask) {
    return this.http.post<OperationsTask>(this.url, task);
  }

  searchLinks(q: string, group?: OperationsTaskLinkKind, page = 0) {
    return this.http.get<OperationsTaskLinkOptions>(this.url + '/link-options', {
      params: group ? { q, group, page } : { q },
    });
  }

  changeResolution(task: OperationsTask, resolved: boolean) {
    return this.http.put<OperationsTask>(this.url + '/' + task.id + '/resolution', {
      resolved,
      revision: task.revision,
    });
  }
}
