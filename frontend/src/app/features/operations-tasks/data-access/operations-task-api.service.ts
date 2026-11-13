import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../../../core/config/api.config';

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
  bucket: OperationsTaskBucket;
  revision: number;
  created: OperationsTaskAttribution;
  lastTransition: OperationsTaskAttribution | null;
}

export interface CreateOperationsTask {
  description: string;
  dueDate: string | null;
  stayId: string | null;
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

  changeResolution(task: OperationsTask, resolved: boolean) {
    return this.http.put<OperationsTask>(this.url + '/' + task.id + '/resolution', {
      resolved,
      revision: task.revision,
    });
  }
}
