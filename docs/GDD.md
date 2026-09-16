# Documento Maestro — Juego móvil de fútbol: de jugador a entrenador
*Título provisional: **"Leyenda: De Crack a Míster"** · Versión 0.2 (añadidas las Jugadas en Vivo) · Autor: Luis*

> Este documento es la fuente de verdad del proyecto. Claude Code debe leerlo antes de implementar cualquier funcionalidad. Cualquier cambio de diseño se refleja aquí primero y luego en código.

---

## 0. Índice
1. Valoración de la idea
2. Visión y pilares de diseño
3. Estructura general del juego
4. Modo Jugador (carrera)
5. Transición: el Legado
6. Modo Entrenador (gestión)
7. Motor de partidos (y la solución al problema de la lentitud)
7B. Jugadas en Vivo (habilidad real con el dedo)
8. Mundo simulado
9. Retención y enganche del usuario gratuito
10. Monetización (futura, diseñada desde el principio)
11. Aspectos legales
12. Requisitos (RF / RNF)
13. Arquitectura técnica
14. Modelo de datos
15. Sistema de contenido data-driven
16. Estrategia de pruebas y balanceo
17. Proceso de ingeniería del software
18. Hoja de ruta por fases
19. Herramientas, MCP y skills
20. Riesgos y mitigación
21. Glosario

---

## 1. Valoración de la idea

**Puntos fuertes**
- **Combinación poco explotada.** Hay muchos juegos de carrera de jugador tipo "decisiones con cartas" y muchos de gestión, pero pocos unen ambos en una sola vida continua. El paso de jugador a entrenador con un *legado* que se hereda es el gancho diferencial.
- **Ciclo de vida largo.** Una partida puede durar semanas o meses: bueno para retención y monetización por suscripción.
- **Barato de producir visualmente.** Es un juego de interfaz, texto y datos: no hace falta motor 3D ni artistas caros.
- **Habilidad real, no solo decisiones.** Las Jugadas en Vivo (sección 7B) hacen que el resultado dependa también de lo bien que juegas con el dedo, que es lo que más enganchaba de World Soccer Champs.
- **Corrige un fallo conocido.** La lentitud de World Soccer Champs frustraba; aquí la rapidez es estándar y el pago ofrece comodidad y profundidad, no alivio de una frustración artificial.

**Riesgos principales**
- **Alcance enorme.** Son dos juegos en uno. Sin un MVP muy acotado, el proyecto no se termina. → Se desarrolla primero el Modo Jugador completo y jugable, y después el Modo Entrenador.
- **Balanceo.** Muchas variables interconectadas pueden producir carreras absurdas. → Simulaciones automáticas masivas (sección 16).
- **Sensación de control de las Jugadas en Vivo.** Si el deslizamiento no es preciso y agradable, estropea el juego. → Prototipo técnico temprano con criterios de aceptación (sección 18, Fase 0.5).
- **Licencias.** No se pueden usar nombres reales de jugadores, clubes ni escudos sin licencia (sección 11).
- **Contenido.** El Modo Jugador vive de la variedad de eventos. → Sistema data-driven para escribir cientos de eventos sin tocar código.

**Veredicto:** idea sólida y viable si se construye por fases, con motor de simulación separado de la interfaz y contenido en datos.

---

## 2. Visión y pilares de diseño

**Visión:** *"Vive una vida entera en el fútbol: desde un chaval en un club modesto hasta leyenda en el campo y en el banquillo. Tus decisiones te definen, no la suerte."*

**Pilares (toda funcionalidad debe respetar al menos uno y no romper ninguno):**
1. **Decisiones con consecuencias.** Cada decisión muestra sus riesgos y altera estadísticas visibles. La aleatoriedad existe, pero está modulada por tus atributos y se comunica (p. ej. "Probabilidad de éxito: 70 % por tu Carisma").
2. **Ritmo ágil.** Una semana de juego se resuelve en menos de 60 segundos. Una temporada, en una sesión razonable.
3. **Profundidad opcional.** El jugador casual avanza con decisiones simples; el experto accede a tácticas, datos y negociación detallada.
4. **Una sola vida continua.** Lo que haces como jugador importa como entrenador.
5. **Habilidad y atributos se suman.** En las Jugadas en Vivo un buen jugador humano rinde mejor, pero un jugador de media 55 nunca juega como uno de 90.
6. **Justo con el usuario gratuito.** El juego completo es disfrutable gratis; pagar da comodidad, personalización y extras, nunca la única forma de progresar.

---

## 3. Estructura general del juego

```
Crear personaje ─► MODO JUGADOR (15–22 años de carrera)
                        │
                        ▼
                  Retirada ─► Pantalla de Legado ─► ¿Qué haces ahora?
                                                   ├─ Entrenador de club
                                                   ├─ (futuro) Director deportivo / Agente / Comentarista
                                                   └─ Terminar partida (Salón de la Fama)
                        │
                        ▼
                  MODO ENTRENADOR (club ↔ selección, hasta jubilarte)
                        │
                        ▼
                  Fin de vida deportiva ─► Puntuación final ─► Nueva partida (con bonus de "dinastía")
```

**Unidad de tiempo:** la **semana**. Cada semana tiene fases: *Entrenamiento → Vida personal / eventos → Partido(s) → Resumen*.

**Idea añadida — Dinastía:** al terminar una vida, puedes empezar como hijo/a de tu personaje anterior, con ventajas pequeñas (apellido conocido, contactos) y presión mediática extra.

---

## 4. Modo Jugador (carrera)

### 4.1 Creación del personaje
- Nombre, nacionalidad, aspecto (avatar 2D por capas), pie dominante, posición.
- **Origen** (elige 1): *Barrio humilde* (+Mentalidad, −Dinero), *Hijo de exfutbolista* (+Contactos, +Presión), *Canterano de academia* (+Técnica), *Tardío* (empieza con 19 años, +Físico).
- **País de inicio:** determina liga, visibilidad y dificultad.
- Reparto de puntos iniciales limitado.

### 4.2 Atributos
| Grupo | Atributos | Cómo cambian |
|---|---|---|
| Físicos | Velocidad, Resistencia, Fuerza, Salto | Entrenamiento, edad (declive desde ~29), lesiones |
| Técnicos | Pase, Regate, Tiro, Control, Defensa, Cabeza (portero: Reflejos, Colocación, Juego aéreo) | Entrenamiento, minutos jugados |
| Mentales | Visión, Compostura, Liderazgo, Trabajo en equipo | Experiencia, decisiones |
| Personalidad | Profesionalidad, Carisma, Ego, Temperamento | Decisiones (lo más importante del modo) |

**Media global (0–99)** y **Potencial oculto** (se revela parcialmente con la edad y los informes de tus entrenadores).

### 4.3 Estados vitales (barras)
- **Salud física** (lesiones, cansancio acumulado).
- **Salud mental** (estrés, presión, felicidad).
- **Forma** (rendimiento reciente).
- **Energía semanal** (acciones disponibles esa semana).
- **Dinero** y **Patrimonio**.

Valores extremos disparan eventos: agotamiento, depresión, lesión grave, bancarrota.

### 4.4 Relaciones (medidores de −100 a +100)
- **Entrenador** → minutos de juego.
- **Vestuario** → apoyo, pases en el campo, capitanía.
- **Afición** → pitos o ovaciones (afecta a Compostura en partido).
- **Directiva** → renovaciones, venta, apertura de expediente.
- **Prensa** → fama, polémicas.
- **Pareja / familia / amigos** → salud mental.
- **Agente** → calidad de las ofertas que te llegan.
- **Patrocinadores** → ingresos y exigencias.

### 4.5 Acciones semanales (gastan Energía)
- **Entrenar** (elige foco: físico, técnico, táctico, descanso activo). Entrenar de más aumenta el riesgo de lesión.
- **Entrenamiento extra / entrenador personal** (cuesta dinero).
- **Vida social:** salir de fiesta, cita, familia, amigos, videojuegos, redes sociales.
- **Imagen:** entrevista, evento benéfico, publicación en redes.
- **Negocios:** invertir, abrir negocio, comprar coche o casa.
- **Salud:** fisioterapeuta, nutricionista, psicólogo deportivo.
- **Estudio:** cursos (p. ej. licencia de entrenador → ventaja para el futuro Modo Entrenador).

### 4.6 Eventos con decisiones (el corazón del modo)
Tarjetas con texto, 2–4 opciones, requisitos y consecuencias. Ejemplos:
- *"Un compañero te invita a una fiesta la noche antes del derbi."* → Ir (+Vestuario, −Forma, riesgo de foto en prensa) / No ir (+Profesionalidad, −Vestuario leve) / Ir un rato (chequeo de Profesionalidad).
- *"La afición te pita tras fallar un penalti."* → Pedir perdón / Gesto de silencio (−Afición, +Ego, posible sanción) / Ignorar.
- *"Una marca de apuestas te ofrece patrocinio."* → Aceptar (+Dinero, −Prensa, riesgo de polémica) / Rechazar.
- *"Tu pareja se queja de que nunca estás."* → Cancelar concentración extra / Prometer vacaciones / Ignorar (−Pareja, riesgo de ruptura).

**Reglas para reducir la dependencia de la suerte:**
- Si una opción tiene riesgo, **se muestra la probabilidad** y el atributo que la determina.
- Las consecuencias pueden ser **diferidas** (cadenas de eventos): la foto de la fiesta aparece dos semanas después.
- Las elecciones repetidas generan **rasgos** (p. ej. *Fiestero*, *Ejemplar*, *Polémico*, *Líder*), que desbloquean o bloquean eventos futuros.

### 4.7 Partidos (vista jugador)
- **Partido normal:** se simula el partido y el jugador vive **2–4 "momentos clave"** en forma de tarjetas de decisión rápidas: *"Estás solo ante el portero: ¿chutar fuerte, colocar o regatear?"* La probabilidad de éxito depende de tus atributos, la forma y la moral.
- **Partido importante:** además de las tarjetas, se activan **Jugadas en Vivo** controladas con el dedo (sección 7B), pero **solo en momentos que marcan un antes y un después**:
  - Derbis y clásicos.
  - Finales y semifinales.
  - Tandas de penaltis y penaltis a favor o en contra en el tiempo añadido.
  - Debut como profesional y debut con la selección.
  - Partidos decisivos por el título, el ascenso, el descenso o la clasificación continental.
  - Partido de despedida antes de la retirada.
- **Frecuencia orientativa:** 1 Jugada en Vivo cada 5–8 partidos de media, para que siga siendo especial. En un partido importante: 1–3 jugadas.
- Tu **personaje** es el protagonista de la jugada: solo controlas a tu jugador (compañeros y rivales los mueve la IA).
- Nota del partido (1–10), estadísticas, reacción de afición y prensa.
- Opción **Simular** sin momentos clave (resultado basado en tu nivel, con nota algo más conservadora).

### 4.8 Carrera profesional
- **Contratos:** duración, sueldo, primas, cláusula, rol prometido. Negociación por turnos con el club y tu agente.
- **Fichajes:** ofertas según tu nivel, visibilidad de la liga y fama. Puedes pedir el traspaso, forzar la salida (−Afición) o aceptar cesiones.
- **Despidos o rescisiones** por mal comportamiento o bajo rendimiento.
- **Selección nacional:** convocatorias, torneos internacionales.
- **Títulos y premios:** liga, copa, continental, Bota de Oro, Balón de Oro (nombres ficticios), equipo del año.
- **Lesiones:** tipo, duración, riesgo de recaída si vuelves antes de tiempo (decisión del jugador).
- **Declive y retirada:** a partir de ~31–34 años baja el físico; la retirada puede ser voluntaria o forzada por lesión o falta de ofertas.

### 4.9 Vida personal
- Parejas (conocer, citas, relación, ruptura, matrimonio), hijos (activa la Dinastía), amistades, familia.
- Fiesta y ocio con efectos claros en salud y prensa.
- Patrimonio: casas, coches, inversiones con riesgo, negocios propios.
- Contenido apto para mayores de 12 años aproximadamente: sin contenido sexual explícito ni consumo de drogas representado de forma atractiva.

### 4.10 Marcas y campañas
- Ofertas según fama e imagen. Cada marca exige algo: publicaciones, eventos, no tener polémicas.
- **Campañas benéficas** mejoran Prensa y Afición.
- Romper una cláusula de imagen implica penalización económica.

---

## 5. Transición: el Legado

Al retirarte se calcula tu **Puntuación de Legado** (títulos, partidos, premios, reputación e imagen) y se desbloquean ventajas para el Modo Entrenador:

| Heredado | Efecto en Modo Entrenador |
|---|---|
| Reputación | Nivel de clubes que te ofrecen trabajo al empezar |
| Licencias de entrenador cursadas como jugador | Puedes empezar en divisiones más altas |
| Excompañeros | Disponibles como segundo entrenador, preparador u ojeador |
| Clubes donde fuiste ídolo | Su afición y directiva te dan más paciencia |
| Rasgos | *Líder* → +moral del vestuario; *Polémico* → ruedas de prensa más duras |
| Patrimonio | Posibilidad futura de comprar un club (idea de ampliación) |

---

## 6. Modo Entrenador (gestión)

### 6.1 Carrera del entrenador
- **Reputación** de entrenador (independiente de la de jugador, aunque parte de ella).
- **Ofertas de trabajo** y entrevistas con la directiva (preguntas con respuestas que fijan tus objetivos).
- **Objetivos de la directiva:** clasificación, presupuesto, cantera, estilo de juego.
- **Confianza de la directiva:** si baja de cierto nivel, ultimátum y después despido.
- **Dimisión**, fichaje por otro club, **selección nacional** (compatible o exclusiva según el nivel).
- **Ruedas de prensa** con decisiones (afectan a la moral, la afición y la directiva).

### 6.2 Plantilla y jugadores
**Atributos de cada jugador:** como en el Modo Jugador, más:
- **Potencial** (oculto), **edad**, **curva de desarrollo** (precoz, normal, tardío).
- **Personalidad:** ambición, lealtad, profesionalidad, temperamento.
- **Moral**, **forma**, **condición física**, **felicidad** (minutos, sueldo, promesas cumplidas).
- **Valor de mercado dinámico:** depende de edad, media, potencial, forma, contrato restante, rendimiento reciente y demanda.
- **Envejecimiento:** mejora hasta ~27, meseta, y declive desde ~30 (variable por posición; los porteros duran más).
- **Exigencias:** piden renovación, subida de sueldo o salir si no juegan; se lesionan y se retiran.

### 6.3 Niebla de guerra y ojeadores
- Al principio solo ves la **media aproximada** de jugadores ajenos (p. ej. "65–78").
- **Ojeadores** con atributos propios (juicio de habilidad, juicio de potencial, región de especialidad y coste).
- Enviar ojeadores a países o torneos → informes que **estrechan los rangos** de atributos y revelan el potencial.
- Jugadores de tu plantilla: rangos más precisos con el tiempo.
- **Talento joven:** torneos juveniles y regiones con "joyas" ocultas.

### 6.4 Entrenamiento y cantera
- Planes semanales por grupo o individuales (foco en atributos, posición nueva, recuperación).
- **Staff:** segundo entrenador, preparador físico, entrenador de porteros, médicos, psicólogo. Su calidad afecta a la mejora y a las lesiones.
- **Cantera:** llegada anual de juveniles; su calidad depende de las instalaciones y del director de cantera. Opciones: subir al primer equipo, ceder o vender.

### 6.5 Mercado de fichajes
- **Ventanas** de verano e invierno, más agentes libres todo el año.
- **Búsqueda avanzada** con filtros (posición, edad, precio, país, atributos conocidos).
- **Negociación con clubes:** oferta, contraoferta, jugador incluido en el trato, pagos aplazados, porcentaje de futura venta, cesión con opción de compra.
- **Negociación con el jugador y su agente:** sueldo, duración, rol, primas, cláusula de rescisión.
- **IA de clubes:** los demás clubes también fichan, venden y compiten por los mismos jugadores (con lógica según presupuesto y necesidades).
- **Rumores** y filtraciones de prensa.
- Despedir o rescindir contratos cuesta indemnización.

### 6.6 Tácticas
- Formación, mentalidad (defensiva ↔ ofensiva), presión, ritmo, amplitud, línea defensiva.
- Roles por posición (p. ej. lateral ofensivo, mediocentro organizador, delantero de área).
- Instrucciones específicas simples; el modo experto permite más detalle.
- Cambios en directo durante el partido.
- **Jugadas en Vivo** (sección 7B): varias por partido, en ataque y en defensa; controlas a todo el equipo en la jugada, como en World Soccer Champs.

### 6.7 Club y finanzas
- Ingresos: taquilla, TV, patrocinio, traspasos, premios.
- Gastos: salarios, staff, instalaciones y amortizaciones.
- Mejoras: estadio, centro de entrenamiento, cantera, instalaciones médicas.
- **Límite salarial / juego limpio financiero** simplificado.

### 6.8 Selección nacional
- Convocatorias en fechas FIFA (nombres ficticios), sin mercado de fichajes.
- Clasificatorios y torneos. La presión mediática es mayor.

---

## 7. Motor de partidos (solución a la lentitud)

**Problema de World Soccer Champs:** los partidos eran lentos y completar una temporada se hacía eterno.

**Solución:** el partido se **calcula entero en milisegundos** y genera un **registro de eventos** (goles, ocasiones, tarjetas, lesiones, estadísticas minuto a minuto). La interfaz **reproduce** ese registro a la velocidad elegida:

| Modo de visualización | Duración aproximada | Disponibilidad |
|---|---|---|
| Resultado instantáneo | 0 s | Gratis |
| Resumen (jugadas destacadas) | 20–40 s | Gratis |
| Partido en directo x1 / x2 / x4 | 2–6 min | Gratis |
| Simular jornada/semana completa | Instantáneo | Gratis |
| **Simular hasta una fecha / fin de temporada** | Instantáneo | Gratis limitado (p. ej. 1/día o con anuncio) · **Ilimitado en Premium** |

Si el usuario interviene en directo (cambio táctico o sustitución), el motor **recalcula desde ese minuto** con el mismo generador aleatorio.

**Algoritmo (primera versión):**
1. Fuerza por zonas (defensa, medio, ataque) a partir de atributos, forma, moral, táctica y ventaja de campo.
2. Por cada tramo de 5 minutos: se decide la posesión, las ocasiones (probabilidad según diferencia de zonas) y la conversión (tirador contra portero).
3. Eventos secundarios: tarjetas (temperamento, agresividad de la táctica), lesiones (condición física), cansancio.
4. Todo con un **RNG con semilla** (determinista) → reproducible en pruebas y en la nube.

**Simulación a distintos niveles de detalle:** los partidos de ligas que no sigue el usuario se resuelven con un modelo estadístico mucho más barato (solo resultado y goleadores), para que el móvil aguante un mundo grande.

---

## 7B. Jugadas en Vivo (habilidad real con el dedo)

### 7B.1 Concepto
El partido avanza minuto a minuto. En ciertos momentos **el reloj se detiene** y aparece una **jugada 2D en vista cenital** (el campo visto desde arriba) en la que el usuario mueve el balón y los jugadores **deslizando el dedo**. El resultado de la jugada (gol, parada, fuera, falta, pérdida) **se lo devuelve al motor**, que continúa el partido a partir de ahí. Así el resultado final depende de **tus decisiones + tus atributos + tu habilidad real**.

### 7B.2 Diferencias entre modos
| | Modo Jugador | Modo Entrenador |
|---|---|---|
| Frecuencia | Rara: solo partidos importantes (ver 4.7) | Frecuente: 3–6 jugadas por partido |
| A quién controlas | Solo a tu personaje; el resto es IA | A todo tu equipo dentro de la jugada |
| Tipos de jugada | Ocasión de gol, regate decisivo, penalti, falta directa, parada (si eres portero), cruce defensivo | Ataque, defensa, contraataque, córner, falta, penaltis |
| Consecuencias extra | Nota del partido, afición, prensa, fama, "momento histórico" en tu Legado | Moral del equipo, confianza de la directiva |
| Si no quieres jugarla | Resolución automática según atributos | Resolución automática según atributos |

### 7B.3 Tipos de jugada y controles
- **Ataque (pase y tiro):** mantén pulsado el balón y **dibuja la trayectoria** hacia un compañero para pasar; desliza rápido hacia la portería para **chutar**. La velocidad del gesto marca la potencia y la curva del deslizamiento marca el efecto.
- **Conducción y regate:** arrastra al jugador con el balón; un **toque rápido** a un lado hace un recorte.
- **Defensa:** arrastra a tus defensas para **cortar líneas de pase**; toca al rival para **entrar al balón** (si llegas tarde, falta o tarjeta).
- **Portero:** desliza en la dirección del disparo para **estirarte** en el momento justo.
- **Penalti (lanzador):** apunta arrastrando y suelta cuando la barra de potencia esté en la zona buena; la barra oscila más o menos según la **Compostura** y la presión del partido.
- **Penalti (portero):** elige lado y momento de lanzarte; ves una **pista sutil** del lanzador si tus reflejos y tu experiencia son altos.
- **Balón parado (falta y córner):** elige el objetivo, la altura y el efecto.
- **Tiempo:** cada jugada dura como máximo 8–15 segundos. Opcionalmente, **cámara lenta breve** al tocar el balón para facilitar la precisión en móvil.

### 7B.4 Cómo influyen los atributos (habilidad + estadísticas)
| Atributo | Efecto en la jugada |
|---|---|
| Pase / Visión | Tamaño del **cono de error** del pase; líneas de pase visibles más largas |
| Tiro / Compostura | Error de dirección y de potencia; estabilidad de la barra en penaltis |
| Velocidad / Regate | Velocidad del jugador arrastrado; éxito del recorte frente al defensa |
| Defensa / Fuerza | Radio de robo; probabilidad de falta al entrar |
| Reflejos / Colocación (portero rival o propio) | Velocidad de reacción de la IA; alcance de la estirada |
| Forma, moral, cansancio | Modificadores globales |
| Presión (derbi, final, afición en contra) | Más oscilación y menos tiempo de reacción; se reduce con Compostura y Liderazgo |

**Regla de oro:** la habilidad humana puede aumentar mucho la probabilidad de éxito, pero no convertir a un jugador muy malo en un crack. Ejemplo orientativo de probabilidad de gol en un mano a mano: jugador humano torpe con delantero de media 90 → 35 %; jugador humano muy hábil con delantero de media 55 → 45 %; jugador humano muy hábil con delantero de media 90 → 80 %.

### 7B.5 Integración con el motor (arquitectura)
1. El motor, al generar el partido, marca ciertos eventos como **candidatos a Jugada en Vivo** (según el modo, la importancia del partido y los ajustes del usuario).
2. Al llegar a ese minuto, el motor crea una **`LiveSituation`**: posiciones iniciales, jugadores implicados con sus atributos, tipo de jugada, presión y **semilla**.
3. El **minijuego** (en la app) ejecuta la jugada con físicas 2D sencillas y la IA de los jugadores.
4. El minijuego devuelve un **`LiveOutcome`** (gol, parada, fuera, poste, falta, tarjeta, lesión, pérdida) más datos para la repetición.
5. El motor **recalcula el resto del partido** desde ese minuto con el resultado aplicado (mismo mecanismo que los cambios tácticos).
6. Si el usuario elige **resolución automática**, el motor calcula un `LiveOutcome` a partir de los atributos (equivalente a un jugador humano de nivel medio).

La lógica de físicas, IA y cálculo de errores se escribe en un módulo **puro y determinista** (`packages/engine/src/live/`) para poder probarla y, en el futuro, **validarla en el servidor** en modos competitivos (evita trampas). La app solo se encarga del dibujado, los gestos y las animaciones.

### 7B.6 Experiencia de usuario
- **Tutorial interactivo** la primera vez de cada tipo de jugada.
- **Campo de entrenamiento** (modo libre, sin consecuencias) para practicar penaltis, faltas y ataques. Idea: completar retos del campo da un pequeño bonus temporal de moral o forma (nunca atributos permanentes, para no romper el balanceo).
- **Ajustes:** frecuencia de jugadas (pocas / normal / muchas en Modo Entrenador), dificultad, ayudas de puntería, zurdos (controles espejados), vibración.
- **Repetición** de la jugada al acabar (y posibilidad de compartir el gol como vídeo corto o GIF, bueno para marketing).
- **Feedback claro:** tras fallar, se indica si fue por el gesto ("disparo demasiado flojo") o por los atributos ("tu Tiro limitó la precisión"), para que el jugador sienta que el resultado es justo.
- **Estilo visual:** 2D sencillo, legible en pantallas pequeñas, 60 fps. Jugadores como fichas o siluetas con dorsal; nada de 3D.

### 7B.7 Relación con el resto del partido
- La reproducción del partido (resultado instantáneo, resumen o directo) sigue igual: las Jugadas en Vivo **interrumpen** la reproducción en su minuto.
- "Simular hasta fin de temporada" resuelve todas las jugadas en automático.
- Estadísticas separadas: **goles en Jugada en Vivo**, **penaltis parados**, etc., que alimentan logros y el Salón de la Fama.

## 8. Mundo simulado

- **Base de datos ficticia generada proceduralmente:** nombres por país, clubes inspirados en ciudades reales con nombres inventados y escudos generados.
- **Alcance inicial:** 8–12 países, 2–3 divisiones cada uno, con ascensos y descensos; copas nacionales; 2 competiciones continentales; mundial y continentales de selecciones.
- **Volumen orientativo:** ~250 clubes × ~28 jugadores ≈ 7.000 jugadores más regenerados cada año.
- **Regeneración:** los jugadores que se retiran se sustituyen por juveniles nuevos para que el mundo no se degrade.
- **Calendario** con fechas, ventanas de fichajes, parones de selecciones y pretemporada.
- **Editor de datos** (futuro, posible funcionalidad premium o comunitaria): permitir que los usuarios renombren equipos (así lo hacen legalmente otros juegos).

---

## 9. Retención y enganche del usuario gratuito

- **Primera sesión muy cuidada:** en 5 minutos el usuario debe crear el personaje, tomar decisiones con consecuencias visibles y jugar su primer partido.
- **Objetivos a corto, medio y largo plazo** siempre visibles (esta semana, esta temporada, esta carrera).
- **Logros** (cientos) y **Salón de la Fama** personal.
- **Retos de habilidad** en el campo de entrenamiento (penaltis, faltas) con clasificación entre amigos (fase posterior).
- **Retos semanales** con reglas especiales (p. ej. "llega a primera división desde tercera en 3 temporadas").
- **Notificaciones** útiles y no abusivas (ofertas recibidas, final de temporada).
- **Ligas entre amigos** y clasificación global de Legado (fase posterior, con backend).
- **Historias compartibles:** tarjeta resumen de la carrera para redes sociales (marketing gratuito).
- **Guardado en la nube** para no perder partidas.

---

## 10. Monetización (diseñada ahora, implementada después)

**Principio:** nada de muros artificiales. El usuario gratuito puede terminar una vida completa.

| Tipo | Contenido |
|---|---|
| **Anuncios recompensados** (opcionales) | Simular temporada, energía extra una semana, informe de ojeador extra |
| **Premium (suscripción mensual/anual)** | Sin anuncios, simulación ilimitada, varias partidas guardadas, estadísticas avanzadas, ojeador adicional, modos de visualización extra, editor de nombres |
| **Compra única "Pase de Leyenda"** | Alternativa a la suscripción para quien no quiera pagos recurrentes |
| **Cosméticos** | Avatares, botas, estilos de escudo, temas de interfaz, celebraciones, **estelas del balón y estilos del campo en las Jugadas en Vivo** |
| **Expansiones** (futuro) | Nuevas salidas tras la retirada (director deportivo, presidente, agente), nuevos países |

**Nunca de pago en las Jugadas en Vivo:** ayudas de puntería, repetir una jugada fallada o mejores resultados. La habilidad no se compra; si no, se rompe la sensación de mérito.

**Evitar:** cajas de botín o recompensas aleatorias de pago (riesgo regulatorio en España y en la UE, y mala imagen); ventajas de pago en modos competitivos entre usuarios.

---

## 11. Aspectos legales

- **No usar** nombres, caras ni firmas de futbolistas reales, ni nombres, escudos o equipaciones de clubes, ligas o competiciones reales sin licencia. Tampoco nombres de marcas reales en las campañas publicitarias.
- **Nombres ficticios** para todo; parecidos genéricos (ciudades) sí son habituales.
- **RGPD:** política de privacidad, consentimiento para anuncios personalizados y analítica, eliminación de cuenta.
- **Menores:** clasificación por edades (PEGI/IARC en las tiendas) y cuidado con el contenido de apuestas, alcohol y fiesta.
- **Patrocinios de apuestas en el juego:** tratarlos de forma ficticia y con consecuencias negativas, o eliminarlos, para no promocionar el juego de azar.
- **Nombre y marca del juego:** comprobar disponibilidad en la OEPM/EUIPO y en las tiendas antes de publicar.
- *Nota: esto es orientativo, no es asesoramiento jurídico; antes de lanzar conviene consultar con un profesional.*

---

## 12. Requisitos

### 12.1 Funcionales (resumen; se detallan como historias de usuario en el backlog)
- **RF-01** Crear, guardar, cargar y borrar partidas (varias ranuras).
- **RF-02** Crear un personaje jugador con origen, posición y país.
- **RF-03** Ciclo semanal con acciones que consumen energía.
- **RF-04** Sistema de eventos con decisiones, requisitos y consecuencias (inmediatas y diferidas).
- **RF-05** Atributos, estados vitales y relaciones que evolucionan.
- **RF-06** Motor de partidos con momentos clave para el jugador.
- **RF-07** Contratos, ofertas, negociaciones y traspasos del jugador.
- **RF-08** Competiciones con calendario, clasificaciones, ascensos y descensos.
- **RF-09** Retirada y cálculo del Legado.
- **RF-10** Modo Entrenador: ofertas de trabajo, directiva, despidos.
- **RF-11** Gestión de plantilla, tácticas, entrenamiento y staff.
- **RF-12** Ojeadores y niebla de guerra en atributos.
- **RF-13** Mercado de fichajes con IA de clubes y negociación.
- **RF-14** Finanzas del club e instalaciones.
- **RF-15** Selecciones nacionales.
- **RF-16** Modos de visualización y simulación rápida de partidos.
- **RF-16B** Jugadas en Vivo controladas con gestos (ataque, defensa, portero, penaltis, balón parado), con resolución automática opcional, tutorial y campo de entrenamiento.
- **RF-17** Logros, estadísticas históricas y Salón de la Fama.
- **RF-18** (Fase posterior) Cuentas, guardado en la nube, compras, anuncios, clasificaciones.

### 12.2 No funcionales
- **RNF-01 Rendimiento:** simular una jornada completa del mundo en < 500 ms en un móvil de gama media; interfaz a 60 fps.
- **RNF-01B Control táctil:** latencia entre gesto y respuesta < 50 ms; Jugadas en Vivo a 60 fps en gama media; controles cómodos con una mano.
- **RNF-02 Offline primero:** todo el juego un jugador funciona sin conexión.
- **RNF-03 Determinismo:** misma semilla + mismas decisiones = mismo resultado.
- **RNF-04 Persistencia robusta:** guardado automático; esquema versionado con migraciones; nunca perder una partida al actualizar.
- **RNF-05 Tamaño:** aplicación < 100 MB; partida guardada < 20 MB.
- **RNF-06 Batería:** sin procesos pesados en segundo plano.
- **RNF-07 Internacionalización:** español e inglés desde el inicio (textos fuera del código).
- **RNF-08 Accesibilidad:** tamaños de texto ajustables, contraste suficiente, no depender solo del color.
- **RNF-09 Calidad:** cobertura de pruebas del motor ≥ 80 %; CI obligatoria antes de fusionar.
- **RNF-10 Plataformas:** Android e iOS.

---

## 13. Arquitectura técnica

### 13.1 Decisión de tecnología (ADR-001)
El juego es **de interfaz y datos**, no de gráficos. Por eso se descarta un motor de juego (Unity/Godot) en favor de un framework de apps:

| Opción | Pros | Contras | Decisión |
|---|---|---|---|
| **React Native + Expo + TypeScript** (+ React Native Skia para las Jugadas en Vivo) | Un solo lenguaje para motor, app y backend; builds en la nube (EAS) sin necesidad de Mac; gran ecosistema; Claude Code rinde muy bien con TS; Skia + Reanimated + Gesture Handler permiten dibujo 2D fluido y gestos en el hilo de UI | Las Jugadas en Vivo exigen cuidar el rendimiento; hay que validarlo con un prototipo | ✅ **Elegida, condicionada a la Fase 0.5** |
| Flutter (Dart) + Flame | Muy buen rendimiento de UI y motor 2D integrado | Otro lenguaje, motor no reutilizable en backend TS | **Plan B** si el prototipo de Skia no cumple |
| Unity (C#) | Potente para gráficos y físicas | Excesivo para la mayoría del juego (menús y datos); UI más costosa | Descartada |

**ADR-002 (pendiente de la Fase 0.5):** las Jugadas en Vivo se implementan con React Native Skia + Reanimated + Gesture Handler, con la lógica de físicas en el motor puro. Criterios de aceptación del prototipo: 60 fps estables en un Android de gama media, latencia de gesto imperceptible, y que 5 personas lo prueben y digan que el control se siente bien. Si no se cumplen → evaluar el plan B.

### 13.2 Stack
- **App:** Expo (React Native) + TypeScript estricto + Expo Router (navegación).
- **Estado de UI:** Zustand. **Validación de datos:** Zod.
- **Persistencia local:** SQLite (expo-sqlite) + Drizzle ORM (migraciones versionadas).
- **Motor de simulación:** paquete TypeScript **puro** (sin dependencias de React ni de la plataforma).
- **Animaciones y gestos:** React Native Reanimated + React Native Gesture Handler.
- **Jugadas en Vivo (2D):** React Native Skia (dibujo) + físicas propias sencillas en el motor (o una librería ligera tipo Matter.js si hiciera falta).
- **Sonido y vibración:** expo-audio y expo-haptics. **Listas grandes:** FlashList.
- **i18n:** i18next.
- **Backend (fase posterior):** Supabase (Postgres, Auth, Storage, Edge Functions) para cuentas, guardado en la nube, clasificaciones y ligas de amigos. *(Firebase es alternativa si prefieres lo ya conocido.)*
- **Pagos:** RevenueCat (abstrae App Store y Google Play). **Anuncios:** Google AdMob (anuncios recompensados).
- **Analítica:** PostHog. **Errores:** Sentry.
- **Pruebas:** Vitest (motor), Jest + React Native Testing Library (componentes), Maestro (pruebas E2E en móvil).
- **Monorepo:** pnpm workspaces + Turborepo.
- **CI/CD:** GitHub Actions + EAS Build/Submit.

### 13.3 Estructura del repositorio
```
leyenda/
├── apps/
│   └── mobile/                 # App Expo (solo presentación y orquestación)
│       ├── app/                # Rutas (Expo Router)
│       ├── src/features/       # player-career, manager, match, live-play, market, scouting...
│       ├── src/components/     # UI reutilizable (design system)
│       ├── src/store/          # Zustand
│       └── src/persistence/    # SQLite + Drizzle + migraciones
├── packages/
│   ├── engine/                 # Núcleo de simulación: TS puro, determinista, 100 % testeable
│   │   ├── src/rng/            # RNG con semilla
│   │   ├── src/match/          # Motor de partidos
│   │   ├── src/career/         # Lógica del jugador
│   │   ├── src/manager/        # Lógica de club, directiva, staff
│   │   ├── src/market/         # Valoración, IA de fichajes, negociación
│   │   ├── src/development/    # Crecimiento y envejecimiento
│   │   ├── src/world/          # Calendario, competiciones, regeneración
│   │   ├── src/events/         # Intérprete de eventos data-driven
│   │   └── src/live/           # Jugadas en Vivo: situaciones, físicas 2D, IA, resolución automática
│   ├── content/                # Eventos, textos, nombres (JSON/YAML + esquemas Zod)
│   ├── worldgen/               # Generador procedural del mundo
│   ├── shared/                 # Tipos y utilidades comunes
│   └── balance-sim/            # CLI: simula miles de carreras/temporadas y genera informes
├── supabase/                   # Migraciones SQL, funciones (fase posterior)
├── docs/
│   ├── GDD.md                  # Este documento
│   ├── adr/                    # Decisiones de arquitectura
│   ├── backlog/                # Épicas e historias de usuario
│   └── balance/                # Informes de balanceo
├── .claude/                    # Configuración de Claude Code (agentes, comandos, skills)
├── .github/workflows/          # CI
└── CLAUDE.md
```

### 13.4 Principios de arquitectura
- **Arquitectura limpia / hexagonal:** el `engine` no conoce la UI ni la base de datos. Recibe un `GameState` y comandos, y devuelve un nuevo estado más una lista de eventos.
- **Patrón comando:** toda acción del usuario es un comando (`TrainCommand`, `AcceptOfferCommand`...) → facilita deshacer, repetir, registrar y probar.
- **Funciones puras** en el motor; toda la aleatoriedad pasa por el RNG inyectado.
- **Simulación en segundo plano** (hilo separado o troceada) para no bloquear la UI en simulaciones largas.
- **Guardado incremental:** solo se escriben las entidades modificadas.

```
UI (React Native) ──comando──► Store (Zustand) ──► Engine.apply(state, cmd, rng)
      ▲                                               │
      └────────── nuevo estado + eventos ◄────────────┘
                                   │
                                   ▼
                          Persistencia (SQLite)
```

---

## 14. Modelo de datos (entidades principales)

- **Save** (id, versión de esquema, semilla, fecha de juego, modo actual)
- **Person** (base común: nombre, nacionalidad, fecha de nacimiento, personalidad)
  - **Player** (atributos, potencial, posición, forma, moral, condición, valor, contrato)
  - **Coach** (reputación, licencias, estilo, historial)
  - **Staff / Scout** (rol, atributos de juicio, región, sueldo)
- **ProtagonistCareer** (estados vitales, relaciones, rasgos, patrimonio, legado)
- **Club** (nombre, país, reputación, finanzas, instalaciones, directiva, afición)
- **Nation** (selección, liga, coeficiente)
- **Competition / Season / Fixture / Match / MatchEvent / Standing**
- **Contract** (persona, club, sueldo, duración, cláusulas, primas)
- **Transfer / Offer / Negotiation** (estado, historial de ofertas)
- **ScoutReport** (jugador, ojeador, rangos de atributos, fecha, fiabilidad)
- **LiveSituation / LiveOutcome** (tipo de jugada, posiciones, implicados, presión, semilla, resultado, datos de repetición)
- **GameEventInstance** (definición, fecha, elección tomada, consecuencias pendientes)
- **Achievement / HallOfFameEntry**

---

## 15. Sistema de contenido data-driven

Los eventos se escriben en archivos, no en código, y se validan con Zod al compilar:

```yaml
id: party_before_derby
category: social
weight: 3
cooldownWeeks: 20
conditions:
  - phase: player
  - nextMatch.isDerby: true
  - stat.energy: { gte: 1 }
text: events.party_before_derby.text
choices:
  - id: go
    text: events.party_before_derby.go
    effects:
      - relation.squad: +8
      - state.form: -10
    delayed:
      - weeks: 1
        chance: { base: 0.35, modifier: "-trait.discreet*0.15" }
        trigger: press_party_photo
  - id: stay
    text: events.party_before_derby.stay
    effects:
      - personality.professionalism: +2
      - relation.squad: -3
  - id: short_visit
    text: events.party_before_derby.short
    check: { attribute: professionalism, difficulty: 55 }
    onSuccess: [ relation.squad: +5 ]
    onFail: [ state.form: -6, relation.squad: +5 ]
```

Beneficios: escribir cientos de eventos rápidamente (Claude puede ayudar a redactarlos), balancear sin recompilar y validar automáticamente que ningún evento referencie estadísticas inexistentes.

---

## 16. Estrategia de pruebas y balanceo

- **Unitarias (motor):** atributos, contratos, valoración de mercado, envejecimiento, efectos de eventos.
- **Pruebas basadas en propiedades** (fast-check): "ningún atributo sale de 0–99", "el dinero de un club nunca es NaN", "una temporada siempre tiene un campeón".
- **Pruebas de determinismo:** misma semilla → mismo resultado.
- **Pruebas de regresión de partidas guardadas:** cargar partidas de versiones antiguas tras cada migración.
- **Componentes:** pantallas clave con React Native Testing Library.
- **Jugadas en Vivo:** pruebas del módulo `live` (determinismo, límites de probabilidad por atributos), **bots de habilidad** (torpe, medio, experto) que juegan miles de jugadas automáticas para comprobar la regla de oro de la sección 7B.4, y pruebas en dispositivos reales de rendimiento y sensación de control.
- **E2E (Maestro):** crear personaje → jugar 3 semanas → guardar → reabrir.
- **Simulador de balanceo (`balance-sim`):** 10.000 carreras automáticas con bots de distintos estilos (profesional, fiestero, aleatorio) → informes de medias, títulos, edad de retirada y distribución de goles. Objetivos de ejemplo:
  - Media de goles por partido: 2,4–2,9.
  - Un jugador "profesional" con potencial alto gana algún título importante en el 60–80 % de las carreras.
  - Un "fiestero" extremo acaba su carrera antes en la mayoría de simulaciones.
  - Ningún club acumula más del 40 % de las ligas en 50 temporadas simuladas.
- **Pruebas de rendimiento:** tiempo de simular una temporada en CI.

---

## 17. Proceso de ingeniería del software

- **Metodología:** Scrum ligero / Kanban con sprints de 1–2 semanas.
- **Backlog:** épicas → historias de usuario con criterios de aceptación (formato Dado/Cuando/Entonces). Gestión en GitHub Projects (issues + tablero).
- **Git:** rama `main` protegida; ramas `feat/...`, `fix/...`; Pull Requests obligatorios; **Conventional Commits**; versionado semántico.
- **Definition of Done:** código tipado sin `any`, pruebas escritas y en verde, lint y formato correctos, documentación/ADR actualizados si cambia el diseño, revisado (por ti o por un subagente de revisión).
- **CI (GitHub Actions):** typecheck, lint (ESLint), formato (Prettier), pruebas, validación de contenido y simulación de balanceo reducida.
- **ADRs** en `docs/adr/` para cada decisión relevante.
- **Changelog** automático a partir de los commits.
- **Entornos:** desarrollo (Expo Go / dev client), preview (builds internas de EAS), producción.
- **Telemetría** respetando el consentimiento del usuario, para detectar dónde se atasca y dónde abandona.

---

## 18. Hoja de ruta por fases

| Fase | Objetivo | Entregable | Criterio de salida |
|---|---|---|---|
| **0. Fundamentos** | Montar el proyecto | Monorepo, CI, Expo funcionando, RNG, esquema de guardado, design system básico | CI en verde; la app abre en el móvil |
| **0.5. Prototipo de Jugadas en Vivo** | Validar el control táctil antes de comprometerse | Minijuego aislado: un ataque y un penalti en 2D con gestos | Cumple los criterios del ADR-002 |
| **1. Mundo y motor** | Simulación sin UI | `worldgen`, calendario, ligas, motor de partidos, `balance-sim` | Se simulan 50 temporadas con estadísticas creíbles |
| **2. Vertical slice Jugador** | Primer juego jugable | Creación de personaje, ciclo semanal, 30 eventos, partidos con momentos clave, Jugadas en Vivo de penalti y ocasión de gol, 1 país | Una temporada completa jugable y divertida (probada con amigos) |
| **3. Modo Jugador completo** | Carrera entera | Contratos, fichajes, selección, lesiones, vida personal, marcas, 200+ eventos, retirada y Legado | Una carrera completa de principio a fin |
| **4. Modo Entrenador base** | Gestión | Ofertas de trabajo, plantilla, tácticas, entrenamiento, directiva, despidos, Jugadas en Vivo de equipo completo (ataque, defensa, balón parado) | Una temporada como entrenador jugable |
| **5. Mercado y ojeadores** | Profundidad | Niebla de guerra, ojeadores, negociación, IA de fichajes, cantera, finanzas | Mercado vivo y equilibrado según `balance-sim` |
| **6. Pulido y retención** | Enganche | Logros, Salón de la Fama, retos, tutorial, campo de entrenamiento, repeticiones compartibles, sonido, animaciones, i18n en/es | Buena retención en prueba cerrada |
| **7. Servicios online y monetización** | Negocio | Supabase (cuentas, nube), RevenueCat, AdMob, PostHog, Sentry | Compras y anuncios funcionando en entorno de pruebas |
| **8. Beta cerrada** | Validación | Pruebas internas de Google Play y TestFlight | Sin errores críticos; métricas aceptables |
| **9. Lanzamiento** | Publicación | Fichas de tienda, política de privacidad, clasificación por edad | Aprobado en las tiendas |
| **10. Post-lanzamiento** | Crecimiento | Selecciones ampliadas, ligas entre amigos, Dinastía, nuevas salidas tras la retirada | — |

**MVP publicable = Fases 0–3 + 6 parcial + 7 básica.** El Modo Entrenador puede llegar como gran actualización, lo que además da un motivo para volver.

---

## 19. Herramientas, MCP y skills

### 19.1 Software necesario
- **Node.js LTS**, **pnpm**, **Git** y cuenta de **GitHub**.
- **Claude Code** (terminal o extensión de VS Code).
- **VS Code** con extensiones de ESLint, Prettier y Expo Tools.
- **Expo / EAS CLI** y cuenta de Expo.
- **Android Studio** (emulador) y un móvil Android real.
- **Xcode** solo si tienes Mac; si no, se compila iOS en la nube con EAS y se prueba con TestFlight.
- **Figma** para diseñar pantallas (opcional pero recomendable).
- **Cuentas de tienda** (cuando llegue el momento): Google Play Console (pago único) y Apple Developer Program (cuota anual). Comprueba los precios actuales en sus webs.
- **Servicios** (fase 7): Supabase, RevenueCat, AdMob, PostHog y Sentry (todos con capa gratuita para empezar).

### 19.2 Servidores MCP para Claude Code
| MCP | Para qué | Cuándo |
|---|---|---|
| **GitHub** | Issues, PR, tablero del backlog | Desde la fase 0 |
| **Context7** | Documentación actualizada de librerías (Expo, Reanimated, Drizzle...) y evitar APIs obsoletas | Desde la fase 0 |
| **Expo MCP** (si está disponible en tu plan/versión) | Consultar la documentación de Expo e interactuar con el proyecto | Desde la fase 0 |
| **Figma** | Pasar diseños a componentes | Cuando tengas diseños |
| **Supabase** | Crear tablas, migraciones y políticas | Fase 7 |
| **Sentry** | Analizar errores reales | Fases 8–9 |
| **Playwright** (opcional) | Pruebas de la versión web de Expo, si la usas para iterar rápido | Opcional |

*Los MCP y sus comandos de instalación cambian a menudo: consulta la documentación oficial de Claude Code y de cada servicio antes de instalarlos.*

### 19.3 Configuración de Claude Code en el repositorio
- **`CLAUDE.md`**: reglas del proyecto (se incluye un borrador junto a este documento).
- **Subagentes** (`.claude/agents/`):
  - `engine-architect`: diseña y revisa la lógica del motor, garantiza pureza y determinismo.
  - `test-writer`: escribe pruebas unitarias y de propiedades.
  - `content-writer`: redacta eventos en YAML respetando el esquema y el tono.
  - `balance-analyst`: ejecuta `balance-sim` e interpreta los informes.
  - `live-play-dev`: implementa y optimiza las Jugadas en Vivo (Skia, gestos, rendimiento).
  - `code-reviewer`: revisa las PR según la Definition of Done.
- **Comandos personalizados** (`.claude/commands/`): `/nueva-historia`, `/nuevo-evento`, `/adr`, `/balance`, `/revisar-pr`.
- **Skills** (`.claude/skills/`): una skill "event-authoring" con el esquema y ejemplos de eventos, y otra "engine-conventions" con las reglas del motor.
- **Hooks:** ejecutar `typecheck` y `lint` tras las ediciones y pruebas antes de cada commit.
- **Forma de trabajar:** usar el **modo plan** para cada historia, pedir que implemente con pruebas primero y revisar el diff antes de aceptar.

### 19.4 Skills útiles en Claude (chat) para la parte de producto
- **Brainstorm / product-brainstorming:** afinar mecánicas.
- **write-spec:** convertir cada épica en especificación.
- **sprint-planning / roadmap-update:** planificar sprints.
- **design-critique, ux-copy, accessibility-review, design-system:** interfaz y textos.
- **frontend-design:** prototipos visuales de pantallas.
- **engineering:architecture / system-design / testing-strategy / documentation:** ADRs, diseño y pruebas.

---

## 20. Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Alcance inabarcable | Alta | Alto | Fases estrictas; MVP centrado en el Modo Jugador |
| Balanceo roto | Alta | Alto | `balance-sim` en CI; parámetros en archivos de configuración |
| Contenido repetitivo | Media | Alto | Sistema data-driven, cooldowns, cadenas de eventos, rasgos |
| Control táctil poco preciso o poco divertido | Media | Muy alto | Fase 0.5 con criterios claros; pruebas con usuarios; ajustes de ayuda; plan B tecnológico |
| Jugadas en Vivo repetitivas | Media | Medio | Muchas situaciones iniciales generadas, IA variada, frecuencia configurable |
| Rendimiento en móviles modestos | Media | Medio | Simulación por niveles de detalle, guardado incremental, pruebas de rendimiento |
| Pérdida de partidas | Baja | Muy alto | Migraciones probadas, copias de seguridad automáticas, nube |
| Problemas legales por nombres reales | Media | Muy alto | Todo ficticio; editor para el usuario |
| Monetización agresiva que espante | Media | Alto | Pilar 5; métricas de retención antes que de ingresos |
| Abandono del proyecto por cansancio | Media | Alto | Sprints cortos con resultados jugables; enseñar avances a amigos |

---

## 21. Glosario
- **Legado:** puntuación e historial que conecta el Modo Jugador con el Modo Entrenador.
- **Momento clave:** decisión rápida dentro de un partido.
- **Niebla de guerra:** atributos mostrados como rangos hasta que los ojeadores los precisan.
- **Jugada en Vivo:** minijuego 2D controlado con el dedo que interrumpe el partido y cuyo resultado se devuelve al motor.
- **Rasgo:** etiqueta de personalidad adquirida por decisiones repetidas.
- **Vertical slice:** pequeña parte del juego terminada de principio a fin con calidad final.
- **ADR:** registro de una decisión de arquitectura.
- **RNG con semilla:** generador aleatorio reproducible.
