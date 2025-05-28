# Diseño de Base de Datos para Cronogramas UCASAL

## Estructura Propuesta

### Tablas Principales

```sql
-- Tabla de Facultades
CREATE TABLE facultades (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  codigo VARCHAR(50),
  sheet_id VARCHAR(255), -- Para sincronización con Google Sheets
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Carreras
CREATE TABLE carreras (
  id SERIAL PRIMARY KEY,
  facultad_id INTEGER REFERENCES facultades(id),
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(facultad_id, codigo)
);

-- Tabla de Materias/Exámenes
CREATE TABLE examenes (
  id SERIAL PRIMARY KEY,
  carrera_id INTEGER REFERENCES carreras(id),
  nombre_materia VARCHAR(255) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME,
  tipo_examen VARCHAR(100), -- 'oral', 'escrito', 'virtual', etc.
  monitoreo VARCHAR(100),   -- 'proctoring', '---', etc.
  material_permitido TEXT,
  observaciones TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Logs de Sincronización
CREATE TABLE sync_logs (
  id SERIAL PRIMARY KEY,
  facultad_id INTEGER REFERENCES facultades(id),
  tipo_operacion VARCHAR(50), -- 'import', 'export', 'error'
  resultado VARCHAR(50),      -- 'success', 'error', 'partial'
  mensaje TEXT,
  registros_procesados INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Ventajas de esta Estructura

### 1. **Una Base de Datos Central**
- No necesitas una base por facultad
- Todas las facultades comparten la misma estructura
- Facilita reportes y consultas globales

### 2. **Flexibilidad Total**
- Puedes agregar/editar/eliminar registros
- Campos personalizables por facultad si es necesario
- Historial de cambios

### 3. **Sincronización Bidireccional**
```javascript
// Importar desde Google Sheets (mantener compatibilidad)
POST /api/sync/import?facultad=X

// Exportar a Google Sheets (actualizar hojas existentes)
POST /api/sync/export?facultad=X

// Solo trabajar con BD (independiente de Sheets)
GET /api/cronogramas/db?facultad=X
```

### 4. **APIs Robustas**
```javascript
// CRUD completo
GET    /api/examenes                    // Listar todos
GET    /api/examenes?facultad=X         // Filtrar por facultad  
POST   /api/examenes                    // Crear nuevo
PUT    /api/examenes/:id                // Actualizar
DELETE /api/examenes/:id                // Eliminar

// Bulk operations
POST   /api/examenes/bulk               // Crear múltiples
PUT    /api/examenes/bulk               // Actualizar múltiples
```

## Migración Sugerida

### Fase 1: Implementar BD (1-2 días)
1. Crear tablas
2. Script de migración desde Google Sheets actual
3. APIs básicas de lectura

### Fase 2: Interface de Edición (2-3 días)  
1. Panel de administración
2. CRUD completo para examenes
3. Validaciones y permisos

### Fase 3: Sincronización (1-2 días)
1. Mantener compatibilidad con Sheets
2. Sync bidireccional opcional
3. Logs y monitoreo

## Tecnologías Recomendadas

### Base de Datos
- **PostgreSQL** (robusto, gratis)
- **MySQL** (simple, compatible)
- **SQLite** (para desarrollo/testing)

### ORM/Query Builder
- **Prisma** (moderno, TypeScript)
- **Sequelize** (maduro, flexible)

### Hosting de BD
- **Supabase** (PostgreSQL gratis + APIs automáticas)
- **PlanetScale** (MySQL serverless)
- **Railway** (PostgreSQL simple)

## Ejemplo de Implementación con Prisma

```javascript
// schema.prisma
model Facultad {
  id        Int       @id @default(autoincrement())
  nombre    String    @unique
  codigo    String?
  sheetId   String?   @map("sheet_id")
  activa    Boolean   @default(true)
  carreras  Carrera[]
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
}

model Carrera {
  id         Int       @id @default(autoincrement())
  facultadId Int       @map("facultad_id")
  nombre     String
  codigo     String
  activa     Boolean   @default(true)
  facultad   Facultad  @relation(fields: [facultadId], references: [id])
  examenes   Examen[]
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  
  @@unique([facultadId, codigo])
}

model Examen {
  id                Int      @id @default(autoincrement())
  carreraId         Int      @map("carrera_id")
  nombreMateria     String   @map("nombre_materia")
  fecha             DateTime
  hora              DateTime? @db.Time
  tipoExamen        String?   @map("tipo_examen")
  monitoreo         String?
  materialPermitido String?   @map("material_permitido")
  observaciones     String?
  activo            Boolean   @default(true)
  carrera           Carrera   @relation(fields: [carreraId], references: [id])
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
}
```

## ¿Quieres que implemente esta solución?

Puedo ayudarte a:
1. **Configurar la base de datos**
2. **Migrar los datos actuales**
3. **Crear las APIs de edición**
4. **Mantener compatibilidad con Sheets** (opcional)

¿Te parece viable esta aproximación? 