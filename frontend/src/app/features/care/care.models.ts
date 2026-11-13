export type CareMode = 'DAILY' | 'SHIFT' | 'EVENT';
export type CareShift = 'MORNING' | 'AFTERNOON' | 'EVENING';
export type CareRoutineSeed = 'FOOD' | 'WATER' | 'LITTER';

export interface CareRoutine {
  id: string;
  name: string;
  mode: CareMode;
  seedKey: CareRoutineSeed | null;
  active: boolean;
}

export interface CareRecord {
  id: string;
  stayId: string;
  catId: string;
  catName: string;
  businessDate: string;
  recordedAt: string;
  routineId: string | null;
  routineName: string | null;
  routineSeedKey: CareRoutineSeed | null;
  mode: CareMode | null;
  shift: CareShift | null;
  note: string | null;
  authorId: string;
  authorUsername: string;
  annulledAt: string | null;
  annulledById: string | null;
  annulledByUsername: string | null;
}

export interface CareCat {
  stayId: string;
  catId: string;
  catName: string;
  foodBrand: string | null;
  litterBrand: string | null;
  stayStartAt: string;
  stayEndAt: string;
  records: CareRecord[];
}

export interface CareDay {
  date: string;
  businessToday: string;
  routines: CareRoutine[];
  cats: CareCat[];
}

export interface CareHistory {
  stayId: string;
  startAt: string;
  endAt: string;
  actorId: string;
  records: CareRecord[];
}

export type CareRoutineRequest = Pick<CareRoutine, 'name' | 'mode'>;
export type CareRecordRequest = Pick<CareRecord, 'stayId' | 'catId' | 'businessDate'> &
  ({ routineId: string; expectedMode: CareMode; shift: CareShift | null } | { note: string });
