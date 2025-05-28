# Configuración de Base de Datos MySQL para UCASAL Cronogramas

## 1. Configuración del archivo .env

Crea o actualiza tu archivo `.env` con la configuración de MySQL:

```env
# Base de datos MySQL
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/ucasal_cronogramas"

# Google Sheets API (mantener las existentes)
NEXT_PUBLIC_GOOGLE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_GOOGLE_SHEET_ID=tu_sheet_id_aqui
```

### Ejemplos de DATABASE_URL para diferentes entornos:

```env
# Local con XAMPP/WAMP (sin contraseña)
DATABASE_URL="mysql://root:@localhost:3306/ucasal_cronogramas"

# Local con contraseña
DATABASE_URL="mysql://root:tu_password@localhost:3306/ucasal_cronogramas"

# PlanetScale (recomendado para producción - gratis)
DATABASE_URL="mysql://usuario:password@host.connect.psdb.cloud/database-name?sslaccept=strict"

# Railway (hosting gratuito)
DATABASE_URL="mysql://root:password@containers-us-west-xxx.railway.app:6543/railway"
```

## 2. Opciones para crear la base de datos

### Opción A: Local con XAMPP/WAMP/MAMP

1. **Instalar XAMPP** (si no lo tienes):
   - Descargar desde: https://www.apachefriends.org/
   - Instalar y ejecutar Apache + MySQL

2. **Crear la base de datos**:
   - Abrir phpMyAdmin: http://localhost/phpmyadmin
   - Crear nueva base de datos: `ucasal_cronogramas`
   - Configurar `.env`: `DATABASE_URL="mysql://root:@localhost:3306/ucasal_cronogramas"`

### Opción B: PlanetScale (Recomendado - Gratis)

1. **Crear cuenta en PlanetScale**:
   - Ir a: https://planetscale.com/
   - Crear cuenta gratuita

2. **Crear base de datos**:
   - New Database → `ucasal-cronogramas`
   - Región: `us-east` (más cercana)
   - Crear branch `main`

3. **Obtener credenciales**:
   - Connect → Create password
   - Copiar la DATABASE_URL generada

### Opción C: Railway (Alternativa gratuita)

1. **Crear cuenta en Railway**:
   - Ir a: https://railway.app/
   - Conectar con GitHub

2. **Crear base MySQL**:
   - New Project → Provision MySQL
   - Copiar DATABASE_URL desde Variables

## 3. Comandos para configurar Prisma

Una vez que tengas la DATABASE_URL configurada:

```bash
# Instalar dependencias de Prisma (si no están)
npm install prisma @prisma/client

# Generar el cliente de Prisma
npx prisma generate

# Crear y aplicar la migración inicial
npx prisma migrate dev --name init

# Ver la base de datos en el navegador
npx prisma studio
```

## 4. Verificar la instalación

Después de ejecutar los comandos, deberías tener:

- ✅ Tablas creadas: `facultades`, `carreras`, `examenes`, `sync_logs`
- ✅ Cliente de Prisma generado en `src/generated/prisma`
- ✅ Prisma Studio disponible en http://localhost:5555

## 5. Datos iniciales (opcional)

Puedes crear un script para insertar las facultades existentes:

```sql
INSERT INTO facultades (nombre, codigo, sheet_id) VALUES
('Facultad de Ciencias Jurídicas', 'FCJ', '14_ODC3bZL4EarjzG62M9TpNdiXNUYG8aymy1QsHu_qc'),
('Facultad de Arquitectura y Urbanismo', 'FAU', '1xJBRTnfNMlcfGHLo_9y96taH5JCNdlIw_fYiuAIy7kQ'),
('Facultad de Economía y Administración', 'FEA', '1NVGjcJFoJigektPblUdHuzGqVsY7PiD-hZuLBqe4MNk'),
('Escuela Universitaria de Educación Física', 'EUEF', '1cUk1wAObM1u0ErEIh98XXz6NTxGcKLVt3orJczSgCAU'),
('Facultad de Educación', 'FE', '1G2gL5bqy85gE5mOGTTlN7PPTAbKoeIcDYJineSPqut0'),
('Facultad de Ingeniería', 'FI', '10-IUeW-NZMvZkwwxxjspdNG9-jbBvtXhgWG3Bcwxqr0'),
('Facultad de Turismo', 'FT', '1saPHBuYV0L6_NN1mcsEABIDCKa2SXINMYK2sZIsOxwo');
```

## 6. Próximos pasos

Una vez configurada la BD, podremos:

1. **Migrar datos** desde Google Sheets a la BD
2. **Crear APIs** para CRUD de exámenes
3. **Panel de administración** para editar cronogramas
4. **Mantener sincronización** con Sheets (opcional)

¿Qué opción prefieres para la base de datos? 