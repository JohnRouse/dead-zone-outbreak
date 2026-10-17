# DEAD ZONE: OUTBREAK

Juego de supervivencia zombi 2D para navegador, con combate híbrido (disparo manual + apoyo automático), movimiento libre y progresión por misiones. Objetivo futuro: cooperativo online de 1 a 4 jugadores.

## Estado

Repositorio inicializado para el desarrollo con Codex CLI y pruebas de navegador con Playwright. La versión HTML jugable v0.2 debe incorporarse en `legacy/index.html` como referencia antes de migrar su lógica por módulos.

## Desarrollo local

Requisitos: Node.js 20+ y Git.

```bash
npm install
npx playwright install chromium
npm run dev
```

Para iniciar Codex en la carpeta del proyecto:

```bash
codex
```

## Prioridades v0.3

1. Arte pixel art más reconocible, con personajes y zombis animados y escenarios urbanos coherentes.
2. Mundo más amplio, cámara que sigue al jugador, exploración y puntos de interés.
3. Escalado de dificultad real (hordas, enemigos especiales y control de mejoras).
4. Armas evolucionables inspiradas en juegos arcade: tiro triple, láser, ráfaga y munición perforante.
5. Misión por etapas con extracción, sin olvidar dash y disparo en movimiento.

## Calidad

`npm test` ejecuta pruebas Playwright. No se consideran verificadas las mecánicas sin test real de navegador y revisión humana.
