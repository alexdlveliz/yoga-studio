# Yoga Studio

Aplicación en español para consultar el horario semanal y crear y editar clases. Este despliegue es una **demostración pública de un trabajo académico**: cualquier visitante puede modificar los registros compartidos. Usa únicamente datos ficticios. No incluye acceso de estudiantes, autenticación, pagos ni notificaciones.

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

Abre <http://127.0.0.1:8000/>. También puedes exportar las variables en la sesión y usar `pnpm run db:init` y `pnpm start`. `db:init` y el alias `db:migrate` preparan el esquema PostgreSQL de forma transaccional y repetible; no borran registros. No ejecutes el procedimiento SQLite de versiones anteriores.

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

La matrícula solo existe como estructura interna para proteger el cupo; aún no hay una interfaz de inscripción, paquetes ni contabilidad de accesos. Futuras escrituras de matrícula deben conservar el bloqueo de la clase y añadir las reglas aprobadas de paquetes, reembolsos y orden FIFO.
