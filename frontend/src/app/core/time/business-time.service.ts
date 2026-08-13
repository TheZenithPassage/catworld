import { inject, Injectable } from '@angular/core';

import { RuntimeConfigService } from '../config/runtime-config.service';

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export type BusinessLocalDateTimeResolution =
  | { valid: true; instant: string }
  | { valid: false; reason: 'malformed' | 'nonexistent' };

@Injectable({ providedIn: 'root' })
export class BusinessTimeService {
  private readonly config = inject(RuntimeConfigService);

  formatInstant(value: string, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: this.config.businessTimeZone(),
    }).format(new Date(value));
  }

  formatLocalDateTime(value: string, locale: string): string {
    const parts = this.parseLocalDateTime(value);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)));
  }

  localDateTimeToInstant(value: string): string {
    const resolution = this.resolveLocalDateTime(value);
    if (!resolution.valid) throw new RangeError(`Invalid business local date-time: ${value}`);
    return resolution.instant;
  }

  resolveLocalDateTime(value: string): BusinessLocalDateTimeResolution {
    let expected: DateTimeParts;
    try {
      expected = this.parseLocalDateTime(value);
    } catch (error) {
      if (error instanceof RangeError) return { valid: false, reason: 'malformed' };
      throw error;
    }
    const wallClockUtc = this.partsAsUtc(expected);
    const offsets = new Set<number>();

    for (const hours of [-48, -24, 0, 24, 48]) {
      const probe = wallClockUtc + hours * 3_600_000;
      offsets.add(this.partsAsUtc(this.partsInBusinessZone(new Date(probe))) - probe);
    }

    const matches = [...offsets]
      .map((offset) => new Date(wallClockUtc - offset))
      .filter((candidate) => this.sameParts(this.partsInBusinessZone(candidate), expected))
      .sort((left, right) => left.getTime() - right.getTime());

    return matches.length
      ? { valid: true, instant: matches[0].toISOString() }
      : { valid: false, reason: 'nonexistent' };
  }

  instantToLocalDateTime(value: string): string {
    const parts = this.partsInBusinessZone(new Date(value));
    return `${this.pad(parts.year, 4)}-${this.pad(parts.month)}-${this.pad(parts.day)}T${this.pad(parts.hour)}:${this.pad(parts.minute)}`;
  }

  private partsInBusinessZone(value: Date): DateTimeParts {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.config.businessTimeZone(),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(value);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value);
    return {
      year: part('year'),
      month: part('month'),
      day: part('day'),
      hour: part('hour'),
      minute: part('minute'),
      second: part('second'),
    };
  }

  private parseLocalDateTime(value: string): DateTimeParts {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?$/.exec(
      value,
    );
    if (!match) throw new RangeError(`Invalid local date-time: ${value}`);
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
      second: Number(match[6] ?? 0),
    };
  }

  private partsAsUtc(parts: DateTimeParts): number {
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  }

  private sameParts(left: DateTimeParts, right: DateTimeParts): boolean {
    return this.partsAsUtc(left) === this.partsAsUtc(right);
  }

  private pad(value: number, length = 2): string {
    return String(value).padStart(length, '0');
  }
}
