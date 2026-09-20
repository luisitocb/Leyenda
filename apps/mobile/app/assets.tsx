import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import type { ProtagonistPlayer, PurchasableAsset } from '@leyenda/shared';
import { purchaseAsset } from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { purchasableAssets } from '@/content';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';

const CATEGORY_LABELS: Record<PurchasableAsset['category'], string> = {
  house: 'Casa',
  car: 'Coche',
  business: 'Negocio',
};

interface AssetRowProps {
  asset: PurchasableAsset;
  affordable: boolean;
  onBuy: () => void;
}

function AssetRow({ asset, affordable, onBuy }: AssetRowProps): JSX.Element {
  return (
    <Pressable
      style={[styles.row, !affordable && styles.rowDisabled]}
      onPress={affordable ? onBuy : undefined}
      accessibilityRole="button"
    >
      <Text variant="body" color={affordable ? 'textPrimary' : 'textSecondary'}>
        {CATEGORY_LABELS[asset.category]} — {asset.name} ({asset.price}€)
      </Text>
      <Text variant="caption" color="textSecondary">
        {asset.description}
      </Text>
    </Pressable>
  );
}

/** Patrimonio comprable (GDD §4.9): convierte dinero en patrimonio, sin consumir una semana. */
export default function AssetsScreen(): JSX.Element {
  const router = useRouter();

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const [protagonist, setProtagonist] = useState<ProtagonistPlayer | undefined>(
    () => protagonistRow?.data
  );

  if (!save || !protagonist || !protagonistRow) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no tienes ninguna carrera
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  const handleBuy = (asset: PurchasableAsset): void => {
    const updated = purchaseAsset(protagonist, asset);
    updateProtagonist(protagonistRow.id, updated);
    setProtagonist(updated);
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summary}>
          <Text variant="body">Dinero: {protagonist.money}€</Text>
          <Text variant="body">Patrimonio: {protagonist.assets}€</Text>
        </View>

        {purchasableAssets.map((asset) => (
          <AssetRow
            key={asset.id}
            asset={asset}
            affordable={protagonist.money >= asset.price}
            onBuy={() => handleBuy(asset)}
          />
        ))}
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
  rowDisabled: {
    opacity: 0.4,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
