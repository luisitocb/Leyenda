import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  RNG,
  acceptContractOffer,
  acceptTransferOffer,
  createRandomSeed,
  generateRenewalOffer,
  generateTransferOffer,
  negotiateOffer,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries } from '@/content';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';
import { resolveDivisionCalendar } from '@/world/resolve-division-calendar';

/**
 * Oferta de contrato (GDD §4.8): renovación con el club actual (disparada
 * al entrar en la ventana de expiración próxima) u oferta de fichaje de
 * otro club (`type=transfer`, probabilidad semanal aparte).
 */
export default function ContractOfferScreen(): JSX.Element {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const isTransfer = type === 'transfer';
  const [seed] = useState(() => createRandomSeed());
  const [negotiated, setNegotiated] = useState(false);
  const [negotiationSuccess, setNegotiationSuccess] = useState<boolean | null>(null);

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const protagonist = protagonistRow?.data;

  const division = useMemo(() => {
    if (!save || !protagonist) return null;
    return resolveDivisionCalendar(save.seed, protagonist, countries);
  }, [save, protagonist]);

  const initialOffer = useMemo(() => {
    if (!protagonist) return null;
    if (isTransfer) {
      if (!division) return null;
      return generateTransferOffer(protagonist, division.divisionClubs, new RNG(seed));
    }
    return generateRenewalOffer(protagonist, new RNG(seed));
  }, [protagonist, division, isTransfer, seed]);
  const [offer, setOffer] = useState(initialOffer);

  const offerClub = useMemo(
    () =>
      offer && division ? division.divisionClubs.find((c) => c.id === offer.clubId) : undefined,
    [offer, division]
  );

  if (!save || !protagonist || !protagonistRow || !offer) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay ninguna oferta que mostrar
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  const handleNegotiate = (): void => {
    const result = negotiateOffer(offer, protagonist, new RNG(createRandomSeed()));
    setOffer(result.offer);
    setNegotiationSuccess(result.success);
    setNegotiated(true);
  };

  const handleAccept = (): void => {
    const updated = isTransfer
      ? acceptTransferOffer(protagonist, offer, save.gameDate)
      : acceptContractOffer(protagonist, offer, save.gameDate);
    updateProtagonist(protagonistRow.id, updated);
    router.replace('/career');
  };

  const handleReject = (): void => {
    router.replace('/career');
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <Text variant="title">{isTransfer ? 'Oferta de fichaje' : 'Oferta de renovación'}</Text>
        <Text variant="body" style={styles.text}>
          {isTransfer
            ? `${offerClub?.name ?? 'Un club rival'} quiere ficharte.`
            : 'Tu club te ofrece un nuevo contrato.'}
        </Text>
        <Text variant="body">Sueldo semanal: {offer.salary}€</Text>
        <Text variant="body">
          Duración: {offer.durationYears} {offer.durationYears === 1 ? 'año' : 'años'}
        </Text>
        <Text variant="body">
          {isTransfer ? 'Prima de fichaje' : 'Prima de renovación'}: {offer.signingBonus}€
        </Text>

        {negotiated && (
          <Text
            variant="body"
            color={negotiationSuccess ? 'accent' : 'error'}
            style={styles.negotiationResult}
          >
            {negotiationSuccess
              ? 'Tu agente ha conseguido mejorar la oferta.'
              : 'El club no ha cedido: la oferta se mantiene igual.'}
          </Text>
        )}

        <Button label="Aceptar" onPress={handleAccept} />
        {!negotiated && <Button label="Pedir mejora" onPress={handleNegotiate} />}
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
  negotiationResult: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
