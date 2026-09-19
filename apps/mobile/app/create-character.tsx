import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';

import type { Club, CountryCode, Foot, Position } from '@leyenda/shared';
import {
  RNG,
  createCharacter,
  createRandomSeed,
  GROUP_MAX,
  GROUP_MIN,
  POINT_POOL,
  type AttributeGroupAllocation,
  type CreateCharacterInput,
} from '@leyenda/engine';
// Import por subruta, no por el barrel `@leyenda/worldgen`: el barrel reexporta
// generate-world.ts, que arrastra @leyenda/content (node:fs) aunque no se use
// generateWorld — Metro evalúa todo el grafo estático, no solo lo importado.
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';
import { pickCandidateClubs } from '@leyenda/worldgen/src/clubs/pick-candidate-clubs';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries, origins } from '@/content';
import { FOOT_LABELS, POSITION_LABELS } from '@/labels';
import { createSave } from '@/persistence/saves.repository';
import { createProtagonist } from '@/persistence/protagonists.repository';
import { generateClubsForCountry } from '@/world/generate-clubs-for-country';

type Step = 'basics' | 'origin' | 'points' | 'club' | 'confirm';

const POSITIONS = Object.keys(POSITION_LABELS) as Position[];
const FEET = Object.keys(FOOT_LABELS) as Foot[];

const GROUP_LABELS: Record<keyof AttributeGroupAllocation, string> = {
  physical: 'Físico',
  technical: 'Técnico',
  mental: 'Mental',
};

const ALLOCATION_STEP = 5;
const FREE_POOL = POINT_POOL - 3 * GROUP_MIN;

interface SelectableRowProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
}

function SelectableRow({ label, sublabel, selected, onPress }: SelectableRowProps): JSX.Element {
  return (
    <Pressable
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text variant="body" color={selected ? 'accent' : 'textPrimary'}>
        {label}
      </Text>
      {sublabel && (
        <Text variant="caption" color="textSecondary">
          {sublabel}
        </Text>
      )}
    </Pressable>
  );
}

/** Asistente de creación de personaje (GDD §4.1 / RF-01 parcial + RF-02). */
export default function CreateCharacterScreen(): JSX.Element {
  const router = useRouter();
  const [seed] = useState(() => createRandomSeed());

  const [step, setStep] = useState<Step>('basics');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState<CountryCode | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [foot, setFoot] = useState<Foot | null>(null);
  const [originId, setOriginId] = useState<string | null>(null);
  const [groups, setGroups] = useState<AttributeGroupAllocation>({
    physical: GROUP_MIN,
    technical: GROUP_MIN,
    mental: GROUP_MIN,
  });
  const [clubId, setClubId] = useState<string | null>(null);

  const remaining =
    FREE_POOL - (groups.physical + groups.technical + groups.mental - 3 * GROUP_MIN);

  const candidateClubs = useMemo<Club[]>(() => {
    if (!nationality) return [];
    const clubs = generateClubsForCountry(seed, nationality);
    // Seed distinta a la generación de clubes (seed) y a la del personaje
    // (seed + 1, en handleConfirm) para no reutilizar la misma secuencia de
    // números "aleatorios" en dos pasos independientes.
    return pickCandidateClubs(clubs, nationality, new RNG(seed + 2));
  }, [nationality, seed]);

  const canLeaveBasics =
    firstName.trim().length > 0 && lastName.trim().length > 0 && nationality && position && foot;

  const adjustGroup = (group: keyof AttributeGroupAllocation, delta: number): void => {
    setGroups((current) => {
      const nextValue = current[group] + delta;
      if (nextValue < GROUP_MIN || nextValue > GROUP_MAX) return current;
      if (delta > 0 && remaining < delta) return current;
      return { ...current, [group]: nextValue };
    });
  };

  const handleConfirm = (): void => {
    if (!nationality || !position || !foot || !originId || !clubId) return;
    const origin = origins.find((o) => o.id === originId);
    if (!origin) return;

    const input: CreateCharacterInput = {
      id: randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nationality,
      position,
      foot,
      origin,
      groupAllocation: groups,
      clubId,
      startDate: SEASON_ONE_START_DATE,
    };

    try {
      const character = createCharacter(input, new RNG(seed + 1));
      const save = createSave({ seed, gameDate: SEASON_ONE_START_DATE, currentMode: 'player' });
      createProtagonist({ saveId: save.id, data: character });
      Alert.alert(
        'Carrera creada',
        `${character.firstName} ${character.lastName} ha empezado su carrera.`,
        [{ text: 'OK', onPress: () => router.replace('/career') }]
      );
    } catch (error) {
      Alert.alert('Error al crear el personaje', String(error));
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {step === 'basics' && (
          <View>
            <Text variant="subtitle">Datos básicos</Text>
            <TextInput
              placeholder="Nombre"
              placeholderTextColor={theme.colors.textMuted}
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
            />
            <TextInput
              placeholder="Apellido"
              placeholderTextColor={theme.colors.textMuted}
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
            />

            <Text variant="body" style={styles.sectionLabel}>
              Nacionalidad
            </Text>
            {countries.map((country) => (
              <SelectableRow
                key={country.code}
                label={country.name}
                selected={nationality === country.code}
                onPress={() => setNationality(country.code)}
              />
            ))}

            <Text variant="body" style={styles.sectionLabel}>
              Posición
            </Text>
            {POSITIONS.map((value) => (
              <SelectableRow
                key={value}
                label={POSITION_LABELS[value]}
                selected={position === value}
                onPress={() => setPosition(value)}
              />
            ))}

            <Text variant="body" style={styles.sectionLabel}>
              Pie dominante
            </Text>
            {FEET.map((value) => (
              <SelectableRow
                key={value}
                label={FOOT_LABELS[value]}
                selected={foot === value}
                onPress={() => setFoot(value)}
              />
            ))}

            {canLeaveBasics && <Button label="Siguiente" onPress={() => setStep('origin')} />}
          </View>
        )}

        {step === 'origin' && (
          <View>
            <Text variant="subtitle">Origen</Text>
            {origins.map((origin) => (
              <SelectableRow
                key={origin.id}
                label={origin.name}
                sublabel={origin.description}
                selected={originId === origin.id}
                onPress={() => setOriginId(origin.id)}
              />
            ))}
            <Button label="Volver" onPress={() => setStep('basics')} />
            {originId && <Button label="Siguiente" onPress={() => setStep('points')} />}
          </View>
        )}

        {step === 'points' && (
          <View>
            <Text variant="subtitle">Reparto de puntos</Text>
            <Text variant="body" color="textSecondary" style={styles.sectionLabel}>
              Puntos restantes: {remaining}
            </Text>
            {(Object.keys(groups) as Array<keyof AttributeGroupAllocation>).map((group) => (
              <View key={group} style={styles.groupRow}>
                <Text variant="body" style={styles.groupLabel}>
                  {GROUP_LABELS[group]}: {groups[group]}
                </Text>
                <View style={styles.groupButtons}>
                  <Button label="-" onPress={() => adjustGroup(group, -ALLOCATION_STEP)} />
                  <Button label="+" onPress={() => adjustGroup(group, ALLOCATION_STEP)} />
                </View>
              </View>
            ))}
            <Button label="Volver" onPress={() => setStep('origin')} />
            {remaining === 0 && <Button label="Siguiente" onPress={() => setStep('club')} />}
          </View>
        )}

        {step === 'club' && (
          <View>
            <Text variant="subtitle">Club inicial</Text>
            {candidateClubs.map((club) => (
              <SelectableRow
                key={club.id}
                label={club.name}
                sublabel={`Reputación ${club.reputation}`}
                selected={clubId === club.id}
                onPress={() => setClubId(club.id)}
              />
            ))}
            <Button label="Volver" onPress={() => setStep('points')} />
            {clubId && <Button label="Siguiente" onPress={() => setStep('confirm')} />}
          </View>
        )}

        {step === 'confirm' && (
          <View>
            <Text variant="subtitle">Confirmar</Text>
            <Text variant="body">
              {firstName} {lastName}
            </Text>
            <Text variant="body" color="textSecondary">
              {countries.find((c) => c.code === nationality)?.name} ·{' '}
              {position && POSITION_LABELS[position]} · {foot && FOOT_LABELS[foot]}
            </Text>
            <Text variant="body" color="textSecondary">
              Origen: {origins.find((o) => o.id === originId)?.name}
            </Text>
            <Text variant="body" color="textSecondary">
              Físico {groups.physical} · Técnico {groups.technical} · Mental {groups.mental}
            </Text>
            <Text variant="body" color="textSecondary" style={styles.sectionLabel}>
              Club: {candidateClubs.find((c) => c.id === clubId)?.name}
            </Text>
            <Button label="Volver" onPress={() => setStep('club')} />
            <Button label="Empezar carrera" onPress={handleConfirm} />
          </View>
        )}
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
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  sectionLabel: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  rowSelected: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  groupLabel: {
    flex: 1,
  },
  groupButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
});
