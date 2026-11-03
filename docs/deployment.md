# Desplegar la demostración en Netlify y Supabase

Esta guía prepara una demostración académica pública, editable por todos y con datos ficticios. No requiere dominio propio ni servicios de pago. La creación de cuentas y la publicación son pasos manuales separados de la implementación.

## 1. Crear la base vacía

1. Crea una cuenta Supabase y un proyecto en el plan **Free**. Guarda la contraseña de PostgreSQL en un gestor de contraseñas.
2. En **Connect**, copia las conexiones PostgreSQL del **Transaction pooler** (puerto 6543) y **Session pooler** (puerto 5432). Usa los hosts y usuarios exactos del panel. La conexión directa también sirve para preparar/copiar si tu red admite su direccionamiento. Codifica caracteres especiales de la contraseña como componentes de URL.
3. No se necesita cliente Supabase en el navegador ni claves `anon`/`service_role`. El servidor usa el driver PostgreSQL. El esquema privado `yoga_studio` no debe añadirse a los esquemas expuestos de la Data API. Puedes desactivar la Data API si no la necesitas. La preparación revoca acceso de `PUBLIC`, habilita RLS sin políticas públicas y conserva el acceso del propietario de las tablas. No concedas permisos a los roles `anon` o `authenticated`.
4. Copia `.env.example` a `.env` local y sustituye los valores. Nunca subas el archivo ni pegues conexiones en capturas, comentarios o tickets.

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión del Transaction pooler para el servidor y las funciones. Obligatoria para usar los datos. |
| `DIRECT_DATABASE_URL` | Conexión del Session pooler o directa para preparación y copia/restauración. Solo local; no es necesaria en Netlify. Si falta, `db:init` usa `DATABASE_URL`. |
| `DATABASE_CA_CERT` | Certificado CA PEM completo cuando el proveedor lo requiera; copia el certificado oficial de la configuración de SSL de Supabase. El driver verifica TLS y el nombre del servidor; no desactives la verificación. |
| `STUDIO_LOCALE` | `es-GT` por defecto; determina el primer día de semana. |
| `STUDIO_TIMEZONE` | `America/Guatemala` por defecto; determina la fecha actual del estudio. Usa un identificador IANA válido. |
| `TEST_DATABASE_URL` | Solo pruebas: PostgreSQL desechable con permiso para crear bases, nunca el proyecto compartido. |

Los valores regionales predeterminados son decisiones de configuración de la demo, no una afirmación sobre la ubicación del usuario objetivo. Las fechas y horas de clase siguen siendo valores de calendario del estudio, sin conversión por el navegador. Una configuración regional inválida usa `es-GT`; una zona horaria inválida impide mostrar el horario hasta corregirla.

Con Node 24 y pnpm instalados:

```sh
pnpm install --frozen-lockfile
pnpm run build
node --env-file=.env dist/init-db.js
```

La preparación es explícita: no se ejecuta al arrancar, construir ni desplegar. Usa una transacción y un bloqueo para serializar ejecuciones simultáneas, crea tablas e índices si faltan y nunca trunca, borra ni importa registros. Repítela después de guardar una clase para comprobar que permanece. Un fallo revierte toda la transacción: revisa credenciales, permisos, conectividad y certificado; corrige y repite. No reemplaces una base con datos para resolver un error. Las versiones SQLite previas no se migran con este comando.

## 2. Preparar y publicar en Netlify Free

1. Crea una cuenta Netlify **Free**. Cuando hayas revisado los cambios y autorizado su subida, conecta el repositorio y selecciona la rama revisada. La integración Git puede publicar automáticamente cada cambio posterior: revisa la política de despliegue antes de activarla.
2. Usa `netlify.toml`: comando `pnpm run build`, directorio publicado `build`, funciones en `netlify/functions`, Node 24 y pnpm fijado. El directorio publicado contiene únicamente CSS; no selecciones la raíz, `src` ni `dist` como directorio público.
3. En la configuración de variables del proyecto, crea `DATABASE_URL`, `STUDIO_LOCALE`, `STUDIO_TIMEZONE` y, si hace falta, `DATABASE_CA_CERT`. Limita los secretos al ámbito **Functions**. No pongas contraseñas en `netlify.toml` ni variables con prefijos públicos. No hace falta proporcionar `DIRECT_DATABASE_URL` ni `TEST_DATABASE_URL` a Netlify. Establece `AWS_LAMBDA_JS_RUNTIME=nodejs24.x` en el panel si necesitas fijar expresamente el runtime de Functions.
4. Publica desde el panel. Netlify compila TypeScript y empaqueta Express con sus vistas y recursos. `/static/styles.css` se sirve desde los recursos publicados; el resto conserva las rutas originales a través de una reescritura a la función. `serverless-http` 4 es necesario para procesar formularios con Express 5.
5. Abre la URL HTTPS `https://NOMBRE.netlify.app` que aparece en el panel y realiza la verificación de abajo. No configures un dominio de pago.

Para pruebas de ramas/previews, usa otra base ficticia o evita darles credenciales: todas las instancias que usan la misma conexión comparten y pueden modificar los mismos datos. Cambiar variables de Functions requiere volver a desplegar.

## 3. Verificar el despliegue

- Abre la URL en un teléfono: aviso público, semana actual, días legibles, navegación y estilos.
- Crea una clase ficticia y edita título, día, hora, cupo y profesora. Comprueba la semana anterior y la nueva.
- Abre el mismo horario desde otro navegador: debe aparecer la clase guardada.
- Vuelve a desplegar el mismo commit sin ejecutar preparación; comprueba que la clase permanece. El despliegue no contiene la base.
- Prueba un campo inválido: aparecen errores en español sin perder los valores. Repite un envío del mismo formulario: solo debe existir una clase.
- Antes de presentar, ejecuta `pnpm run build`, `pnpm test` con un PostgreSQL de pruebas y `pnpm run test:deploy`. El test de función empaquetada no sustituye la comprobación HTTPS real.

Estas comprobaciones públicas de teléfono, proveedor, certificado, segundo navegador y redeployment quedan pendientes hasta que crees las cuentas y autorices la publicación.

## Límites gratuitos y recuperación

Consulta siempre los paneles y las condiciones vigentes. Referencia consultada el 3 de noviembre de 2026:

- [Netlify Free](https://www.netlify.com/pricing/) usa una asignación mensual de 300 créditos compartidos por despliegues, tráfico y cómputo. [Al agotar la asignación](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/) pueden pausarse todos los proyectos del equipo hasta el siguiente ciclo. Mantén el plan gratuito y reduce tráfico y despliegues; no actives recargas ni upgrades para seguir esta guía.
- [Supabase Free](https://supabase.com/pricing) incluye una base de hasta 500 MB; las copias automáticas no están incluidas. Hay límites de conexiones, salida y otros recursos: revisa Usage en el panel antes de la presentación. El pool de la aplicación permite como máximo dos conexiones por instancia, pero varias funciones pueden multiplicar ese uso.
- [Supabase puede pausar proyectos gratuitos con poca actividad durante siete días](https://supabase.com/docs/guides/platform/free-project-pausing). Antes de una presentación, abre el panel, reanuda/restaura el proyecto según las opciones disponibles y espera a que esté operativo. Reintenta el horario; no inicialices una base nueva sobre los datos existentes. Si ya no permite reanudar directamente, sigue su flujo de recuperación y usa una copia manual para un nuevo proyecto gratuito.

Si aparece «Los datos del estudio no están disponibles» o falla el guardado, revisa primero pausa/cuotas, estado de proveedores, conexión, certificado y variables de Functions. La interfaz oculta los diagnósticos de PostgreSQL para no revelar secretos. Tras corregir la configuración, redespliega si cambió y reintenta. Conserva el mismo formulario para un reintento seguro de creación. No introduzcas datos reales ni uses esta demo como sistema de producción.

## Copia y restauración manuales

Instala herramientas PostgreSQL de la misma versión principal que tu servidor o posterior para `pg_dump`; consulta la versión en el panel. Usa la conexión directa o Session pooler. Mantén las credenciales en `.pgpass`/`PGPASSFILE` con permisos `0600` y configura `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE=postgres`, `PGSSLMODE=verify-full` y `PGSSLROOTCERT` si requiere el CA oficial. Así no quedan contraseñas en argumentos o historial. No subas el archivo de credenciales ni la copia a Git.

Con esas variables apuntando al origen:

```sh
pg_dump --format=custom --no-owner --no-acl --schema=yoga_studio --file=studio-backup.dump
pg_restore --list studio-backup.dump
```

Guarda una copia fuera del equipo y anota fecha, proyecto y commit. Para restaurar, configura las variables para **otro proyecto vacío**, verifica el destino en el panel y ejecuta:

```sh
pg_restore --exit-on-error --single-transaction --no-owner --no-acl --dbname=postgres studio-backup.dump
```

No ejecutes `db:init` antes de restaurar un dump completo de esquema ni uses `--clean`. Si hay tablas en el destino, detente y usa un proyecto vacío: no sobrescribas registros. Después ejecuta preparación para reafirmar permisos/RLS y comprobar compatibilidad, cambia `DATABASE_URL` al nuevo proyecto y verifica las clases desde otra sesión. Prueba esta restauración antes de depender de la copia. Las copias contienen datos y consumen cuota de salida.

Referencias técnicas: [Express en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/express/), [configuración de Functions](https://docs.netlify.com/build/functions/configuration/), [conexiones Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [TLS en node-postgres](https://node-postgres.com/features/ssl).
