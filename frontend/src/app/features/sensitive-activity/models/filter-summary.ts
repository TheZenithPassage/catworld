import { StayDateFilters } from '../../../shared/stay-date-filters/stay-date-filter.model';
import {
  describeStayDates,
  StayDateDescriptions,
} from '../../../shared/stay-date-filters/stay-date-description';
import { SensitiveActivityFilters } from './sensitive-economic-activity';

/** No technical identifiers or resolver-only state enter the narrative. null means unavailable. */
export interface ActivitySummarySnapshot {
  pending: boolean;
  eventType: SensitiveActivityFilters['eventType'];
  actor?: string | null;
  occurredFrom?: string;
  occurredTo?: string;
  owner?: string | null;
  cat?: string | null;
  dates: StayDateFilters;
  exactStay?: { owner: string; cats: string[]; startAt: string; endAt: string } | null;
}

export interface ActivitySummaryParts {
  pending: boolean;
  events: string;
  actor?: string;
  occurredFrom?: string;
  occurredTo?: string;
  owner?: string;
  cat?: string;
  dates?: string;
  exact?: string;
}

export interface ActivitySummaryCopy {
  preparing: string;
  invalid: string;
  unavailable: Record<'actor' | 'owner' | 'cat' | 'stay', string>;
  events: Record<SensitiveActivityFilters['eventType'], string>;
  dates: StayDateDescriptions;
  exact: (cats: string, owner: string, start: string, end: string) => string;
  sentence: (parts: ActivitySummaryParts) => string;
}

export function composeActivitySummary(
  snapshot: ActivitySummarySnapshot,
  copy: ActivitySummaryCopy,
  formatInstant: (value: string) => string,
  formatStay: (value: string) => string,
  formatDay: (value: string) => string,
): string {
  const label = (kind: 'actor' | 'owner' | 'cat', value: string | null | undefined) =>
    value === null ? copy.unavailable[kind] : value;
  const exact = snapshot.exactStay;
  return copy.sentence({
    pending: snapshot.pending,
    events: copy.events[snapshot.eventType],
    actor: label('actor', snapshot.actor),
    owner: label('owner', snapshot.owner),
    cat: label('cat', snapshot.cat),
    occurredFrom: snapshot.occurredFrom ? formatInstant(snapshot.occurredFrom) : undefined,
    occurredTo: snapshot.occurredTo ? formatInstant(snapshot.occurredTo) : undefined,
    dates: describeStayDates(snapshot.dates, copy.dates, formatDay),
    exact:
      exact === null
        ? copy.unavailable.stay
        : exact
          ? copy.exact(
              exact.cats.join(', '),
              exact.owner,
              formatStay(exact.startAt),
              formatStay(exact.endAt),
            )
          : undefined,
  });
}
