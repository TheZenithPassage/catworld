export interface Stay {
  stayId: string;
  startAt: string;
  endAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  catIds: string[];
}
