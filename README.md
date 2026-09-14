<div align="center">

# Fixlat

### Portal colaborativo para equipos

Autenticación · Usuarios · Tablero de notas · Métricas · Docker · AWS

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.10.0-2D3748?logo=prisma)
![Bun](https://img.shields.io/badge/Bun-1.3.13-f9f1e1?logo=bun)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

</div>

---

## Qué es

Fixlat es un portal de trabajo para que un equipo pueda iniciar sesión, administrar sus cuentas y organizar notas en un tablero compartido. El proyecto está preparado para ejecutarse localmente sin depender de AWS y cuenta con una arquitectura de despliegue documentada mediante SAM y CloudFormation.

## Arranque rápido

**Requisito:** Docker Desktop.

```powershell
docker compose up --build
```

Abre **http://localhost:3000**.

El arranque automático hace lo siguiente:

1. Levanta PostgreSQL 16.
2. Espera a que la base de datos esté saludable.
3. Aplica las migraciones de Prisma.
4. Carga las cuentas demo con contraseñas hasheadas.
5. Inicia la aplicación Next.js.

> PostgreSQL no publica el puerto `5432` en Windows. Solo es accesible dentro de la red de Docker mediante `postgres:5432`, así que no choca con un PostgreSQL nativo instalado en el equipo.

### Empezar desde cero

Este comando elimina también el volumen persistente:

```powershell
docker compose down -v
docker compose up --build
```

### Detener la aplicación

```powershell
docker compose down
```

## Accesos de demostración

| Rol | Usuario | Contraseña | Permisos |
|:---:|---|---|---|
| `ADMIN` | `admin@demo.com` | `Demo1234` | Dashboard, tablero y administración |
| `USER` | `user@demo.com` | `Demo1234` | Dashboard y tablero |

Los usuarios inactivos no pueden iniciar sesión ni continuar en el área autenticada. La aplicación impide dejar el sistema sin administradores activos.

## Recorrido funcional

### Dashboard

Muestra cuatro métricas del tablero:

- Total de notas.
- Notas pendientes.
- Notas en curso.
- Notas completadas.

El dashboard consulta primero la Lambda de métricas. Si la Lambda local no está disponible, usa un fallback directo con Prisma para mantener la experiencia de desarrollo.

### Tablero compartido

Todos los usuarios activos pueden:

- Crear notas tipo post-it.
- Editar título, texto y estado directamente sobre la nota.
- Mover notas libremente por el lienzo.
- Guardar contenido con feedback visual.
- Eliminar notas con confirmación.

La posición, el contenido y el estado se conservan en PostgreSQL y sobreviven a reinicios de Docker mientras exista el volumen `postgres_data`.

### Administración de usuarios

Disponible para `ADMIN` en `/admin/users`:

- Listar usuarios.
- Crear usuarios con contraseña hasheada mediante bcrypt.
- Editar nombre, email y rol.
- Activar o desactivar cuentas.
- Mantener siempre un administrador activo.

## Arquitectura local

```mermaid
flowchart LR
    Browser["Navegador\nlocalhost:3000"] --> App["Next.js App\nSSR + Server Components"]
    App --> Auth["Auth.js\nJWT + Credentials"]
    App --> API["Route Handlers\nusers + notes"]
    App --> Metrics["LAMBDA_METRICS_URL\nSAM local opcional"]
    App --> DB[("PostgreSQL 16\nvolumen persistente")]
    API --> DB
    Auth --> DB
    Metrics --> DB
```

## Stack técnico

| Área | Tecnología |
|---|---|
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| Autenticación | Auth.js / NextAuth v4, Credentials Provider, JWT |
| Persistencia | PostgreSQL 16, Prisma 7.10.0, `@prisma/adapter-pg` |
| Contraseñas | `bcryptjs` |
| Drag & drop | Pointer Events sobre un lienzo absoluto |
| Entorno local | Docker Compose |
| Métricas | AWS Lambda + API Gateway, SAM local |
| Infraestructura | AWS SAM / CloudFormation, EC2, S3 y CloudFront |

## Desarrollo con Bun

Para trabajar fuera de Docker, con PostgreSQL disponible y `.env` configurado:

```powershell
bun install
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev
```

Variables locales:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/prueba_tecnica_fixlat?schema=public"
NEXTAUTH_SECRET="genera-un-secreto-seguro"
NEXTAUTH_URL="http://localhost:3000"
LAMBDA_METRICS_URL="http://127.0.0.1:3001/metrics"
```

El archivo `.env` está excluido del repositorio.

## Lambda de métricas

La función está en `lambda/dashboard-metrics/handler.ts`. Usa las dependencias del `package.json` raíz y comparte el schema de Prisma; no tiene `package.json`, `node_modules` ni lockfile propio.

SAM local se ejecuta aparte de Docker Compose:

```powershell
sam validate --template template.yaml
sam build
sam local start-api --port 3001
```

La API queda disponible en `http://127.0.0.1:3001/metrics`.

## Arquitectura AWS

El archivo `template.yaml` describe un único stack con:

```mermaid
flowchart TB
    User["Usuarios"] --> CF["CloudFront"]
    CF --> S3["S3 privado\nOrigin Access Control"]
    User --> EC2["EC2\ncontenedor Next.js"]
    EC2 --> RDS["RDS PostgreSQL\nrecomendado en producción"]
    EC2 --> APIGW["API Gateway"]
    APIGW --> Lambda["Lambda\n/dashboard-metrics"]
    Lambda --> RDS
```

- **EC2:** ejecuta la imagen Docker de Next.js con SSR y Server Components.
- **Lambda + API Gateway:** calcula y entrega las métricas del dashboard.
- **S3 + CloudFront:** distribuye assets estáticos o un futuro export; no reemplaza el HTML SSR principal.
- **RDS PostgreSQL:** sería la opción recomendada para producción por backups, disponibilidad y mantenimiento administrado.

### Requisitos AWS

- Cuenta AWS.
- AWS CLI configurado.
- AWS SAM CLI.
- Permisos para CloudFormation, Lambda, API Gateway, EC2, VPC, S3 y CloudFront.
- VPC, subnet y AMI compatibles.
- Imagen Docker publicada en un registro.

### Desplegar

Primera ejecución guiada:

```powershell
sam build
sam deploy --guided
```

Ejecución posterior con parámetros explícitos:

```powershell
sam deploy --stack-name fixlat-dev --capabilities CAPABILITY_IAM --parameter-overrides ProjectName=fixlat Environment=dev VpcId=vpc-xxxxxxxx SubnetId=subnet-xxxxxxxx ImageId=ami-xxxxxxxx DockerImageUri=123456789012.dkr.ecr.us-east-1.amazonaws.com/fixlat:latest AllowedSSHCidr=203.0.113.10/32 DatabaseUrl=postgresql://user:password@rds-endpoint:5432/fixlat NextAuthSecret=replace-with-a-secure-secret
```

### Retirar recursos

```powershell
sam delete --stack-name fixlat-dev
```

Alternativa directa:

```powershell
aws cloudformation delete-stack --stack-name fixlat-dev
```

## Validación

```powershell
bun x tsc --noEmit
bun run lint
bun run build
docker compose config
```

## Entrega y alcance

- No se realizó un despliegue real en AWS; la aplicación local funciona sin cuenta AWS ni servicios de pago.
- El video de demostración debe mostrar login, roles, CRUD de usuarios, tablero, persistencia y dashboard.
- El tiempo efectivo empleado debe completarse con el dato real antes de entregar.
- No forman parte del alcance: colaboración en tiempo real, historial, comentarios, adjuntos, notificaciones, fechas de vencimiento ni múltiples tableros.

---

<div align="center">

Hecho para la prueba técnica de Fixlat · Next.js + Prisma + PostgreSQL + AWS

</div>
