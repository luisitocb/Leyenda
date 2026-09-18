import type { Fixture, Match, Season } from '@leyenda/shared';

export interface SeasonCalendar {
  season: Season;
  fixtures: Fixture[];
  matches: Match[];
}
