# Engine Conventions

Convenciones y reglas del motor de simulación de "Leyenda".

## Regla de Oro: Pureza

El motor (`packages/engine`) es **código puro**:

❌ **PROHIBIDO:**

- Imports de React, React Native, Expo
- Imports de SQLite, AsyncStorage, FileSystem
- Imports de APIs de plataforma (window, navigator, etc.)
- `Math.random()` - usar RNG con semilla
- `Date.now()` - recibir fecha como parámetro
- `console.log()` - solo en desarrollo, eliminar antes de commit
- Side effects (HTTP, escritura de archivos, etc.)
- Estado global mutable

✅ **PERMITIDO:**

- TypeScript puro
- Imports de `@leyenda/shared`
- Librerías matemáticas puras (si son necesarias)
- Lodash/Ramda (funciones puras)

## Patrón de Funciones

```typescript
// ❌ MAL: side effects, estado global
let globalSeed = 12345;

function simulateMatch(home: Team, away: Team) {
  const random = Math.random(); // ❌ No determinista
  globalSeed++; // ❌ Mutación global
  return { homeGoals: Math.floor(random * 5), awayGoals: 0 };
}

// ✅ BIEN: pura, determinista
function simulateMatch(home: Team, away: Team, rng: RNG): MatchResult {
  const homeStrength = calculateStrength(home);
  const awayStrength = calculateStrength(away);

  const homeGoals = generateGoals(homeStrength, rng);
  const awayGoals = generateGoals(awayStrength, rng);

  return { homeGoals, awayGoals };
}
```

## RNG: Toda Aleatoriedad Pasa Aquí

```typescript
import { RNG } from '@leyenda/engine';

// Crear RNG
const rng = new RNG(seed);

// Generar números
const float = rng.next(); // 0 a 1
const int = rng.nextInt(1, 6); // 1 a 6 (dados)
const bool = rng.chance(0.7); // 70% de probabilidad
const pick = rng.pick(['A', 'B', 'C']); // Elige uno

// Mezclar array
const shuffled = rng.shuffle([1, 2, 3, 4, 5]);
```

## Arquitectura: Comando → Estado

```typescript
// Estado del juego
interface GameState {
  version: string;
  seed: Seed;
  currentDate: ISODate;
  player: ProtagonistPlayer;
  world: World;
  // ...
}

// Comando del usuario
interface TrainCommand {
  type: 'TRAIN';
  payload: {
    focus: 'physical' | 'technical' | 'tactical';
  };
}

// Aplicar comando
function apply(state: GameState, command: Command, rng: RNG): CommandResult {
  const newState = { ...state }; // Inmutabilidad
  const events: GameEvent[] = [];

  // Lógica...

  return { newState, events };
}
```

## Tipado Estricto

```typescript
// ❌ MAL
function foo(x: any) {
  return x.bar;
}

// ✅ BIEN
interface HasBar {
  bar: string;
}

function foo(x: HasBar): string {
  return x.bar;
}
```

## Rendimiento

Una jornada completa del mundo debe simularse en < 500ms.

**Optimizaciones:**

- Simular partidos irrelevantes con modelo simplificado
- Evitar operaciones O(n²) sobre grandes colecciones
- Cachear cálculos pesados (media de jugadores, fuerzas de equipos)

```typescript
// ❌ MAL: O(n²)
teams.forEach((team) => {
  players.forEach((player) => {
    // ...
  });
});

// ✅ BIEN: O(n)
const playersByTeam = groupBy(players, 'teamId');
teams.forEach((team) => {
  const teamPlayers = playersByTeam[team.id];
  // ...
});
```

## Pruebas Obligatorias

Cada función pura del motor debe tener:

1. **Prueba unitaria básica**
2. **Prueba de casos extremos** (valores mínimos/máximos)
3. **Prueba de determinismo** (misma semilla = mismo resultado)

```typescript
describe('simulateMatch', () => {
  it('debe generar resultados válidos', () => {
    const rng = new RNG(12345);
    const result = simulateMatch(homeTeam, awayTeam, rng);

    expect(result.homeGoals).toBeGreaterThanOrEqual(0);
    expect(result.awayGoals).toBeGreaterThanOrEqual(0);
  });

  it('debe ser determinista', () => {
    const result1 = simulateMatch(homeTeam, awayTeam, new RNG(12345));
    const result2 = simulateMatch(homeTeam, awayTeam, new RNG(12345));

    expect(result1).toEqual(result2);
  });
});
```

## Checklist antes de Commit

- [ ] ¿Hay imports prohibidos?
- [ ] ¿Se usa Math.random()?
- [ ] ¿Hay `any` en los tipos?
- [ ] ¿Las funciones son puras?
- [ ] ¿Hay pruebas?
- [ ] ¿Pasan todas las pruebas? (`pnpm test`)
- [ ] ¿Pasa el typecheck? (`pnpm typecheck`)
- [ ] ¿Pasa el lint? (`pnpm lint`)
