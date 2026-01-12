# Guía de Despliegue en Easypanel

Sigue estos pasos para desplegar tu proyecto "Alvaro Vaca CMS" en tu VPS usando Easypanel.

## 1. Preparar el Proyecto en Easypanel

1.  Accede a tu panel de Easypanel.
2.  Crea un nuevo **Proyecto** con el nombre `AlvaroCMS` (o el que prefieras).

## 2. Crear Servicio de Base de Datos (PostgreSQL)

1.  Dentro del proyecto, haz clic en **+ Service**.
2.  Selecciona **PostgreSQL** o **Database**.
3.  Nombre del servicio: `db` (o `postgres`).
4.  Configura la contraseña y el usuario si es necesario, pero Easypanel suele gestionar esto automáticamente y proporcionar la URL de conexión.
5.  Anota las credenciales o la variable `DATABASE_URL` que genera Easypanel.

## 3. Crear Servicio Backend

Este servicio ejecutará la lógica del servidor (NestJS).

1.  Haz clic en **+ Service**.
2.  Selecciona **App** (o Custom).
3.  Nombre del servicio: `backend` (Es MUY IMPORTANTE que se llame `backend` para que el frontend lo encuentre).
4.  **Source (Fuente):**
    *   Si usas GitHub/GitLab: Conecta tu repositorio.
    *   **Root Directory (Directorio Raíz):** `./backend`
    *   **Docker Build:** Easypanel detectará automáticamente el `Dockerfile` en la carpeta `backend`.
5.  **Environment Variables (Variables de Entorno):**
    Agrega las siguientes variables:
    *   `DB_HOST`: `db` (o el nombre de tu servicio de base de datos)
    *   `DB_PORT`: `5432`
    *   `DB_USERNAME`: (tu usuario de la base de datos)
    *   `DB_PASSWORD`: (tu contraseña de la base de datos)
    *   `DB_DATABASE`: `colombiapicture_cms`
    *   `JWT_SECRET`: (crea una clave secreta segura)
    *   `PORT`: `3000`
6.  **Build & Deploy:** Haz clic en Deploy.
7.  Asegúrate de que el puerto expuesto (interno) sea `3000`. No es necesario exponerlo al público (hazlo "Private") si todo el tráfico pasa por el frontend, pero si necesitas acceso directo a la API, puedes exponerlo.

## 4. Crear Servicio Frontend

Este servicio servirá los archivos estáticos y actuará como puerta de enlace (Gateway) para el sitio público.

1.  Haz clic en **+ Service**.
2.  Selecciona **App**.
3.  Nombre del servicio: `frontend`.
4.  **Source (Fuente):**
    *   Conecta el mismo repositorio.
    *   **Root Directory (Directorio Raíz):** `./frontend`
    *   **Docker Build:** Easypanel detectará el `Dockerfile` en la carpeta `frontend`.
5.  **Domains (Dominios):**
    *   Configura tu dominio principal aquí (ej. `alvarovaca.com`).
    *   Habilita HTTPS.
6.  **Build & Deploy:** Haz clic en Deploy.
7.  Este servicio expone el puerto `80` internamente, Easypanel lo mapeará a tu dominio.

## Verificación

*   Visita tu dominio (ej. `https://alvarovaca.com`). Deberías ver la página de inicio.
*   Visita `https://alvarovaca.com/dashboard`. Deberías ver el panel de administración.
*   Si ves errores `502 Bad Gateway`, asegúrate de que el servicio `backend` esté corriendo y que se llame exactamente `backend` (ya que el archivo `nginx.conf` del frontend intenta conectar a `http://backend:3000`).

## Notas Importantes

*   **Persistencia de datos:** Los archivos subidos (imágenes) en el backend se guardan en el contenedor. Si redespiegas, se perderán a menos que configures un **Volumen**.
    *   En el servicio `backend`, ve a **Mounts**.
    *   Crea un volumen montado en `/app/public/uploads`.
    *   Ruta en el contenedor: `/app/public/uploads`.
*   **Base de datos:** Asegúrate de que el servicio `postgres` tenga un volumen persistente para no perder los datos.
