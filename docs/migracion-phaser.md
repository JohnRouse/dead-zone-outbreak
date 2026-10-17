# Migración progresiva a Phaser y TypeScript

Propuesta para revisión; no se implementa el reemplazo del juego en esta rama. Cada etapa se entrega en una rama y PR pequeños, con build, pruebas y capturas revisadas. `/legacy/index.html` sigue accesible hasta que exista aprobación humana de la paridad y del resultado visual.

## Arquitectura propuesta

| Área | Responsabilidad | Límite de dependencia |
| --- | --- | --- |
| `src/core/` | Tipos de entidades, estado, comandos, eventos, reloj de simulación e IDs estables. | TypeScript puro, sin DOM ni Phaser. |
| `src/simulation/` | Movimiento, colisiones, combate, generación de enemigos, XP, mejoras y misión. | Consume comandos y `dt`/tick; produce estado y eventos. RNG inyectable. |
| `src/content/` | Definiciones de armas, mejoras, enemigos, mapa y colisiones. | Datos tipados y versionados; valores iniciales copiados del legacy. |
| `src/client/phaser/` | Escenas, carga de assets, dibujo, animación, cámara y efectos. | Proyecta estado; no decide daño, botín ni victoria. |
| `src/client/input/` | Traducción WASD/flechas/mouse/dash a comandos con secuencia. | No modifica directamente entidades. |
| `src/client/ui/` | HUD, menús, mejoras, pausa y resultados. | Consume vistas/eventos y emite comandos. Puede mantener DOM inicialmente. |
| `src/transport/` | Contrato de sesión local y futuro adaptador de red. | No instalar ni desplegar servidor en esta fase. |

Separar simulación y representación es una decisión del proyecto para permitir futuro servidor autoritativo, no una capacidad automática de Phaser. [Las escenas de Phaser](https://docs.phaser.io/phaser/concepts/scenes) organizan carga, ciclo de vida y presentación; no deben convertirse en el único contenedor de las reglas del juego.

Flujo previsto: entrada → comando → simulación → eventos/snapshot → cliente Phaser y HUD. El modo local ejecuta ese flujo sin red. El futuro servidor validará y ejecutará los mismos comandos, conservando la autoridad sobre impactos, botín y objetivos.

## Etapa 0 — Base de comparación (esta entrega)

Conservar el HTML original y su hash, lockfile, configuración de Chromium, fixtures de errores, recorridos de teclado/mouse, capturas y defectos conocidos. La portada sigue enlazando al prototipo.

Aceptación: `npm run build` y `npm test` con resultado explicado, recorrido completo de misión reproducible, artefactos navegables, sin reescritura ni ajuste de valores de juego. Los fallos esperados están identificados y no se presentan como funciones corregidas.

## Etapa 1 — Contratos TypeScript y simulación aislada

1. Definir `GameState`, `PlayerState`, `EnemyState`, `ProjectileState`, `WeaponDefinition`, `UpgradeDefinition`, `MissionState`, `InputCommand` y `SimulationEvent` con uniones discriminadas. Usar IDs en vez de referencias a objetos para impactos y serialización.
2. Copiar las constantes actuales a datos tipados; registrar unidades (unidades/s, segundos, HP), límites y asociaciones entre armas y mejoras. No introducir cambios de balance mezclados con extracción.
3. Extraer funciones puras de normalización, colisión y temporizadores a módulos, inicialmente usados por un prototipo paralelo. Mantener el HTML de referencia intacto, evitando sostener dos implementaciones divergentes durante meses.
4. Implementar RNG de simulación con semilla y RNG de efectos separado. Añadir reloj fijo con acumulador, límite de pasos por frame y política explícita al recuperar foco. Verificar que 30/60/144 FPS producen resultados de simulación equivalentes dentro de tolerancias documentadas.

Aceptación: pruebas unitarias de reglas con riesgo real (normalización, cooldown, impactos únicos/perforación, XP y estados terminales), serialización de snapshots sin objetos de Phaser y reproducción de una semilla mediante comandos grabados. Mantener las E2E del legacy como referencia.

## Etapa 2 — Cliente Phaser paralelo y mundo

1. Añadir una ruta optativa `/phaser/` en Vite y escenas `BootScene`, `MenuScene`, `MissionScene` y una capa de HUD. Usar Phaser 3.90 ya instalado y su tipado local; no migrar simultáneamente a otra versión mayor.
2. Cargar mapa y obstáculos desde los datos de la etapa 1. Representar primero el mismo barrio, coordenadas y objetivos para poder comparar. Conservar los gráficos existentes como referencia temporal, sin aprobarlos como arte final.
3. Definir resolución lógica y estrategia de escalado antes de ampliar el mundo. Usar cámara con límites, seguimiento y redondeo de píxeles; distinguir coordenadas de pantalla y mundo. [Phaser documenta límites y seguimiento de cámara](https://docs.phaser.io/phaser/concepts/cameras); el tamaño de ventana no debe alterar el alcance ni la simulación.
4. En esta fase, mantener las colisiones de reglas en el módulo compartido. Evaluar [Arcade Physics](https://docs.phaser.io/phaser/concepts/physics/arcade) para consultas y depuración de cuerpos simples si aporta valor, evitando que dos motores resuelvan el mismo cuerpo. Si se adopta para autoridad local, encapsularlo y justificar cómo se ejecutaría en servidor antes de fusionar.

Aceptación: entrar/salir de la ruta alternativa, menú, jugador, límites y cámara sin fugas de listeners al reiniciar; pruebas en 1280×720, 1920×1080, QHD y viewport estrecho. Resolver DZO-002 mediante escala/mapa con un criterio de exploración en unidades lógicas y nuevas capturas revisadas.

## Etapa 3 — Movimiento e interacción equivalentes

Portar WASD/flechas, mouse, clic sostenido, dash con ambas teclas y última dirección; normalización, recuperación, invulnerabilidad, colisiones y pausa. La entrada produce comandos; la representación consume el resultado. Definir política de foco y bloquear entradas cuando un modal tiene la autoridad.

Adaptar el helper de pruebas a un contrato de snapshot de solo lectura habilitado únicamente en entorno de pruebas/desarrollo; conservar las mismas expectativas conductuales en ambas rutas. Aún no convertir las pruebas del legacy en pruebas que solo leen nuevos valores sin ejercer controles.

Aceptación: desplazamientos equivalentes en tiempo fijo, dash sin atravesar edificios, apuntado correcto con cámara desplazada, pausa real, pérdida de foco sin entradas atascadas y reinicio repetido sin callbacks duplicados. El servidor futuro podrá rechazar un dash con cooldown aunque el cliente lo solicite.

## Etapa 4 — Combate, enemigos y progresión

Portar pistola y torreta como instancias de armas independientes con daño, intervalo, velocidad, alcance, patrón y penetración explícitos. Distinguir abanico simultáneo de ráfaga temporal mediante un programador de disparos; decidir si el láser seguirá siendo proyectil o tendrá trazado instantáneo. Cada diferencia respecto del legacy debe describirse y aprobarse como cambio de diseño.

Conservar colisión continua/subpasos para evitar que las balas atraviesen enemigos a alta velocidad. Separar selección de objetivo, detección de impactos y daño. Introducir grupos/pools y consultas espaciales solo si un perfil de rendimiento lo justifica. Llevar IA y aparición a la simulación, con una navegación mínima para evitar fachadas si las pruebas confirman atascos.

Portar XP, curas y ocho mejoras; corregir DZO-001 con una salida útil cuando no quedan opciones y probar la transición. Modelar estados terminales para impedir, por ejemplo, que una subida de nivel reanude una muerte dentro del mismo tick.

Aceptación: daño y cadencia iniciales medidos, ninguna bala golpea dos veces el mismo ID, alcance/colisión con paredes, triple con tres trayectorias, láser y perforación con varios objetivos, ráfaga con intervalos temporales, límites de todas las mejoras y selector agotado recuperable. E2E con combate y movimiento simultáneos.

## Etapa 5 — Misión, arte y legibilidad

Migrar suministros y evacuación a una máquina de estados con eventos; separar la entrada de evacuación del edificio y garantizar conectividad de las tres cajas y la salida. Definir puntos de interés y rutas antes de ampliar el mapa. Añadir datos de colisión para coches/obstáculos que deban bloquear y mantener decoración no sólida identificable.

Producir spritesheets, tiles y animaciones originales o con licencia documentada; incluir manifiesto de procedencia. Acordar tamaño base de tiles y personajes, paleta, iluminación y escala entera. Animaciones por estado idle/caminar/disparar/daño/muerte y siluetas distintas para los tres tipos de enemigo. Reorganizar el HUD estrecho y conservar menús DOM accesibles si resulta útil.

Aceptación: misión completa, muerte y reinicio en Phaser; imágenes de idénticos puntos de referencia y aprobación visual humana. No aceptar rectángulos provisionales como entrega final. No inferir soporte táctil de una captura responsiva: requerir controles y pruebas propios si entra en alcance.

## Etapa 6 — Dificultad y rendimiento medidos

Instrumentar eventos de daño antes de curación, daño causado por arma, disparos/aciertos, densidad de enemigos a 150/360 unidades, apariciones intentadas/aceptadas, tiempo para matar, elecciones de mejora y tiempo de extracción/muerte. Registrar semilla y secuencia de comandos para comparar versiones sin enviar telemetría externa.

Ejecutar al menos diez semillas por condición, durante 3–10 minutos cuando sobreviva: jugador quieto solo automático, movimiento evasivo, disparo manual con movimiento y combinaciones de mejoras (daño/cadencia/triple/láser/perforación). Comparar antes/después de cada nivel y P50/P90 de supervivencia y presión. La curación puede esconder daño si solo se observa el HP final. Medir también el recorrido rápido de extracción: hoy puede omitir toda la progresión.

Definir con diseño bandas de presión y duración objetivo antes de ajustar valores. Ajustar generación, variedad, rutas y economía por cambios pequeños; verificar que subir de nivel ayuda sin hacer desaparecer sostenidamente la amenaza. No aumentar velocidad/HP sin considerar caminos y rendimiento.

Aceptación: informe de balance reproducible, nuevas capturas en combate denso y perfil real de CPU/GPU/memoria en equipos de referencia a acordar. El tiempo simulado de Playwright no sirve para declarar FPS. Añadir partidas largas automatizadas y Firefox/WebKit después de resolver paridad en Chromium.

## Etapa 7 — Promoción y preparación de cooperación

Promover Phaser como entrada principal solo tras revisión humana de paridad funcional, arte y mediciones; conservar acceso al legacy mientras siga siendo útil para regresiones. Publicar checklist de cambios aceptados en vez de ocultar diferencias de diseño. No fusionar directamente a `main`.

Para cooperación posterior de 1–4: añadir un adaptador de sesión Colyseus, sala autoritativa con tick fijo, estado serializable por IDs, comandos numerados y validados, snapshots/interpolación y reconciliación de jugador local. El cliente no fija HP, posiciones finales, botín o victoria. Separar la pausa local del progreso del mundo compartido y definir reconexión, abandono y propiedad de suministros antes de implementar.

Aceptación de esa fase futura: dos y luego cuatro clientes, latencia/pérdida simuladas, impactos y misión consistentes, reconexión y rechazo de comandos inválidos. La arquitectura propuesta facilita este trabajo; no constituye una implementación ni verificación del multijugador.

## Orden de revisión

Etapas 1→2→3→4→5 establecen paridad; 6 evalúa el resultado antes de 7. DZO-001 puede corregirse en una PR aislada anterior y DZO-002 debe resolverse al definir cámara/escala. Cambios de arte, cambios de balance y extracción de reglas se revisan por separado para poder atribuir cada regresión. Cada PR enumera qué se ejecutó, qué se vio y qué sigue pendiente.
