# ADR-002: Tecnología para Jugadas en Vivo

## Estado

Propuesto — pendiente de validación con el prototipo de la Fase 0.5.

## Contexto

El GDD (§13.1, ADR-001) eligió React Native + Expo + TypeScript como stack general, con React Native Skia + Reanimated + Gesture Handler para las Jugadas en Vivo, condicionado explícitamente a validar esta decisión en la Fase 0.5 antes de construir más funcionalidad encima. El Plan B documentado si el prototipo no cumple los criterios es Flutter + Flame.

Para la Fase 0.5 se construyó un prototipo aislado con dos minijuegos (penalti y ataque/ocasión de gol), según GDD §7B:

- **Motor** (`packages/engine/src/live/`): funciones puras y deterministas (`resolvePenalty`, `resolveChance`, dispatcher `resolveLivePlay`) que reciben una `LiveSituation`, un `GestureData` y un `RNG` con semilla, y devuelven un `LiveOutcome`. Sin imports de React/Expo/Skia, toda la aleatoriedad pasa por el RNG del motor.
- **App** (`apps/mobile/src/features/live-play/`): dos componentes con `Canvas` de Skia (`PenaltyMinigame`, `ChanceMinigame`) que capturan gestos con `Gesture.Pan()` de Gesture Handler, animan en el hilo de UI con `SharedValue`s de Reanimated, y solo cruzan al hilo de JS una vez por jugada (al soltar el gesto, vía `runOnJS`) para llamar a `resolveLivePlay`.

**Limitación conocida:** las fórmulas de probabilidad de `resolvePenalty`/`resolveChance` usan únicamente `pressure` (0-100) como modificador de dificultad. No existe todavía ningún sistema de atributos de jugador real (`packages/engine/src/career/` no existe, no hay generador de `Player`), así que la "regla de oro" de dificultad del GDD §7B.4 (que depende de un atributo real, p. ej. Tiro) **no es verificable con este prototipo**. Queda diferida a la Fase 2, cuando exista un `ProtagonistPlayer` real con atributos.

## Decisión evaluada

Usar React Native Skia + Reanimated + Gesture Handler para las Jugadas en Vivo, con toda la física/IA/cálculo de errores en un módulo puro del motor, siguiendo la regla 10 de `CLAUDE.md`.

## Criterios de aceptación

(Copiados literalmente de `.claude/agents/live-play-dev.md`)

- [ ] 60fps estables en Android gama media
- [ ] Latencia de gesto < 50ms
- [ ] Controles cómodos con una mano
- [ ] 5 personas lo prueban y dicen "se siente bien"

## Cómo verificarlo

1. **60fps:** usar un profiler de rendimiento (Perf Monitor de React Native, Flipper, o el GPU profiler de Android) mientras se juega el minijuego de penalti y el de ataque en un **dispositivo Android real de gama media** — el emulador no refleja fielmente el rendimiento de GPU/Skia.
2. **Latencia < 50ms:** grabación de vídeo a alta velocidad de fotogramas comparando el instante del toque físico con la respuesta visual en pantalla, o instrumentación de timestamps touch-start vs. primer frame renderizado.
3. **Una mano:** sostener el móvil con una sola mano y comprobar que se alcanza toda la superficie de gesto usada (zona de apuntado del penalti, barra de potencia, swipe del ataque) con el pulgar.
4. **5 personas:** sesión informal — que jueguen penalti y ataque sin más instrucción que "desliza para disparar", y recoger su reacción espontánea.

## Resultado

**PENDIENTE** — requiere prueba manual de Luis en un dispositivo Android real. El agente no tiene acceso a hardware físico ni a personas para probar, así que esta sección no puede rellenarse automáticamente. Completar tras la sesión de pruebas:

- [ ] 60fps estables: SI/NO — _(dispositivo usado, notas)_
- [ ] Latencia < 50ms: SI/NO — _(notas)_
- [ ] Cómodo con una mano: SI/NO — _(notas)_
- [ ] 5 personas / "se siente bien": SI/NO — _(resumen de las reacciones)_

## Conclusión

_A rellenar tras completar el Resultado:_ "Aceptada, se mantiene el stack" o "Rechazada, evaluar Plan B (Flutter + Flame)" según GDD §13.1.
