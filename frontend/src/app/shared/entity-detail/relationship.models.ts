import { Cat } from '../../features/cats/models/cat.model';
import { Owner } from '../../features/owners/models/owner.model';
import { Vet } from '../../features/vets/models/vet.model';

export interface RelationshipPreview<T> {
  totalElements: number;
  items: T[];
}

export interface RelationshipPage<T> {
  items: T[];
  page: number;
  pageSize: 5;
  totalElements: number;
  totalPages: number;
}

export interface OwnerRelationshipItem {
  id: string;
  fullName: string;
}
export interface VetRelationshipItem {
  id: string;
  name: string;
}
export interface CatRelationshipItem {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
}
export interface StayRelationshipItem {
  stayId: string;
  startAt: string;
  endAt: string;
  status: 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
}

export interface OwnerDetailResponse {
  owner: Owner;
  cats: RelationshipPreview<CatRelationshipItem>;
  stays: RelationshipPreview<StayRelationshipItem>;
}

export interface CatDetailResponse {
  cat: Cat;
  stays: RelationshipPreview<StayRelationshipItem>;
}

export interface VetDetailResponse {
  vet: Vet;
  cats: RelationshipPreview<CatRelationshipItem>;
}

export type CatRelationshipPage = RelationshipPage<CatRelationshipItem>;
export type StayRelationshipPage = RelationshipPage<StayRelationshipItem>;
