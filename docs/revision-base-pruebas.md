# Preparar base Playwright del prototipo y diagnóstico de migración

La suite anterior solo abría la portada; las mecánicas del prototipo no tenían cobertura y el build fallaba por falta de tipos de Node. Esta rama conserva el HTML jugable original y añade pruebas de Chromium que ejercitan inicio, movimiento, disparo, dash, pausa, combate, suministros, victoria, derrota, reinicio y progresión, además de diagnóstico visual y plan gradual para Phaser/TypeScript.

## Cambios para revisar

- `public/legacy/index.html`: se incorpora el archivo original encontrado sin seguimiento, sin editarlo; su hash figura en el diagnóstico.
- Dependencias: `@types/node` y `package-lock.json`; instalación de CI mediante `npm ci`.
- Playwright: Chromium explícito, servidor propio en 4173, dos workers, listeners de errores, reloj controlado y smoke con tiempo real. Los tests no requieren Internet para fuentes y no añaden API de prueba al juego.
- Artefactos por test: PNG y estado JSON; informe HTML y resumen JSON. La CI conserva imágenes, trazas e informes.
- [Diagnóstico técnico](diagnostico-legacy.md) y [plan de migración](migracion-phaser.md) con criterios de aceptación y separación entre evidencia y pendientes.

## Validación realizada

| Comando / acción | Resultado |
| --- | --- |
| Pruebas originales, antes de editar | 2/2 pasaron; Chromium disponible. Solo cubrían portada. |
| Build inicial | TS2580 en configuración de Playwright; corregido añadiendo tipos de Node. |
| `npm run build` final | Correcto; también existe `dist/legacy/index.html`. |
| `npm test` ampliado | 24 verificaciones normales y 2 fallos esperados; cero fallos inesperados. |
| `npm test -- --repeat-each=3` final | 72 verificaciones normales y 6 fallos esperados, en 89,4 s; cero fallos inesperados, omitidos o intermitentes. |
| Chromium 156.0.8078.4 | Canvas, controles reales y misión completa comprobados. Un smoke confirma avance del tiempo sin reloj simulado. |
| `npm ci` en carpeta temporal limpia | Correcto con el lockfile. En el workspace, Vite mantenía binarios bloqueados; se restauró con `npm install`. |
| Capturas | Revisadas visualmente a 1280×720, 390×844 y 2560×1440; las fuentes son las reservas locales del CSS original. |

Playwright muestra «78 passed» porque contabiliza los fallos esperados como resultados correctos. Dos defectos siguen abiertos: DZO-001 (selector vacío cuando todas las mejoras están al máximo) y DZO-002 (mundo más pequeño que QHD). Ambos se reproducen con `test.fail`; no están corregidos ni omitidos.

## Evidencia local

Las carpetas cambian al renombrar tests; el informe HTML mantiene los adjuntos junto a cada prueba. Los siguientes archivos corresponden a la última ejecución de esta sesión y no están versionados:

- [Informe HTML](../playwright-report/index.html) y [resumen JSON](../test-results/report.json).
- [Inicio de misión](../test-results/legacy-Chromium-dibuja-el-menú-e-inicia-una-misión-real-chromium/mission-start.png).
- [Disparo en movimiento](../test-results/legacy-apunta-y-mantiene-d-1ea01-soltar-detiene-los-disparos-chromium/manual-fire-moving.png).
- [Dash](../test-results/legacy-dash-con-Space-desp-10509-invulnerabilidad-y-cooldown-chromium/dash.png).
- [Partida a 20 segundos](../test-results/legacy-partida-de-20-segun-66046-ural-de-enemigos-y-capturas-chromium/natural-play-20s.png) y [su estado](../test-results/legacy-partida-de-20-segun-66046-ural-de-enemigos-y-capturas-chromium/natural-play-20s-state.json).
- [Acceso a evacuación](../test-results/legacy-completa-las-tres-c-8a28b-rriendo-el-mapa-con-teclado-chromium/evacuation-approach.png).
- [HUD estrecho](../test-results/legacy-diagnostics-documen-cbcc2--sin-afirmar-soporte-táctil-chromium/narrow-ui.png) y [mapa QHD](../test-results/legacy-diagnostics-defecto-ecfc4-rar-también-una-ventana-QHD-chromium/qhd-map-known-bug.png).

## Límites y revisión pendiente

Las pruebas controladas de daño/mejoras preparan objetivos o XP; no certifican balance ni progresión orgánica. Falta medir partidas largas tras varias subidas de nivel, láser/perforación en cadena, ráfaga temporal, rendimiento real, otros navegadores y CI remota. La revisión de capturas identifica problemas; no aprueba el arte actual como definitivo.

El plan propone contratos y simulación TypeScript sin DOM, cliente Phaser paralelo, paridad de controles/combate/misión, arte original, medición de dificultad y posterior transporte Colyseus. No se reemplaza el juego ni se añade red en esta entrega.

Rama local: `test/legacy-playwright-baseline`. Cambios preparados para revisión local, sin merge en `main` ni publicación de PR remota. La identidad Git local no está configurada; no se inventa un autor para crear un commit. El texto de este archivo sirve como descripción propuesta de la PR.
