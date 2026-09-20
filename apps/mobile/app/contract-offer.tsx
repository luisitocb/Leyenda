import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import {
  RNG,
  acceptContractOffer,
  createRandomSeed,
  generateRenewalOffer,
  negotiateOffer,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';

/** Oferta de renovación de contrato (GDD §4.8), disparada al entrar en la ventana de expiración próxima. */
export default function ContractOfferScreen(): JSX.Element {
  const router = useRouter();
  const [seed] = useState(() => createRandomSeed());
  const [negotiated, setNegotiated] = useState(false);
  const [negotiationSuccess, setNegotiationSuccess] = useState<boolean | null>(null);

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const protagonist = protagonistRow?.data;

  const initialOffer = useMemo(
    () => (protagonist ? generateRenewalOffer(protagonist, new RNG(seed)) : null),
    [protagonist, seed]
  );
  const [offer, setOffer] = useState(initialOffer);

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
    updateProtagonist(protagonistRow.id, acceptContractOffer(protagonist, offer, save.gameDate));
    router.replace('/career');
  };

  const handleReject = (): void => {
    router.replace('/career');
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <Text variant="title">Oferta de renovación</Text>
        <Text variant="body" style={styles.text}>
          Tu club te ofrece un nuevo contrato.
        </Text>
        <Text variant="body">Sueldo semanal: {offer.salary}€</Text>
        <Text variant="body">
          Duración: {offer.durationYears} {offer.durationYears === 1 ? 'año' : 'años'}
        </Text>
        <Text variant="body">Prima de renovación: {offer.signingBonus}€</Text>

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
