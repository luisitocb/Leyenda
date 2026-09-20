import { useMemo, type JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import type { ProtagonistPlayer } from '@leyenda/shared';
import {
  addDays,
  calculateAge,
  DAYS_PER_WEEK,
  DECLINE_START_AGE,
  isContractExpiringSoon,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries, injuries } from '@/content';
import { FOOT_LABELS, POSITION_LABELS, RELATION_LABELS, TRAIT_LABELS } from '@/labels';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave } from '@/persistence/protagonists.repository';
import { generateClubsForCountry } from '@/world/generate-clubs-for-country';
import { resolveWeekMatch } from '@/world/resolve-week-match';

interface StatRowProps {
  label: string;
  value: string | number;
  valueColor?: 'accent';
}

function StatRow({ label, value, valueColor }: StatRowProps): JSX.Element {
  return (
    <View style={styles.statRow}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="body" color={valueColor}>
        {value}
      </Text>
    </View>
  );
}

/** Pantalla de solo lectura del protagonista de la partida más reciente (GDD §4.2-4.4). */
export default function CareerScreen(): JSX.Element {
  const router = useRouter();

  const save = useMemo(() => getLatestSave(), []);
  const protagonist: ProtagonistPlayer | undefined = useMemo(
    () => (save ? getProtagonistBySave(save.id)?.data : undefined),
    [save]
  );

  const club = useMemo(() => {
    if (!save || !protagonist) return undefined;
    return generateClubsForCountry(save.seed, protagonist.nationality).find(
      (c) => c.id === protagonist.clubId
    );
  }, [save, protagonist]);

  const lastMatch = useMemo(() => {
    if (!save || !protagonist) return null;
    return resolveWeekMatch(save.seed, protagonist, addDays(save.gameDate, -DAYS_PER_WEEK));
  }, [save, protagonist]);

  if (!save || !protagonist) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no tienes ninguna carrera
        </Text>
        <Button label="Nueva carrera" onPress={() => router.push('/create-character')} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.scrollContent}>
        <Text variant="title">
          {protagonist.firstName} {protagonist.lastName}
        </Text>
        <Text variant="body" color="textSecondary" style={styles.sectionLabel}>
          {POSITION_LABELS[protagonist.position]} · {FOOT_LABELS[protagonist.foot]} ·{' '}
          {countries.find((c) => c.code === protagonist.nationality)?.name}
        </Text>
        <Text variant="body" color="accent">
          {club?.name ?? 'Sin club'}
        </Text>

        {protagonist.activeInjury && (
          <Text variant="body" color="error" style={styles.sectionLabel}>
            Lesionado: {injuries.find((i) => i.id === protagonist.activeInjury?.typeId)?.name ?? ''}{' '}
            ({protagonist.activeInjury.weeksRemaining}{' '}
            {protagonist.activeInjury.weeksRemaining === 1 ? 'semana' : 'semanas'})
          </Text>
        )}

        <Button label="Semana" onPress={() => router.push('/week')} />
        <Button label="Clasificación" onPress={() => router.push('/standings')} />
        {calculateAge(protagonist.dateOfBirth, save.gameDate) >= DECLINE_START_AGE && (
          <Button label="Retirarte" onPress={() => router.push('/retirement')} />
        )}

        {lastMatch && (
          <>
            <Text variant="subtitle" style={styles.sectionLabel}>
              Último resultado
            </Text>
            <Text variant="body">
              {lastMatch.homeClub.name} {lastMatch.result.homeGoals} - {lastMatch.result.awayGoals}{' '}
              {lastMatch.awayClub.name}
            </Text>
          </>
        )}

        {protagonist.traits.length > 0 && (
          <>
            <Text variant="subtitle" style={styles.sectionLabel}>
              Rasgos
            </Text>
            <Text variant="body">
              {protagonist.traits.map((trait) => TRAIT_LABELS[trait]).join(' · ')}
            </Text>
          </>
        )}

        <Text variant="subtitle" style={styles.sectionLabel}>
          Carrera
        </Text>
        <StatRow label="Partidos jugados" value={protagonist.gamesPlayed} />
        <StatRow label="Goles" value={protagonist.goalsScored} />
        <StatRow label="Asistencias" value={protagonist.assists} />

        <Text variant="subtitle" style={styles.sectionLabel}>
          Contrato
        </Text>
        <StatRow label="Sueldo semanal" value={`${protagonist.salary}€`} />
        <StatRow
          label="Contrato hasta"
          value={protagonist.contractExpiry ?? 'Sin contrato'}
          valueColor={
            isContractExpiringSoon(protagonist.contractExpiry, save.gameDate) ? 'accent' : undefined
          }
        />

        <Text variant="subtitle" style={styles.sectionLabel}>
          Atributos
        </Text>
        <StatRow label="Media global" value={protagonist.currentAbility} />

        <Text variant="subtitle" style={styles.sectionLabel}>
          Estados vitales
        </Text>
        <StatRow label="Salud física" value={protagonist.health} />
        <StatRow label="Salud mental" value={protagonist.mentalHealth} />
        <StatRow label="Forma" value={protagonist.form} />
        <StatRow label="Energía" value={protagonist.energy} />
        <StatRow label="Dinero" value={protagonist.money} />
        <StatRow label="Patrimonio" value={protagonist.assets} />

        <Text variant="subtitle" style={styles.sectionLabel}>
          Relaciones
        </Text>
        {(Object.keys(RELATION_LABELS) as Array<keyof typeof RELATION_LABELS>).map((key) => (
          <StatRow key={key} label={RELATION_LABELS[key]} value={protagonist.relations[key]} />
        ))}
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
