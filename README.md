# DEAD ZONE: OUTBREAK

Juego de supervivencia zombi 2D para navegador, con combate híbrido (disparo manual + apoyo automático), movimiento libre y progresión por misiones. Primera sala multijugador de 1–4 jugadores incorporada; el combate compartido se implementará por fases.

## Estado

Prototipo Canvas 2D conservado en `public/legacy/index.html`, con pruebas reales de navegador mediante Playwright. Phaser ya es una dependencia, pero el juego todavía no lo utiliza. La portada permanece en `/` y el prototipo en `/legacy/index.html`.

Diagnóstico, evidencia y alcance: [docs/diagnostico-legacy.md](docs/diagnostico-legacy.md). Plan por etapas y criterios de aceptación: [docs/migracion-phaser.md](docs/migracion-phaser.md). Resumen listo para revisión: [docs/revision-base-pruebas.md](docs/revision-base-pruebas.md).

Multijugador: [diseño técnico y fases](docs/diseno-multijugador.md), [modelo PostgreSQL propuesto](db/migrations/001_multiplayer_design.sql) y [verificación de la primera sala](docs/verificacion-multijugador.md).

## Desarrollo local

Requisitos: Node.js 22.12+ (la CI usa Node 22) y Git.

```bash
npm ci
npx playwright install chromium
npm run dev
```

Abrir `http://127.0.0.1:5173/legacy/index.html`. En Windows PowerShell, si la política de scripts bloquea `npm.ps1` o `npx.ps1`, usar `npm.cmd` y `npx.cmd`; no es necesario cambiar la política de seguridad. Para ejecutar `npm ci` en Windows, cerrar primero los servidores de este proyecto: sus binarios de esbuild/Rollup pueden quedar bloqueados.

## Sala multijugador local

En una segunda terminal, ejecutar `npm run dev:server`. Abrir `http://127.0.0.1:5173/multiplayer` y crear una sala. Compartir el ID con hasta otras tres pestañas o sesiones del mismo equipo de desarrollo; cada una puede entrar por ID y elegir Soldado, Médica, Mecánico o Explorador. El servidor escucha solo en `127.0.0.1:2567` (configurable con `PORT`). La interfaz local utiliza el puerto 2567; si se cambia, ajustar también su endpoint.

El primer ingreso inicia los 30 segundos. Al vencer, el servidor asigna clases libres y cuenta cinco segundos hasta «Equipo preparado». No adelanta el cierre porque todos hayan elegido. Una caída reserva plaza y clase 20 segundos, con reconexión automática del SDK o recuperación tras recargar la misma pestaña; salir voluntariamente libera la plaza durante selección. Al cerrar la selección no se admiten sustituciones. Si nadie está conectado al acabar la cuenta regresiva, se cancela.

Esta entrega prepara salas: no conecta todavía el combate del prototipo, no aplica especializaciones de clase y no guarda equipos/rankings. El SQL es un diseño para revisión, sin conexión de base de datos ni ejecución automática. Los jugadores actuales son invitados por sesión; las cuentas autenticadas y equipos permanentes pertenecen a la siguiente fase.

Para iniciar Codex en la carpeta del proyecto:

```bash
codex
```

## Prioridades v0.3

1. Arte pixel art más reconocible, con personajes y zombis animados y escenarios urbanos coherentes.
2. Mundo más amplio, cámara que sigue al jugador, exploración y puntos de interés.
3. Escalado de dificultad real (hordas, enemigos especiales y control de mejoras).
4. Armas evolucionables inspiradas en juegos arcade: tiro triple, láser, ráfaga y munición perforante.
5. Misión por etapas con extracción, sin olvidar dash y disparo en movimiento.

## Calidad

```bash
npm run build
npm test
npm run test:server
npm run test:e2e -- --repeat-each=3
npx playwright show-report
```

`npm test` ejecuta primero pruebas de dominio/red con Node y SDK Colyseus y luego Playwright. Las pruebas de red usan un puerto efímero y una configuración corta solo para su servidor. Las de navegador mantienen los 30 + 5 segundos reales.

Playwright inicia su propio Vite en `127.0.0.1:4173` y Colyseus en `127.0.0.1:2567`, usa Chromium con dos workers y no reutiliza servidores existentes. Dejar libres ambos puertos; detener el servidor multijugador manual antes de ejecutar la suite. No hace falta iniciar Vite ni Colyseus manualmente para las pruebas. En Linux/CI, instalar Chromium con `npx playwright install --with-deps chromium`.

La suite comprueba entradas de teclado/mouse, movimiento, disparo, dash, suministros, victoria, daño, derrota, reinicio y errores de JavaScript/consola/red. Un smoke comprueba el bucle con reloj real; las pruebas detalladas controlan los frames con el reloj de Playwright. Las fuentes de Google se sustituyen por CSS vacío solo en las pruebas, para permitir ejecución sin Internet; las capturas usan las fuentes de reserva originales.

Las imágenes y estados JSON se guardan por prueba en `test-results/`; el informe HTML en `playwright-report/` y el resumen JSON en `test-results/report.json`. Se regeneran en cada ejecución y están excluidos de Git. La CI los adjunta como artefactos durante siete días.

Hay dos defectos conocidos marcados con `test.fail`: selector vacío al agotar mejoras (DZO-001) y mundo menor que una ventana QHD (DZO-002). Playwright los contabiliza entre los resultados esperados: un resultado global verde **no significa que estén corregidos**. Si se solucionan, su aceptación pasará inesperadamente y habrá que retirar la marca. Consultar el diagnóstico para distinguir recorridos reales, escenarios controlados y comprobaciones pendientes.
