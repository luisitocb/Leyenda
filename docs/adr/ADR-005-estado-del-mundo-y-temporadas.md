# ADR-005: Estado dinámico del mundo, temporadas sucesivas y Modo Entrenador base

## Estado

Aceptada (2026-11-05).

## Contexto

Hasta ahora el `World` nunca se persistía: todo (clubes, plantillas, calendario) se regeneraba desde la seed del save. Eso funcionaba para una sola temporada, pero el calendario estaba fijado a `SEASON_YEAR = 2026`: a partir de la segunda temporada el protagonista no volvía a jugar ningún partido de liga, y no había ascensos ni descensos (RF-08). Además, el Modo Entrenador necesita cosas que no se pueden regenerar desde la seed:

- **Ascensos y descensos:** la división de cada club en la temporada N depende de las clasificaciones de N-1, que dependen a su vez de las de N-2... Recalcularlo todo desde la seed cada vez costaría cientos de milisegundos por temporada transcurrida.
- **La plantilla del entrenador** cambia (entrenamiento, lesiones, envejecimiento, cantera), así que re-simular un partido ya jugado daría otro marcador distinto del que vio el usuario.

## Decisiones

**1. Temporadas anuales repartidas en 42 semanas.** La temporada N empieza en la primera fecha de la cuadrícula semanal de la partida en o después del 1 de agosto (`getSeasonStartDate`), para que los partidos caigan siempre en una fecha que `save.gameDate` alcanza exactamente y no haya deriva. Las jornadas se reparten entre agosto y finales de mayo (`SEASON_LENGTH_WEEKS = 42`, `roundWeekOffsets`), con ~10 semanas de pretemporada. Es un parámetro opcional de `generateSeasonCalendar`: sin él, una jornada por semana como antes (lo que sigue usando `balance-sim`, que da resultados idénticos).

**2. `WorldState` persistido: solo lo que no se puede regenerar.** Nueva tabla `world_states` (una fila por save, JSON) con la composición de divisiones por temporada (`divisionsBySeason`) y el historial de temporadas cerradas (campeones, ascendidos, descendidos). Nombre, reputación y plantillas de los clubes de la IA se siguen regenerando desde la seed. Cerrar una temporada (`closeSeason`) es idempotente. Un club ascendido regenera su plantilla con la calidad de su nueva división (worldgen usa `divisionLevel`). 2 plazas de ascenso/descenso, 3 si ambas divisiones tienen 18+ clubes.

**3. Los partidos del entrenador se guardan, no se re-simulan.** `CoachCareer.results` (matchId → resultado) se pasa como `fixedResults` a las clasificaciones y al cierre de temporada.

**4. `CoachCareer` completa en la tabla `coaches` (JSON).** Plantilla (`SquadPlayer[]`), tácticas, foco de entrenamiento, confianza de la directiva, objetivo, resultados, estadísticas e historial. Las partidas guardadas con la forma de la primera historia de Fase 4 (`LegacyCoachCareerV1`) se actualizan al cargarlas (`upgradeLegacyCoachCareer`, con prueba).

**5. Salón de la Fama independiente del save.** Tabla `hall_of_fame` (migración 0003, junto a `world_states`), con el id del save como id de la entrada para que sea idempotente. `saves.current_mode` admite `'finished'` (solo cambia el tipo TS; la columna ya era texto).

**6. Tácticas sin romper la IA.** `simulateMatch` acepta tácticas opcionales; sin ellas el resultado es idéntico bit a bit al de antes (prueba de huella de regresión en `tactics.test.ts` y `balance --quick` idéntico a `HEAD`).

## Consecuencias

- Una carrera de jugador de 20 años tiene ahora 20 temporadas de liga reales, con ascensos y descensos.
- El cierre de una temporada simula todas las divisiones del país (~100-120 ms en Node para el país más grande); ocurre una vez por temporada.
- **Limitación conocida:** las plantillas de la IA son estáticas (no envejecen, no se desarrollan ni se regeneran); solo la plantilla del entrenador evoluciona. La regeneración del mundo (GDD §8) y el mercado (GDD §6.5) son Fase 5.
- **Limitación conocida:** la Jugada en Vivo del entrenador es la versión base (una ocasión por equipo y partido, reutilizando los minijuegos de penalti y ocasión). El control de todo el equipo (GDD §7B.2) queda pendiente.
