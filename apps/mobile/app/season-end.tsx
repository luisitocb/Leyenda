import { useEffect, useMemo, type JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { applySeasonEndResult } from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries } from '@/content';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';
import { resolveDivisionCalendar } from '@/world/resolve-division-calendar';
import { resolveStandings } from '@/world/resolve-standings';
import { closeSeasonIfNeeded, loadWorldState, playerSeasonQuery } from '@/world/season-transition';

interface StatRowProps {
  label: string;
  value: string | number;
}

function StatRow({ label, value }: StatRowProps): JSX.Element {
  return (
    <View style={styles.statRow}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

/**
 * Reconocimiento único de fin de temporada (GDD §4): clasificación final,
 * estadísticas personales y ascenso/descenso del club (GDD §8, RF-08).
 */
export default function SeasonEndScreen(): JSX.Element {
  const router = useRouter();

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const protagonist = protagonistRow?.data;

  const context = useMemo(() => {
    if (!save || !protagonist) return null;
    const worldState = loadWorldState(save, protagonist.nationality);
    const query = playerSeasonQuery(save, protagonist, worldState);
    const division = resolveDivisionCalendar(query, save.gameDate, countries);
    if (!division) return null;
    const closedWorld = closeSeasonIfNeeded(save, worldState, division.seasonIndex);
    const resolution = resolveStandings(query, save.gameDate, {}, countries);
    const summary = closedWorld.seasonHistory.find((s) => s.seasonIndex === division.seasonIndex);
    return { division, resolution, summary };
  }, [save, protagonist]);

  const myStanding = useMemo(
    () => context?.resolution?.standings.find((s) => s.clubId === protagonist?.clubId),
    [context, protagonist]
  );
  const champion = myStanding?.position === 1;
  const seasonId = context?.division.calendar.season.id ?? null;
  const clubId = protagonist?.clubId ?? '';
  const promoted = context?.summary?.promoted.includes(clubId) ?? false;
  const relegated = context?.summary?.relegated.includes(clubId) ?? false;

  useEffect(() => {
    if (!champion || !seasonId || !protagonist || !protagonistRow) return;
    if (protagonist.titlesWon.includes(seasonId)) return;
    updateProtagonist(protagonistRow.id, applySeasonEndResult(protagonist, seasonId));
  }, [champion, seasonId, protagonist, protagonistRow]);

  if (!save || !protagonist || !context?.resolution || !myStanding) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no hay temporada que cerrar
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.scrollContent}>
        <Text variant="title">Fin de temporada {context.division.calendar.season.year}</Text>

        {champion ? (
          <Text variant="subtitle" color="accent" style={styles.sectionLabel}>
            ¡Campeón de la liga!
          </Text>
        ) : (
          <Text variant="subtitle" style={styles.sectionLabel}>
            Terminaste {myStanding.position}º en la clasificación
          </Text>
        )}
        {promoted && (
          <Text variant="body" color="accent">
            ¡Tu club asciende de división!
          </Text>
        )}
        {relegated && (
          <Text variant="body" color="textSecondary">
            Tu club desciende de división.
          </Text>
        )}

        <Text variant="subtitle" style={styles.sectionLabel}>
          Tu carrera hasta ahora
        </Text>
        <StatRow label="Partidos jugados" value={protagonist.gamesPlayed} />
        <StatRow label="Goles" value={protagonist.goalsScored} />
        <StatRow label="Asistencias" value={protagonist.assists} />
        <StatRow label="Títulos" value={protagonist.titlesWon.length} />

        <Text variant="body" color="textSecondary" style={styles.sectionLabel}>
          Empieza la pretemporada: la próxima liga arranca en agosto.
        </Text>

        <Button label="Ver clasificación completa" onPress={() => router.push('/standings')} />
        <Button label="Continuar" onPress={() => router.replace('/career')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  scrollContent: {
    width: '100%',
  },
  sectionLabel: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
