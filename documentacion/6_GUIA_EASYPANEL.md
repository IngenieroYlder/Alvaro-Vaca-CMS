# Guía Completa de Despliegue en Easypanel (VPS)

Esta guía documenta la configuración probada y exitosa para desplegar el Sistema CMS en Easypanel, solucionando problemas comunes de contexto de construcción (Build Context) y conexión a base de datos.

## 1. Arquitectura de Despliegue
El proyecto se compone de dos aplicaciones independientes y una base de datos dentro del mismo VPS.

*   **Repositorio GitHub:** `IngenieroYlder/Patios` (Público o Privado con Token).
*   **Estructura:**
    *   `/backend` -> NestJS API
    *   `/frontend` -> React/Vite App
*   **Orquestador:** Easypanel (Docker).

---

## 2. Servicio Base de Datos (PostgreSQL)
Antes de desplegar las aplicaciones, crea el servicio de base de datos.

*   **Tipo de Servicio:** Database (PostgreSQL).
*   **Nombre del Servicio:** `cms` (Importante: este nombre será el host).
*   **Usuario:** `postgres`
*   **Contraseña:** `postgres` (o la que definas).
*   **Nombre BD:** `colombiapicture_cms`
*   **Puerto Interno:** `5432`

---

## 3. Servicio Backend (NestJS)

### Configuración de Fuente (Source)
Para solucionar el error *"No such file or directory"* al buscar `package.json`:

*   **Repo:** `IngenieroYlder/Patios`
*   **Rama:** `master` (o `main` según corresponda).
*   **Usuario / Token:** (Si es privado).
*   **Root Directory (Contexto):** `backend`  ✅ **(SIN barra inicial /)**
*   **Dockerfile Path:** `Dockerfile` ✅

### Configuración de Build
Asegúrate de que el Dockerfile instale dependencias de desarrollo (`@nestjs/cli` es necesaria para el build).
*   *Nota: Esto ya está parchado en el Dockerfile del repositorio (`npm install --production=false`).*

### Variables de Entorno (Environment)
Para solucionar el error `ECONNREFUSED 127.0.0.1:5432`:

```env
PORT=3000
DB_HOST=cms                  # ✅ Nombre del servicio de BD, NO localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres         # La que definiste en el servicio 'cms'
DB_DATABASE=colombiapicture_cms
JWT_SECRET=tu_secreto_seguro
ADMIN_EMAIL=tu_email@admin.com
ADMIN_PASSWORD=tu_password_segura
```

---

## 4. Servicio Frontend (React + Vite)

Este servicio consume la API del Backend.

### Configuración de Fuente (Source)
*   **Repo:** `IngenieroYlder/Patios`
*   **Root Directory (Contexto):** `frontend` ✅ **(SIN barra inicial /)**
*   **Dockerfile Path:** `Dockerfile` ✅

### Variables de Entorno (Environment)
El frontend necesita saber dónde está el backend.

```env
# URL Pública de tu Backend (Dominio final)
VITE_API_URL=https://api.tudominio.com

# O si no tienes dominio aún y usas la IP:
# VITE_API_URL=http://TU_IP_VPS:3000
```

> **Nota:** No uses nombres de servicio internos (como `http://cms_movitrans_backend:3000`) para `VITE_API_URL`, porque el frontend se ejecuta en el **navegador del usuario**, no en el servidor. El usuario necesita una URL pública accesible desde internet.

---

## 5. Resumen de Puertos y Accesos

| Servicio | Puerto Interno (Container) | Puerto Externo (Easypanel) | URL de Acceso |
| :--- | :--- | :--- | :--- |
| **Base de Datos** | 5432 | (Cerrado por defecto) | `postgres://...` (Interno) |
| **Backend** | 3000 | 80 / 443 | `https://api.tudominio.com` |
| **Frontend** | 80 | 80 / 443 | `https://tudominio.com` |

## 6. Solución de Problemas Comunes

### Error: `npm run build` falla
*   **Causa:** Faltan dependencias de desarrollo (`devDependencies`) en la imagen de Docker.
*   **Solución:** Verificar que el Dockerfile tenga `RUN npm install --production=false`.

### Error: Conexión BD rechazada
*   **Causa:** Usar `localhost` o `127.0.0.1` en `DB_HOST`.
*   **Solución:** Usar el nombre del servicio (`cms`) creado en Easypanel.

### Error: Frontend no conecta con Backend
*   **Causa:** `VITE_API_URL` apunta a una dirección interna o localhost del servidor.
*   **Solución:** Asegurar que `VITE_API_URL` sea la dirección pública HTTPS del backend.

### Error: Setup Frontend Naranja (Nunca inicia) o "Exit Code 1" en Build
*   **Síntoma:** El servicio en Easypanel se queda en naranja indefinidamente o el log de build muestra error.
*   **Causa Real:** El comando `npm run build` falla silenciosamente porque **TypeScript está en modo estricto** y detecta "variables no usadas" (Warnings) tratándolas como Errores fatales.
*   **Solución (Ya aplicada en Repo):**
    En `frontend/tsconfig.app.json`, relajar las reglas de linter:
    ```json
    "noUnusedLocals": false,
    "noUnusedParameters": false


### Error: Upload 413 Payload Too Large (Importante)
Este error suele ocurrir por bloqueos en **dos capas** diferentes. Debes revisar ambas.

#### 1. Nginx Interno del Frontend (⚠️ Indispensable)
El contenedor de Frontend ejecuta su propio Nginx para servir la aplicación y hacer proxy al backend. Este Nginx tiene un límite por defecto de 1MB.
*   **Archivo:** `frontend/nginx.conf`
*   **Acción:** Agregar `client_max_body_size 50M;` dentro del bloque `server`.
*   **Nota:** Si no haces esto, aunque configures Easypanel/Traefik, el contenedor rechazará la conexión internamente.

#### 2. Proxy Inverso Traefik (Consejo / Nivel Servidor)
Traefik es la "puerta de entrada" a tu VPS. Es recomendable aumentar su límite globalmente para evitar problemas antes de que la petición llegue a tus contenedores.

**Configuración Global (Recomendada):**
1. Ir a **Ajustes** (Settings) -> **Servidor** -> **General**.
2. Abrir **Configuración personalizada de Traefik**.
3. Agregar/Editar el YAML:
   ```yaml
   servers:
     http:
       maxRequestBodyBytes: 52428800 # 50MB
   ```
4. Guardar y Reiniciar Traefik.


