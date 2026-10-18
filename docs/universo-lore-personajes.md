# DEAD ZONE: OUTBREAK — Universo, lore y protagonistas
**Versión:** 0.1 · **Estado:** política narrativa confirmada; universo y biografías **aún por redactar y aprobar**.  
**Complementa:** [Biblia visual](biblia-visual-diseno.md) y [Arquitectura funcional](arquitectura-funcional-producto.md).

## 1. Decisión narrativa de producto — CONFIRMADA

**Todo el lore oficial y toda la historia conocida de los personajes deben poder consultarse desde el inicio en la página web del juego.** No será un misterio que únicamente se revele tras completar campañas ni se bloquearán biografías, acontecimientos fundamentales u origen del apocalipsis detrás de partidas, niveles, monedas, cuentas de pago o recompensas.

- El usuario puede leer estas páginas **sin iniciar sesión**, incluso si no ha jugado.
- La historia principal deberá explicar claramente **qué provocó el apocalipsis, cómo comenzó, cómo se extendió y qué sucedió hasta el presente del juego**, una vez que esas respuestas hayan sido escritas y aprobadas.
- Los perfiles de personajes incluirán **nombre real, identidad, profesión anterior, pasado, personalidad, motivación, relación con el brote y compañeros, y habilidades**, con la información que se apruebe para el canon.
- Las sinopsis de campañas, lugares, facciones y enemigos también estarán disponibles desde la web, diferenciando hechos narrativos oficiales de instrucciones de misión.
- **Nuevos contenidos en el futuro:** cuando se publique una campaña o personaje nuevo, se publicará simultáneamente su información narrativa correspondiente. No prometer hoy un lore de expansiones todavía inexistentes.
- Los documentos, conversaciones, transmisiones o archivos encontrados dentro del juego pueden **recrear, dramatizar o ampliar** acontecimientos ya publicados; nunca serán la única forma de descubrir un dato fundamental del universo o el pasado de un personaje.
- Se puede seguir contando una historia emocionante mediante decisiones, tragedias, relaciones y eventos experimentados en la campaña, **sin ocultar artificialmente el origen del brote ni el pasado de los protagonistas**.

## 2. Arquitectura de la web y navegación — CONFIRMADA como objetivo

Desde bienvenida y menú principal habrá un acceso claramente visible a **«Universo» / «Historia»**, con estas secciones orientativas (etiquetas definitivas sujetas a revisión):

1. **Historia del apocalipsis:** origen, agentes implicados, lugar y momento inicial, propagación, respuesta social y situación actual.
2. **Cronología:** hitos ordenados desde antes del desastre hasta el momento del juego, con fecha cuando el canon la establezca.
3. **Supervivientes:** ficha individual de las cuatro clases (Soldado, Médica, Mecánico y Explorador): nombre real, retrato V4, oficio previo, historia completa, relaciones, habilidades y variantes de apariencia.
4. **Campañas y regiones:** sinopsis de cada campaña, incluidos los cuatro mapas de **Aguas tenebrosas**, y descripción del mundo.
5. **Facciones e infectados:** grupos del universo, orígenes de los tipos de zombis y amenazas importantes cuando su canon esté definido.
6. **Archivo narrativo:** lecturas, radio y documentos complementarios, accesibles también fuera de las partidas cuando formen parte del canon.

**Regla editorial:** una página del lore no es una pantalla de misión bloqueada. El botón «Leer historia» no requiere iniciar sesión, no consulta progreso ni desbloqueos y no ofrece ventajas jugables. Usar ilustraciones originales, buen contraste, títulos legibles, organización fácil de recorrer y adaptación a pantallas móviles. El arte de retratos y UI debe seguir la estética 2D ilustrada aprobada en V4/V4.1.

**Versionado:** mantener contenido narrativo como datos/Markdown estructurados por capítulo, personaje y localización, con claves estables y posibilidad de traducciones futuras. No incrustar párrafos largos únicamente dentro de imágenes. Asegurar accesibilidad y rendimiento de la web.

## 3. Protagonistas — CLASES CONFIRMADAS, PERSONAS AÚN NO CANÓNICAS

Clases del prototipo: `soldier` (**Soldado**), `medic` (**Médica**), `mechanic` (**Mecánico**) y `scout` (**Explorador**). Sus nombres reales, edades, profesiones exactas y antecedentes **todavía no han sido aprobados oficialmente**.

En conversación se exploraron como **ejemplos provisionales, no nombres definitivos**: Adrián Vega (Soldado), Valeria Cruz (Médica), Bruno Salazar (Mecánico) y Lucía Torres (Exploradora). **Codex no debe imprimir estos nombres como canon definitivo ni utilizarlos como identificadores de datos sin confirmación.**

Plantilla de ficha de personaje para aprobación editorial:
- ID técnico estable de clase (independiente de apodo y cosméticos).
- Nombre real y apodo de la historia.
- Retrato/ilustración en el estilo aprobado.
- Trabajo y vida antes del apocalipsis.
- Experiencia durante el inicio del brote.
- Motivación, personalidad, relaciones y objetivos actuales.
- Habilidad activa, pasiva y limitaciones.
- Diálogos/radio relacionados con campañas.
- Fecha o versión editorial de publicación.

## 4. Habilidades de clase — PROPUESTAS, NO APROBADAS PARA BALANCE

El objetivo propuesto es una **habilidad activa especial** y una **especialización pasiva** por personaje, relacionadas con su historia y útiles en juego individual o cooperativo:

| Clase | Activa propuesta | Pasiva propuesta |
| --- | --- | --- |
| Soldado | **Frenesí:** durante segundos aumenta la cadencia de disparo y los ataques cuerpo a cuerpo, consumiendo munición normal | mejor control de retroceso |
| Médica | **Estación de curación:** torreta/dispositivo desplegable que sana aliados en área y puede ser destruido | revive compañeros con mayor rapidez |
| Mecánico | **Sobrecarga:** mejora temporalmente el funcionamiento de una torreta/dispositivo cercano | repara estructuras con mayor eficiencia |
| Explorador | **Instinto de supervivencia:** pulso temporal que ayuda a localizar suministros/amenazas cercanas | mayor capacidad para desplazarse por terreno difícil |

**Reglas:** todos conservan movimiento, apuntado, disparo, dash, construcción básica, rescate e interacción; ninguna misión debe exigir obligatoriamente una clase. Los tiempos, daños, alcance, consumo de recursos, enfriamientos, mejoras y efectos deben equilibrarse y aprobarse con pruebas, especialmente para rankings. Habilidades jugables ≠ cosméticos comprables. Es posible añadir más personajes en el futuro, pero sin ampliar el catálogo antes de equilibrar los cuatro actuales.

## 5. Estado del canon y criterios de publicación

**CONFIRMADO:** mundo zombi posapocalíptico; dos modos principales (Supervivencia y Campaña); cuatro clases; «Aguas tenebrosas» como campaña de cuatro mapas; lore y biografías completas accesibles desde la web al inicio; arte ilustrado V4.

**PROPUESTAS NARRATIVAS AÚN NO CONFIRMADAS:** origen por experimento de regeneración celular, propagación a través de hospitales/agua, unidad militar desaparecida, vínculos pasados de personajes con una instalación, cualquier facción o corporación concreta, y los cuatro nombres personales mostrados como ejemplos. No tratar estos elementos como hechos fijados del universo.

**Antes de programar la sección final:** escribir y aprobar (a) explicación definitiva del brote, (b) línea de tiempo y regiones, (c) cuatro biografías completas, (d) tono narrativo y (e) relación de cada campaña con la historia global. Hasta entonces sí se puede crear una **pantalla estructural de muestra con textos expresamente marcados como provisionales**, no publicar ficciones como canon.

### Criterios de aceptación futuros
- Persona sin cuenta navega a Historia y puede leer el origen completo del apocalipsis, sin bloqueos de progreso.
- Persona sin cuenta accede a los cuatro perfiles completos desde el menú principal.
- Un personaje añadido posteriormente tiene ficha pública disponible el día de su lanzamiento.
- Archivos narrativos encontrados en las misiones no son el único acceso a un hecho obligatorio del canon.
- Identidad de la web, retratos, botones y fondos sigue la dirección artística V4; lector de pantalla y móvil pueden acceder al texto.
- La UI no presenta nombres, fechas, habilidades ni explicaciones como definitivas hasta aprobación editorial.

**No se implementaron páginas, lore ni habilidades con este documento.**
