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

/** Reconocimiento único de fin de temporada (GDD §4): clasificación final y estadísticas personales. */
export default function SeasonEndScreen(): JSX.Element {
  const router = useRouter();

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const protagonist = protagonistRow?.data;

  const division = useMemo(() => {
    if (!save || !protagonist) return null;
    return resolveDivisionCalendar(save.seed, protagonist, countries);
  }, [save, protagonist]);

  const resolution = useMemo(() => {
    if (!save || !protagonist) return null;
    return resolveStandings(save.seed, protagonist, save.gameDate, countries);
  }, [save, protagonist]);

  const myStanding = useMemo(
    () => resolution?.standings.find((s) => s.clubId === protagonist?.clubId),
    [resolution, protagonist]
  );
  const champion = myStanding?.position === 1;
  const seasonId = division?.calendar.season.id ?? null;

  useEffect(() => {
    if (!champion || !seasonId || !protagonist || !protagonistRow) return;
    if (protagonist.titlesWon.includes(seasonId)) return;
    updateProtagonist(protagonistRow.id, applySeasonEndResult(protagonist, seasonId));
  }, [champion, seasonId, protagonist, protagonistRow]);

  if (!save || !protagonist || !resolution || !myStanding) {
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
        <Text variant="title">Fin de temporada</Text>

        {champion ? (
          <Text variant="subtitle" color="accent" style={styles.sectionLabel}>
            ¡Campeón de la liga!
          </Text>
        ) : (
          <Text variant="subtitle" style={styles.sectionLabel}>
            Terminaste {myStanding.position}º en la clasificación
          </Text>
        )}

        <Text variant="subtitle" style={styles.sectionLabel}>
          Tu temporada
        </Text>
        <StatRow label="Partidos jugados" value={protagonist.gamesPlayed} />
        <StatRow label="Goles" value={protagonist.goalsScored} />
        <StatRow label="Asistencias" value={protagonist.assists} />

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
