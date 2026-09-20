import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { RNG, acceptBrandDeal, createRandomSeed, generateBrandDealOffer } from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { brandDeals } from '@/content';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';

/** Oferta de acuerdo de marca (GDD §4.10), probabilidad semanal aparte. */
export default function BrandDealOfferScreen(): JSX.Element {
  const router = useRouter();
  const [seed] = useState(() => createRandomSeed());

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const protagonist = protagonistRow?.data;

  const offer = useMemo(() => generateBrandDealOffer(brandDeals, new RNG(seed)), [seed]);

  if (!save || !protagonist || !protagonistRow) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay ninguna oferta que mostrar
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  const handleAccept = (): void => {
    updateProtagonist(protagonistRow.id, acceptBrandDeal(protagonist, offer));
    router.replace('/career');
  };

  const handleReject = (): void => {
    router.replace('/career');
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <Text variant="title">Oferta de marca</Text>
        <Text variant="body" style={styles.text}>
          {offer.name}: {offer.description}
        </Text>
        <Text variant="body">Prima de fichaje: {offer.signingBonus}€</Text>
        <Text variant="body">Ingreso semanal: {offer.weeklyIncome}€</Text>
        <Text variant="body">
          Duración: {offer.durationWeeks} {offer.durationWeeks === 1 ? 'semana' : 'semanas'}
        </Text>
        <Text variant="body" style={styles.text}>
          Si te vuelves polémico mientras dure, se rompe y pagas {offer.breachPenalty}€ de
          penalización.
        </Text>

        <Button label="Aceptar" onPress={handleAccept} />
        <Button label="Rechazar" onPress={handleReject} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  card: {
    marginTop: theme.spacing.lg,
  },
  text: {
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
