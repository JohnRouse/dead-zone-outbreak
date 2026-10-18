# DEAD ZONE: OUTBREAK — Arquitectura funcional, cuentas, inventario y servicios
**Versión:** 1.0 · **Estado:** decisiones de producto y diseño técnico para desarrollo incremental; **no equivale a implementación**.  
**Complementa:** [Biblia visual y de diseño](biblia-visual-diseno.md), [Diseño multijugador](diseno-multijugador.md) y [AGENTS.md](../AGENTS.md).

> **Instrucción a Codex:** leer ambos documentos rectores antes de cualquier tarea de cuentas, salas, loot, tienda, menús o persistencia. Distinguir siempre entre **CONFIRMADO** (decisión de producto), **PROPUESTA** (hipótesis a probar) y **PENDIENTE** (no inventar política). La existencia de este documento no habilita por sí sola compras, servicios externos ni cambios en la base de datos.

## 1. Producto: principios innegociables

- **CONFIRMADO:** videojuego web gratuito; cooperación de **1–4 supervivientes**, cuatro clases exclusivas por sala: `soldier`, `medic`, `mechanic`, `scout`.
- **CONFIRMADO:** el poder se obtiene *dentro de las partidas*. Ningún cosmético, compra, colección, avatar, marco o moneda de tienda modifica estadísticas, capacidad de mochila, daño, cadencia, rareza de loot o resultados competitivos.
- **CONFIRMADO:** estilo **2D ilustrado top-down, caricaturesco, colorido pero sombrío**, a aplicar también en bienvenida, autenticación, lobby, perfiles, inventario, arsenal, tienda y recompensas. Referencias como *Nobody Saves the World* inspiran lenguaje visual; no se copian recursos propietarios.
- **CONFIRMADO:** campaña y supervivencia tienen reglas, progreso y rankings separados; construcción, recuperación de compañeros y exploración libre con comunicación de equipo.
- **CONFIRMADO:** el inventario permanente de cuenta es una **colección de derechos cosméticos y progreso**, no un almacén de armas físicas para llevar gratis a la siguiente partida.
- **PENDIENTE:** precios, proveedores, límites de inventario, balance de armas, caducidad de recompensas, sistemas fiscales y requisitos territoriales. No codificar números de ejemplo como economía final.

## 2. Tres ámbitos de estado (no mezclarlos)

| Ámbito | Ejemplos | Vigencia | Autoridad |
| --- | --- | --- | --- |
| **Cuenta permanente** | identidad, métodos de acceso vinculados, apodo, cosméticos poseídos/equipados, monedas persistentes autorizadas, misiones reclamadas, perfil, historial y rankings validados | entre sesiones | backend + PostgreSQL futuro |
| **Campaña en curso** | capítulo 1–4, personajes, armas encontradas, munición, protecciones, mochila, curaciones y recursos, posición, muerte, loot caído | desde inicio de campaña hasta su fin o fracaso según política de reintentos | servidor autoritativo Colyseus; checkpoints persistentes solo si se diseñan |
| **Sesión/sala efímera** | presencia, conexión, reserva para reconexión, votos, mensajes, lobby, selección de clase y emparejamiento | durante estancia/reconexión | servidor Colyseus; Redis **solo cuando el escalado lo requiera** |

Nunca mostrar una skin como «fusil desbloqueado para empezar campañas». Poseer cosmético ≠ poseer físicamente arma dentro de la partida. Evitar escrituras SQL por cada paso, bala o frame.

## 3. Campaña: continuidad de inventario confirmada

**CONFIRMADO:** cada **nueva campaña** empieza con equipo básico y suministros limitados (ej.: pistola, munición inicial y mochila básica). En **Aguas tenebrosas**, los **cuatro mapas** comparten la misma progresión de loot por jugador: del mapa 1 se llevan al 2 el armamento, munición restante, curas, protecciones y mochila; así hasta el mapa 4. Iniciar otra campaña reinicia *todo el equipamiento jugable*, no los cosméticos permanentes.

- **Looteo:** explorar edificios/sectores proporciona armas, munición correspondiente, botiquines, materiales, casco, chaleco y mochilas. Los suministros se pueden compartir/transferir entre compañeros bajo reglas validadas por servidor.
- **Equipo con propiedades:** únicamente **casco, chaleco y mochila** ocupan ranuras de equipamiento. El casco y el chaleco protegen según reglas de daño que deberán probarse; la mochila controla capacidad de almacenaje. **Botas y guantes NO son ranuras de equipamiento jugable.** Ropa/conjuntos son solo cosméticos.
- **Armas físicas:** categorías cuerpo a cuerpo, arma de fuego y arrojadizo (futura entrada 1/2/3). Fusil, escopeta, pistola, ballesta y otros modelos tienen munición/cargadores, recargas y características propias; los objetos concretos y números quedan **pendientes de balance**.
- **Arma personal automática/manual:** el fusil disparado automáticamente o mediante clic sigue siendo **la misma arma**, con el mismo cooldown, cargador y munición; cambiar de modo no duplica proyectiles. Las torretas construidas son estructuras independientes.
- **Supervivencia:** economía, aprovisionamiento y reinicio de cada nueva sesión de oleadas tienen reglas específicas, distintas a la persistencia de cuatro mapas de campaña; confirmar antes de desarrollarlo.

### Estados y transiciones de ejemplo

| Situación | Equipo físico del jugador | Cosméticos de cuenta |
| --- | --- | --- |
| Nueva campaña | kit básico | se aplican al modelo de arma/conjunto cuando corresponda |
| Capítulo 1 → 2 tras éxito | **se conserva** el loot disponible del superviviente | intactos |
| Fallece de forma definitiva en capítulo 2 | genera contenedor de loot | intactos |
| Compañero recoge el contenedor | transferencias al inventario del recolector según capacidad; sin duplicar | intactos |
| Nadie recoge loot y el equipo evacúa | loot abandonado se pierde con el mapa | intactos |
| Jugador fallecido reaparece en capítulo 3 si el equipo triunfó | vuelve **solo con kit básico** | intactos |
| Se inicia una campaña distinta | kit básico, sin importar loot anterior | intactos |

**CONFIRMADO:** jugador incapacitado tiene oportunidad de rescate físico por sus compañeros, con plazo. Una vez fallecido definitivamente deja **una caja de loot** que contiene todo su equipamiento y suministros jugables. El equipo decide si recuperarla o la deja y se pierde al abandonar el mapa. El jugador fallecido permanece conectado como espectador (sin poder revelar áreas desconocidas), y si los supervivientes completan el capítulo puede regresar en el siguiente **con equipo básico**, recibiendo ayuda de otros o volviendo a lootear. Si todos mueren, el capítulo falla.

**PENDIENTE:** qué bienes son recuperables de misión (claves/objetos únicos), política al reiniciar capítulo fallido, duración de caja, cómo se protege la caja durante una caída de red y el tiempo de rescate definitivo. Un ítem de misión no debe hacer imposible el objetivo: permitir recuperación/reasignación validada.

**Garantías de ingeniería:** operaciones atómicas para soltar caja, reclamar pila, transferir, equipar, consumir, morir, revivir y cerrar capítulo. Cada ítem tiene identidad o stack con cantidad explícita y cambios idempotentes: ninguna reconexión, clic duplicado o retransmisión puede clonar objetos. Autoridad en servidor, nunca confiar en inventarios enviados por cliente.

## 4. Salas públicas, incorporación en progreso y reconexión

**CONFIRMADO:** habrá directorio de **partidas en vivo** con campaña, capítulo, dificultad, ocupación `3/4`, estado y acceso público/privado. Al perder una plaza por abandono/desconexión definitiva, otro usuario podrá **incorporarse a una campaña iniciada**, recibir una clase disponible y aparecer **con kit básico en una zona segura**; no hereda armas, equipo ni cosméticos del usuario sustituido. Puede comunicarse por texto y, posteriormente, voz; recibir pings/avisos.

Distinguir explícitamente:
1. **Pérdida temporal de internet:** reservar plaza, clase, estado y loot un plazo configurable; el usuario original se reconecta con la **misma identidad**, nunca como recién llegado. No se ofrece plaza pública durante la reserva.
2. **Abandono confirmado / reserva vencida:** el servidor libera plaza según política de abandono y la anuncia como disponible. La reconciliación de inventario/actor se hace una única vez, sin clonación.
3. **Muerte definitiva mientras sigue conectado:** el jugador es espectador hasta el siguiente capítulo; no se vende su plaza como desconexión ni se sustituye de manera oportunista para evitar una vida extra.
4. **Ingreso nuevo:** verificación servidor de capacidad, identidad, clase exclusiva y spawn seguro sin zombis inmediatos ni bloqueo de progreso. La cantidad de objetivos pendientes debe escalar al equipo activo; si falta una clase, otra puede completar objetivos críticos.

**Situación actual:** el lobby Colyseus existente en las ramas de desarrollo reserva plaza **20 segundos durante la selección**. No asumir que ya funciona ingreso en combate, directorio público o reconexión de campaña. **PENDIENTE:** timeout de reconexión de partida (90 s es solo una propuesta conversada), comportamiento del avatar durante la ausencia, transferencia/abandono de objetos, entrada en momentos de combate críticos, privacidad de salas, expulsión/mute y reglas exactas para abandonar/retomar.

Para rankings registrar participantes iniciales, uniones tardías, duración de participación, desconexiones y sustituciones. Distinguir clasificación competitiva sin sustituciones y partidas públicas casuales hasta validar políticas. Un recién llegado al último capítulo no hereda mérito de capítulos previos.

## 5. Cuentas, apodos y modo invitado

**CONFIRMADO:** ofrecer acceso con **Google, X, TikTok o cuenta propia con datos/correo**, junto con **Jugar como invitado**. Implementar primero **Google + cuenta propia**, luego X/TikTok tras comprobar registro de aplicación, OAuth/OIDC aplicable, permisos, costes y reglas de sus proveedores.

- Usuario nuevo autenticado por proveedor: asignar **apodo provisional aleatorio** modificable luego; validar unicidad, caracteres, longitud, palabras prohibidas y cadencia de cambios. El ID estable de cuenta NO depende del apodo.
- Identidades vinculadas: un usuario puede vincular proveedores a **una sola cuenta** mediante operación autenticada/reconfirmada; no fusionar automáticamente cuentas por correo sin seguridad.
- Cuenta propia: validación de correo/credenciales, contraseñas gestionadas por proveedor o hash robusto; protección contra abuso, recuperación de acceso y controles de sesión.
- **Invitado:** puede probar el juego y guardar avances **solo en memoria de su sesión temporal**. Sin compras, saldo persistente, desbloqueos permanentes ni rankings oficiales. Al cerrar/perder sesión sin registrarse, todo avance temporal se pierde. Explicarlo antes de salir.
- **Conversión de invitado a cuenta sin salir del juego:** permitir crear/vincular cuenta y migrar una **selección explícita de progreso elegible** de esa sesión al nuevo perfil, una sola vez y con validación de servidor. No transferir automáticamente monedas monetarias, compras, recompensas repetibles u objetos prohibidos. Mantener continuidad de la partida si es técnicamente seguro.
- **Seguridad:** cookies/sesiones seguras, CSRF donde corresponda, protección de tokens, límite de intentos, revocación, auditoría de cambios de identidad; nunca guardar contraseñas ni secretos OAuth en cliente.

**PENDIENTE:** si el invitado participa en salas públicas con usuarios registrados o solo modo prueba; retención de cuentas, política de apodos, elegibilidad de hitos de campaña a convertir e integración Android. No prometer todas las redes sociales para el primer lanzamiento.

## 6. Cosméticos: variantes de clase y armas universales

La cuenta tiene un **Arsenal/Armario** de apariencias, NO armas jugables. El catálogo puede mostrar todos los modelos de arma base, pero poseer una skin no habilita su uso hasta que esa arma sea looteada en campaña o ganada por reglas del modo.

- **Conjunto de personaje:** *por clase*. Ejemplo «Operación Panda»: `panda-soldier`, `panda-medic`, `panda-mechanic`, `panda-scout`, cuatro derechos cosméticos independientes. Un usuario puede poseer solo uno o los cuatro; no aplicar el traje del Soldado automáticamente a la Médica.
- **Colección aleatoria sin duplicados:** cuando esté disponible como **recompensa ganada jugando**, escoger solo entre las variantes no poseídas, hasta completar cuatro. Una vez completa, el sistema detiene nuevas entregas o especifica otra recompensa; jamás confundir el inventario de posesión con las probabilidades.
- **Skins de armas:** asignadas a **modelo o familia explícitamente compatible**, no a clase; todos los personajes que looteen un rifle compatible ven la apariencia que el usuario tiene equipada. No conferir velocidad, mejor mira, daño, menor retroceso ni camuflaje injusto.
- **Más cosméticos posibles:** avatares, marcos de perfil, gestos, mochilas decorativas, efectos no competitivos. Deben conservar silueta y legibilidad, sin modificar hitbox ni visibilidad injustamente.
- **Al entrar a partida:** resolver `skin(modelo_arma, cuenta)` y `outfit(clase, cuenta)` desde datos verificados del servidor; si falta derecho o la skin no es compatible, mostrar aspecto básico. Los demás jugadores ven cosméticos equipados, sujetos a límites de rendimiento.

### Pagos y gacha — exclusión expresa de la primera implementación
**CONFIRMADO:** el juego será gratuito y **sin ventajas de pago**. Se contempla **venta directa** de cosméticos en el futuro. Sorteos aleatorios/gacha y moneda comprable para tiradas **NO están autorizados para implementación ni monetización** hasta revisión legal, de plataformas, jurisdicciones, edad, probabilidades, protección del consumidor, pagos y política de reembolsos. La cifra «0,001 %» fue una idea exploratoria, **NO una tasa aprobada**.

Misiones recompensadas jugando podrán entregar fichas, objetos y eventualmente recompensas cosméticas aleatorias sin pago, sujetas a transparencia y revisión de diseño. Nunca añadir compra de tiradas, cajas aleatorias pagadas ni embudos de conversión por iniciativa del agente.

## 7. Misiones, economía permanente y premios

- Desafíos: completar mapas/campañas, alcanzar oleadas, rescatar compañeros, etc. Frecuencias diarias, semanales y logros permanentes **propuestos**, con reclamación servidor y límites contra repetición/abuso.
- Monedas de progresión ganadas jugando: saldos registrados mediante **libro mayor (ledger)**, no una cifra mutable sin historial; separar monedas ganadas de las comprables si llegaran a existir.
- Entregar cosméticos, monedas y logros **una sola vez** mediante claves de idempotencia, eventos verificables y transacciones.
- Duplicados de cosméticos: en colecciones sin duplicado se excluyen del sorteo; otros premios de colecciones generales exigen regla documentada para canje/fragmentos, **todavía pendiente**.
- Cambios de precios, tasas y premios: catálogo versionado y fechas auditables; nunca alterar retrospectivamente resultados reclamados.
- Anti-trampas: campañas/oleadas completadas, tiempo y resultados deben validarse en servidor; sesiones de invitado no generan automáticamente premios permanentes.

## 8. UI/UX: la identidad visual aplica a TODO el producto

**CONFIRMADO:** bienvenida, registro, recuperación de cuenta, perfil, inventario de cuenta, mochila dentro del juego, Arsenal, Armario, tienda, centro de misiones, selección de campaña, buscador de salas, lobby, selección de personaje, resultados y ranking deben **compartir el lenguaje gráfico aprobado**: ilustración 2D pintada, personajes caricaturescos, contorno orgánico, formas en capas, color vivo con penumbra, luces cálidas/locales y fondos narrativos.

Evitar interfaz genérica de «tarjetas rectangulares negras», textos diminutos, saturación de banners, demasiadas monedas, adornos que tapen la lectura o replicar la pantalla de otro juego.

**Guía de sistema de diseño:**
- Componentes web HTML/CSS/TypeScript para pantallas y formularios, Phaser para mundo/escenas; usar tokens comunes de color, tipografía, espaciado, formas y efectos de foco.
- Fondo ilustrado original con profundidad/parallax moderado y zonas tranquilas para texto; paneles pintados con borde controlado, iluminación localizada y jerarquía. Botones grandes, feedback de hover/focus/disabled/loading y estados vacíos.
- Personajes animados/retratos de las cuatro clases en lobby; destacar exclusividad, cuenta regresiva real y reserva de puesto sin ocultar conectividad.
- Tienda: separar **poseído**, **equipado**, **disponible**, **sin acceso**; mostrar qué clase/modelo admite cosmético; vista previa y precio inequívocos. Nada que sugiera estadísticas mejoradas por skin.
- Perfil: apodo editable, avatar y marco visibles, cosméticos poseídos, historial y estadísticas verificadas; no exhibir emails/tokens.
- Invitado: señalización clara de que nada permanente se guarda, y acceso visible a «Crear cuenta para conservar progreso elegible».
- Accesibilidad: contraste, subtítulos de radio, navegación por teclado, etiquetas para lectores de pantalla, tamaño responsivo, reducción de movimiento/destellos, controles de voz y chat si existen.
- Localización inicialmente español; preparar claves de texto/i18n. No quemar textos en fondos o sprites si son traducibles.
- Producir **una pantalla de referencia de bienvenida y una de lobby** para aprobación visual antes de diseñar el catálogo; Playwright para capturas a 1280×720 y 1920×1080 y pruebas de flujo.

## 9. Arquitectura objetivo y responsabilidades

**No desplegada en producción.** Mantener modularidad prevista:

| Componente | Responsabilidad | No debe hacer |
| --- | --- | --- |
| Cliente web (Vite + Phaser + UI HTML/CSS) | render, controles, interfaz, feedback y predicción de movimiento si procede | decidir daño, loot o saldo permanente |
| Colyseus + dominio TypeScript de simulación | salas, movimiento, combate, drops, inventario de campaña, misiones, votos, muertes, reconexión y resultados | confiar en datos inventados por cliente |
| API backend / capa de servicios | identidad, catálogo, misiones, compras autorizadas, validación y cuentas | exponer secretos ni procesar pagos solo en navegador |
| PostgreSQL gestionado | identidad, vínculos, derechos cosméticos, ledger, progreso, equipos, rankings y auditoría | almacenar cada proyectil o posición a cada frame |
| Redis compartido (escala posterior) | presencia, coordinación entre procesos y emparejamiento | reemplazar almacenamiento durable |
| CDN / almacenamiento de recursos | texturas, sonidos, fondos, atlas versionados | almacenar secretos o derechos de propiedad en archivos públicos |

**Modelo de datos conceptual** (NO migración SQL ejecutable):
- `Account(id, nickname, createdAt, status)`, `AuthIdentity(accountId, provider, providerSubject)`, `GuestSession(id, expiresAt, ephemeralState)`.
- `CosmeticDefinition(id, category, compatibleWeaponModelId?, characterClassId?, version)`; `OwnedCosmetic(accountId, cosmeticId, acquiredVia, acquiredAt)`; `EquippedCosmetic(accountId, slotOrModel, cosmeticId)`. Índice único `(accountId, cosmeticId)`.
- `WeaponDefinition(id, category, ammoType, magazineSize, fireMode, ...)`; `LootDefinition(id, type, stackRules)`, catálogo compartido versionado y sin autoridad de compra en navegador.
- `CampaignRun(id, campaignId, mode, difficulty, rulesVersion, status)`, `ChapterRun(runId, chapterIndex, startedAt, endedAt)`, `RunMember(runId, accountOrGuestRef, classId, joinAt, leaveAt, status)`, `RunLootState` gestionado en servidor y solo persistido cuando haya requisito de recuperación.
- `RoomDirectoryEntry` derivado de estado autoritativo de sala, con reservas y cupo; no confiar en contador mostrado en cliente.
- `MissionDefinition`, `ClaimedReward`, `CurrencyLedgerEntry`, `StoreCatalog`, `PurchaseLedger`, `MatchResult`, `LeaderboardEntry`; claves de idempotencia y transacciones en todos los movimientos de valor.

**Nunca** aplicar el SQL histórico `db/migrations/001_multiplayer_design.sql` sin verificar cómo se integrará con cuentas, pertenencia a equipos, propiedad de cosméticos, inventarios de sesión y restricciones. Planificar migraciones reversibles, backups, pruebas de concurrencia y controles de acceso antes de producción.

## 10. Escalabilidad, despliegue y futuro Android

- Separar frontend estático/CDN del servidor WebSocket (Colyseus); TLS/WSS, autenticación, límites de conexiones, métricas y health checks.
- Una sala admite máximo cuatro jugadores. **100 conectados ≈ 25 salas llenas** es un cálculo de capacidad lógica, **no** una garantía de rendimiento. Probar 25 salas concurrentes con enemigos, daño, loot, votos y reconexión; medir CPU, RAM, latencia, red, picos y fallos, con hardware objetivo definido.
- Mantener simulación autoritativa, límites de mensajes y protección contra trampas; escalar horizontalmente solo cuando los benchmarks indiquen necesidad; coordinación compartida mediante Redis/presencia cuando haya múltiples procesos.
- PostgreSQL administrado con conexión agrupada, backups y restauración verificada; separación de producción/staging, logs estructurados, alertas y rotación de secretos. Estimar coste real de conexiones, servidores y transferencia de assets.
- **Android futuro:** reutilizar motor/web en empaquetado cuando controles táctiles, rendimiento móvil, escalado UI, políticas de tienda y compatibilidad crossplay se hayan validado; no asumir que la web actual está optimizada para móviles.

## 11. Plan de implementación sin romper avances visuales

1. **Documentar (esta entrega):** actualizar biblia visual, crear arquitectura funcional, incorporar referencia a AGENTS/README. Sin mutar código ni migraciones.
2. **Cerrar dirección visual V4/V4.1:** perspectiva, oclusión y cámara pendientes de revisión humana, independiente de la documentación.
3. **Mockups UI ilustrados:** bienvenida, lobby, perfil, Arsenal y tienda sin pagos; probar accesibilidad, responsive y consistencia con la estética V4.
4. **Inventario local de campaña y equipo:** ranuras casco/chaleco/mochila; armas por modelo, stacks de munición, botiquines, cargar/descargar y transferencia; tests deterministas.
5. **Loot y muerte:** contenedor recuperable, sin duplicados, desaparición al cerrar capítulo, respawn básico en capítulo siguiente.
6. **Campaña autoritativa:** cuatro capítulos vinculados, equipamiento conservado entre mapas, muertes, rescates y objetivos escalables.
7. **Directorio de salas + reconexión + join-in-progress:** roles exclusivos, reserva y spawn seguro, no reemplazar muertos conectados, tests con desconexiones simultáneas.
8. **Cuentas + invitados:** Google/credenciales básicas, conversión segura y sesiones; X/TikTok más adelante; no ejecutar integraciones sin credenciales de prueba.
9. **Persistencia y economía cosmética:** PostgreSQL, catálogo, posesión/equipado, skins por clase/modelo, misiones verificadas, pruebas de duplicado y rankings. Tienda **solo de compra directa** en caso de habilitar cobros.
10. **Carga y lanzamiento:** pruebas de 100+ clientes simulados, observabilidad, backups, privacidad, revisión legal de funciones de pago, optimización; Android solo después.

### Pruebas mínimas de aceptación futuras (no ejecutadas)
- Completar cap. 1 con fusil 17 balas + chaleco y arrancar cap. 2 con ese mismo estado, no con un fusil nuevo infinito.
- Morir en cap. 2 → caja con loot íntegro → otro lo recoge una vez → muerto vuelve cap. 3 con equipo básico.
- Desconexión temporal → reserva → reconexión recupera idéntico personaje/inventario; no aparece simultáneamente otra copia.
- Cupo `3/4` tras abandono real → nuevo jugador se une con clase libre y kit básico, aparece en zona segura y no obtiene ranking de capítulo previo.
- Guest juega y cierra sin registro → sin datos durables; guest convierte sesión elegible a cuenta → sin doble pago/recompensa.
- Conjunto Panda: se obtiene solo variante de Soldado; Médica no puede equiparla. Recompensa de colección sin duplicados elige una de otras tres. Skin de fusil compatible visible con las cuatro clases.
- Compra directa de cosmético no cambia ninguna estadística; fallo en red no duplica propiedad/saldo.
- Menús se leen, navegan y tienen estados de foco; capturas auditadas de bienvenida/lobby/tienda con estilo V4.

## 12. Decisiones abiertas (pedir aprobación, no inventarlas)
1. Política de reinicio de capítulo fallido y qué loot recuperan supervivientes.
2. Duración y protección de la caja de loot; objetos de misión.
3. Timeout final de reconexión en combate, IA del avatar ausente y cómo abandonar con recursos.
4. Invitados en salas públicas y alcance concreto de migración invitado→cuenta.
5. Catálogo de armas, cargadores, rarezas, daño, slots y tamaños de mochilas.
6. Criterios de rankings oficiales ante reemplazos y jugadores fallecidos.
7. Sistema de monedas/recompensas y eventual venta directa, precios, jurisdicciones y comprobación legal.
8. Proveedores concretos de hosting, Auth/OAuth, PostgreSQL y pagos tras estimaciones de coste y seguridad.

**Regla final:** esta arquitectura es una especificación de producto, no una declaración de que estas funciones ya estén presentes. No ampliar ni monetizar sin pruebas y aprobación explícita.
