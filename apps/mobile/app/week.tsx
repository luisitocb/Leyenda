import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import type { WeeklyAction } from '@leyenda/content';
import type { ProtagonistPlayer } from '@leyenda/shared';
import {
  RNG,
  advanceWeek,
  applyWeeklyAction,
  createRandomSeed,
  isContractRenewalWeek,
  paySalary,
  selectEvent,
  shouldReceiveTransferOffer,
  WEEKLY_ENERGY_RESET,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries, events, weeklyActions } from '@/content';
import { RELATION_LABELS } from '@/labels';
import { getLatestSave, updateSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';
import { resolveWeekMatch } from '@/world/resolve-week-match';
import { isSeasonJustEnded, resolveDivisionCalendar } from '@/world/resolve-division-calendar';

function describeEffects(action: WeeklyAction): string {
  const parts: string[] = [];
  if (action.effects.attributeGroup) {
    const group = { physical: 'Físico', technical: 'Técnico', mental: 'Mental' }[
      action.effects.attributeGroup
    ];
    parts.push(`+${group}`);
  }
  for (const [key, delta] of Object.entries(action.effects.vitalStateDelta)) {
    if (delta === 0) continue;
    const label = {
      health: 'Salud',
      mentalHealth: 'Salud mental',
      form: 'Forma',
      fitness: 'Forma física',
    }[key as keyof typeof action.effects.vitalStateDelta];
    parts.push(`${delta > 0 ? '+' : ''}${delta} ${label}`);
  }
  for (const [key, delta] of Object.entries(action.effects.relationsDelta)) {
    parts.push(`+${delta} ${RELATION_LABELS[key as keyof typeof RELATION_LABELS]}`);
  }
  if (action.effects.moneyDelta !== 0) {
    parts.push(`${action.effects.moneyDelta > 0 ? '+' : ''}${action.effects.moneyDelta}€`);
  }
  return parts.join(' · ');
}

interface ActionRowProps {
  action: WeeklyAction;
  chosen: boolean;
  affordable: boolean;
  onToggle: () => void;
}

function ActionRow({ action, chosen, affordable, onToggle }: ActionRowProps): JSX.Element {
  const disabled = !chosen && !affordable;
  return (
    <Pressable
      style={[styles.row, chosen && styles.rowChosen, disabled && styles.rowDisabled]}
      onPress={disabled ? undefined : onToggle}
      accessibilityRole="button"
    >
      <Text variant="body" color={chosen ? 'accent' : 'textPrimary'}>
        {action.name} ({action.energyCost >= 0 ? '-' : '+'}
        {Math.abs(action.energyCost)} energía)
      </Text>
      <Text variant="caption" color="textSecondary">
        {action.description}
      </Text>
      <Text variant="caption" color="textSecondary">
        {describeEffects(action)}
      </Text>
    </Pressable>
  );
}

/** Ciclo semanal (GDD §4.5): elegir acciones que gastan Energía y avanzar la semana. */
export default function WeekScreen(): JSX.Element {
  const router = useRouter();
  const [seed] = useState(() => createRandomSeed());
  const [chosenActionIds, setChosenActionIds] = useState<string[]>([]);

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const protagonist = protagonistRow?.data;

  const workingProtagonist = useMemo<ProtagonistPlayer | undefined>(() => {
    if (!protagonist) return undefined;
    const rng = new RNG(seed);
    return chosenActionIds.reduce((current, id) => {
      const action = weeklyActions.find((a) => a.id === id);
      return action ? applyWeeklyAction(current, action, rng) : current;
    }, protagonist);
  }, [protagonist, chosenActionIds, seed]);

  if (!save || !protagonist || !protagonistRow || !workingProtagonist) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no tienes ninguna carrera
        </Text>
        <Button label="Nueva carrera" onPress={() => router.push('/create-character')} />
      </Screen>
    );
  }

  const toggleAction = (id: string): void => {
    setChosenActionIds((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
    );
  };

  const isAffordable = (action: WeeklyAction): boolean => {
    const energyOk = action.energyCost <= 0 || workingProtagonist.energy >= action.energyCost;
    const moneyOk = workingProtagonist.money + action.effects.moneyDelta >= 0;
    return energyOk && moneyOk;
  };

  const handleAdvanceWeek = (): void => {
    const thisWeekDate = save.gameDate;
    const match = resolveWeekMatch(save.seed, workingProtagonist, thisWeekDate, countries);
    const event = selectEvent(events, new RNG(createRandomSeed()));
    const division = resolveDivisionCalendar(save.seed, workingProtagonist, countries);
    const seasonJustEnded = division !== null && isSeasonJustEnded(division.calendar, thisWeekDate);
    const renewalWeek = isContractRenewalWeek(workingProtagonist.contractExpiry, thisWeekDate);
    const transferOfferWeek =
      !seasonJustEnded && !renewalWeek && shouldReceiveTransferOffer(new RNG(createRandomSeed()));

    updateProtagonist(protagonistRow.id, {
      ...paySalary(workingProtagonist),
      energy: WEEKLY_ENERGY_RESET,
    });
    updateSave(save.id, { gameDate: advanceWeek(save.gameDate) });

    if (seasonJustEnded) {
      router.replace('/season-end');
    } else if (renewalWeek) {
      router.replace('/contract-offer');
    } else if (transferOfferWeek) {
      router.replace({ pathname: '/contract-offer', params: { type: 'transfer' } });
    } else if (event) {
      router.replace({
        pathname: '/event',
        params: match
          ? { eventId: event.id, nextPath: '/match', date: thisWeekDate }
          : { eventId: event.id, nextPath: '/career' },
      });
    } else if (match) {
      router.replace({ pathname: '/match', params: { date: thisWeekDate } });
    } else {
      router.replace('/career');
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">Semana del {save.gameDate}</Text>
        <View style={styles.summary}>
          <Text variant="body">Energía: {workingProtagonist.energy}</Text>
          <Text variant="body">Dinero: {workingProtagonist.money}€</Text>
        </View>

        {weeklyActions.map((action) => (
          <ActionRow
            key={action.id}
            action={action}
            chosen={chosenActionIds.includes(action.id)}
            affordable={isAffordable(action)}
            onToggle={() => toggleAction(action.id)}
          />
        ))}

        <Button label="Avanzar semana" onPress={handleAdvanceWeek} />
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
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.sm,
  },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  rowChosen: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
