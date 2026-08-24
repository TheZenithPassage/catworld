import type { Stay } from '../../features/stays/models/stay.model';

export type EntityType = 'owner' | 'cat' | 'vet' | 'stay';

export interface EntityReference {
  entityType: EntityType;
  entityId: string;
}

export type EntityDetailUpdate = EntityReference | Stay;
