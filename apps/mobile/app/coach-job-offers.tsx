import { useMemo, useState, type JSX } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';

import type { Club, InterviewAmbition } from '@leyenda/shared';
import {
  RNG,
  calculateInitialCoachReputation,
  calculateLegacyScore,
  createCoachCareer,
  generateJobOffers,
  hireCoach,
  isCurrentCoachCareer,
} from '@leyenda/engine';

import { Screen, Button, Text, OptionRow } from '@/components';
import { theme } from '@/theme';
import { AMBITION_DESCRIPTIONS, AMBITION_LABELS, OBJECTIVE_LABELS } from '@/labels';
import { getLatestSave, updateSave } from '@/persistence/saves.repository';
import { getProtagonistBySave } from '@/persistence/protagonists.repository';
import { createCoach, getCoachBySave, updateCoach } from '@/persistence/coaches.repository';
import {
  activeSeasonIndex,
  clubsForActiveSeason,
  initialSquadFor,
  objectiveFor,
} from '@/coach/coach-context';
import { loadWorldState } from '@/world/season-transition';

/**
 * Offset de seed de las ofertas de trabajo sobre la seed del save (ver el
 * registro en resolve-division-calendar.ts). Las ofertas tras un despido
 * añaden el día de la partida para que cambien de una vez a otra.
 */
const JOB_OFFERS_SEED_OFFSET = 4;
const MS_PER_DAY = 86_400_000;

const AMBITIONS: InterviewAmbition[] = ['ambitious', 'realistic', 'cautious'];

/**
 * Ofertas de trabajo como entrenador (GDD §5, §6.1): tras la retirada como
 * jugador o tras quedarte sin club. Elegir club abre la entrevista con la
 * directiva, donde lo que prometes fija el objetivo de la temporada.
 */
export default function CoachJobOffersScreen(): JSX.Element {
  const router = useRouter();
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [ambition, setAmbition] = useState<InterviewAmbition>('realistic');

  const save = useMemo(() => getLatestSave(), []);
  const protagonist = useMemo(
    () => (save ? getProtagonistBySave(save.id)?.data : undefined),
    [save]
  );
  const coachRow = useMemo(() => (save ? getCoachBySave(save.id) : undefined), [save]);
  const existingCoach = coachRow && isCurrentCoachCareer(coachRow.data) ? coachRow.data : undefined;

  const context = useMemo(() => {
    if (!save || !protagonist) return null;
    const worldState = loadWorldState(save, protagonist.nationality);
    const clubs = clubsForActiveSeason(save, worldState);
    const seasonIndex = activeSeasonIndex(worldState, save.gameDate);
    const reputation =
      existingCoach?.reputation ??
      calculateInitialCoachReputation(calculateLegacyScore(protagonist));
    const daySalt = existingCoach ? Math.floor(Date.parse(save.gameDate) / MS_PER_DAY) : 0;
    const candidates = clubs.filter((c) => c.id !== existingCoach?.clubId);
    const offers = generateJobOffers(
      candidates,
      reputation,
      new RNG(save.seed + JOB_OFFERS_SEED_OFFSET + daySalt)
    );
    return { clubs, seasonIndex, reputation, offers };
  }, [save, protagonist, existingCoach]);

  if (!save || !protagonist || !context) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay ninguna carrera desde la que empezar como entrenador
        </Text>
        <Button label="Volver" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const objective = selectedClub
    ? objectiveFor(selectedClub, context.clubs, context.seasonIndex, ambition)
    : null;

  const handleSign = (): void => {
    if (!selectedClub || !objective) return;
    const squad = initialSquadFor(save.seed, selectedClub, save.gameDate);
    if (existingCoach && coachRow) {
      updateCoach(
        coachRow.id,
        hireCoach(existingCoach, { clubId: selectedClub.id, squad, objective, ambition })
      );
    } else {
      const coach = createCoachCareer({
        id: randomUUID(),
        clubId: selectedClub.id,
        legacyScore: calculateLegacyScore(protagonist),
        squad,
        objective,
        ambition,
      });
      createCoach({ saveId: save.id, data: coach });
    }
    updateSave(save.id, { currentMode: 'coach' });
    router.replace('/coach-career');
  };

  if (selectedClub && objective) {
    return (
      <Screen style={styles.screen}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text variant="subtitle">Entrevista con la directiva</Text>
          <Text variant="body" color="accent" style={styles.sectionLabel}>
            {selectedClub.name}
          </Text>
          <Text variant="body" style={styles.paragraph}>
            «¿Qué podemos esperar de su equipo esta temporada?»
          </Text>
          {AMBITIONS.map((option) => (
            <OptionRow
              key={option}
              label={AMBITION_LABELS[option]}
              sublabel={AMBITION_DESCRIPTIONS[option]}
              selected={ambition === option}
              onPress={() => setAmbition(option)}
            />
          ))}
          <Text variant="body" style={styles.sectionLabel}>
            Objetivo: {OBJECTIVE_LABELS[objective.kind]} (puesto {objective.targetPosition} o mejor)
          </Text>
          <Button label="Firmar contrato" onPress={handleSign} />
          <Button label="Ver otras ofertas" onPress={() => setSelectedClub(null)} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">Ofertas de trabajo</Text>
        <Text variant="body" color="textSecondary" style={styles.paragraph}>
          Tu reputación como entrenador: {context.reputation}/20. Estos clubes quieren hablar
          contigo.
        </Text>
        {context.offers.map((club) => (
          <OptionRow
            key={club.id}
            label={club.name}
            sublabel={`División ${club.divisionLevel} · Reputación ${club.reputation}`}
            onPress={() => {
              setAmbition('realistic');
              setSelectedClub(club);
            }}
          />
        ))}
        {existingCoach && <Button label="Volver" onPress={() => router.replace('/coach-career')} />}
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
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    marginVertical: theme.spacing.sm,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
