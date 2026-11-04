# Yoga Studio

Aplicación en español para consultar el horario semanal, gestionar clases y mantener estudiantes y sus clases disponibles. Este despliegue es una **demostración pública de un trabajo académico**: cualquier visitante puede modificar los registros compartidos. Usa únicamente datos ficticios. No incluye acceso de estudiantes, autenticación, pagos ni notificaciones.

El servidor Express/EJS conserva sus rutas y funciona localmente o en Netlify Functions. Los registros se guardan en PostgreSQL de Supabase, fuera del despliegue. Los archivos SQLite existentes quedan intactos; no se importan ni se usan durante la ejecución.

## Desarrollo local

Requiere Node.js 24 con ICU completo, pnpm 10.12.4 y PostgreSQL 14 o posterior (o un proyecto Supabase gratuito). Las pruebas de copia requieren `pg_dump` y `pg_restore` de la misma versión principal que el servidor o posterior.

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Edita `.env` con tus conexiones privadas. Node no carga ese archivo automáticamente; para la configuración local:

```sh
pnpm run build
node --env-file=.env dist/init-db.js
node --env-file=.env dist/server.js
```

Abre <http://127.0.0.1:8000/>. También puedes exportar las variables en la sesión y usar `pnpm run db:init` y `pnpm start`. `db:init` y el alias `db:migrate` preparan el esquema PostgreSQL de forma transaccional y repetible; actualizan el esquema v1 conocido a v2 y preservan los registros existentes. Si el esquema no coincide con una versión conocida, la inicialización falla sin aplicar cambios. No ejecutes el procedimiento SQLite de versiones anteriores.

## Despliegue gratuito

La guía [Netlify + Supabase](docs/deployment.md) explica cuentas, conexiones, secretos, preparación, publicación, límites, recuperación y copias de seguridad. Preparar el repositorio no crea cuentas ni publica el sitio. Una vez publicado, usa el dominio HTTPS `*.netlify.app` que proporciona Netlify.

## Verificación

Los tests requieren una conexión `TEST_DATABASE_URL` a un servidor PostgreSQL **de pruebas**, cuyo usuario pueda crear bases de datos. Cada prueba usa una base aislada que se elimina al terminar; no uses credenciales del proyecto compartido. Ejemplo con un PostgreSQL local ya iniciado:

```sh
export TEST_DATABASE_URL=postgresql://localhost/postgres
pnpm run build
pnpm test
pnpm run test:deploy
```

`test:deploy` empaqueta la función con las herramientas de Netlify y la ejecuta desde un directorio temporal separado, comprobando vistas, formularios, errores y recursos estáticos. No publica ni necesita credenciales. Las pruebas de comportamiento usan PostgreSQL real e incluyen duplicados concurrentes, restricciones de cupo para inscritos/en espera, rollback, reintentos y reinicios del proceso.

## Estudiantes y clases disponibles

Desde «Estudiantes» se pueden crear y buscar registros, corregir nombre y teléfono, y archivar con confirmación. Los registros archivados se pueden consultar, pero no editar ni recibir nuevas clases. Cada estudiante tiene un saldo único: al crear se puede comenzar con cero o agregar 1, 5, 10 o una cantidad entera positiva; después se pueden agregar más clases. Los reintentos del mismo formulario no duplican la suma. No se guardan asignaciones ni historial de paquetes.

La matrícula solo existe como estructura interna para proteger el cupo; la inscripción, las deducciones y devoluciones de accesos y la promoción FIFO siguen pendientes. Tampoco están implementadas las notificaciones ni la restauración de estudiantes archivados. La recuperación de la base de datos mediante copias está documentada en la guía de despliegue.
