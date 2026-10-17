# Iteración 3 · revisión visual pendiente

17 de octubre de 2026. Rama `feat/phaser-art-iteration-3`, basada en `feat/phaser-combat-iteration-2` (`eb2e0bb`). Esta entrega termina aquí para revisión humana; no implica aprobación artística.

## Plan presentado y alcance ejecutado

1. Guardar capturas de la segunda iteración antes de modificarla, leyendo AGENTS, biblia visual, migración y arquitectura multijugador.
2. Rediseñar protagonista e infectados mediante ilustraciones originales por capas; conservar los estados y reglas de combate.
3. Refinar el fusil, destello, proyectil e impacto como presentación de los eventos existentes.
4. Enriquecer materiales, fachadas y objetos del mismo distrito. Comparar a la escala de juego, ejecutar build/suite y grabar una partida real.

No cambia el mundo 2800 × 2100, el encuadre, zoom o seguimiento de cámara, el arma única, la IA, sus tiempos, daño, cadencia, munición, dash, controles ni colisiones. No hay cambios en `src/core`, `src/simulation`, `src/content`, servidor, protocolo o legacy. No incorpora mapas, campañas, clases ni interiores.

## Cambios concretos

### 1. Protagonista

- Sustituye el personaje vectorial plano por un superviviente pintado con cabeza, torso, brazos y piernas articulados. Chaqueta jade, chaleco oscuro, pañuelo naranja, rostro visible, mochila/equipo y bordes cálidos para localizarlo sobre el suelo frío.
- Torso con más volumen y silueta legible, botas separadas, postura de disparo, apoyo alternado y oscilación pequeña. El dash acelera el gesto de marcha sin modificar desplazamiento.
- Fusil propio con culata, cargador, cañón, mira, acabados de metal y manos; conserva apuntado continuo, reflejo lateral y retroceso en ambos modos.
- Sombra de contacto suave y aro de pies más discreto. El tamaño dibujado no modifica el círculo de colisión.

### 2. Zombis

- Caminante: figura estrecha y encorvada, camisa vino desgarrada, cara hundida, dientes, piel gris verdosa y extremidades deterioradas.
- Pesado: torso ancho, casco roto, tirantes de trabajo, brazo infectado asimétrico y manos enormes. La separación de hombros y pies refuerza su peso.
- Nuevas piezas conservan marcha, anticipación, golpe, recuperación, impacto, caída, cadáver y salida anunciada por puerta. La animación de piernas sigue la distancia recorrida; la sombra queda en el suelo.
- El impacto usa un brillo cálido parcial sobre el torso en lugar de borrar los detalles con una silueta blanca. Las barras se sitúan por encima de las nuevas cabezas.

### 3. Proyectil y disparo

- Bala con punta luminosa, núcleo fino, trazo cálido y cola exterior de baja opacidad. Es la misma representación en manual y automático.
- Destello con forma en la boca del fusil durante hasta 0.06 s, pequeño halo y retroceso.
- Impacto en infectado: punto luminoso, anillo breve y cinco fragmentos direccionales. Superficies: tres fragmentos minerales. Duración máxima 0.18 s, sin partículas permanentes.
- Consume proyectiles/eventos ya resueltos por la simulación; no crea disparos ni cambia estadísticas del arma.

### 4. Riqueza del distrito

- Materiales pintados de asfalto, mampostería, chapa y hormigón, con contraste moderado en la calzada.
- Coches rojo y turquesa deteriorados, barricadas con madera/metal y arbustos pintados sustituyen las instancias anteriores en las mismas posiciones y huellas.
- Fachadas con gradientes, humedad, yeso desprendido, bajantes, abrazaderas, placas de edificio y cantos de puertas. Rótulos conservan sus nombres dentro del área reservada; desgaste fuera de las letras.
- Sombras suaves de objetos y personajes; se conserva la relación entre luz cálida y ambiente azul, los dos modos de iluminación y las sombras existentes. Son acabados dibujados, sin introducir iluminación física.
- Atlas con mipmaps para reducir ruido de detalle al alejarse, sin cambiar la cámara ni los PNG guardados.

## Evidencia local

Todo está en `test-results/`, excluido de Git. Ejecutar de nuevo `npm test` regenera esa carpeta.

- [Comparación interactiva](../test-results/reference-iteration-3/comparacion.html): tres estados, divisor antes/después y enlaces a originales.
- Láminas: [tenue](../test-results/reference-iteration-3/comparacion-1.png), [diurna](../test-results/reference-iteration-3/comparacion-2.png), [combate](../test-results/reference-iteration-3/comparacion-3.png).
- [Captura nueva de combate 1920 × 1080](../test-results/reference-iteration-3/after/03-combate.png).
- [Fachadas sur](../test-results/reference-iteration-3/fachadas-sur.png), alcanzadas con movimiento y dash, sin teletransporte ni modificación del estado.
- [Video de partida real de 20.92 s](../test-results/reference-iteration-3/partida-real.webm), [estados y métricas](../test-results/reference-iteration-3/real-session.json), [metadatos de revisión del video](../test-results/reference-iteration-3/video-review.json).
- [Fotografía de la partida](../test-results/reference-iteration-3/real-03-combate.png). Fotogramas extraídos mediante reproducción en Chromium, sin retoque: `video-frame-0.6.png` y `video-frame-0.9.png`.
- Estados de ataque, salida por puertas y muerte: carpetas `test-results/phaser-*`; informe completo en `playwright-report/index.html`.

Las capturas previas se tomaron en `eb2e0bb` antes de implementar. Ambas versiones ejecutan la misma prueba con semilla, reloj y entradas controlados, a 1920 × 1080. El video usa reloj real y entradas de teclado/mouse de Playwright, sin mutar la simulación. Su recorrido produjo **6 disparos manuales, 14 automáticos, 1 dash, 4 bajas, 15 impactos y 2 recargas**, con 7.57 s de tiempo simulado y cero errores de JavaScript/consola/red. No recibió daño en ese recorrido corto; los escenarios de contacto de la suite verifican daño de ambos infectados.

## Validación realizada

- `npm run art:reference`: recompone todos los SVG correctamente y conserva los recursos anteriores.
- `npm run build`: TypeScript y Vite correctos. Permanece el aviso de tamaño del chunk de Phaser (1.24 MB minificado, 344 kB gzip).
- `npm test`: **8/8 simulación, 16/16 servidor; Playwright 40 resultados esperados, cero inesperados, cero flaky, cero omitidos** (254.6 s).
- De los 40 casos de navegador, 38 pasan sus aserciones y 2 son defectos del legacy marcados previamente con `test.fail`: selector vacío de mejoras y mundo menor que QHD. No están corregidos.
- Phaser verifica entradas, diagonal, cámara, dash/colisión, ambos modos, pausa, derrota/reinicio, contacto/daño de caminante y pesado, rutas, apariciones, caída/cadáver, cadencia compartida y HUD a 1280 × 720, 2560 × 1440 y 390 × 844.
- `npm run record:reference` y `npm run review:art -- <carpeta-previa>` ejecutados después de la suite. Revisión visual de capturas tenue/diurna/combate, ataques, muerte, fachada y fotogramas del video.
- `main` permanece en `9b0a6e8afb0af7f4014829c01e99cf59ea088925`. SHA256 de `public/legacy/index.html`: `755EF02AD5D1BE67473C5EA2D1DC883CC9148950288E66E24CB4F019706B7D31`.

## Límites que siguen presentes

Esta propuesta requiere valoración humana de estilo, contraste y personalidad. La animación es por piezas articuladas con reflejo lateral; no es todavía un set dibujado de ocho direcciones. Parte de la arquitectura, charcos y señalización conserva construcción vectorial; la mezcla con materiales pintados debe juzgarse en la revisión.

El distrito compuesto ocupa 6.77 MB y el atlas de personajes 1.90 MB sin compresión HTTP. La optimización de carga y memoria queda pendiente; esta validación no mide FPS, rendimiento en GPU real ni soporte en Safari/Firefox. El viewport estrecho comprueba disposición de HUD, no soporte táctil.

Recursos originales, tamaños y anclajes: [manifiesto](../public/assets/README.md). Herramienta integrada imagegen y prompts exactos: [procedencia](iteracion-3-prompts.md). No se editaron los PNG generados ni se añadieron assets comerciales.
