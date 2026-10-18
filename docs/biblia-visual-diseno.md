# DEAD ZONE: OUTBREAK — Biblia visual y de diseño
**Versión:** 1.1 · **Idioma:** español · **Estado:** documento rector de producto y dirección artística. **Complemento obligatorio:** [Arquitectura funcional, cuentas, inventario y servicios](arquitectura-funcional-producto.md), con decisiones recientes de equipamiento, salas, cosméticos y autenticación.

> **Para Codex:** leer este documento junto con `AGENTS.md`, `docs/migracion-phaser.md` y `docs/diseno-multijugador.md` antes de planificar cambios. Para cuentas, inventario, economía, salas e interfaz, leer también `docs/arquitectura-funcional-producto.md`. Este documento actualiza las decisiones creativas anteriores: **NO desarrollar DEAD ZONE como pixel art de 8 bits**. Implementar por entregas pequeñas, con pruebas y aprobación visual humana. La existencia de una sección aquí **no** implica que esté implementada.

## 1. Visión y promesa al jugador

**DEAD ZONE: OUTBREAK** es un juego de acción y supervivencia zombi **2D ilustrado, cámara superior (top-down), colorido pero sombrío**, para navegador, con controles ágiles, armas de disparo manual y apoyo automático, construcción de defensas, exploración, entornos cambiantes y cooperación opcional de hasta cuatro jugadores.

Las dos fantasías principales:
- **Supervivencia:** «Construí una fortaleza ingeniosa, resistí una oleada imposible; cuando pierda, querré reconstruirla de otra manera».
- **Campaña:** «Cada compañero puede explorar zonas distintas y sus decisiones afectan a una misión compartida; sobrevivimos a la crisis juntos».

**Tres pilares:** combate arcade legible + fortificación estratégica + cooperación bajo presión. Profundidad en las decisiones, no menús ni simulaciones de necesidades que frenen la acción.

### Decisiones confirmadas por dirección del proyecto
- **Referente visual principal:** *Nobody Saves the World* por su perspectiva, ilustración 2D, composición, paleta expresiva, sombras, iluminación y animaciones. **Inspiración, no copia** de diseños ni activos.
- **Abandonado:** pixel art, 8 bits, personajes de rectángulos como resultado final, tipografías retro obligatorias y efectos que saturen toda la pantalla.
- **Atmósfera:** colorida pero sombría, ciudades y entornos posapocalípticos con contrastes cálido/frío y amenaza reconocible.
- **Personajes:** caricaturescos, silueta fuerte, expresividad y movimientos fluidos, no fotorealistas.
- **Cámara:** distancia intermedia; el personaje y su arma deben distinguirse, pero también los enemigos, el terreno y las rutas.
- **Modos:** Supervivencia por oleadas en mapas compactos/medianos y Campaña en mapas extensos de sectores explorables.
- **Campañas:** colecciones temáticas de capítulos. «Aguas tenebrosas» tendrá **cuatro mapas**.
- **Construcción:** herramientas improvisadas y tecnológicas según recursos, ambientación y campaña.
- **Cooperación:** de uno a cuatro jugadores; exploración libre sin ataduras de distancia, chat escrito y, más adelante, voz y pings; cuatro clases exclusivas por sala.
- **Caída y rescate:** los compañeros pueden acudir a levantar a uno incapacitado; si expira el tiempo, muere por ese mapa. Si el equipo restante completa el mapa, reaparecen todos al comenzar el siguiente.
- **Mejoras cooperativas:** se votan opciones globales; cada jugador conserva sus mejoras individuales.
- **Competición:** rankings separados por modo, mapa, dificultad y tamaño inicial del grupo; en campaña, tiempo de misión validado por servidor.
- **Inventario:** el loot jugable dura una campaña completa, se conserva entre sus cuatro capítulos y se reinicia al empezar una campaña nueva; **solo casco, chaleco y mochila** como equipo de protección/carga.
- **Muerte:** al finalizar el rescate sin éxito, se deja una **caja de loot** recuperable por aliados; si superan ese capítulo, el fallecido reaparece con equipo básico en el siguiente.
- **Partidas abiertas:** salas en vivo con vacantes (`3/4`) y entrada de nuevos jugadores tras desconexión/abandono definitivo; el nuevo llega con equipo básico a una zona segura, sin sustituir a un muerto que siga en la sala.
- **Cuenta:** Google, X, TikTok y registro propio como dirección futura; invitado efímero sin compras ni guardado permanente y opción de crear cuenta durante esa sesión.
- **Cosméticos:** skins de armas compartidas por modelo compatible entre clases; conjuntos de ropa específicos para cada clase, con variantes coleccionables sin duplicados. La tienda no da ventajas jugables. Gacha de pago y monedas para tiradas **no están autorizados** hasta revisión legal posterior.
- **Pantallas:** menús, bienvenida, lobby, Arsenal, perfil, tienda y sección pública de Universo/Historia también siguen la identidad 2D ilustrada y deben ser aprobados visualmente.

## 2. Lenguaje visual (obligatorio)

**Estilo:** ilustración 2D dibujada/pintada digitalmente con contornos controlados, formas orgánicas y lectura instantánea; vista superior con una **ligera percepción de volumen** en fachadas, objetos y cuerpos, sin convertir el mapa en 3D ni imponer perspectiva isométrica. No usar filtro pixelado ni bordes escalonados como estética. Mantener consistencia de grosor de línea, saturación, nivel de detalle, sombras y tamaño relativo en todos los sprites.

**Paleta de arranque — orientativa, no una restricción por píxel:**
| Uso | Color guía |
| --- | --- |
| Sombras profundas | `#141922` |
| Azul petróleo nocturno | `#243D4D` |
| Teal / agua contaminada | `#2E8B89` |
| Verde tóxico y pistas de infección | `#86C95A` |
| Luz artificial cálida | `#F3A44B` |
| Incendio y amenaza caliente | `#E65D40` |
| Morado de penumbra | `#584567` |
| Texto e indicadores principales | `#E9F0E5` |

Paletas derivadas por localización: hospital (teal, verde de emergencia, ámbar), barrio inundado (azul petróleo, turquesa, reflejos cálidos), bosque (verdes profundos + hogueras), laboratorio (cian frío + señales químicas).

**Iluminación:** separar base del escenario, volumen/sombra de objetos, luces locales, oclusión legible y efectos atmosféricos. Farolas, torretas, fuego, linternas, generadores y relámpagos deben afectar percepción espacial. Evitar que la oscuridad esconda sistemáticamente enemigos o zonas de interacción. Priorizar soluciones WebGL/2D eficientes, degradando efectos opcionales si el dispositivo no soporta iluminación avanzada. El clima **altera reglas**, no solo dibuja partículas.

**Criterios visuales de aceptación:**
- A una vista normal de escritorio se distingue el jugador, su clase, arma, dirección y estado sin leer etiquetas.
- En capturas estáticas se reconocen al menos dos tipos de infectados por su silueta, no solo por el color.
- Las zonas transitables y las colisiones coinciden con el arte; una fachada decorativa no puede comportarse como pared invisible.
- Ataques especiales se anticipan con señales perceptibles; el jugador reconoce peligro y dirección del impacto.
- Proyectiles no llenan el escenario con cuadros y partículas persistentes; la claridad prevalece sobre el espectáculo.
- UI accesible sobre escenarios claros u oscuros: contraste, jerarquía y textos legibles.

## 3. Personajes, enemigos y animación

Cuatro clases base, con IDs compatibles con la sala existente:
- `soldier` / **Soldado**: silueta robusta, equipo táctico y arma claramente visible; especialidad ofensiva.
- `medic` / **Médica**: mochila, emblema de asistencia legible y elementos de curación; rescates más eficientes.
- `mechanic` / **Mecánico**: herramientas, guantes, equipo de reparación; construcciones y mantenimiento.
- `scout` / **Explorador**: equipamiento ligero, postura ágil, reconocimiento y movilidad.

Todos pueden moverse, disparar, usar dash, explorar, construir estructuras básicas, realizar objetivos y rescatar. Ninguna misión debe quedar bloqueada porque una clase no se seleccionó o murió.

**Set mínimo de estados de animación por clase:** inactivo, caminar (preferiblemente 8 direcciones o solución 4 direcciones + orientación), correr/dash, apuntar mientras camina, ataque/disparo, recibir impacto, interactuar, incapacitado y rescate. Añadir natación y escalada en fases posteriores. Favorecer **cuerpo + brazos/arma en capas** para apuntado continuo sin dibujar cientos de cuadros completos. Animar expresividad con desplazamientos, anticipación, retroceso, impactos y efectos breves.

**Comportamiento de zombis — CONFIRMADO POR DIRECCIÓN:** el arquetipo común debe ser **rápido, feroz, insistente y peligroso**, con persecuciones intensas y embestidas en grupo, inspirado en la sensación de urgencia de *Guerra Mundial Z* (sin copiar diseños ni escenas). **NO** basar la experiencia en caminantes lentos y pasivos al estilo de *The Walking Dead*. Que un infectado esté inactivo antes de detectar a una víctima no significa que sea lento una vez alertado. Variedad por función: infectado común agresivo, velocista, pesado/rompebarricadas (puede desplazarse más despacio, pero presiona y castiga), y especiales posteriores como tóxico, gritón, saltador, atacante a distancia y jefes. «Caminante» en prototipos o pruebas anteriores es un identificador legado, no la dirección final de comportamiento. No copiar movimientos ni assets de franquicias ajenas.

**Justicia y legibilidad del combate rápido:** animación de alerta, sonido y breve anticipación de ataques; aceleración y cambios de trayectoria verosímiles; colisiones y rutas coherentes; espacio y herramientas para esquivar, usar dash, barricadas y cooperar; emboscadas telegráficas y entradas de hordas desde rutas inteligibles, no spawns inevitables encima del jugador. Alternar densidades, velocidades y roles sin recurrir solo a más HP. Evitar el extremo contrario: perseguidores fáciles de mantener a distancia indefinidamente. Medir con pruebas reproducibles presión real sobre jugador inmóvil, jugador en movimiento y grupo, y rendimiento con hordas. Los infectados rápidos **no deben** arruinar la exploración ni convertir misiones tempranas en daños inevitables.

**Combate:** **arma personal única**, con apuntado automático cuando no se mantiene clic y apuntado manual al sostenerlo, compartiendo cadencia, cargador y munición (no doble disparo); patrones claramente distintos de tiro triple simultáneo, ráfaga temporal, ametralladora, láser/perforación y ataques de área. Inspiración general en armas arcade clásicas; no reutilizar sprites, sonido ni nombres protegidos específicos de juegos ajenos.

## 4. Cámara, mapas y transiciones

- Cámara top-down de distancia **intermedia**, seguimiento suave y límites coherentes. El tamaño del mundo es independiente de la resolución del navegador.
- Punto de partida para evaluar, **no valor definitivo**: a 1920×1080, personaje legible aproximadamente 55–95 píxeles de alto en pantalla durante exploración; capturar comparaciones y ajustar con feedback.
- Cámara no debe marear con cada disparo; vibración breve, opcional y ajustable.
- Opción de revelar ligeramente más entorno hacia la dirección de avance/apuntado, sin desorientación.
- UI fija en pantalla y mundo desplazable; HUD no debe tapar objetivos o entradas; minimapa con ubicación y piso de compañeros.
- Probar escritorio 1280×720, 1920×1080 y QHD, y viewport estrecho sin fingir soporte móvil táctil.

**Mapas de campaña:** ciudad con barrios y sectores distintos, hospital, laboratorio, subterráneos, azoteas, instalaciones y rutas alternas. Edificios visitables conectados por **puertas de transición** hacia mapas 2D separados (planta baja, sótano, piso superior); escaleras/ascensores cambian de piso manteniendo identidad del jugador. Un compañero puede estar en el exterior mientras otro explora el sótano. Transiciones no requieren modelado 3D. Garantizar que objetivos, retornos y rutas sigan disponibles tras un evento ambiental.

**Mapas de supervivencia:** escenarios más compactos y defendibles, elegibles por ambientación: bosque abandonado, ciudad, isla, hospital/laboratorio, puerto y otras variantes futuras. Lo compacto no significa pantalla única ni un escenario sin exploración.

## 5. Mecánicas de entorno y clima

Lluvia: superficies mojadas, reflejos, menor visibilidad local y/o complicación de torretas eléctricas según reglas visibles. **Inundación**: el agua sube en regiones predefinidas, corta rutas bajas, reduce movilidad donde corresponde y abre estrategias alternativas; no hacer simulación física compleja de fluidos en las primeras versiones. **Incendio**: propagación controlada por zonas inflamables, daño y destrucción de defensas, humo. **Niebla**: baja visibilidad, no genera golpes inevitables. **Apagón**: iluminación y dispositivos afectados.

Reglas para eventos: aviso previo audiovisual, contrajuego posible, mapas transitables, recursos para recuperar la situación, no bloquear permanentemente objetivos ni castigar aleatoriamente sin pistas. Para rankings oficiales, escenarios/semillas/versiones equivalentes y registrados.

## 6. Modo Supervivencia — oleadas y fortificación

Ciclo fundamental: **prepararse → oleada → defender/retroceder → recompensa → reparar o replantear → siguiente oleada**. El jugador puede levantar un fuerte cuadrado con torretas en esquinas y muros, construir corredores, mover defensas o defender posiciones alternas. La variedad de estrategias es un objetivo explícito.

Herramientas escalonadas según ambiente: barricadas improvisadas, puertas reforzadas, minas/trampas, torretas mecánicas, torretas avanzadas, generadores, dispositivos eléctricos. Cada estructura necesita alcance, salud, coste, reparación, colisión y debilidad comprensible. Permitir colocación rápida con vista previa válida/inválida; no abrir menús largos durante la acción.

Ritmo: oleadas finitas por fase con pausa breve para reparación; las nuevas amenazas se introducen gradualmente (corredores, rompemuros, especiales, jefes). Un director de asedio puede variar rutas, densidad y combinación de infectados, pero sin contrarrestar siempre ni automáticamente todas las decisiones del jugador. Evitar crecimiento de poder que vuelva irrelevantes las hordas.

**Ranking supervivencia:** oleada máxima alcanzada y criterio de desempate publicado (p. ej. enemigos eliminados/tiempo supervivencia). Separar por mapa, dificultad, tamaño de equipo y versión de reglas. No mezclar con el ranking de velocidad de campaña.

## 7. Modo Campaña — exploración libre, decisiones y objetivos compartidos

Campañas temáticas compuestas por capítulos/mapas consecutivos. Cada capítulo tiene narrativa breve, introducción por **radio con voz cuando existan audios** y subtítulos siempre, objetivos principales/secundarios, exploración, combate, eventos y extracción. Una voz/texto de Central puede actualizar la misión a medida que se descubren cosas; no revelar todas las tareas al inicio.

Ejemplos de misiones: defender un generador diez minutos, recuperar piezas en varios sectores, reactivar bombas, investigar un laboratorio, encontrar suministros, abrir rutas, rescatar un compañero, solicitar evacuación.

Los cuatro jugadores pueden **separarse libremente**, entrar a distintos edificios y pisos, y encontrar desafíos individuales que influyan en el objetivo del grupo. Preferir **dependencias cruzadas**: un jugador restablece la luz que habilita el ascensor de otro, alguien consigue un fusible que abre un acceso, otros defienden un punto. Nunca obligar a un jugador a quedarse al lado de otro mediante distancia artificial.

**Escalado 1–4:** garantizar objetivos completables con uno, dos, tres o cuatro integrantes, con distribuciones adaptadas; evitar requerir cuatro acciones simultáneas cuando queden menos jugadores vivos. Un objetivo que queda pendiente por muerte de su portador puede reasignarse, recuperarse del lugar de caída o solucionarse de otro modo.

### Campaña de referencia: «Aguas tenebrosas» (4 mapas)
1. **Barrio inundado:** explorar calles anegadas, activar refugio y establecer comunicaciones; presentación gradual de lluvia y rutas alternativas.
2. **Hospital de la ribera:** recorrer planta baja y sótano, recuperar suministros/compuestos y restaurar un ascensor con energía remota.
3. **Planta de bombeo:** activar bombas y **defender maquinaria** durante un intervalo bajo ataque, mientras parte del equipo consigue piezas y combustible.
4. **Laboratorio sumergido:** alternar salas oscuras, subterráneos parcialmente inundados, mutante especial y extracción final.

Esto es un **concepto aprobado de campaña**, no cuatro mapas listos. Cada capítulo necesita plan de navegación, interacción, crisis, recompensa, duración objetivo medida y cierre narrativo propio.

## 8. Compañeros caídos y continuidad

Estados: **activo → incapacitado → revivido o muerto**.
- Al quedar con 0 HP un personaje puede ser revivido por otro que llegue físicamente, incluso desde otro piso o edificio.
- **Propuesta inicial para playtesting:** 60 segundos para rescatar, seis segundos de interacción normal, tres para Médica, revivir con salud parcial. Ajustar después con mapas de tamaño real y telemetría; no tratar estos números como definitivos.
- Si se agota el plazo, el jugador queda muerto/espectador hasta el fin de ese capítulo; mantiene comunicación y puede observar a compañeros sin revelar habitaciones inaccesibles.
- Los supervivientes restantes **pueden completar el capítulo**. Si lo hacen, **los cuatro reaparecen en el capítulo siguiente**.
- Si nadie queda vivo, el capítulo fracasa y se repite desde su inicio; no reiniciar automáticamente la campaña completa.
- **Continuidad y muerte confirmadas:** el equipamiento encontrado se conserva entre los cuatro mapas de la misma campaña. La muerte definitiva genera una caja con todo el loot jugable recuperable por el equipo; los objetos no recogidos se pierden al cerrar el mapa. Al superar el capítulo, el fallecido vuelve en el siguiente **con kit básico**, sin recuperarlo mágicamente. El estado del inventario del resto del equipo no se reinicia por su muerte. Consultar [arquitectura funcional](arquitectura-funcional-producto.md) para las reglas de no duplicación.
- El servidor valida daño, plazo, rescate, muerte, supervivientes y resultado; la experiencia debe evitar imposibles de rescate o softlocks.
- Ranking de campaña mantiene el tiempo como criterio principal; registrar aparte supervivientes 4/4, rescates y distinción por evacuación perfecta sin sustituir el cronómetro.

## 9. Votaciones de mejoras globales y progreso

En hitos entre oleadas o momentos seguros de campaña, el equipo elige **una entre tres mejoras globales**: p. ej. murallas reforzadas, torretas perforantes o arsenal compartido. El ejemplo favorito para la dirección es **Murallas reforzadas**. Combinar con mejoras individuales de arma, movilidad y especialidad para mantener autonomía.

**Reglas iniciales propuestas, a validar:** una elección por jugador conectado; 20 segundos para votar; votos visibles durante el proceso; resultado basado en mayoría relativa; si hay empate, desempate breve de cinco segundos entre empatadas y, si persiste, azar de servidor documentado. Manejar desconexiones y ausencia de voto sin bloquear. No ofrecer una votación después de cada oleada si interrumpe el flujo. Las mejoras globales deben ser equilibradas: defensa, ataque y recursos son alternativas valiosas, no una elección óptima evidente.

## 10. Salas, comunicación y rankings

La sala de selección Colyseus **ya existente en una rama de desarrollo** permite hasta cuatro jugadores, cuatro clases únicas, plazo de 30 segundos y asignación automática desde servidor, cuenta atrás de cinco segundos y reconexión con reserva de 20 segundos. **Conservar sus pruebas y contratos**; no confundir lobby con combate multijugador ya implementado.

Las **salas públicas en curso**, su ocupación (p. ej. `3/4`), el reemplazo por abandono definitivo, la entrada en zona segura con equipo básico y las reservas de reconexión se especifican en [arquitectura funcional](arquitectura-funcional-producto.md). No confundir la reserva de 20 s del lobby de selección con una futura reserva configurable durante una partida.

Plan de comunicación: **chat escrito** primero, **pings en mundo/minimapa** después, **voz opcional** en fase separada con control de mute, push-to-talk, privacidad, reconexión y costes de infraestructura (posible WebRTC/servicio especializado). No prometer que Colyseus por sí solo transmita voz.

Rankings individuales y de equipos permanentes; campaña por menor tiempo de capítulo completado, supervivencia por mayor oleada. Servidor autoritativo, resultados verificables, categorías por dificultad, tamaño inicial del equipo, mapa/capítulo y versión de reglas. Equipos permanentes distintos de las salas temporales. No activar tablas SQL propuestas sin revisar migración, autenticación, autorizaciones y conservación de datos.

## 11. Diseño de interfaz y accesibilidad

**Lore público desde el inicio (DECISIÓN CONFIRMADA):** la historia completa del apocalipsis y los antecedentes completos de cada personaje estarán disponibles directamente en la web desde el primer ingreso, incluso como invitado y sin completar campañas. Incluir navegación a Universo/Historia, Cronología, Supervivientes, Campañas y archivos complementarios, con el mismo estilo ilustrado V4. El canon (origen exacto, nombres y biografías) todavía requiere redacción y aprobación; no confundir ejemplos anteriores con historia definitiva. Las escenas de campaña dramatizan y amplían hechos, no bloquean información narrativa esencial. Ver [Universo, lore y protagonistas](universo-lore-personajes.md).


HUD discreto, no bloqueante: HP, dash, arma personal (modo manual/automático sin duplicación), munición y recarga, equipo de casco/chaleco/mochila, recursos de construcción, fase/objetivo, estado de compañeros, minimapa/piso, avisos de radio, indicador de rescate y voto cuando correspondan. Estética diegética ligera: placas metálicas desgastadas, pictogramas ilustrados y acentos de color, evitando un HUD puramente «8-bit».

La **dirección artística aprobada** se extiende a **bienvenida, login, menú, perfiles, lobby, selección, Arsenal/Armario, mochila, tienda, misiones y rankings**. Ilustración original, personajes caricaturescos, contornos expresivos, luces y sombras amplias, jerarquía clara; evitar ventanas planas genéricas o una UI publicitaria recargada. Los menús HTML/CSS pueden compartir tokens gráficos con Phaser. Antes de implementar un catálogo, producir y revisar una pantalla de bienvenida y una de lobby. [Reglas completas](arquitectura-funcional-producto.md#8-uiux-la-identidad-visual-aplica-a-todo-el-producto).

Opciones: subtítulos para toda voz de misión, controles remapeables en fase posterior, volumen separado (efectos/música/voz), no depender solo del color, modos de menor intensidad de efectos, reducir sacudidas/destellos, alto contraste y escala de interfaz. No tapar alertas críticas con números de daño masivos.

## 12. Arquitectura y producción de assets

**Tecnología de partida:** Vite + TypeScript + Phaser para render, Colyseus para red, Playwright para E2E, PostgreSQL **futuro** para identidad, derechos cosméticos, economía auditada y rankings, acorde con planes existentes. Conservar `public/legacy/index.html` como referencia hasta sustitución aprobada. Separar simulación (reglas compartidas, RNG semillado, ticks, IDs), presentación (Phaser), red (Colyseus), contenido (datos) y UI (DOM/Phaser). No trasladar reglas críticas al navegador si afectarán a rankings y multijugador.

**Biblioteca de arte original:** organizar `public/assets/` por `characters/`, `enemies/`, `world/`, `buildables/`, `vfx/`, `ui/`, `audio/`; documentar para cada recurso resolución de origen, versiones, puntos de anclaje, hitbox, estados, atlas, autor/licencia y uso. Trabajar con capas PNG/SVG/atlas exportados según convenga; no estirar arte raster a gran escala sin revisar nitidez.

**Regla de propiedad intelectual:** *Nobody Saves the World*, *Boxhead*, *Contra* y *Left 4 Dead* son **referencias de sensaciones o presentación**. No extraer ni subir sprites, fondos, sonidos, fuentes propietarias, personajes reconocibles, capturas redistribuidas ni otros activos protegidos a este repositorio público. Usar arte original o con licencia compatible y registrar origen. Nunca fingir que un placeholder geométrico es arte aprobado.

**Guías para creación de assets:** la composición de capas y los brillos deben reproducirse en movimiento, no solo en mockups. Primero una «lámina de estilo» original que incluya: superviviente, dos zombis, trozo de calle con una puerta, barricada, luz cálida y sombra fría. Revisar coherencia antes de generar docenas de recursos. Evitar assets de estilos mixtos.

## 13. Entrega mínima viable y orden de trabajo

**No encargar a Codex “construye todo el juego” en una única tarea.** Entregas aisladas en ramas/PR con capturas y pruebas:

1. **Estabilizar base:** resolver la prueba intermitente detectada en PR #1 y conflictos de puertos; conservar `main`, legacy y pruebas. Esta documentación no fusiona esa PR.
2. **Dirección artística demostrable:** implementar solo una **escena de referencia** con assets originales ilustrados: calle húmeda, un personaje y dos enemigos reconocibles, sombra/luces locales y HUD básico. Revisar tres capturas antes de ampliar el contenido.
3. **Vertical slice jugable local:** cámara intermedia en escenario más grande que el viewport, WASD/flechas, apuntado, disparo sostenido, arma automática, dash, colisiones y un edificio con una transición 2D básica. Conservar pruebas legacy.
4. **Primer bucle de supervivencia:** 3–5 oleadas de prueba, una barricada y una torreta con reparación/colocación, una mejora grupal simulada localmente y un enemigo que obliga a cambiar defensa.
5. **Campaña de muestra:** objetivo defender un generador y buscar un componente en edificio, evento anunciado de lluvia/agua en una región, extracción y derrota; escalado por tamaño de equipo posteriormente.
6. **Cooperativo real:** vincular la sala Colyseus a simulación autoritativa, introducir 2 y luego 4 jugadores, sincronizar movimientos/combate/objetivos, caídas y rescates; posteriormente voto global.
7. **Persistencia y servicios:** autenticación, equipos, rankings verificados, voz opcional; tras pruebas de seguridad y coste.
8. **Campaña completa y catálogo:** terminar los cuatro mapas de Aguas tenebrosas, más escenarios de supervivencia; solo expandir al contar con pipeline de assets, colisiones y pruebas estables.

### Criterios de salida de la primera demo visual (antes de avanzar a más mapas)
- No pixel art; una dirección de ilustración coherente y original validada con captura de referencia.
- Personaje distinguible y animado, dos zombis con siluetas diferentes, sombras bajo objetos y una fuente de luz claramente visible.
- Perspectiva top-down, cámara de distancia intermedia, mapa mayor que 1920×1080 en unidades de mundo y movimiento fluido sin saltos por desplazamiento de cámara.
- Disparar mientras se camina, disparo automático y dash conservados en el slice jugable; impactos y efectos legibles.
- Una entrada interior/exterior transitable sin teletransporte inesperado ni perder inputs.
- `npm run build`, pruebas unitarias y Playwright apropiados aprobados o fallos conocidos claramente documentados; capturas de día/noche o luz tenue, combate y transición.
- Estado de juego y documentación consistente con lo realmente implementado. Ninguna funcionalidad futura debe presentarse como terminada.

## 14. Qué debe entregar Codex en cada encargo

1. Plan corto indicando alcance exacto, archivos y limitaciones.
2. Rama nueva o rama de tarea existente claramente declarada, **sin** reescribir trabajo ajeno ni fusionar `main` por iniciativa propia.
3. Cambios incrementales; assets con procedencia; datos separados de reglas y de render.
4. Pruebas automatizadas reproducibles (casos felices y límites), al menos una captura Playwright relevante **revisada visualmente**, y explicación de fallos existentes versus introducidos.
5. Resumen en español de mecánicas realmente implementadas, pantallas, rendimiento observado vs no medido, riesgos pendientes y comandos para probar.
6. Solicitar aprobación visual antes de multiplicar biomas, personajes y capítulos. No mejorar estética solo añadiendo partículas, brillo o zoom.

## 15. Decisiones pendientes (no asumir automáticamente)

- Canon narrativo (origen y cronología del apocalipsis), nombres y biografías completas de los protagonistas, y diseño/balance final de habilidades especiales por clase, según `docs/universo-lore-personajes.md`.
- Duraciones reales de oleadas y tiempos de rescate después de medir mapas.
- Economía de créditos/materiales, límites de torretas, balance de armas y número de niveles de mejora.
- Tamaño lógico del mapa, zoom final y técnicas específicas de animación después de revisión de la primera escena.
- Audio de voces de radio (grabado, sintetizado con permisos y licencias, o solo subtítulos).
- Política exacta de votación cuando haya muertos/desconectados.
- Tiempo de reconexión en combate y cómo conservar, soltar o proteger inventario del avatar desconectado.
- Equipamiento al reiniciar un capítulo fallido y límites/capacidad/rareza del loot.
- Qué progreso de invitado puede convertirse en cuenta permanente sin duplicar recompensas.
- Normativa aplicable a gacha de pago, probabilidades, edad, plataformas y condiciones de compra: **no desarrollar cobros aleatorios antes de validación legal**.
- Requisitos de servidor, coste y privacidad para chat de voz en línea.
- Reglas de ranking oficiales ante semillas de clima, abandonos y extracción parcial.

**Regla final:** conservar el legado jugable y las pruebas mientras se construye un producto visualmente nuevo. La biblia representa la intención creativa; solo una implementación probada y aprobada representa una función terminada.
