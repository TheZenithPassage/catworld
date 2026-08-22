export type EntityType = 'owner' | 'cat' | 'vet' | 'stay';

export interface EntityReference {
  entityType: EntityType;
  entityId: string;
}
