# ADR-004: Nombres reales para clubes, ligas y países

## Estado

Aceptada.

## Contexto

Desde el inicio del proyecto, la regla 6 de `CLAUDE.md` prohibía nombres reales de jugadores, clubes, ligas, competiciones o marcas — de ahí los 10 países ficticios de `packages/content/data/worldgen/countries.json` (códigos XA-XJ, rango no asignado por ISO a propósito, para no colisionar con países reales) y la generación procedural de nombres de club vía `packages/content/data/worldgen/club-names.json`.

El 2026-09-20, Luis pidió explícitamente que el juego use nombres reales e idénticos de clubes, ligas y países ("las mismas divisiones con los mismos equipos que hay actualmente en cada división... y así igual en los principales países"), empezando por España. Se le preguntó dos veces por el conflicto con la regla 6 (primero ofreciendo un término medio "inspirado, no idéntico", que eligió; después, al pedir explícitamente equipos reales de España, se le repreguntó si de verdad quería nombres reales idénticos, dejando claro el riesgo) y confirmó en ambas ocasiones que quería nombres reales, aceptando explícitamente:

- **Riesgo de marca/propiedad intelectual** si el juego llega a publicarse en tiendas sin una licencia oficial (ligas y clubes reales registran sus nombres/escudos como marca).
- **Coste de mantenimiento recurrente**: la composición de cada división cambia cada temporada por ascensos/descensos, así que las plantillas reales autoradas en el contenido quedan desactualizadas con el tiempo y hay que revisarlas.

## Decisión

**Clubes, ligas y países pueden usar nombres reales** cuando así se autora explícitamente en contenido dedicado (`packages/content/data/worldgen/real-clubs/<código-país>.json`). Los países sin esa plantilla real siguen generándose de forma ficticia y procedural exactamente igual que antes — este cambio es aditivo, no una migración de golpe de todo el mundo generado.

**Los nombres de jugadores individuales generados siguen siendo ficticios/genéricos**, no atados a futbolistas reales concretos — esta decisión no cambia eso. Es un límite deliberado: los pools de nombres (`person-names/<país>.json`) contienen nombres y apellidos comunes y genéricos del país real correspondiente (p. ej. nombres españoles habituales para España), nunca el nombre completo de un futbolista real existente.

Un país con plantilla real (`loadRealClubRoster`) sustituye la generación combinatoria de `generateClubs` por la lista autorada (nombre, nombre corto y reputación por club, decididos a mano en vez de calculados a partir de `country.reputationBase` — los clubes reales de una misma división no son igual de fuertes entre sí, a diferencia del modelo ficticio).

`CLAUDE.md` regla 6 se actualiza para reflejar esta excepción.

## Consecuencias

- El contenido de plantillas reales necesita revisión periódica (al menos una vez por temporada real) para seguir reflejando ascensos/descensos — es trabajo recurrente, no un coste de una sola vez.
- Si el juego se publica comercialmente sin una licencia oficial de las ligas/clubes representados, existe riesgo legal real de marca — asumido explícitamente por Luis, no mitigado por este ADR.
- El modelo de datos (`Club`, `Country`, `Competition`) no cambia de forma — solo se añade una vía de autoría alternativa (lista fija) junto a la ya existente (generación procedural), así que Fase 1-3 (calendario, motor de partidos, carrera) no necesitan cambios para consumir países reales.
- Países ficticios y reales conviven en el mismo `World` sin problema (p. ej. el protagonista puede nacer en un país ficticio y fichar por un club real, o viceversa).
