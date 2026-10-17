# Biblioteca original · referencia 01

Arte SVG original creado para DEAD ZONE: OUTBREAK por Codex en este repositorio, 2026-10-17. Sin imágenes, sprites, fuentes ni trazados extraídos de juegos comerciales. Su uso sigue las condiciones del código del proyecto; no se declara una licencia de terceros ni una licencia nueva para el repositorio. La dirección visual está **pendiente de aprobación humana**.

Fuente editable y generador: `scripts/reference-art.ts`. Ejecutar `npm run art:reference`. Geometría de edificios, coches y barricadas compartida con `src/content/reference-district.ts`; regenerar el arte al editar esos datos. Versión del conjunto: `reference-01`.

| Recurso | Origen / resolución | Anclaje / escala en mundo | Hitbox / uso |
| --- | --- | --- | --- |
| `world/district.svg` | SVG 2800 × 2100 | (0,0), 1:1 | Huellas rectangulares en `OBSTACLES`; pavimento, charcos, fachadas, puertas cerradas, coches, barricadas, plantas y farolas. |
| `characters/soldier-body.svg` | SVG 96 × 112 | centro inferior, escala 0.8; offset Y=12 | Círculo R=17 en los pies. Torso y brazos base. |
| `characters/soldier-head.svg` | SVG 96 × 112 | Igual al torso | Casco, visor, cara y pañuelo. |
| `characters/boot.svg` | SVG 30 × 35 | centro inferior; escala 0.58 | Dos instancias, marcha alternada. |
| `characters/rifle.svg` | SVG 88 × 40 | (0.24,0.5); escala 0.68 | Arma y manos; orientación continua y retroceso. |
| `characters/drone.svg` | SVG 56 × 46 | centro; escala 0.75 | Representación del apoyo automático; sin cuerpo sólido. |
| `enemies/walker.svg` | SVG 96 × 112 | centro inferior; escala 0.78 | Círculo R=19; encorvado, ropa rota, manos y rostro infectado. |
| `enemies/brute.svg` | SVG 136 × 140 | centro inferior; escala 0.78 | Círculo R=29; hombros anchos, casco y chaleco de obra. |
| `vfx/light.svg` | SVG 512 × 512 | centro | Gradiente radial ámbar con composición SCREEN; no afecta reglas. |
| `vfx/vignette.svg` | SVG 1600 × 900 | ajustado al viewport | Viñeta de atmósfera; no afecta visibilidad de reglas. |

Phaser rasteriza los SVG al cargar; antialias activado, pixelArt y roundPixels desactivados. Sin atlas: diez texturas separadas en esta prueba pequeña. No ampliar el catálogo antes de la revisión visual. Las sombras del suelo/edificios están dibujadas; luces locales y personajes se componen en ejecución. No hay normales, sombras físicas, lluvia simulada ni sistema de clima.

Animación implementada: respiración, marcha de botas y torso, reflejo lateral según apuntado, arma independiente, retroceso, dash y respuesta a impactos; balanceo de infectados, anticipación circular antes del golpe. No es aún un set completo de ocho direcciones, interacción, caída y rescate.
