# CLAUDE.md — Proyecto "Leyenda" (juego móvil de fútbol)

## Contexto

Juego móvil de decisiones y gestión: el usuario vive una carrera como futbolista (Modo Jugador) y después como entrenador (Modo Entrenador). El diseño completo está en `docs/GDD.md`. **Léelo antes de implementar cualquier funcionalidad** y no inventes mecánicas que no estén allí; si falta algo, propón el cambio al GDD primero.

## Stack

- Monorepo pnpm + Turborepo. TypeScript en modo estricto en todo el proyecto.
- `apps/mobile`: Expo (React Native), Expo Router, Zustand, Reanimated, Gesture Handler, React Native Skia (Jugadas en Vivo), FlashList, i18next.
- Persistencia: expo-sqlite + Drizzle ORM (migraciones versionadas).
- `packages/engine`: simulación en TypeScript puro.
- `packages/content`: eventos y textos en YAML/JSON validados con Zod.
- Pruebas: Vitest (engine), Jest + RNTL (app), Maestro (E2E), fast-check (propiedades).

## Reglas obligatorias

1. **El motor (`packages/engine`) es puro:** sin imports de React, Expo, SQLite ni APIs de plataforma. Entrada: estado + comando + RNG. Salida: nuevo estado + eventos.
2. **Nunca uses `Math.random()`**: toda aleatoriedad pasa por el RNG con semilla de `engine/src/rng`.
3. **Sin `any`.** Usa tipos de `packages/shared` y esquemas Zod para datos externos.
4. **Ningún texto visible en código:** todo va a los archivos de i18n (es, en).
5. **Contenido en datos:** los eventos van en `packages/content`, nunca codificados en la lógica.
6. **Nombres de jugadores generados: siempre ficticios/genéricos**, nunca el nombre de un futbolista real concreto. **Clubes, ligas y países pueden usar nombres reales** cuando se autoran explícitamente en `packages/content/data/worldgen/real-clubs/<país>.json` (decisión de Luis del 2026-09-20, ver ADR-004 — asume riesgo de marca/IP y mantenimiento anual de las plantillas). Los países sin plantilla real siguen siendo ficticios y procedurales como siempre.
7. **Pruebas primero** para la lógica del motor; cada historia incluye sus pruebas.
8. **Cambios de esquema de guardado** → nueva migración + prueba de carga de partidas antiguas.
9. **Rendimiento:** una jornada completa del mundo debe simularse en < 500 ms; no bloquees el hilo de UI.
10. **Jugadas en Vivo (GDD sección 7B):** la física, la IA y el cálculo de errores viven en `packages/engine/src/live/` (puro y determinista). La app solo dibuja con Skia y captura gestos; los gestos y animaciones se ejecutan en el hilo de UI (worklets). Objetivo: 60 fps y respuesta inmediata al dedo. Nunca añadas ventajas de pago a estas jugadas.
11. **Decisiones de arquitectura** → nuevo ADR en `docs/adr/`.

## Flujo de trabajo

- Usa el modo plan antes de cada historia; resume el plan y espera confirmación.
- Ramas `feat/<id>-<descripcion>`; commits con Conventional Commits.
- Antes de dar algo por terminado: `pnpm typecheck && pnpm lint && pnpm test && pnpm content:validate`.
- Si cambias fórmulas del motor, ejecuta `pnpm balance --quick` y comenta los resultados.

## Comandos

- `pnpm dev` — arrancar la app
- `pnpm test` — todas las pruebas
- `pnpm typecheck` / `pnpm lint`
- `pnpm content:validate` — validar eventos
- `pnpm balance` — simulación masiva de balanceo

## Definition of Done

Tipado correcto, pruebas en verde, lint limpio, textos en i18n, documentación/GDD/ADR actualizados si procede, y sin regresiones en `balance-sim`.

## Idioma

Código e identificadores en inglés. Documentación, comentarios de diseño y comunicación con Luis en español.
