# Segunda iteración local de la escena Phaser

Rama: `feat/phaser-combat-iteration-2`. Base de primera entrega conservada en `c5637d5` sobre `feat/illustrated-phaser-reference`. No cambia `main`, legacy, servidor, contratos de lobby ni campañas.

## Plan presentado antes de editar

1. Rutas alrededor de obstáculos; fases de persecución, preparación, golpe, recuperación, impacto y muerte. Caminante rápido y pesado de golpe amplio, lento y evitable. Extremidades animadas y contacto con suelo.
2. Puntos definidos de aparición en bordes, callejones y puertas; validación de cámara, distancia, obstáculos y ocupación. Cola de solicitudes reutilizable por un futuro director de hordas.
3. Un fusil personal con selección automática sin clic y apuntado manual con clic. Cooldown, cargador, recarga, daño y modificadores compartidos, sin duplicar balas al alternar. Retirar únicamente el dron de la escena; conservar su asset.
4. Rótulos dentro de sus placas, cornisas detrás de texto y variedad en las cuatro fachadas existentes. Build, suite existente, E2E nuevas, mediciones reproducibles, secuencias y video con reloj real.

## Problemas reproducidos y cambios

**Antes:** mantener clic generaba dos proyectiles en el primer tick: `manualShots=1`, `autoShots=1`. Un caminante en (1100,910), persiguiendo a un jugador en (1100,1200), quedaba en Y=950.7 al norte del coche, sin daño después de diez segundos. Los rótulos eran dibujados antes de una cornisa que cruzaba su línea de texto. La animación desplazaba arriba/abajo todo el sprite, sin marcha de piernas ni cadáver.

**Ahora:** reglas en TypeScript independiente de Phaser; datos en `src/content/`, geometría, navegación y apariciones en módulos separados de `src/simulation/`. La escena y `EnemyActor` representan estados serializables y no deciden daño.

- Navegación mediante grafo de esquinas con obstáculos expandidos por el radio de cada tipo, comprobación continua de segmentos y rutas recalculadas cada 0.45 s o ante desplazamiento del objetivo. Colisiones por subpasos de seis unidades. Separación suave entre infectados; no es simulación rígida de multitudes. Se corrigió durante las pruebas una salida prematura de la esquina que atascaba al pesado.
- Caminante: 88 u/s, 60 HP, golpe de 12, preparación 0.32 s, golpe 0.16 s, recuperación 0.65 s. Sus impactos interrumpen la preparación.
- Pesado: 56 u/s, 156 HP, golpe de 28, preparación 0.9 s, golpe 0.24 s, recuperación 1.3 s; mayor arco/alcance. Fija dirección al preparar, se puede esquivar y conserva preparación al recibir balas. No rompe barricadas en esta entrega.
- Daño una sola vez al iniciar el golpe, con alcance, sector, línea libre e invulnerabilidad validados. Estados explícitos `emerging/chasing/windup/strike/recover/hit/dying`. Los cadáveres duran 1.1 s y no cuentan como objetivos ni enemigos activos.
- Diez puntos de aparición. Bordes/callejones se rechazan dentro del rectángulo de cámara ampliado 80 unidades. Toda aparición exige distancia de 300–1600 unidades, espacio libre y ausencia de otro infectado próximo. Las puertas visibles son la excepción justificada: aviso, puerta abierta y animación de 1.3 s antes de poder combatir. No aparecen atacando de inmediato. Hay cinco residentes visibles al cargar el distrito; no se crean durante la partida.
- `SpawnDirector.enqueue()` recibe intención de tipo/punto y aplaza si no hay sitio válido; cola acotada a 32 y máximo 18 activos. Primer pedido natural a los tres segundos; después cada 1.5 s. No incluye oleadas, economía ni campaña.
- Un fusil: 26 de daño, intervalo 0.28 s, velocidad 900 u/s, alcance 760. Automático busca al enemigo más cercano con línea de tiro hasta 460 u; clic dirige al cursor. Cargador compartido de diez, recarga automática de 1.5 s, reserva ilimitada para la demo. Cambiar de modo no reinicia cooldown ni recarga. `upgradeWeapon()` modifica una única instancia; no existe aún selector de mejoras/XP. Los valores sustituyen expresamente el esquema anterior 26/0.14 + 16/0.65 de dos armas.
- Brazos y piernas separados, botas apoyadas y ciclo de marcha ligado al desplazamiento; caída y desvanecimiento. Se conserva el estilo SVG ilustrado original. Botica con cruz/equipo de refrigeración, radio con antena/plato, almacén con claraboyas/persianas y taller con paneles/herramientas. Rótulos encima de la cornisa y sin obstrucción de tuberías. Puertas de aparición no son transiciones para el jugador.

## Pruebas y artefactos

```sh
npm run dev
# http://127.0.0.1:5173/phaser/
npm run art:reference
npm run build
npm test
npm run measure:reference
npm run record:reference
```

En PowerShell se puede usar `npm.cmd` y `npx.cmd`. Las mediciones/video deben ejecutarse después de `npm test`, que limpia `test-results/`. El grabador usa el servidor de desarrollo 5173; las E2E mantienen servidores exclusivos 4173/2567.

Escenarios fijos accesibles **solo en Vite DEV** mediante `?scenario=contact-walker`, `contact-brute`, `navigation`, `cadence` o `door`, con `&seed=101` opcional. Son fixtures de contenido, no un API para modificar posiciones/HP desde el navegador. `cadence` usa un objetivo con 10000 HP para medir disparos continuos; no representa balance. La ruta normal siempre utiliza `district`; producción ignora estos parámetros y no expone el snapshot de diagnóstico.

Validación realizada:

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | Correcto. Chunk Phaser optativo: 1.238 MB / 343.02 kB gzip; conserva el aviso de tamaño de Vite. |
| `npm test` | 8 pruebas de simulación, 16 de servidor y 40 casos Playwright correctos, con 38 casos normales y dos fallos esperados legacy. Cero inesperados, omitidos o intermitentes en esta ejecución. Duración de las E2E: 214.57 s en este entorno. |
| E2E nuevas | Contacto/daño/recuperación de ambos tipos, rodeo del coche y colisión, puerta con aviso/salida, puntos naturales válidos y fuera de cámara, alternancia de modo con cargador/cooldown compartidos, recarga, impacto/caída/cadáver. |
| Revisión posterior de caída | La captura reveló una silueta demasiado comprimida. Se ajustaron pivote y sombra, se repitieron build y el caso de cadáver: 1/1 correcto. El informe completo se conserva; la repetición usa salida `test-results/final-corpse` y reporter line. |
| Partida real con Playwright | Chromium sin reloj simulado ni mutación de estado: 6.47 s de simulación observada, movimiento, dash, 4 disparos manuales + 15 automáticos = 19 del fusil, una recarga y cuatro bajas. Sin errores JavaScript/consola/HTTP. Video de 15.4 s a 1280 × 720; incluye carga y tiempos de capturas. Se revisaron fotogramas del video y fotografías de esa sesión. No es un benchmark de FPS. |
| Mediciones | Treinta partidas simuladas, JSON con reglas/semillas/resultados; segunda ejecución reproduce las mismas cifras de la tabla inferior. |
| Conservación | SHA-256 legacy `755EF02AD5D1BE67473C5EA2D1DC883CC9148950288E66E24CB4F019706B7D31` idéntico. Sin cambios de código en `server/`/`shared/`. `main` conserva `9b0a6e8afb0af7f4014829c01e99cf59ea088925`. |

Evidencia local, regenerable y excluida de Git:

- [Video de partida real](../test-results/reference-iteration-2/partida-real.webm) y [snapshots/estadísticas de la sesión](../test-results/reference-iteration-2/real-session.json).
- [Luz tenue](../test-results/reference-iteration-2/tenue.png), [diurna](../test-results/reference-iteration-2/diurna.png), [combate](../test-results/reference-iteration-2/combate.png) y [fachadas sur](../test-results/reference-iteration-2/fachadas-sur.png).
- [Salida de puerta](../test-results/reference-iteration-2/puerta.png), [golpe del pesado](../test-results/reference-iteration-2/golpe-pesado.png), [navegación](../test-results/reference-iteration-2/navegacion.png) y [cadáver corregido](../test-results/reference-iteration-2/cadaver.png).
- Secuencias completas de preparación/golpe/recuperación, puerta y muerte en [informe Playwright](../playwright-report/index.html); [resumen de la suite completa](../test-results/report.json). La captura corregida de cadáver está en `test-results/final-corpse/`.
- [Mediciones reproducibles](../test-results/reference-iteration-2/difficulty.json).

Revisión visual propia: rótulos limpios, diferencias de silueta y pisada visibles, una única arma orientándose entre automático y manual, arco anunciado antes del daño, salida reconocible desde el umbral y muerte que permanece antes de desaparecer. La pose de ataque y caída sigue siendo animación de capas, pendiente de aprobación jugable/artística. Se revisaron también capturas a 1280 × 720, 1920 × 1080, 2560 × 1440 y 390 × 844; no se afirma soporte táctil.

## Medición de dificultad

`scripts/measure-reference.ts` simula 60 s a 60 ticks/s con diez semillas por política (101,202,…,1010); registra reglas, comandos de política, daño previo a curación (no hay curas), primer daño, bajas, disparos, apariciones, pico de enemigos a 360 u y muestras cada diez segundos. No usa telemetría externa ni mide FPS. El JSON completo queda en `test-results/reference-iteration-2/difficulty.json`.

Una primera pasada con pedidos cada 2.8 s permitió sobrevivir inmóvil con automático en las diez semillas: daño medio 28 y pico cercano 4. Se cambió solo el intervalo de pedidos a 1.5 s y se repitieron las mismas políticas/semillas:

| Política de comandos | Muertes / 10 | Supervivencia media, truncada a 60 s | Daño recibido medio | Pico cercano medio | Bajas medias |
| --- | --- | --- | --- | --- | --- |
| Quieto, automático | 9 | 46.22 s | 94 | 5.5 | 23.7 |
| Quieto, clic dirigido lejos | 10 | 8.63 s | 100 | 5.3 | 0 |
| Ruta evasiva fija, disparo manual al más cercano, dash defensivo | 0 | 60 s | 0 | 6.9 | 32 |

Esto demuestra daño y presión sin que automático garantice supervivencia inmóvil. La ruta evasiva todavía resulta segura durante un minuto; no demuestra balance final ni dificultad para un jugador experto. Las medias de supervivencia con partidas que llegan al límite están censuradas, no son tiempo esperado hasta morir. Son políticas automáticas reproducibles en simulación, no treinta partidas humanas ni un A/B con el legacy. Se necesita revisión jugable y sesiones largas antes de ampliar balance o progresión.

## Límites y revisión requerida

No hay direcciones dibujadas completas, audio de ataques, animación esquelética avanzada, transiciones de jugador, XP, oleadas completas, red de combate ni campañas. Las manos/cuerpos siguen siendo una propuesta de arte por capas. Navegación validada sobre el mapa rectangular actual; futuros obstáculos móviles/reconstrucción necesitarán invalidar el grafo. La separación de multitudes es suave y puede haber solapamiento bajo aglomeración. Iluminación por composición 2D, sin sombras físicas.

Quedan sin verificar Firefox/WebKit, renderer Canvas alternativo, dispositivos físicos, FPS/memoria, partidas largas y progresión. Los dos defectos esperados legacy y su prueba intermitente de apariciones no se dan por corregidos. No se ha conectado combate multijugador.

Al concluir se detiene esta iteración para revisar persecución, anticipación del pesado, sensación de pisada, cadencia/recarga, salida de puertas, rótulos y legibilidad. No se amplían mapas ni campañas sin la siguiente revisión humana.
