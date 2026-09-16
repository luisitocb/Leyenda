# Leyenda: De Crack a Míster

Juego móvil de fútbol donde vives una carrera completa: desde jugador profesional hasta entrenador de leyenda.

## 🎯 Estado del Proyecto

**Fase actual:** 0 - Fundamentos (en progreso)

### Completado

- ✅ Monorepo con pnpm + Turborepo
- ✅ TypeScript estricto configurado
- ✅ ESLint + Prettier
- ✅ Package `@leyenda/shared` con tipos base
- ✅ Package `@leyenda/engine` con RNG determinista
- ✅ Package `@leyenda/content` con schemas Zod
- ✅ Pruebas con Vitest (engine)
- ✅ Repositorio en GitHub

### En progreso

- 🚧 App Expo con Expo Router
- 🚧 GitHub Actions CI
- 🚧 Configuración de Claude Code (subagentes y skills)

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
│   └── mobile/              # App Expo (próximamente)
├── packages/
│   ├── shared/              # Tipos compartidos
│   ├── engine/              # Motor de simulación puro
│   └── content/             # Eventos y traducciones
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
pnpm dev              # Iniciar app en modo desarrollo (cuando esté lista)
pnpm test             # Ejecutar todas las pruebas
pnpm typecheck        # Verificar tipos en todos los packages
pnpm lint             # Ejecutar linter
pnpm format           # Formatear código con Prettier
pnpm content:validate # Validar eventos y traducciones
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

## 📱 Desarrollo Móvil (próximamente)

Para desarrollar la app móvil necesitarás:

- **Android Studio** (para emulador Android)
- O un **dispositivo físico** (Android o iPhone)
- **Cuenta de Expo** (gratis) - [expo.dev](https://expo.dev)

### iOS sin Mac

Puedes compilar para iOS usando **EAS Build** en la nube, sin necesidad de Mac.

## 📚 Documentación

- **[GDD.md](docs/GDD.md)** - Game Design Document completo
- **[CLAUDE.md](CLAUDE.md)** - Reglas y convenciones del proyecto
- **[ADRs](docs/adr/)** - Decisiones de arquitectura (próximamente)

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
