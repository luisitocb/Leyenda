# ADR-003: Alcance del generador de mundo (worldgen) v1

## Estado

Aceptada.

## Contexto

Fase 1 del roadmap (GDD §18) pide como entregable "worldgen, calendario, ligas, motor de partidos, balance-sim", con criterio de salida "se simulan 50 temporadas con estadísticas creíbles". Es una fase demasiado grande para una sola historia — igual que ocurrió con la Fase 0, se divide en slices. Este ADR documenta el primer slice: `packages/worldgen`, que genera la foto fija del mundo en la temporada 1 (países, clubes, competiciones, plantillas), sin calendario ni motor de partidos todavía.

## Decisiones

**10 países, 2 divisiones por país (no 12 países / 3 divisiones).** Dentro de los rangos que da el GDD §8 (8-12 países, 2-3 divisiones), en el extremo manejable. `WorldgenConfig` deja estos números parametrizables — añadir una 3ª división o más países después es cambiar una constante, no rediseñar arquitectura. Resultado: 260 clubes × 28 jugadores ≈ 7.280 jugadores, cerca del "~250 clubes / ~7.000 jugadores" orientativo del GDD.

**Solo ligas nacionales en v1 (sin copas, competiciones continentales ni selecciones).** El GDD §8 describe el alcance de producto a medio plazo, no un checklist de una sola PR. Copas/continentales/selecciones exigen conceptos de calendario cruzado y de torneo de eliminación que no hacen falta para desbloquear el siguiente slice real (calendario + motor de partidos, que primero necesita ligas simples de todos-contra-todos). El tipo `Competition.type` ya soporta `'cup'|'continental'|'international'` — el modelo de datos no impide añadirlas después, simplemente no se generan instancias ahora.

**10 pools de nombres de persona, uno por país** (decisión de Luis, no la opción más barata que se había propuesto de 4 pools reutilizados) — prioriza variedad/autenticidad por país sobre menor esfuerzo de autoría.

**`Country` se añade a `packages/shared/src/types/world.ts`** (aditivo, no rompe nada existente). `Club.countryCode`/`Competition.countryCode` ya referenciaban `CountryCode` pero no existía el tipo del país completo — hueco real, y `World.countries` es algo que slices futuros (calendario, selecciones nacionales) necesitarán importar igual que `Club`/`Competition`, así que vive junto a ellos.

**Dirección de dependencias: `worldgen → engine` (solo el RNG), `worldgen → content` (datos+Zod), `worldgen → shared` (tipos).** `packages/engine` no gana ninguna dependencia nueva y sigue sin conocer `worldgen` — se preserva la regla 1 de `CLAUDE.md` (el motor debe permanecer puro). No hay ciclo.

**Modelo de atributos:** `currentAbility` deriva de una banda de calidad del club (`reputation × divisionLevel`) y de una curva de desarrollo por edad sobre el `potential`; cada atributo concreto se reparte según una tabla de pesos por posición. Solo se generan atributos y estado inicial (forma/moral/fitness neutros) — no hay todavía ningún sistema de mercado de fichajes real (el `value` es un placeholder simple).

## Qué queda explícitamente fuera de este slice

Escudos generados (asset visual, sin pipeline de render aún), calendario/`Fixture`/ventanas de fichajes/parones/pretemporada, ascensos y descensos (solo tienen sentido multi-temporada), copas nacionales, competiciones continentales, selecciones nacionales/mundial, regeneración anual de jugadores retirados, motor de partidos, `balance-sim`, editor de datos.

## Consecuencias

`pnpm content:validate` pasa de ser un placeholder a validar de verdad los datos de worldgen (países, nombres de club, pools de nombres) contra esquemas Zod. El siguiente slice de Fase 1 (calendario + motor de partidos) puede construirse sobre un `World` real y determinista sin necesidad de rehacer esta parte.
