# Diagnóstico del prototipo y base de pruebas

## Alcance y conservación

Inspección de `AGENTS.md`, configuración, CI, portada y `public/legacy/index.html`. El HTML jugable encontrado sin seguimiento se incorpora tal como estaba: no se reescribe el motor, no se ajusta el balance y no se cambia su presentación. SHA-256 del archivo: `755EF02AD5D1BE67473C5EA2D1DC883CC9148950288E66E24CB4F019706B7D31`.

Trabajo en `test/legacy-playwright-baseline`. `main` queda conservada. Las conclusiones siguientes distinguen lectura del código, ejecución en Chromium y juicio visual. Las capturas son evidencia de inspección, no snapshots de aprobación estética automática.

## Mecánicas actuales

| Sistema | Implementación observada en el código |
| --- | --- |
| Motor | Un HTML de 27,5 KB con CSS, DOM, Canvas 2D, estado global y `requestAnimationFrame`. `src/main.ts` es una portada; Phaser 3.90 está instalado pero no se importa. |
| Mundo | 2250 × 1650 unidades; seis edificios sólidos, calles, coches, escombros y farolas decorativos. Tres suministros en (780,720), (1440,880), (1180,1200). |
| Movimiento | WASD/flechas, vector normalizado, 230 unidades/s; radio 15; resolución de colisiones por ejes contra rectángulos y límites del mundo. |
| Cámara y apuntado | Cámara centrada con límites; el mouse pasa a coordenadas de mundo sumando la posición de cámara. No hay zoom ni resolución lógica independiente. |
| Dash | Espacio/Shift; 3,9 veces la velocidad durante 0,19 s; invulnerabilidad 0,23 s; recuperación inicial de 3,3 s. Conserva la última dirección si no se mueve. Mantener la tecla permite repetirlo cuando se recarga. |
| Pistola | Clic izquierdo sostenido; daño 26, intervalo 0,14 s, velocidad de bala 840 y vida de bala de 1 s. Dispersión aleatoria pequeña. |
| Torreta | Automática, objetivo más próximo a menos de 360 unidades; daño 16, intervalo 0,65 s, velocidad de bala 630. Comparte origen y función de disparo con la pistola; no hay una torreta física separada. |
| Enemigos | Caminante: 60 HP, velocidad 66, daño 12; corredor: 38 HP, velocidad 115, daño 8; bruto: 130 HP, velocidad 43, daño 21, aparece después de 38 s. Persiguen en línea recta con las mismas colisiones del jugador. |
| Hordas | Primer intento a los 1,5 s; grupo de `min(1+floor(t/27),5)`; intervalo `max(0.47,1.45-0.006*t)`. Intentos dentro de edificios se descartan. Aparición a 560–720 unidades del jugador, recortada al mundo. |
| Daño y botín | Invulnerabilidad global tras contacto de 0,5 s; ataque por enemigo cada 0,65 s. Probabilidad de XP 93%, botiquín 6,5%; atracción de drops a 110 unidades. Suministro cura 24 y botiquín 28. |
| Niveles | Primer umbral 65 XP; después ×1,33 redondeado. Cada nivel añade 7 HP máximos, cura 20 y añade 7 de daño manual y 4 automático antes de elegir una carta. |
| Mejoras | Triple automático; intervalo automático ×0,77 (hasta cinco); láser automático; perforación automática hasta tres; daño para ambas armas; cadencia manual; recuperación de dash; abanico manual de dos/tres balas llamado «DOBLE RÁFAGA». |
| Misión | Acercarse a menos de 35 unidades de cada caja, reunir tres y llegar a `1020<x<1220, y<155`. Victoria, derrota y reinicio con DOM superpuesto. |
| Estados | Menú, jugando, pausa, mejora, victoria y derrota; P/Escape y botón para pausa; selección con clic o teclas 1–3; perder foco libera entradas y pausa si se estaba jugando. |

## Entorno y resultados

Entorno local: Windows/PowerShell, Node 25.9.0, npm 11.12.1, Playwright 1.64.1, Chromium 156.0.8078.4, TypeScript 5.9.3, Vite 7.3.7 y Phaser 3.90.0. La versión del navegador también está adjunta como `browser-version` al test de inicio. La CI está configurada para Node 22; su ejecución remota sigue pendiente.

Antes del cambio: las dos pruebas de portada pasaron con Chromium; ninguna iniciaba el juego. `npm run build` falló con TS2580 porque faltaban tipos de Node para `process` en la configuración de Playwright. Se añadió `@types/node` y se incorporó el lockfile. El build compila TypeScript y copia el legacy a `dist/legacy/index.html`; no comprueba tipos dentro de su script clásico.

Ahora hay 26 casos: 24 verificaciones normales y dos reproducciones de defectos con fallo esperado. La repetición triple terminó en 89,4 s: 72 verificaciones aprobadas, seis fallos esperados reproducidos, cero resultados inesperados, cero omitidos y cero intermitentes. El resumen de cada ejecución queda en `test-results/report.json`; el HTML muestra las anotaciones de defectos conocidos. `npm run build` terminó correctamente.

`npm ci` en el workspace encontró EPERM en binarios usados por el Vite preexistente. Se restauraron dependencias con `npm install` sin detener ese proceso. Después, `npm ci` con copias de `package.json` y el lockfile en una carpeta temporal limpia terminó correctamente (22 paquetes instalados). Esto verifica la instalación desde cero del lockfile; no se presenta la reinstalación en caliente del workspace como satisfactoria.

Las pruebas instalan listeners antes de navegar y rechazan excepciones no capturadas, `console.error`, solicitudes fallidas y HTTP ≥400. Las fuentes remotas se responden con CSS vacío; no se verifican disponibilidad de Google Fonts ni fidelidad tipográfica en línea. No se habilita `ignoreHTTPSErrors` ni se ocultan errores de aplicación.

La mayor parte de las pruebas usa [el reloj de Playwright](https://playwright.dev/docs/clock) instalado antes de cargar la página, avanzando con `runFor`, que ejecuta los frames. `fastForward` no sirve para medir distancias aquí porque el juego recorta `dt` a 34 ms. No se usan esperas arbitrarias. Un smoke conserva el reloj real y espera que avance el HUD. Cada test tiene un contexto nuevo. Los escenarios controlados se indican por nombre y sus preparaciones solo existen en los archivos de pruebas.

### Comprobado en el navegador

- Inicio desde el enlace de la portada, Canvas 2D disponible, HUD y tiempo de juego activos.
- Ocho direcciones de entrada (WASD y flechas), desplazamiento y parada al soltar; velocidad diagonal normalizada y seguimiento de cámara.
- Clic sostenido, varias balas manuales mientras se avanza, dirección hacia el mouse y ausencia de nuevas balas manuales al soltar.
- Dash con Espacio y Shift: desplazamiento aumentado, temporizador de invulnerabilidad, bloqueo durante recuperación y reutilización posterior. No se enfrenta un golpe real durante el dash.
- Torreta sin clic: proyectil automático, daño de 16 y eliminación de un objetivo inmóvil preparado por la prueba.
- Pausa con P, congelación del tiempo/movimiento y continuación desde el botón.
- Contacto, HP 100→88, invulnerabilidad tras daño, derrota y reinicio en escenario controlado.
- Recogida de una caja y recorrido completo de las tres cajas hasta victoria exclusivamente con teclado, sin teletransportar ni asignar suministros. El edificio del norte obliga a rodear por el este.
- Bloqueo de movimiento ante el edificio norte, límite superior del jugador y límite de cámara.
- Drop de XP preparado cerca del umbral: subida real, tres cartas, selección por clic y tres proyectiles automáticos tras elegir triple.
- Partida de unos 20 segundos de tiempo simulado con apariciones naturales, disparo, desplazamiento y dash, con imágenes a los 8 y 20 segundos. No es una medición de rendimiento en tiempo real.
- Cero errores de JavaScript, consola o red dentro de estos recorridos con las fuentes aisladas.

## Revisión visual e incidencias

Se abrieron y revisaron las capturas de inicio, partida de 20 s, dash, selector de mejoras, aproximación a evacuación, ventana estrecha y QHD. Los nombres siguientes se encuentran dentro de carpetas individuales en `test-results/` y en el informe HTML.

| Prioridad / evidencia | Hallazgo | Consecuencia / siguiente acción |
| --- | --- | --- |
| Alta, reproducido; DZO-001, `exhausted-upgrades-known-bug.png` | Las ocho mejoras suman 24 elecciones máximas. Con todas al máximo, `levelUp()` abre un selector con cero cartas y Escape no permite salir. | Bloqueo de progreso al siguiente nivel. Caso preparado, no alcanzado en una partida larga. Añadir alternativa (cura/moneda/continuar) en un cambio posterior con aceptación explícita. |
| Alta, reproducido y visto; DZO-002, `qhd-map-known-bug.png` | El mundo fijo de 2250 es menor que un viewport de 2560; se ve una franja sin escenario a la derecha. | Separar resolución lógica, escala y tamaño del mapa. Una pantalla grande no debe revelar los límites por accidente. |
| Media, visto; `narrow-ui.png` | En 390×844 el panel de misión cubre parte del panel de tiempo/bajas. No existen controles táctiles. | Definir tamaños admitidos y reorganizar el HUD. La captura estrecha no certifica compatibilidad móvil. |
| Media, visto; `mission-start.png`, `natural-play-20s.png` | Personaje y zombis son reconocibles, pero siguen construidos con rectángulos simples; el terreno es repetitivo, oscuro y poco ocupado. Jugador anima piernas incluso parado; los zombis apenas oscilan la cabeza. | Crear sprites y tiles originales con siluetas claras y animaciones idle/caminar/ataque/daño. La estética actual no cumple aún una versión final de arte. |
| Media, recorrido y vista; `evacuation-approach.png` | El edificio (910,120,340,195) se superpone visualmente a la parte inferior de evacuación (1010,30,250,115). La entrada frontal está bloqueada; hay acceso lateral/norte. | No es una misión imposible, pero la ruta contradice la señalización. Separar colisión y zona de extracción y señalizar un acceso inequívoco. |
| Media, código | Coches y escombros se dibujan pero no tienen colisión; solo seis edificios son sólidos. | Obstáculos visuales y físicos incoherentes. Añadir datos explícitos de colisión por objeto sin convertir toda decoración en barrera. |
| Media, código | «DOBLE RÁFAGA» añade proyectiles simultáneos en abanico; no programa disparos sucesivos. El láser es un proyectil rápido con estela y 99 impactos, no un rayo instantáneo. Perforación solo afecta a la torreta. | Acordar diseño: diferenciar abanico, ráfaga temporal, rayo y perforación en datos, temporización, efectos y pruebas. Mantener el comportamiento existente durante la extracción inicial. |
| Media, código | La torreta escoge el enemigo más próximo sin comprobar línea de visión; las balas chocan con edificios. La IA solo persigue directamente. | Puede desperdiciar disparos y atascarse en fachadas. Reproducir con escenarios dedicados antes de cambiar selección o navegación. |
| Media, código | Simulación y dibujo comparten `Math.random`; dibujar consume azar incluso sin shake. Partículas amortiguan velocidad ×0,94 por frame. `dt` máximo 0,034 ralentiza el juego con pocos FPS. | Reloj controlado no equivale a simulación determinista. Separar RNG de simulación/efectos y usar un paso fijo con acumulador y límite de recuperación. |

### Dificultad: evidencia y límites

En una captura inicial revisada de la partida de 20 s: 100/100 HP, nivel 1 y cinco bajas, sin recuperar cajas. En la repetición triple final, los JSON a 20,032 s registraron respectivamente HP 88/76/64, bajas 5/7/6 y enemigos activos 5/4/6, siempre a nivel 1. El recorrido completo revisado llega al acceso de evacuación alrededor de los 12–13 s con 100/100 HP y nivel 1. Estos valores son de ejecuciones concretas; `Math.random` permanece activo y los resultados no son constantes. Demuestran que se puede terminar pronto sin subir de nivel. No demuestran la presión tras evolucionar las armas.

Riesgos derivados del código: el jugador (230) supera incluso al corredor (115), así que en terreno libre puede alejarse sin dash; HP y daño enemigo son fijos mientras cada nivel aumenta daño, salud y curación; daño, triple, cadencia, láser y perforación se multiplican. La generación aumenta con el tiempo pero alcanza cinco intentos por tanda y un intervalo mínimo; los intentos fallidos por edificios reducen la presión real. La invulnerabilidad compartida también limita el daño simultáneo. Estas observaciones justifican medir, no ajustar el balance a ciegas.

Como referencia analítica, sin fallos ni colisiones, la pistola inicial produce ~186 de daño/s y la torreta ~24,6. Los dos valores no equivalen al daño efectivo: alcance, aciertos, cadencia por frame y distribución de enemigos importan. Aún no se midieron supervivencia, daño recibido ni presión de hordas después de varias mejoras.

## Pendiente de verificar

- Balance de 3–10 minutos, varios niveles, combinaciones de mejoras, corredores/brutos y saturación de entidades; registrar daño acumulado sin ocultarlo con curas, enemigos cercanos, eliminaciones/minuto y supervivencia.
- Daño evitado durante dash, dash contra esquinas, colisión de proyectiles con paredes, impactos láser/perforación en varios enemigos y ráfagas diferenciadas.
- Puntería con cámara en todos los bordes, cambio de tamaño/DPR, pérdida y recuperación de foco, teclas 1–3 y estados simultáneos (muerte/subida/evacuación).
- Pantallas 1920×1080 y 4K, escalas fraccionarias, rendimiento real CPU/GPU, memoria durante partidas largas, accesibilidad y teclado internacional.
- Firefox/WebKit, dispositivos táctiles y ejecución de GitHub Actions en Linux. El servidor de producción/preview no se abrió: se verificaron build y navegador contra Vite de desarrollo.
- La tipografía descargada en línea y su impacto en los solapamientos. Las capturas usan el fallback original del prototipo.

No se corrigen estos problemas en esta entrega: el propósito es establecer evidencia y un punto de comparación antes de migrar.
