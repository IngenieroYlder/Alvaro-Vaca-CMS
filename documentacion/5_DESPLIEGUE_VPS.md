# Guía de Despliegue en VPS (Docker)

Esta guía detalla los pasos para llevar el proyecto desde tu entorno local hasta un servidor de producción (VPS) utilizando Docker.

## 1. Requisitos Previos

### En tu Máquina Local
*   Docker Desktop instalado y corriendo.
*   PowerShell (para ejecutar el script de automatización).

### En tu Servidor VPS (Ubuntu/Debian recomendado)
*   Tener **Docker** y **Docker Compose** instalados.
    ```bash
    # Comandos rápidos de instalación en Ubuntu:
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    # (Reiniciar sesión para aplicar cambios de grupo)
    ```

## 2. Generar Artefactos (Local)

Hemos creado un script que automatiza la construcción y empaquetado de las imágenes.

1.  Abre una terminal en la carpeta raíz del proyecto (`d:\Colombia Picture\Patios`).
2.  Ejecuta el script de respaldo:
    ```powershell
    .\crear_respaldo_v0.1.ps1
    ```
3.  Este proceso generará un archivo llamado **`patios_v0.1.tar`** (puede pesar varios MB/GB ya que contiene todo el sistema).

## 3. Transferir Archivos al VPS

Necesitas subir dos archivos clave al servidor. Puedes usar FileZilla, WinSCP o el comando `scp`.

**Archivos a subir:**
1.  `patios_v0.1.tar` (Las imágenes generadas).
2.  `docker-compose.yml` (La orquestación).
3.  (Opcional) `.env` (Si tienes configuraciones específicas, aunque se recomienda configurar variables de entorno en el servidor).

**Ejemplo con SCP (Terminal):**
```bash
scp patios_v0.1.tar docker-compose.yml usuario@tu_ip_vps:/home/usuario/
```

## 4. Despliegue en el VPS

Conéctate a tu servidor vía SSH y ejecuta los siguientes pasos:

### 4.1. Cargar las Imágenes
Desempaqueta el archivo `.tar` para que Docker reconozca las imágenes del proyecto.
```bash
docker load -i patios_v0.1.tar
```
*Verás mensajes indicando que `patios-backend:v0.1` y `patios-frontend:v0.1` han sido cargadas.*

### 4.2. Configuración (Variables de Entorno)
Puedes editar el archivo `docker-compose.yml` en el servidor con `nano` o `vim` para ajustar credenciales si es necesario, o crear un archivo `.env` en el mismo directorio.

**Variables Clave a revisar:**
*   `DB_PASSWORD`: Contraseña de la base de datos.
*   `JWT_SECRET`: Clave secreta para tokens.
*   `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Credenciales para el primer usuario administrador (Modo Dios).

### 4.3. Iniciar el Sistema
Ejecuta Docker Compose para levantar los contenedores en segundo plano (`-d`).

```bash
# IMPORTANTE: Asegúrate de que el docker-compose.yml use las versiones v0.1
# Si el archivo subido dice "latest", edítalo o asegúrate de haber subido el correcto.
# El script local NO modifica el docker-compose.yml original localmente permanentemente.

# Comando para iniciar:
docker-compose up -d
```

### 4.4. Verificar Estado
```bash
docker-compose ps
```
Deberías ver 3 servicios corriendo (`patios_db`, `patios_backend`, `patios_frontend`).

## 5. Acceso
*   **Web Pública**: `http://tu_ip_vps`
*   **API/Backend**: `http://tu_ip_vps:3000` (Si el puerto 3000 está abierto en el firewall del VPS).

## Notas Importantes de Mantenimiento
*   Para actualizar una nueva versión, repite el proceso cambiando la etiqueta (ej: `v0.2`) en el script local y en el `docker-compose.yml`.
*   La base de datos se guarda en un volumen persistente de Docker (`postgres_data`), por lo que no perderás datos al reiniciar los contenedores.

---

## 6. Método Alternativo: Despliegue Directo con Git/GitHub

Si prefieres no subir archivos manualmente y usar un repositorio de Git, sigue estos pasos:

### 1. Preparar el Servidor
*   Asegúrate de tener instalados `git`, `docker` y `docker-compose` en tu VPS.
*   Si tu repositorio es privado, configura tus claves SSH en el VPS.

### 2. Clonar el Código
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git .
# O si usas SSH:
# git clone git@github.com:TU_USUARIO/TU_REPOSITORIO.git .
```

### 3. Configurar Entorno
Crea el archivo `.env` en la raíz del proyecto clonado:
```bash
nano .env (o nano backend/.env según tu estructura)
```
Agrega tus variables (DB_PASSWORD, JWT_SECRET, etc.).

### 4. Construir y Desplegar
Docker Compose puede construir las imágenes directamente desde el código fuente que acabas de descargar.

```bash
# --build fuerza la reconstrucción de las imágenes con el código nuevo
docker-compose up -d --build
```

**Nota:** Asegúrate de que tu `docker-compose.yml` tenga la propiedad `build: context: ...` configurada (ya está configurada por defecto en este proyecto). Si tu docker-compose apunta a imágenes específicas (ej: `patios-backend:v0.1`), puede que necesites quitar la línea `image: ...` o asegurar que el nombre coincida.

### 5. Actualizar Cambios Futuros
Cuando hagas cambios en tu PC y los subas a GitHub:

1.  Entra al servidor.
2.  Baja los cambios: `git pull origin main`
3.  Reconstruye y reinicia: `docker-compose up -d --build`

## 7. Resolución de Problemas Comunes

### 7.1. Imágenes Rotas y Errores 404 en Medios
Si al subir imágenes al servidor estas aparecen rotas o desaparecen después de un despliegue, verifica lo siguiente:

#### 1. Variables de Entorno (VITE_API_URL)
Cuando despliegues en producción usando Nginx como proxy reverso, **DEBES** configurar la variable `VITE_API_URL` correctamente en el frontend.
*   **Recomendado**: Déjala **VACÍA** o no la definas.
    ```env
    VITE_API_URL=
    ```
    *Razón*: Al estar vacía, el código generará rutas relativas (ej. `/uploads/foto.png`). Nginx tomará estas rutas y las redirigirá internamente al backend.
*   **Error Común**: Si pones `http://localhost:3000` o una dirección interna de Docker (ej. `backend:3000`), el navegador del cliente intentará conectar a ESA dirección y fallará.

#### 2. Persistencia de Datos (Volúmenes)
Si las imágenes desaparecen cada vez que haces un "Deploy" o reinicias el servidor:
*   **Causa**: Los contenedores de Docker son efímeros. Al recrearlos, se borra todo su contenido interno.
*   **Solución**: Debes configurar un **Volumen** para la carpeta de cargas.
    *   En `docker-compose.yml`:
        ```yaml
        services:
          backend:
            volumes:
              - ./uploads:/usr/src/app/uploads
        ```
    *   En Easypanel/Portainer: Busca la sección "Mounts" o "Volumes" y mapea `/usr/src/app/uploads` a un disco persistente.

#### 3. Reconstrucción (Rebuild)
Si cambias una variable de entorno del frontend (como `VITE_API_URL`), **SIEMPRE** debes reconstruir la imagen.
*   Comando manual: `docker-compose up -d --build`
*   Easypanel: Botón "Rebuild" o "Force Rebuild".
*   *Razón*: Las variables de entorno en aplicaciones React/Vite se "queman" dentro del código Javascript en el momento de la construcción (Build time), no en tiempo de ejecución.
