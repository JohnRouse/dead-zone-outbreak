# Referencia urbana ilustrada · etapa 1

Rama: `feat/illustrated-phaser-reference`, derivada de `feat/colyseus-character-lobby`. Escena local optativa en `/phaser/`. No promociona Phaser a juego principal, no edita el legacy ni integra combate Colyseus. Dirección artística pendiente de revisión humana.

## Plan presentado antes de implementar

1. **Esta entrega:** una calle húmeda original, sombras frías, luz ámbar, soldado animado por capas, caminantes y pesados con siluetas diferentes. Cámara intermedia, mundo mayor que pantalla y controles híbridos conservados. Build, regresiones, pruebas nuevas y tres capturas revisadas.
2. **Solo tras aprobación visual:** refinar animación y navegación; una transición interior/exterior conservando inputs e identidad. No existe en esta etapa: la puerta de la botica es una puerta cerrada dentro de una fachada sólida.
3. **Después:** un primer bucle corto de supervivencia; campañas y cooperación autoritativa por entregas propias.

La biblia prevalece sobre indicaciones antiguas de escala entera, redondeo y pixel art del documento de migración. No se pretende cumplir aquí la salida completa del vertical slice: falta explícitamente el interior transitable y la paridad de progresión/misión.

## Implementación y límites

- `src/core/reference.ts`: comandos y snapshots serializables por IDs.
- `src/content/reference-district.ts`: mapa 2800 × 2100, huellas sólidas, farolas, armas y enemigos.
- `src/simulation/reference.ts`: reloj consumido a 60 ticks/s, RNG con semilla para aparición, movimiento normalizado, colisiones con subpasos, dash, proyectiles, daño, anticipación de ataques, pausa y derrota. No depende de Phaser ni DOM.
- `src/client/input/`: teclado/mouse a comandos, limpieza al perder foco y bloqueo con modal.
- `src/client/phaser/`: carga SVG, cámara suave, personajes por capas, efectos breves y luces locales. Renderiza reglas, no calcula daño.
- `src/client/reference-demo.ts`: HUD DOM, entrada, pausa, reinicio y cambio diurno/tenue para comparación visual. Sin audio.
- `scripts/reference-art.ts` y `public/assets/`: diez SVG originales reproducibles; procedencia, anclajes y cuerpos en el manifiesto.

Velocidad 230 u/s, dash ×3.9 durante 0.19 s y recuperación 3.3 s; daño manual 26/cadencia 0.14 s y automático 16/0.65 s como referencia inicial del legacy. Ajustes exclusivos de la demo: alcance manual 760, munición automática 360, cuerpo de caminante R19 y pesado R29 para las nuevas siluetas, cinco infectados iniciales, apariciones posteriores acotadas, anticipación de golpe de 0.4 s. **No constituyen un balance aprobado.** No hay XP, curas, mejoras ni victoria en esta escena; continúan disponibles en el prototipo conservado.

El tamaño lógico del mundo es independiente del navegador. Campo vertical de cámara: 900 unidades; a 1920 × 1080 zoom=1.2, conservando una escala de personaje intermedia. Son valores para revisión, no decisiones definitivas. El formato estrecho conserva un HUD visible para teclado/mouse; no incorpora controles táctiles. Iluminación eficiente por composición 2D con ruta Canvas de Phaser AUTO como alternativa, pendiente de verificar separadamente.

El adaptador local ejecuta la simulación desde la escena con acumulador fijo y máximo seis pasos por frame. Al perder foco se pausa y se descartan entradas; no se intenta recuperar minutos de tiempo. Esto permite aislar reglas para el futuro, pero **no implementa un servidor autoritativo, sincronización ni reconciliación**. Los contratos del lobby `soldier/medic/mechanic/scout`, reservas y plazos no se modifican. El snapshot de diagnóstico es una copia de lectura habilitada únicamente en Vite DEV; no ofrece comandos para alterar estado.

## Ejecutar y revisar

```sh
npm run dev
# Abrir http://127.0.0.1:5173/phaser/
npm run art:reference
npm run build
npm test
# Solo la nueva ruta:
npx playwright test tests/phaser.spec.ts
```

En Windows se puede usar `npm.cmd`/`npx.cmd`. Playwright conserva sus servidores exclusivos en 4173/2567; no requiere servidores manuales. Capturas y snapshots adjuntos al informe en `test-results/`, regenerados por cada ejecución; no se versionan.

## Evidencia de verificación

Antes de editar: build correcto; 16 pruebas de servidor y 28 casos Playwright contabilizados como correctos, incluidos los dos fallos esperados DZO-001/DZO-002. La intermitencia natural de enemigos legacy descrita en `organizacion-entregas.md` no se reprodujo en esa ejecución y no se considera corregida.

Validación final realizada el 2026-10-17:

| Verificación | Resultado |
| --- | --- |
| `npm run build` | Correcto. Aviso de tamaño del chunk Phaser: 1.227 MB sin comprimir / 339.46 kB gzip, cargado al entrar a la ruta optativa. |
| `npm test` | Correcto: 4 pruebas de simulación, 16 de servidor y 34 casos Playwright; cero fallos inesperados. Playwright contabiliza 32 casos normales y los dos fallos esperados legacy. |
| Controles Phaser en navegador | Las ocho teclas de movimiento, diagonal normalizada, clic sostenido mientras se mueve, apuntado, apoyo automático que elimina sin clic, dash Espacio/Shift con recuperación, colisión contra fachada y seguimiento de cámara. |
| Ciclo local | Pausa congela reglas; P reanuda y devuelve el foco; perder foco pausa y limpia entradas; daño natural, derrota y reinicio comprobados. |
| Capturas | Luz tenue, diurna y combate a 1920 × 1080; adicionales a 1280 × 720, 2560 × 1440 y 390 × 844. Todas abiertas y revisadas visualmente. HUD visible sin desborde. |
| Conservación | Legacy SHA-256 `755EF02AD5D1BE67473C5EA2D1DC883CC9148950288E66E24CB4F019706B7D31`, idéntico antes/después. Sin cambios en `server/` ni `shared/`; `main` permanece en `9b0a6e8afb0af7f4014829c01e99cf59ea088925`. |

En la primera ejecución nueva se detectó y corrigió una suscripción a eventos antes de la inicialización de Phaser. La carga y recorridos WebGL simultáneos también excedieron el timeout corto de algunas pruebas: la nueva ruta ejecuta sus seis casos consecutivamente, con límite de 120 s y espera de carga acotada. Los recorridos de controles usan 960 × 540; las capturas conservan las cuatro resoluciones de revisión. No se silencian errores de consola/red ni se cambian expectativas legacy. La ejecución completa final tarda aproximadamente dos minutos en este entorno; **esto no es una medición de FPS**.

Evidencia de la ejecución local final (los archivos de `test-results/` se regeneran en la siguiente ejecución):

- [Luz tenue](../test-results/reference-review/01-luz-tenue.png), [luz diurna](../test-results/reference-review/02-luz-diurna.png) y [combate](../test-results/reference-review/03-combate.png): copias de las tres capturas finales para facilitar la revisión.
- [Informe Playwright](../playwright-report/index.html), con capturas originales y snapshots adjuntos a cada prueba; [resumen JSON](../test-results/report.json).

Revisión visual propia: contornos suaves sin pixelado, paleta petróleo/ámbar coherente, diferenciación de caminante y pesado por volumen, casco y postura, arma independiente legible y luces locales visibles sin ocultar enemigos. El superviviente es más compacto que el pesado; revisar con dirección su escala y la lectura de las botas sobre asfalto oscuro. Las animaciones son aún sencillas y no representan ocho direcciones completas. La escena se entrega como propuesta, **no como estética aprobada**.

Sin verificar: FPS/CPU/GPU en dispositivos físicos, balance de partidas largas o tras mejoras, equivalencia a 30/144 FPS, Firefox/WebKit, render Canvas alternativo, controles táctiles, transiciones, progresión y cooperación. Las colisiones E2E recorren una fachada; las huellas de coches/barricadas comparten datos y subpasos, pero no se ha ejercitado cada cara de cada objeto en navegador.

La aprobación solicitada al terminar esta etapa se limita a paleta, perspectiva, escala, siluetas y legibilidad de iluminación/HUD. Solo después se amplía animación y se conecta un interior.
