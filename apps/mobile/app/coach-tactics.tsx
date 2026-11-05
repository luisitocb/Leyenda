import { useMemo, useState, type JSX } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import type { FormationId, Mentality, Tactics } from '@leyenda/shared';
import { FORMATION_IDS, MENTALITIES, selectCoachXI } from '@leyenda/engine';

import { Screen, Button, Text, OptionRow } from '@/components';
import { theme } from '@/theme';
import {
  FORMATION_LABELS,
  MENTALITY_DESCRIPTIONS,
  MENTALITY_LABELS,
  POSITION_SHORT_LABELS,
} from '@/labels';
import { updateCoach } from '@/persistence/coaches.repository';
import { loadCoachContext } from '@/coach/coach-context';

/** Tácticas (GDD §6.6, versión base): formación y mentalidad; el XI se elige solo. */
export default function CoachTacticsScreen(): JSX.Element {
  const router = useRouter();
  const context = useMemo(() => loadCoachContext(), []);
  const [tactics, setTactics] = useState<Tactics | null>(context?.coach.tactics ?? null);

  const xi = useMemo(() => {
    if (!context || !tactics) return null;
    try {
      return selectCoachXI(context.coach.clubId, context.coach.squad, tactics);
    } catch {
      return null;
    }
  }, [context, tactics]);

  if (!context || !tactics) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No diriges ningún equipo ahora mismo
        </Text>
        <Button label="Volver" onPress={() => router.replace('/coach-career')} />
      </Screen>
    );
  }

  const setFormation = (formation: FormationId): void => setTactics({ ...tactics, formation });
  const setMentality = (mentality: Mentality): void => setTactics({ ...tactics, mentality });

  const handleSave = (): void => {
    updateCoach(context.coachRowId, { ...context.coach, tactics });
    router.back();
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">Formación</Text>
        {FORMATION_IDS.map((id) => (
          <OptionRow
            key={id}
            label={FORMATION_LABELS[id]}
            selected={tactics.formation === id}
            onPress={() => setFormation(id)}
          />
        ))}

        <Text variant="subtitle" style={styles.sectionLabel}>
          Mentalidad
        </Text>
        {MENTALITIES.map((m) => (
          <OptionRow
            key={m}
            label={MENTALITY_LABELS[m]}
            sublabel={MENTALITY_DESCRIPTIONS[m]}
            selected={tactics.mentality === m}
            onPress={() => setMentality(m)}
          />
        ))}

        <Text variant="subtitle" style={styles.sectionLabel}>
          Once probable
        </Text>
        {xi ? (
          [xi.goalkeeper, ...xi.outfield].map((p) => (
            <Text key={p.id} variant="body">
              {POSITION_SHORT_LABELS[p.position]} · {p.firstName} {p.lastName} ({p.currentAbility})
            </Text>
          ))
        ) : (
          <Text variant="body" color="error">
            No hay jugadores disponibles suficientes.
          </Text>
        )}

        <Button label="Guardar tácticas" onPress={handleSave} />
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
