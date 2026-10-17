# Arte original · iteración 3

Generado el 17 de octubre de 2026 con la herramienta integrada **imagegen**, sin CLI ni assets comerciales. La aprobación artística humana sigue pendiente.

Los tres PNG originales se conservan completos. Los scripts solo definen recortes de atlas y componen los originales en SVG; no retocan ni reescalan los bitmaps guardados. Phaser articula las piezas en ejecución. El fusil, destellos, sombras y acabados de fachadas son recursos nativos SVG o dibujo de Phaser.

## Personajes

Archivo: `public/assets/characters/painted-v3/survivor-infected-atlas.png` (1254 × 1254 RGBA).
Salida seleccionada: `exec-336e86bf-8f69-4e1f-925a-c6e747522188.png`.
Sin imagen de referencia. Recortes documentados en `atlas.json`.

Prompt exacto:

```text
Use case: stylized-concept.
Asset type: production-ready modular 2D game character atlas, original painted illustration, genuinely transparent background.
Create a polished hand-painted cartoon top-down survival game sprite parts sheet for DEAD ZONE OUTBREAK. This is actual in-game art, not a mockup, no labels. Strong organic curved silhouettes, controlled dark ink outlines with varied weight, rich subtle painted brushwork, broad readable cel-shaded volumes, dramatic cool teal shadows and warm ivory edge lighting. Colorful yet grim. Camera high top-down with slight visible faces and torso volume, consistent overhead view across all parts. Not isometric, not photorealistic, not 3D render, NOT pixel art, no geometric placeholder look.

LAYOUT IS CRITICAL: square canvas, exactly FOUR equal columns and THREE equal rows, a 4x3 grid of isolated sprite parts, centered inside each cell with wide transparent gutters. No cell borders or background, no floor, no shadows cast outside the asset. All body parts face down toward viewer, neutral ready stance. NO assembled full characters anywhere.

ROW 1 = a charismatic adult soldier survivor: bold broad shoulder torso, compact muscular proportions, jade/teal tactical jacket, layered dark navy vest with readable chest pouches and straps, orange scarf tied diagonally to one shoulder, small battered backpack silhouette, pale warm skin, determined visible face, swept dark hair under a worn olive cap/goggles; warm brass hardware, scuffed fabric and seams. The face and scarf are the highest visual focal accents.
ROW 2 = a gaunt walker zombie: aggressively hunched thin crooked torso, asymmetric shoulder line, ripped wine-red civilian shirt hanging from shoulders, exposed infected green-grey neck, long jaw with missing teeth, one swollen pale eye and sunken dark sockets, wild sparse black hair, mottled jaundiced skin and dark veins. Threatening and expressive, not cute. Torn cloth, small restrained infection wounds.
ROW 3 = a very massive brute zombie: huge barrel-chested hulking demolition worker, hunched low bald brow, broken ochre hardhat, one hugely swollen shoulder, decayed grey-green skin with toxic olive veins and cracked flesh, giant jaw and grimacing uneven teeth, torn navy work overalls, frayed orange safety straps and corroded metal shoulder bracing. Chunky asymmetrical silhouette, heavy weight, visibly much more massive than walker.

WITHIN EACH ROW:
COLUMN 1: only head + neck + torso + waist as one coherent cutout, with shoulder stubs for arm attachment. NO arms and NO legs on this torso sprite. Entire head, hair/hat and backpack contained within cell. Tall torso on a transparent background.
COLUMN 2: isolated LEFT full arm from shoulder to fist, hanging vertically downward, shoulder top and fist bottom; matching that row's outfit/skin, a left hand clearly attached.
COLUMN 3: isolated RIGHT full arm from shoulder to fist, hanging vertically downward; matching outfit, asymmetrical torn sleeves on zombies and massive forearm on brute.
COLUMN 4: isolated SINGLE leg from upper thigh to a heavy boot or torn shoe, pointing downward, knee and footwear with material volume; matching row outfit. The game mirrors it to animate walking.

Keep each part wholly inside its grid cell and separate, do not touch other cells. Real alpha transparency, no checkerboard painted in, no text, no guns, no extra items, no scene. The same original painterly art direction and light direction throughout.
```

## Materiales

Archivo: `public/assets/world/painted-v3/material-atlas.png` (1254 × 1254).
Salida seleccionada: `exec-50334d6a-35c1-420a-b098-63830716213f.png`.
Sin imagen de referencia.

Prompt exacto:

```text
Use case: stylized-concept. Asset type: four hand-painted seamless game material swatches in one square 2x2 atlas. EXACT equal quadrants with no gutters, no borders, no labels. Entire image is the materials, no perspective, no objects, no scenery or text. Hand-painted 2D illustrated cartoon post-apocalyptic urban game, rich brushwork and subtle tactile texture, consistent controlled painterly stylization, NOT photorealistic, not a 3D render, no pixel art.
Top-left quadrant: damp dark blue-petroleum asphalt (#243D4D), very fine gravel, subtle broken surface grain, old warm flecks and dark worn irregular micro-cracks; broad calm values, no lane markings, no objects or large potholes.
Top-right quadrant: aged washed teal painted masonry with small believable cracks in paint, weathered plaster over brick, soft cool shadows, muted expressive paint.
Bottom-left quadrant: old blue-grey corrugated metal roofing, narrow subtle sheet seams, patina, darker cool edges, restrained copper corrosion and brush highlights, top-down orthographic.
Bottom-right quadrant: weathered cool grey urban concrete paving, small pits, soft mottled stains and painted grain, no prominent repetitive geometry.
Keep all four surfaces low contrast enough that illustrated characters and projectiles remain legible on top. Stylized painted materials for a colorful yet somber world. Avoid noisy speckles that dominate, writing, neon, dramatic lighting, objects, plants, 3D depth, logos, watermarks.
```

## Objetos existentes

Archivo: `public/assets/world/painted-v3/props-atlas.png` (1254 × 1254 RGBA).
Salida seleccionada: `exec-6a9483fc-250f-481a-95c7-8854a57dccb0.png`.
Referencia de estilo: el atlas original de personajes de esta entrega, pasado mediante `referenced_image_paths`. Recortes en `props-atlas.json`.

Prompt exacto:

```text
Use case: stylized-concept. Asset type: a production 2D game prop atlas, original painted illustration on real transparent alpha. The input image is a STYLE REFERENCE ONLY for brushwork, dark ink contours and warm/cool shading; do not include any characters or body parts.
Create a square sheet with EXACTLY FOUR separated objects in a precise 2x2 equal quadrant layout, one complete object centered in each quadrant, broad transparent gutters, no borders, no labels, no backdrop, no floor shadows outside the object.
All views are high top-down orthographic with a small amount of visible volume, for the SAME illustrated top-down urban zombie game. Cartoon painterly artwork, strong curved shapes, chunky forms with controlled dark outlines, large readable planes and subtle brush marks. Colorful yet somber teal shadows and warm pale edge highlights. Not pixel art, not photographic, not a 3D render. Keep details readable after downscaling.
TOP LEFT: an abandoned compact rust-red sedan seen from above, nose pointing straight up, full car and wheels contained in quadrant; very narrow vertically elongated silhouette, width-to-length ratio about 1:2.1. Clearly shaped hood, dark teal cracked windscreen, scuffed metal red paint, dented roof, pale yellow headlights, restrained corrosion, bumpers and side mirrors. Strong graphic silhouette.
TOP RIGHT: a very wide, low wooden road barricade seen from high above, width-to-height ratio about 4:1, two aged wooden rails across three short chunky supporting legs, faded diagonal dark/ochre hazard paint on upper rail, bolts and splinters, sturdy believable volume. Entire horizontal silhouette in quadrant.
BOTTOM LEFT: one compact wild urban shrub cluster, organic irregular leaves, dark blue-green and olive foliage with a few ochre dry leaves, large clear leaf masses with smaller supporting leaves, NOT a perfect flower or a radial geometric pinwheel. Top-down view, full plant silhouette contained in quadrant.
BOTTOM RIGHT: another abandoned compact sedan, same silhouette and straight-up orientation as top-left car but dark desaturated turquoise body with corroded warm orange patches and mismatched ochre hood, broken rear glass. Same width-to-length ratio 1:2.1 and same scale. Original, no trademarks.
No people, weapons, UI, text, watermarks, props outside cells, pavement, baked rectangular backdrops, or shadows outside silhouettes. Genuinely transparent background; preserve complete outlines and wide margins.
```

## Integración reproducible

- `npm run art:reference`: recompone SVG y recursos nativos usando los PNG guardados; no vuelve a generar imágenes.
- `node scripts/atlas-frames.mjs`: calcula metadatos a partir del alfa de los originales, con Vite en puerto 5173; no escribe imágenes.
- La generación es estocástica: los prompts explican la procedencia y no garantizan otra imagen idéntica.

Las versiones SVG anteriores permanecen conservadas. Los PNG seleccionados son parte del repositorio; no dependen de la carpeta temporal de generación. No se añade una licencia de terceros ni se cambia la licencia del proyecto.
