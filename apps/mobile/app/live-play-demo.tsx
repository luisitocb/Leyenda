import { useState, type JSX } from 'react';
import type { LiveOutcome } from '@leyenda/shared';

import { Screen, Button } from '@/components';
import { ChanceMinigame, LivePlayResultOverlay, PenaltyMinigame } from '@/features/live-play';

type Mode = 'menu' | 'penalty' | 'chance';

/**
 * Demo de Jugadas en Vivo (Fase 0.5 — ADR-002). Spike de validación
 * técnica, no una pantalla de producto: permite probar el minijuego de
 * penalti y el de ataque, y muestra el resultado que devuelve el motor.
 */
export default function LivePlayDemoScreen(): JSX.Element {
  const [mode, setMode] = useState<Mode>('menu');
  const [outcome, setOutcome] = useState<LiveOutcome | null>(null);

  const handleResult = (result: LiveOutcome): void => {
    setOutcome(result);
  };

  if (mode === 'penalty') {
    return (
      <Screen>
        <PenaltyMinigame onResult={handleResult} />
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
        <ChanceMinigame onResult={handleResult} />
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
