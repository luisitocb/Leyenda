# Event Authoring

Guía para escribir eventos del juego "Leyenda".

## Estructura de un Evento

```yaml
id: unique_event_id # Único, snake_case
category: social # social, professional, family, financial, health, media
weight: 5 # 1-10 (probabilidad relativa)
cooldownWeeks: 15 # Semanas antes de poder repetir
conditions: # Condiciones para que aparezca
  - field: phase
    value: player
  - field: stat.energy
    operator: gte
    value: 1
text: events.event_id.text # Clave i18n
choices: # 2-4 opciones
  - id: choice1
    text: events.event_id.choice1
    effects: [...]
  - id: choice2
    text: events.event_id.choice2
    check: { ... }
    onSuccess: [...]
    onFail: [...]
```

## Categorías

### social

Fiestas, amistades, relaciones con compañeros

**Targets comunes:**

- `relation.squad` (-10 a +10)
- `state.form` (-15 a +5)
- `state.mentalHealth` (-10 a +10)
- `personality.professionalism` (+1 a +3)

### professional

Entrenamiento, ofertas, negociaciones, prensa

**Targets comunes:**

- `relation.coach` (-15 a +15)
- `relation.press` (-10 a +10)
- `relation.board` (-20 a +20)
- `personality.ego` (-5 a +5)

### family

Pareja, hijos, padres, amigos cercanos

**Targets comunes:**

- `relation.partner` (-20 a +20)
- `relation.family` (-15 a +15)
- `state.mentalHealth` (-15 a +15)
- `state.energy` (-10 a +10)

### financial

Inversiones, negocios, patrocinios, compras

**Targets comunes:**

- `state.money` (-50000 a +50000)
- `state.assets` (+valor de la compra)
- `relation.sponsors` (-10 a +10)

### health

Lesiones, nutrición, psicólogo, fisio

**Targets comunes:**

- `state.health` (-30 a +20)
- `state.fitness` (-20 a +15)
- `state.form` (-10 a +10)

### media

Entrevistas, redes sociales, polémicas

**Targets comunes:**

- `relation.press` (-20 a +20)
- `relation.fans` (-15 a +15)
- `personality.charisma` (+1 a +3)

## Condiciones

```yaml
conditions:
  # Fase del juego
  - field: phase
    value: player # o manager

  # Estadísticas
  - field: stat.energy
    operator: gte
    value: 1

  # Relaciones
  - field: relation.coach
    operator: lt
    value: 30

  # Próximo partido
  - field: nextMatch.isDerby
    value: true

  # Rasgos
  - field: trait
    value: partyAnimal

  # Edad
  - field: age
    operator: gte
    value: 30
```

**Operadores:** `eq`, `neq`, `gt`, `gte`, `lt`, `lte`

## Efectos

```yaml
effects:
  # Relación
  - target: relation.squad
    value: 8

  # Estado
  - target: state.form
    value: -10

  # Personalidad (cambio permanente, usar con cuidado)
  - target: personality.professionalism
    value: 2

  # Dinero
  - target: state.money
    value: 5000

  # Añadir rasgo
  - target: traits
    value: add:partyAnimal

  # Eliminar rasgo
  - target: traits
    value: remove:controversial
```

## Chequeos de Atributo

```yaml
choices:
  - id: convince
    text: events.sponsor_negotiation.convince
    check:
      attribute: charisma
      difficulty: 65
    onSuccess:
      - target: state.money
        value: 10000
      - target: relation.sponsors
        value: 15
    onFail:
      - target: relation.sponsors
        value: -5
```

**Dificultades orientativas:**

- 30-40: Fácil (80%+ de probabilidad)
- 50-60: Media (60-70%)
- 70-80: Difícil (40-50%)
- 85+: Muy difícil (20-30%)

## Eventos Diferidos

```yaml
delayed:
  - weeks: 2
    chance:
      base: 0.4 # 40% base
      modifier: '-trait.discreet*0.2' # -20% si tiene el rasgo
    trigger: paparazzi_photo
```

**Usos:**

- Consecuencias de fiestas (foto en prensa)
- Lesiones que se agravan
- Inversiones que dan frutos
- Rumores que se hacen realidad

## Textos (i18n)

```json
// locales/es/events.json
{
  "sponsor_offer": {
    "text": "Una marca de bebidas deportivas te ofrece un contrato de patrocinio por 15.000€. Tu agente te advierte que tu actual patrocinador puede molestarse.",
    "accept": "Aceptar (riesgo de perder patrocinador actual)",
    "decline": "Rechazar",
    "negotiate": "Negociar mejores términos"
  }
}

// locales/en/events.json
{
  "sponsor_offer": {
    "text": "A sports drink brand offers you a sponsorship deal for €15,000. Your agent warns that your current sponsor might get upset.",
    "accept": "Accept (risk losing current sponsor)",
    "decline": "Decline",
    "negotiate": "Negotiate better terms"
  }
}
```

## Balanceo de Valores

**Relaciones** (-100 a +100):

- Cambio pequeño: ±3 a ±5
- Cambio medio: ±8 a ±12
- Cambio grande: ±15 a ±20
- Cambio muy grande: ±25+ (raro, solo eventos críticos)

**Estados** (0-99 o 0-100):

- Cambio pequeño: ±5
- Cambio medio: ±10 a ±15
- Cambio grande: ±20+

**Personalidad** (cambio permanente, usar con moderación):

- Cambio típico: +1 a +3
- Nunca cambios negativos grandes (rompe el personaje)

**Dinero:**

- Ganancias pequeñas: 1.000-5.000€
- Ganancias medias: 10.000-25.000€
- Ganancias grandes: 50.000€+
- Pérdidas: evitar bancarrotas

## Ejemplos Completos

Ver `packages/content/events/player/` para ejemplos reales (cuando se añadan).

## Comandos

```bash
# Validar todos los eventos
pnpm content:validate

# Validar uno específico
tsx packages/content/src/validate.ts events/player/mi-evento.yaml
```

## Checklist

Antes de añadir un evento:

- [ ] ID único y descriptivo
- [ ] Categoría correcta
- [ ] Weight razonable (3-7 típico)
- [ ] Cooldown suficiente (10-20 semanas)
- [ ] Condiciones precisas (no aparece cuando no debe)
- [ ] 2-4 opciones (no más)
- [ ] Textos en es/ y en/
- [ ] Valores balanceados
- [ ] Validación pasa: `pnpm content:validate`
