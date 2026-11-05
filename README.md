# Leyenda: De Crack a Míster

Juego móvil de fútbol donde vives una carrera completa: desde jugador profesional hasta entrenador de leyenda.

## 🎯 Estado del Proyecto

Una vida deportiva completa es jugable de principio a fin: **crear personaje → carrera de jugador (temporada tras temporada, con ascensos y descensos) → retirada y Legado → carrera de entrenador → jubilación → puntuación final y Salón de la Fama**.

### Completado

- ✅ **Fase 0 — Fundamentos:** monorepo pnpm + Turborepo, TypeScript estricto, CI, Expo + Expo Router, SQLite + Drizzle con migraciones, design system básico.
- ✅ **Fase 0.5 — Prototipo de Jugadas en Vivo:** penalti y ocasión de gol con gestos (Skia + Gesture Handler).
- ✅ **Fase 1 — Mundo y motor:** worldgen (países ficticios + España, Inglaterra, Italia, Alemania y Francia con clubes reales, ADR-004), calendario, motor de partidos y `balance-sim`.
- ✅ **Fase 2 y 3 — Modo Jugador completo:** creación de personaje, ciclo semanal, 200 eventos de decisión, momentos clave, Jugadas en Vivo, contratos, fichajes, lesiones, selección, pareja, patrimonio, marcas, declive y retirada.
- ✅ **Temporadas sucesivas** (ADR-005): calendario anual agosto-mayo con pretemporada, ascensos/descensos e historial de campeones.
- ✅ **Fase 4 — Modo Entrenador (versión base):** ofertas de trabajo y entrevista con la directiva, plantilla, tácticas (5 formaciones × 3 mentalidades), entrenamiento semanal, cantera, envejecimiento y retiradas, directiva con objetivos, ultimátum y despidos, ruedas de prensa, Jugada en Vivo simplificada, historial.
- ✅ **Cierre del ciclo:** puntuación final, Salón de la Fama y menú principal con "Continuar".

### Pendiente

- 🚧 Jugadas en Vivo de equipo completo y selección nacional como entrenador (resto de Fase 4).
- 🚧 Fase 5: mercado de fichajes, ojeadores y niebla de guerra, finanzas, regeneración del mundo.
- 🚧 Fase 6: logros, tutorial, i18n en/es (los textos siguen en el código), sonido y animaciones.
- 🚧 Fases 7-9: cuentas, nube, compras, anuncios y publicación (requieren cuentas de Supabase, RevenueCat, AdMob y de las tiendas).

## 📋 Prerrequisitos

Antes de empezar, asegúrate de tener instalado:

- **Node.js** LTS (v20+) - [Descargar](https://nodejs.org/)
- **pnpm** - Gestor de paquetes
- **Git** - Control de versiones
- **Expo CLI** - Para desarrollo móvil

### Instalación de herramientas

```bash
# Verificar Node.js
node -v  # Debe ser v20 o superior

# Instalar pnpm globalmente
npm install -g pnpm

# Instalar Expo CLI y EAS CLI
npm install -g expo-cli eas-cli

# Verificar instalaciones
pnpm -v
expo --version
eas --version
```

## 🚀 Setup Inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/luisitocb/Leyenda.git
cd leyenda
```

### 2. Instalar dependencias

```bash
# Instalar todas las dependencias del monorepo
pnpm install
```

### 3. Verificar que todo funciona

```bash
# Verificar tipos en todos los packages
pnpm typecheck

# Ejecutar linter
pnpm lint

# Ejecutar pruebas del engine
pnpm test

# Validar contenido
pnpm content:validate
```

Si todos los comandos pasan sin errores, ¡el setup está completo!

## 📁 Estructura del Proyecto

```
leyenda/
├── apps/
│   └── mobile/              # App Expo (Expo Router, SQLite + Drizzle)
├── packages/
│   ├── shared/              # Tipos compartidos
│   ├── engine/              # Motor de simulación puro
│   ├── worldgen/            # Generador procedural del mundo
│   ├── balance-sim/         # Simulador de balanceo
│   └── content/             # Eventos, ruedas de prensa y datos del mundo
├── docs/
│   ├── GDD.md               # Game Design Document
│   ├── adr/                 # Architecture Decision Records
│   └── backlog/             # Historias de usuario
├── CLAUDE.md                # Reglas para Claude Code
└── README.md                # Este archivo
```

## 🧪 Comandos Disponibles

### Root (desde la raíz del proyecto)

```bash
pnpm dev              # Iniciar app en modo desarrollo
pnpm test             # Ejecutar todas las pruebas
pnpm typecheck        # Verificar tipos en todos los packages
pnpm lint             # Ejecutar linter
pnpm format           # Formatear código con Prettier
pnpm content:validate # Validar eventos y contenido
pnpm balance          # Simulación masiva de balanceo (--quick para la versión corta)
pnpm clean            # Limpiar build artifacts
```

### Engine

```bash
cd packages/engine
pnpm test            # Ejecutar pruebas
pnpm test:watch      # Ejecutar pruebas en modo watch
pnpm test:coverage   # Generar reporte de cobertura
```

## 🔧 Desarrollo

### Reglas Importantes

1. **Código en inglés**, documentación en español
2. **Sin `any`** en TypeScript
3. **Nunca usar `Math.random()`** - usar el RNG del engine
4. **Pruebas primero** para lógica del motor
5. **Commits con Conventional Commits**: `feat:`, `fix:`, `docs:`, etc.

### Flujo de Trabajo

1. Crear rama: `git checkout -b feat/mi-feature`
2. Desarrollar con pruebas
3. Verificar: `pnpm typecheck && pnpm lint && pnpm test`
4. Commit: `git commit -m "feat: descripción"`
5. Push y crear PR

## 📱 Desarrollo Móvil

Para desarrollar la app móvil necesitarás:

- **Android Studio** (para emulador Android)
- O un **dispositivo físico** (Android o iPhone)
- **Cuenta de Expo** (gratis) - [expo.dev](https://expo.dev)

### iOS sin Mac

Puedes compilar para iOS usando **EAS Build** en la nube, sin necesidad de Mac.

## 📚 Documentación

- **[GDD.md](docs/GDD.md)** - Game Design Document completo
- **[CLAUDE.md](CLAUDE.md)** - Reglas y convenciones del proyecto
- **[ADRs](docs/adr/)** - Decisiones de arquitectura

## 🎮 Sobre el Juego

"Leyenda" es un juego móvil donde vives una vida completa en el fútbol:

1. **Modo Jugador** (15-22 años): Decisiones que afectan tu carrera, atributos, relaciones
2. **Jugadas en Vivo**: Control táctil en momentos clave (penaltis, ocasiones)
3. **Transición**: Tu legado como jugador afecta tu inicio como entrenador
4. **Modo Entrenador**: Gestión completa de club, tácticas, fichajes, ojeadores

### Pilares de Diseño

- Decisiones con consecuencias visibles
- Ritmo ágil (una temporada en minutos)
- Profundidad opcional para expertos
- Habilidad + atributos (no solo suerte)
- Justo con usuarios gratuitos

## 🤝 Contribución

Este es un proyecto personal, pero las sugerencias son bienvenidas.

## 📄 Licencia

Código propietario - no distribuir sin permiso.

---

**Desarrollado con Claude Code** 🤖
