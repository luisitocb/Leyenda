import { useMemo, useState, type JSX } from 'react';
import type { LiveOutcome, LiveSituation } from '@leyenda/shared';
import { createRandomSeed } from '@leyenda/engine';

import { Screen, Button } from '@/components';
import { ChanceMinigame, LivePlayResultOverlay, PenaltyMinigame } from '@/features/live-play';

type Mode = 'menu' | 'penalty' | 'chance';

/**
 * Demo de Jugadas en Vivo (Fase 0.5 — ADR-002, todavía pendiente de la
 * prueba manual de Luis en Android). Spike de validación técnica, no una
 * pantalla de producto: permite probar el minijuego de penalti y el de
 * ataque con una situación de demostración (atributos neutros a 50, sin
 * protagonista real detrás) y muestra el resultado que devuelve el motor.
 */
export default function LivePlayDemoScreen(): JSX.Element {
  const [mode, setMode] = useState<Mode>('menu');
  const [outcome, setOutcome] = useState<LiveOutcome | null>(null);

  const situation = useMemo<LiveSituation>(
    () => ({
      type: mode === 'chance' ? 'chance' : 'penalty',
      minute: mode === 'chance' ? 60 : 90,
      playerId: 'demo-player',
      team: 'home',
      seed: createRandomSeed(),
      pressure: 40,
      shooterShooting: 50,
      shooterComposure: 50,
    }),
    [mode]
  );

  const handleResult = (result: LiveOutcome): void => {
    setOutcome(result);
  };

  if (mode === 'penalty') {
    return (
      <Screen>
        <PenaltyMinigame situation={situation} onResult={handleResult} />
        {outcome && <LivePlayResultOverlay outcome={outcome} />}
        <Button
          label="Volver"
          onPress={() => {
            setMode('menu');
            setOutcome(null);
          }}
        />
      </Screen>
    );
  }

  if (mode === 'chance') {
    return (
      <Screen>
        <ChanceMinigame situation={situation} onResult={handleResult} />
        {outcome && <LivePlayResultOverlay outcome={outcome} />}
        <Button
          label="Volver"
          onPress={() => {
            setMode('menu');
            setOutcome(null);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Button label="Penalti" onPress={() => setMode('penalty')} />
      <Button label="Ataque" onPress={() => setMode('chance')} />
    </Screen>
  );
}
