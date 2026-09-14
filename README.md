# Prueba Técnica Fixlat

Portal de equipo para consultar actividad, administrar usuarios y organizar notas en un tablero compartido.

## Funcionalidades

- Autenticación con Auth.js y sesiones JWT.
- Roles `ADMIN` y `USER`.
- Usuarios administradores: crear, editar, activar y desactivar cuentas.
- Protección de rutas y bloqueo de usuarios inactivos.
- Regla de seguridad: siempre debe existir al menos un administrador activo.
- Dashboard con métricas de notas.
- Lambda AWS para calcular las métricas, con fallback directo a Prisma en desarrollo.
- Tablero único de notas tipo post-it.
- Edición de título, texto y estado directamente sobre cada nota.
- Arrastre libre con persistencia de posición.
- Creación y eliminación de notas.

## Requisitos

- Docker Desktop para la ejecución completa local.
- Bun 1.3.13 para desarrollo y comandos del proyecto.
- AWS CLI y AWS SAM CLI únicamente para validar o desplegar la infraestructura AWS.

## Ejecución local recomendada

El comando principal levanta PostgreSQL y Next.js, crea las tablas, carga las cuentas demo y conserva los datos en un volumen Docker:

```powershell
docker compose up --build
```

Abre [http://localhost:3000](http://localhost:3000).

Para detener el entorno:

```powershell
docker compose down
```

Para empezar desde una base de datos limpia, eliminando también los datos persistentes:

```powershell
docker compose down -v
docker compose up --build
```

PostgreSQL no publica el puerto `5432` en el host. La aplicación se conecta dentro de la red de Compose mediante `postgres:5432`, por lo que no entra en conflicto con un PostgreSQL nativo de Windows.

## Cuentas demo

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@demo.com` | `Demo1234` |
| Usuario | `user@demo.com` | `Demo1234` |

El administrador puede acceder a `/admin/users`. Ambos roles activos pueden acceder al dashboard y al tablero compartido. Un usuario creado desde la administración puede iniciar sesión con el email y la contraseña definidos al crearlo.

## Desarrollo con Bun

Si PostgreSQL ya está disponible y quieres ejecutar Next.js fuera de Docker:

```powershell
bun install
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev
```

Variables locales principales en `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/prueba_tecnica_fixlat?schema=public"
NEXTAUTH_SECRET="genera-un-secreto-seguro"
NEXTAUTH_URL="http://localhost:3000"
LAMBDA_METRICS_URL="http://127.0.0.1:3001/metrics"
```

`.env` no se versiona.

## Lambda de métricas

La Lambda está en `lambda/dashboard-metrics/handler.ts` y utiliza las dependencias declaradas en el `package.json` raíz. No tiene `package.json`, `node_modules` ni lockfile propios.

SAM local se ejecuta por separado de Docker Compose:

```powershell
sam validate --template template.yaml
sam build
sam local start-api --port 3001
```

Con SAM activo, el dashboard consulta `LAMBDA_METRICS_URL`. Si la Lambda no está disponible, la página usa un fallback silencioso que calcula las mismas métricas directamente con Prisma para que el desarrollo local no se interrumpa.

## Arquitectura AWS

`template.yaml` define la infraestructura mediante SAM y CloudFormation:

- **EC2:** ejecuta la imagen Docker de Next.js con SSR y Server Components.
- **Lambda + API Gateway:** expone `GET /metrics` para las métricas del dashboard.
- **S3 + CloudFront:** bucket privado con Origin Access Control para assets estáticos o un futuro export.
- **Base de datos:** en producción se usaría Amazon RDS for PostgreSQL por sus backups, disponibilidad y mantenimiento administrado. No se incluye RDS en este ejercicio para evitar costes y porque la VPC, subnet group y credenciales deben definirse para cada entorno.

Requisitos para un despliegue real: cuenta AWS, AWS CLI configurado, SAM CLI, permisos para CloudFormation/Lambda/API Gateway/EC2/VPC/S3/CloudFront, una VPC, una subnet, una AMI compatible y una imagen Docker publicada en un registro.

Primera ejecución:

```powershell
sam build
sam deploy --guided
```

Ejecución posterior con parámetros explícitos:

```powershell
sam deploy --stack-name fixlat-dev --capabilities CAPABILITY_IAM --parameter-overrides ProjectName=fixlat Environment=dev VpcId=vpc-xxxxxxxx SubnetId=subnet-xxxxxxxx ImageId=ami-xxxxxxxx DockerImageUri=123456789012.dkr.ecr.us-east-1.amazonaws.com/fixlat:latest AllowedSSHCidr=203.0.113.10/32 DatabaseUrl=postgresql://user:password@rds-endpoint:5432/fixlat NextAuthSecret=replace-with-a-secure-secret
```

Retirada del stack:

```powershell
sam delete --stack-name fixlat-dev
# Alternativa:
aws cloudformation delete-stack --stack-name fixlat-dev
```

## Validaciones

```powershell
bun x tsc --noEmit
bun run lint
bun run build
docker compose config
```

## Estado de la entrega

- No se realizó un despliegue real en AWS; la aplicación local no depende de una cuenta AWS ni de servicios de pago.
- El video de demostración debe grabarse como parte de la entrega final.
- El tiempo efectivo empleado debe registrarse con el tiempo real de trabajo antes de enviar la prueba.
- La colaboración en tiempo real, historial, comentarios, adjuntos y múltiples tableros quedan fuera del alcance solicitado.
