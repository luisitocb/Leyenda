import { useEffect, useMemo, type JSX } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { buildHallOfFameEntry, isCurrentCoachCareer, retireCoach } from '@leyenda/engine';

import { Screen, Button, Text, StatRow } from '@/components';
import { theme } from '@/theme';
import { getLatestSave, updateSave } from '@/persistence/saves.repository';
import { getProtagonistBySave } from '@/persistence/protagonists.repository';
import { getCoachBySave, updateCoach } from '@/persistence/coaches.repository';
import { addHallOfFameEntry } from '@/persistence/hall-of-fame.repository';

/**
 * Fin de la vida deportiva (GDD §3): puntuación final = Legado como
 * jugador + Legado como entrenador, y entrada en el Salón de la Fama.
 */
export default function LifeEndScreen(): JSX.Element {
  const router = useRouter();

  const data = useMemo(() => {
    const save = getLatestSave();
    if (!save) return null;
    const protagonist = getProtagonistBySave(save.id)?.data;
    if (!protagonist) return null;
    const coachRow = getCoachBySave(save.id);
    const coach = coachRow && isCurrentCoachCareer(coachRow.data) ? coachRow.data : null;
    const entry = buildHallOfFameEntry({
      id: save.id,
      protagonist,
      coach,
      finishedOn: save.gameDate,
    });
    return { save, coachRow, coach, entry };
  }, []);

  useEffect(() => {
    if (!data) return;
    addHallOfFameEntry(data.entry);
    if (data.coach && data.coachRow && data.coach.status !== 'retired') {
      updateCoach(data.coachRow.id, retireCoach(data.coach));
    }
    if (data.save.currentMode !== 'finished') {
      updateSave(data.save.id, { currentMode: 'finished' });
    }
  }, [data]);

  if (!data) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay ninguna vida deportiva que cerrar
        </Text>
        <Button label="Menú principal" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const { entry } = data;

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">Fin de una vida en el fútbol</Text>
        <Text variant="body" color="accent" style={styles.sectionLabel}>
          {entry.name}
        </Text>
        <Text variant="title" color="accent">
          {entry.totalScore}
        </Text>
        <Text variant="caption">Puntuación final</Text>

        <Text variant="subtitle" style={styles.sectionLabel}>
          Como jugador
        </Text>
        <StatRow label="Legado" value={entry.playerLegacy} />
        <StatRow label="Partidos" value={entry.player.gamesPlayed} />
        <StatRow label="Goles" value={entry.player.goals} />
        <StatRow label="Asistencias" value={entry.player.assists} />
        <StatRow label="Títulos" value={entry.player.titles} />
        <StatRow label="Internacionalidades" value={entry.player.caps} />

        {entry.coach && (
          <>
            <Text variant="subtitle" style={styles.sectionLabel}>
              Como entrenador
            </Text>
            <StatRow label="Legado" value={entry.coachLegacy} />
            <StatRow label="Temporadas" value={entry.coach.seasons} />
            <StatRow label="Partidos" value={entry.coach.matches} />
            <StatRow label="Victorias" value={entry.coach.wins} />
            <StatRow label="Ligas" value={entry.coach.titles} />
            <StatRow label="Ascensos" value={entry.coach.promotions} />
          </>
        )}

        <Text variant="body" color="textSecondary" style={styles.sectionLabel}>
          Tu vida deportiva ya forma parte del Salón de la Fama.
        </Text>
        <Button label="Salón de la Fama" onPress={() => router.replace('/hall-of-fame')} />
        <Button label="Nueva partida" onPress={() => router.replace('/create-character')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  sectionLabel: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
