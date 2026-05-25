# MATEC NRD Dashboard — Guía de Setup: Supabase + GitHub

## Resumen del stack

```
dashboard-nrd-matec/   ← Frontend React (Vite)
backend-nrd-matec/     ← Backend Express (Node.js + pg)
supabase/              ← Scripts SQL para la BD en Supabase
```

El backend ya **no necesita SQL Server** — ahora se conecta directamente
a Supabase (PostgreSQL) usando la variable `DATABASE_URL`.

---

## PARTE 1 — Configurar Supabase

### 1.1 Encontrar las credenciales

1. Ve a [supabase.com](https://supabase.com) → inicia sesión
2. Selecciona tu proyecto
3. En el panel lateral haz clic en **Project Settings** (ícono de engranaje)
4. Ve a la sección **Database**
5. Baja hasta **Connection string** → selecciona la pestaña **Transaction**
6. Copia el string que tiene este formato:
   ```
   postgresql://postgres.[ref]:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
   > Reemplaza `[TU-PASSWORD]` por la contraseña de tu proyecto Supabase

### 1.2 Crear las tablas en Supabase

1. En Supabase ve a **SQL Editor** → **New query**
2. Pega y ejecuta los scripts en este orden:

   **Paso A:** Pega el contenido de `supabase/01_schema.sql` → clic **Run**

   **Paso B:** Pega el contenido de `supabase/02_seed_base.sql` → clic **Run**
   > ⚠ Si ya tienes fases/subfases/transiciones configuradas en SQL Server,
   > NO ejecutes este archivo. En su lugar exporta esos datos (ver sección 1.3).

   **Paso C:** Pega el contenido de `supabase/03_proyectos.sql` → clic **Run**
   > Este script carga los 67 proyectos del plan AYC 2026.

### 1.3 Migrar datos existentes de SQL Server (si aplica)

Si ya tienes datos en SQL Server que quieres preservar, sigue estos pasos:

**En SSMS (SQL Server Management Studio):**

```sql
-- Exportar hardware_tipos
SELECT id, nombre, fabricante FROM dbo.hardware_tipos ORDER BY id;

-- Exportar fases
SELECT id, numero, nombre, descripcion, color_hex, emoji FROM dbo.fases ORDER BY numero;

-- Exportar subfases  
SELECT id, fase_id, codigo, nombre, es_decision, ISNULL(es_correctivo,0) AS es_correctivo, orden
FROM dbo.subfases ORDER BY fase_id, orden;

-- Exportar transiciones
SELECT id, codigo_origen, codigo_destino, etiqueta, tipo, activo
FROM dbo.subfase_transiciones ORDER BY id;

-- Exportar usuarios
SELECT id, nombre, apellido, email, rol, area, activo FROM dbo.usuarios ORDER BY id;

-- Exportar historial
SELECT id, proyecto_id, subfase_desde_id, subfase_hasta_id, usuario_id, accion, comentario, fecha
FROM dbo.historial_fases ORDER BY id;
```

Luego en SSMS: clic derecho en los resultados → **Save Results As** → CSV.

Para importar los CSV en Supabase: ve a la tabla en **Table Editor** → ícono de importar → sube el CSV.

---

## PARTE 2 — Configurar el backend local

### 2.1 Crear el archivo .env

En la carpeta `backend-nrd-matec/`, crea un archivo llamado `.env`:

```bash
# Windows: usando el Bloc de notas o VS Code
# Ruta: backend-nrd-matec\.env
```

Con este contenido (reemplaza con tu connection string real):

```env
DATABASE_URL=postgresql://postgres.[ref]:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
PORT=3001
NODE_ENV=development
```

### 2.2 Instalar las nuevas dependencias

El backend ahora usa `pg` en lugar de `mssql`.
Abre una terminal en `backend-nrd-matec/` y ejecuta:

```bash
npm install
```

> Esto instalará `pg` (PostgreSQL client) y eliminará las dependencias antiguas.

### 2.3 Probar la conexión

```bash
node server.js
```

Deberías ver:
```
✅ Conexión a Supabase / PostgreSQL establecida
✅ Backend MATEC NRD escuchando en http://localhost:3001
```

### 2.4 Actualizar el script de inicio (iniciar-matec.bat)

Si usas el .bat para arrancar todo, ya no necesitas iniciar SQL Server.
El nuevo `iniciar-matec.bat` debería verse así:

```bat
@echo off
echo Iniciando MATEC NRD Dashboard...

:: Backend Express (conecta a Supabase via internet)
start "Backend MATEC" cmd /k "cd /d backend-nrd-matec && node server.js"

:: Frontend React
start "Frontend MATEC" cmd /k "cd /d dashboard-nrd-matec && npm run dev"

echo Listo! Abre http://localhost:5173 en el navegador.
```

---

## PARTE 3 — Subir a GitHub

### 3.1 Preparar el repositorio

Abre una terminal en la carpeta `WEB/` (la carpeta raíz del proyecto):

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos (respeta el .gitignore)
git add .

# Verificar que .env NO esté incluido (debe aparecer como ignorado)
git status
```

### 3.2 Primer commit

```bash
git commit -m "feat: migración a Supabase (PostgreSQL) + estructura para GitHub"
```

### 3.3 Conectar con tu repositorio GitHub

Copia la URL de tu repositorio GitHub (la encuentras en la página del repo → botón verde "Code"):

```bash
# Si el repo ya existe en GitHub:
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git

# Subir el código
git branch -M main
git push -u origin main
```

### 3.4 Variables de entorno en producción

**IMPORTANTE:** El archivo `.env` con `DATABASE_URL` **nunca** se sube a GitHub.
Si en algún momento despliegas el backend en un servicio como Railway, Render o Fly.io,
configura la variable `DATABASE_URL` directamente en el panel de ese servicio.

---

## PARTE 4 — Arquitectura resultante

```
GitHub (código fuente)
    │
    ├── backend-nrd-matec/   → corre localmente con: node server.js
    │                           conecta a Supabase via DATABASE_URL
    │
    ├── dashboard-nrd-matec/ → corre localmente con: npm run dev
    │                           hace peticiones al backend en :3001
    │
    └── supabase/            → scripts SQL para crear/poblar la BD
                                ejecutados una sola vez en Supabase SQL Editor
```

```
[React App :5173] → [Express :3001] → [Supabase PostgreSQL ☁]
```

---

## Resumen de comandos rápidos

| Acción | Comando |
|--------|---------|
| Instalar dependencias backend | `cd backend-nrd-matec && npm install` |
| Iniciar backend | `cd backend-nrd-matec && node server.js` |
| Iniciar frontend | `cd dashboard-nrd-matec && npm run dev` |
| Commit + push a GitHub | `git add . && git commit -m "mensaje" && git push` |
