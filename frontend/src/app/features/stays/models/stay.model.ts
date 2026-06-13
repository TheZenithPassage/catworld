export interface StayCatSummary {
  catId: string;
  name: string;
}

export interface Stay {
  stayId: string;
  startAt: string;
  endAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  catIds: string[];
  ownerId: string;
  ownerName: string;
  cats: StayCatSummary[];
}

export interface CreateStayRequest {
  catIds: string[];
  startAt: string;
  endAt: string;
  notes: string | null;
}

export interface UpdateStayRequest {
  startAt: string;
  endAt: string;
  notes: string | null;
}
