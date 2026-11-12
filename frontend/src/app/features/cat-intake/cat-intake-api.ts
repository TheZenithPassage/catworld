import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../../core/config/api.config';
import {
  ActiveCatIntakeInvitation,
  CatIntakeApproval,
  CatIntakeInvitationRequest,
  CatIntakeReviewDetail,
  CatIntakeReviewItem,
  IssuedCatIntakeInvitation,
} from './cat-intake-models';

@Injectable({ providedIn: 'root' })
export class CatIntakeApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/cat-intake`;

  getActiveInvitation(ownerId: string) {
    return this.http.get<ActiveCatIntakeInvitation | null>(`${this.baseUrl}/invitations/active`, {
      params: { ownerId },
    });
  }

  issueInvitation(request: CatIntakeInvitationRequest) {
    return this.http.post<IssuedCatIntakeInvitation>(`${this.baseUrl}/invitations`, request);
  }

  revokeInvitation(invitationId: string) {
    return this.http.delete<void>(`${this.baseUrl}/invitations/${invitationId}`);
  }

  listReview() {
    return this.http.get<CatIntakeReviewItem[]>(`${this.baseUrl}/review`);
  }

  getReview(id: string) {
    return this.http.get<CatIntakeReviewDetail>(`${this.baseUrl}/review/${id}`);
  }

  getReviewPhoto(id: string, photoId: string) {
    return this.http.get(`${this.baseUrl}/review/${id}/photos/${photoId}`, {
      responseType: 'blob',
    });
  }

  approve(id: string, approval: CatIntakeApproval) {
    return this.http.post<void>(`${this.baseUrl}/review/${id}/approve`, approval);
  }
}
