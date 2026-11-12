import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../../core/config/api.config';

export type GalleryCatKind = 'RESIDENT' | 'GUEST';

export interface GalleryPublicationRequest {
  name: string;
  description: string | null;
  kind: GalleryCatKind;
}

export interface GalleryPublicationSummary extends GalleryPublicationRequest {
  id: string;
  publishedAt: string | null;
  version: number;
}

@Injectable({ providedIn: 'root' })
export class GalleryPublicationApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/gallery-publications`;

  list() {
    return this.http.get<GalleryPublicationSummary[]>(this.base);
  }

  create(publication: GalleryPublicationRequest, photo: File) {
    return this.http.post<GalleryPublicationSummary>(this.base, this.body(publication, photo));
  }

  update(id: string, publication: GalleryPublicationRequest, photo: File | null) {
    return this.http.put<GalleryPublicationSummary>(
      `${this.base}/${id}`,
      this.body(publication, photo),
    );
  }

  preview(id: string) {
    return this.http.get(`${this.base}/${id}/photo`, { responseType: 'blob' });
  }

  publish(id: string, version: number, guestPermissionConfirmed: boolean) {
    return this.http.post<GalleryPublicationSummary>(`${this.base}/${id}/publish`, {
      version,
      guestPermissionConfirmed,
    });
  }

  hide(id: string) {
    return this.http.post<GalleryPublicationSummary>(`${this.base}/${id}/hide`, null);
  }

  private body(publication: GalleryPublicationRequest, photo: File | null): FormData {
    const data = new FormData();
    data.append(
      'publication',
      new Blob([JSON.stringify(publication)], { type: 'application/json' }),
    );
    if (photo) data.append('photo', photo);
    return data;
  }
}
