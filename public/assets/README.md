# Biblioteca original · referencia 03

La escena actual carga el conjunto `painted-v3`. La referencia 02 descrita más abajo se conserva íntegra. El conjunto nuevo combina tres PNG originales generados con la herramienta integrada imagegen y recursos nativos SVG/Phaser. [Prompts exactos y procedencia](../../docs/iteracion-3-prompts.md). La calidad artística sigue pendiente de revisión humana.

| Recurso actual | Fuente / resolución | Presentación y uso |
| --- | --- | --- |
| `characters/painted-v3/survivor-infected-atlas.png` | PNG RGBA 1254 × 1254 | Tres personajes con torso/cabeza, dos brazos y una pierna reutilizada. `atlas.json` define los doce recortes. No hay cambios de hitboxes. |
| `characters/painted-v3/rifle.svg` | SVG original 130 × 43 | Fusil y manos, 70 × 25 unidades de mundo, origen (.24,.5), Y=-30; orientación continua y retroceso en ambos modos. |
| `world/painted-v3/material-atlas.png` | PNG 1254 × 1254 | Cuatro materiales: asfalto, mampostería, chapa y hormigón. Original incrustado en patrones del SVG del distrito. |
| `world/painted-v3/props-atlas.png` | PNG RGBA 1254 × 1254 | Dos coches, una barricada y un arbusto. Recortes en `props-atlas.json`; las instancias mantienen huellas y posiciones anteriores. |
| `world/painted-v3/district.svg` | Composición SVG 2800 × 2100 | Originales PNG incrustados, fachadas y detalles SVG. Reutiliza la geometría de referencia 02; no añade mapa ni interiores. |
| `vfx/painted-v3/contact-shadow.svg` | SVG original 128 × 64 | Sombra radial suave anclada a pies/cadáveres. |
| `vfx/painted-v3/muzzle.svg` | SVG original 96 × 64 | Destello cálido de hasta 0.06 s, instanciado desde eventos del arma existente. |

Integración: `scripts/painted-reference-art.ts`, mediante `npm run art:reference`. Los PNG seleccionados se guardan sin retoque. `scripts/atlas-frames.mjs` calcula únicamente metadatos de alfa, con Vite en 5173. El atlas se copia sin reescalado a un respaldo de textura 2048 × 2048 en ejecución para permitir mipmaps y reducir ruido al alejarse. La cámara conserva escala, encuadre y seguimiento de la referencia 02.

Protagonista: torso 63 × 66, Y=-20, piernas 14 × 31; caminante: 49 × 62, Y=-18, piernas 13 × 29; pesado: 89 × 80, Y=-23, piernas 22 × 36. Brazos articulados y marcha con pies alternos; caída y salida por puertas mantienen los estados anteriores. Datos de presentación en `src/client/phaser/PaintedActor.ts`. Los círculos de colisión siguen siendo R17, R19 y R29.

Proyectil: cola exterior tenue de 26 u, núcleo de 18 u, punta luminosa y trazo fino. Impactos de hasta 0.18 s, cinco fragmentos en infectados o tres en superficies; destello del torso con alfa máximo .28. No añade proyectiles, daño, físicas ni partículas persistentes. Los materiales pintados y las luces dibujadas no constituyen iluminación física ni mapas de normales.

## Conjunto conservado · referencia 02

Arte SVG original creado para DEAD ZONE: OUTBREAK por Codex en este repositorio, 2026-10-17. Sin imágenes, sprites, fuentes ni trazados extraídos de juegos comerciales. Su uso sigue las condiciones del código del proyecto; no se declara una licencia de terceros ni una licencia nueva para el repositorio. La dirección visual está **pendiente de aprobación humana**.

Fuente editable y generador: `scripts/reference-art.ts`. Ejecutar `npm run art:reference`. Geometría de edificios, coches y barricadas compartida con `src/content/reference-district.ts`; regenerar el arte al editar esos datos. Versión del conjunto: `reference-02`. La primera versión está conservada en el commit `c5637d5`.

| Recurso | Origen / resolución | Anclaje / escala en mundo | Hitbox / uso |
| --- | --- | --- | --- |
| `world/district.svg` | SVG 2800 × 2100 | (0,0), 1:1 | Huellas rectangulares en `OBSTACLES`; pavimento, charcos, fachadas, puertas cerradas, coches, barricadas, plantas y farolas. |
| `characters/soldier-body.svg` | SVG 96 × 112 | centro inferior, escala 0.8; offset Y=12 | Círculo R=17 en los pies. Torso y brazos base. |
| `characters/soldier-head.svg` | SVG 96 × 112 | Igual al torso | Casco, visor, cara y pañuelo. |
| `characters/boot.svg` | SVG 30 × 35 | centro inferior; escala 0.58 | Dos instancias, marcha alternada. |
| `characters/rifle.svg` | SVG 88 × 40 | (0.24,0.5); escala 0.68 | Arma y manos; orientación continua y retroceso. |
| `characters/drone.svg` | SVG 56 × 46 | archivado, sin instancias | Se conserva el recurso de referencia 01. La escena 02 utiliza únicamente el fusil personal, según el cambio de diseño solicitado. |
| `enemies/walker.svg`, `brute.svg` | SVG 96 × 112 / 136 × 140 | fuentes completas | Se conservan como origen editable de las capas. La escena 02 carga las capas siguientes. |
| `enemies/walker-body.svg`, `brute-body.svg` | SVG 96 × 112 / 136 × 140 | centro inferior, escala .78, Y=7 | Torso/cabeza; círculos R19 y R29 en el suelo. |
| `enemies/walker-arm.svg`, `brute-arm.svg` | SVG 40 × 72 | pivote (0.5,0.08); escalas .68 / .88 | Dos brazos articulados para caminar, anticipar, golpear y recuperar. |
| `enemies/walker-leg.svg`, `brute-leg.svg` | SVG 34 × 43 | centro inferior, escala .78, pies Y=2 | Dos piernas, fase ligada a distancia recorrida; una bota permanece apoyada. |
| `world/door-exit.svg` | SVG 96 × 116 | centro inferior, escala .8, umbral del edificio | Puerta abierta durante la salida anunciada; visual sobre fachada. No habilita entrada del jugador. |
| `vfx/light.svg` | SVG 512 × 512 | centro | Gradiente radial ámbar con composición SCREEN; no afecta reglas. |
| `vfx/vignette.svg` | SVG 1600 × 900 | ajustado al viewport | Viñeta de atmósfera; no afecta visibilidad de reglas. |

Phaser rasteriza los SVG al cargar; antialias activado, pixelArt y roundPixels desactivados. Sin atlas: catorce texturas activas; las dos imágenes completas de infectados y el dron se conservan como fuente/archivo. Las sombras del suelo/edificios están dibujadas; luces locales y personajes se componen en ejecución. No hay normales, sombras físicas, lluvia simulada ni sistema de clima. Los rótulos se dibujan después de cornisas/tuberías y antes de la vegetación fuera de su área; no atraviesan el texto. Cada fachada tiene elementos originales distintos: cruz/refrigeración, antena/plato, claraboyas/persianas y paneles/herramientas.

Animación implementada: respiración y marcha del soldado, reflejo lateral según apuntado, un fusil independiente con retroceso en ambos modos, dash y respuesta a impactos. Infectados: piernas y brazos en marcha, preparación, golpe, recuperación, impacto, caída y desvanecimiento del cadáver. Sombras pegadas a pies; no se desplaza todo el infectado con un seno temporal. Puertas: señal previa, apertura y salida progresiva de 1.3 s. Los ataques muestran el sector de alcance real. Sigue pendiente un set dibujado completo de ocho direcciones, interacción, rescate y audio.
