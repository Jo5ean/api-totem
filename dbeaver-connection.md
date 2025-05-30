# Configuración de DBeaver para InnovalApp

## Opción 1: Usuario aplicación (recomendado)
- **Host**: localhost
- **Puerto**: 3306
- **Base de datos**: innovalapp
- **Usuario**: innovalapp_user
- **Contraseña**: innovalapp_password

## Opción 2: Usuario root (alternativo)
- **Host**: localhost  
- **Puerto**: 3306
- **Base de datos**: innovalapp
- **Usuario**: root
- **Contraseña**: rootpassword

## Pasos en DBeaver:
1. Nueva conexión → MySQL
2. Llenar datos de arriba
3. **Probar conexión** antes de guardar
4. Si falla, verificar que Docker esté corriendo: `docker-compose ps`

## Verificación rápida:
- Prisma Studio: http://localhost:5555 (se abre automáticamente)
- phpMyAdmin: http://localhost:8080

## Troubleshooting:
- Si no conecta, usar phpMyAdmin primero para verificar
- Verificar que no tengas otro MySQL local corriendo
- Reiniciar Docker: `docker-compose restart` 