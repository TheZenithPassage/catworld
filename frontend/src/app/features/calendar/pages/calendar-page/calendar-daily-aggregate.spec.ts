import { Stay } from '../../../stays/models/stay.model';
import { getCalendarDailyAggregates } from './calendar-daily-aggregate';

describe('getCalendarDailyAggregates', () => {
  it('counts unique cats from the supplied visible stays across inclusive local dates', () => {
    const overlappingStay = createStay({
      stayId: 'stay-2',
      startAt: '2099-01-31T23:30:00',
      endAt: '2099-02-02T01:00:00',
      cats: [
        { catId: 'cat-2', name: 'Ámbar' },
        { catId: 'cat-1', name: 'Zoe' },
      ],
      catIds: ['cat-2', 'cat-1'],
    });

    const aggregates = getCalendarDailyAggregates([createStay(), overlappingStay]);

    expect(aggregates.map(({ date, count }) => ({ date, count }))).toEqual([
      { date: '2099-01-30', count: 1 },
      { date: '2099-01-31', count: 2 },
      { date: '2099-02-01', count: 2 },
      { date: '2099-02-02', count: 2 },
    ]);
    expect(aggregates[1].participants.map((participant) => participant.catId)).toEqual([
      'cat-1',
      'cat-2',
    ]);
    expect(aggregates[1].participants[0]).toEqual({
      catId: 'cat-1',
      catName: 'Zoe',
      ownerId: 'owner-1',
      ownerName: 'Owner One',
      hasEntry: true,
      hasExit: true,
    });
  });

  it('excludes cancelled stays and merges entry and exit movement for repeated cats', () => {
    const sameDateStay = createStay({
      stayId: 'stay-2',
      startAt: '2099-01-31T08:00:00',
      endAt: '2099-01-31T18:00:00',
    });
    const cancelledStay = createStay({
      stayId: 'stay-3',
      cancelledAt: '2099-01-20T10:00:00',
      cats: [{ catId: 'cat-3', name: 'Cancelled' }],
      catIds: ['cat-3'],
    });

    const aggregate = getCalendarDailyAggregates([createStay(), sameDateStay, cancelledStay]).find(
      ({ date }) => date === '2099-01-31',
    );

    expect(aggregate?.count).toBe(1);
    expect(aggregate?.participants[0]).toEqual(
      expect.objectContaining({ catId: 'cat-1', hasEntry: true, hasExit: true }),
    );
    expect(
      getCalendarDailyAggregates([cancelledStay]).find(({ date }) => date === '2099-01-31'),
    ).toBeUndefined();
  });

  it('orders participants without locale-dependent collation and uses stable identity tie-breakers', () => {
    const aggregates = getCalendarDailyAggregates([
      createStay({
        stayId: 'stay-z',
        ownerId: 'owner-z',
        ownerName: 'Same Owner',
        cats: [{ catId: 'cat-z', name: 'Milo' }],
        catIds: ['cat-z'],
      }),
      createStay({
        stayId: 'stay-a',
        ownerId: 'owner-a',
        ownerName: 'Same Owner',
        cats: [{ catId: 'cat-a', name: 'Milo' }],
        catIds: ['cat-a'],
      }),
    ]);

    expect(aggregates[0].participants.map(({ catId }) => catId)).toEqual(['cat-a', 'cat-z']);
  });
});

function createStay(overrides: Partial<Stay> = {}): Stay {
  return {
    stayId: 'stay-1',
    startAt: '2099-01-30T10:00:00',
    endAt: '2099-01-31T10:00:00',
    numberOfNights: 1,
    cancelledAt: null,
    createdAt: '2099-01-01T10:00:00',
    updatedAt: '2099-01-01T10:00:00',
    notes: null,
    catIds: ['cat-1'],
    ownerId: 'owner-1',
    ownerName: 'Owner One',
    cats: [{ catId: 'cat-1', name: 'Zoe' }],
    retainedNightlyRate: null,
    suggestedAmount: null,
    agreedAmount: null,
    totalPaid: '0',
    remainingAmount: null,
    paymentCondition: 'NO_PAYMENT',
    outstandingCollectionEligible: false,
    payments: [],
    ...overrides,
  };
}
