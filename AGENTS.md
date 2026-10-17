# Instrucciones para Codex — Dead Zone Outbreak

## Documento rector de diseño
- Antes de planificar tareas, leer [`docs/biblia-visual-diseno.md`](docs/biblia-visual-diseno.md). Sus decisiones creativas reemplazan las referencias anteriores a 8 bits/pixel art. Implementar por etapas con aprobación visual humana.
- Distinguir visión futura de funcionalidades que realmente existen. No intentar desarrollar toda la biblia en un solo encargo.

## Objetivo
Desarrollar un juego 2D de zombis para navegador con combate híbrido y futura cooperación en línea. Responder en español en reportes de progreso.

## Reglas principales
- Mantener jugables: WASD/flechas, apuntar con mouse, clic sostenido para disparo manual, arma automática y dash con Espacio/Shift.
- No eliminar funcionalidades existentes sin documentar el motivo y consultar antes de cambios irreversibles.
- Combate: armas manuales y automáticas evolucionables, cadencia, disparo triple, láser, ráfagas y perforación claramente diferenciados.
- La dificultad no debe volverse trivial después de subir de nivel: medir daño recibido, presión de hordas y capacidad de supervivencia.
- Escenario explorable, mayor que la pantalla; cámara siguiendo al personaje, colisiones coherentes y puntos de interés.
- Arte 2D **ilustrado, NO pixel art**, original y consistente; estética colorida pero sombría, top-down, sombras e iluminación expresiva. Evitar sprites geométricos provisionales como versión final y no usar assets de juegos comerciales sin licencia.
- Diseñar módulos independientes para habilitar en el futuro servidor autoritativo y cooperativo de 1–4 jugadores.

## Ciclo de trabajo obligatorio
1. Inspeccionar código y reproducir el problema.
2. Hacer el cambio mínimo que produzca una mejora verificable.
3. Ejecutar `npm run build` y `npm test`.
4. Cuando cambie la parte visual, abrir el juego con Playwright, guardar captura en `test-results/` y revisarla; no dar por satisfactoria una estética solo porque pasó una prueba.
5. Indicar qué se probó realmente y qué sigue sin verificarse.
6. Cambios grandes en ramas y pull requests, sin sobrescribir `main` sin revisión humana.

## Herramientas
Node.js + Vite + TypeScript + Phaser (incorporar durante migración), Playwright para E2E. Colyseus para multiplayer en fase posterior.

## Pruebas recomendadas
Movimiento diagonal y normalizado, dash y cooldown, apuntado/disparo mientras se mueve, proyectiles automáticos y sus mejoras, daño/colisiones, objetivos de misión, cámara/mundo, pausa, final de victoria y derrota, reinicio y ausencia de errores de consola.
