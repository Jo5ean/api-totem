# Configuración de Docker para InnovalApp

## Pasos para configurar la base de datos con Docker

### 1. Verificar Docker Desktop
Asegúrate de que Docker Desktop esté ejecutándose en tu PC.

### 2. Configurar variables de entorno
Crea o modifica tu archivo `.env` con la siguiente configuración:

```env
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# MySQL Database URL for Docker
DATABASE_URL="mysql://innovalapp_user:innovalapp_password@localhost:3306/innovalapp"

# Google Sheets API (mantener las existentes)
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyA3asK3587-fiUgoSWYyOLVbhNfnrD2wIE
NEXT_PUBLIC_GOOGLE_SHEET_ID=14_ODC3bZL4EarjzG62M9TpNdiXNUYG8aymy1QsHu_qc
```

### 3. Levantar los contenedores
```bash
# Levantar MySQL y phpMyAdmin
docker-compose up -d

# Verificar que los contenedores estén corriendo
docker-compose ps
```

### 4. Ejecutar migraciones de Prisma
```bash
# Generar el cliente de Prisma
npx prisma generate

# Ejecutar las migraciones para crear las tablas
npx prisma db push
```

### 5. Acceso a la base de datos

- **Base de datos MySQL**: `localhost:3306`
  - Usuario: `innovalapp_user`
  - Contraseña: `innovalapp_password`
  - Base de datos: `innovalapp`

- **phpMyAdmin** (interfaz web): `http://localhost:8080`
  - Usuario: `root`
  - Contraseña: `rootpassword`

### 6. Comandos útiles

```bash
# Ver logs de los contenedores
docker-compose logs

# Parar los contenedores
docker-compose down

# Parar y eliminar volúmenes (¡cuidado! se pierden los datos)
docker-compose down -v

# Reiniciar los contenedores
docker-compose restart
```

### 7. Estructura creada

El `docker-compose.yml` incluye:

- **MySQL 8.0**: Base de datos principal
- **phpMyAdmin**: Interfaz web para administrar la base de datos
- **Volumen persistente**: Los datos se mantienen entre reinicios

### Notas importantes

- Los datos se almacenan en un volumen de Docker, por lo que persisten entre reinicios
- El puerto 3306 debe estar libre en tu sistema
- El puerto 8080 debe estar libre para phpMyAdmin
- Si cambias las credenciales en `docker-compose.yml`, también debes cambiarlas en el `.env` 