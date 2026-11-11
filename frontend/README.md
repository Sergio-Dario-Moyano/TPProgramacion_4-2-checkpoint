# 🎮 Checkpoint · Red social gamer

**TP #2 – Red social** · Programación IV

Checkpoint es una red social temática de videojuegos. Los usuarios comparten partidas, guías, reseñas, clips o búsquedas de equipo, dan "me gusta", comentan y personalizan su perfil. Los administradores gestionan usuarios y consultan estadísticas de la comunidad.

| Proyecto | Tecnología | Deploy |
|---|---|---|
| `frontend/` | Angular 18 (standalone components, signals, PWA) | Vercel |
| `backend/` | NestJS 10 + MongoDB (Mongoose) + JWT + Cloudinary | Render |

---

## Índice

1. [Requisitos](#requisitos)
2. [Instalación y ejecución local](#instalación-y-ejecución-local)
3. [Variables de entorno](#variables-de-entorno)
4. [Deploy](#deploy)
5. [Funcionalidades por sprint](#funcionalidades-por-sprint)
6. [Autenticación y sesión](#autenticación-y-sesión)
7. [Endpoints de la API](#endpoints-de-la-api)
8. [Códigos de estado](#códigos-de-estado)
9. [Estructura del proyecto](#estructura-del-proyecto)
10. [Pipes y directivas propias](#pipes-y-directivas-propias)
11. [Problemas frecuentes](#problemas-frecuentes)

---

## Requisitos

- **Node.js** 20 o superior y **npm**
- Una base de datos **MongoDB** (por ejemplo, un cluster gratuito de MongoDB Atlas)
- Una cuenta de **Cloudinary** (para las imágenes de perfil y de publicaciones)

> El backend usa **TypeScript 5.9** (versión fijada en `package.json`). No lo actualices a TypeScript 6: cambia la forma de resolver módulos y el proyecto deja de compilar.

---

## Instalación y ejecución local

### Backend

```bash
cd backend
cp .env.example .env     # completar los valores (ver la sección siguiente)
npm ci                   # instala exactamente las versiones del package-lock.json
npm run start:dev        # http://localhost:3000
```

Al arrancar, la consola lista todas las rutas (`Mapped {/auth/login, POST} route`, etc.) y termina con `Servidor Checkpoint corriendo...`.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Compila a `dist/` (solo la carpeta `src/`) |
| `npm run start:prod` | Ejecuta la versión compilada |

### Frontend

```bash
cd frontend
npm ci
npm start                # http://localhost:4200
```

| Comando | Qué hace |
|---|---|
| `npm run build` | Build de producción en `dist/frontend` (incluye el service worker de la PWA) |

> En desarrollo el front usa `src/environments/environment.ts` (API en `http://localhost:3000`). El build de producción usa `environment.prod.ts` (API en Render).

---

## Variables de entorno

Archivo `backend/.env` (hay un modelo en `backend/.env.example`):

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MONGO_URI` | Sí | Cadena de conexión a MongoDB |
| `JWT_SECRET` | Sí | Secreto para firmar los tokens (un texto largo y aleatorio) |
| `SESION_MINUTOS` | No (15) | Duración de la sesión en minutos |
| `CLOUDINARY_CLOUD_NAME` | Sí | Datos de la cuenta de Cloudinary |
| `CLOUDINARY_API_KEY` | Sí | |
| `CLOUDINARY_API_SECRET` | Sí | |
| `DEFAULT_PROFILE_IMAGE_URL` | No | Foto de perfil por defecto. Si queda vacía, el front muestra su propio avatar |
| `FRONTEND_URL` | Sí (producción) | URL del front desplegado, para CORS (sin barra final) |
| `PORT` | No (3000) | Puerto del servidor |

### Duración de la sesión

La consigna pide **15 minutos**. Para probar el aviso de sesión más rápido se puede bajar, pero el valor tiene que ser **el mismo en los dos proyectos**:

- Backend: `SESION_MINUTOS` en `backend/.env` (y en las variables de entorno de Render).
- Frontend: `sesionMinutos` en `frontend/src/environments/environment.ts` y `environment.prod.ts`.

El aviso para extender la sesión aparece cuando queda un tercio del tiempo (con 15 minutos, a los 10). **Antes de entregar, volver a 15.**

---

## Deploy

1. Subir los cambios a GitHub (`git push`).
2. **Render (backend):** se redespliega solo desde la rama configurada. Cargar las variables de entorno de la tabla anterior en *Environment*.
3. **Vercel (frontend):** se redespliega solo. El archivo `frontend/vercel.json` redirige todas las rutas a `index.html` para que funcione el router de Angular.

> El plan gratuito de Render "duerme" el servidor tras un rato sin uso. La primera petición puede tardar hasta un minuto: la pantalla de carga avisa *"Despertando al servidor..."* y, si no hay respuesta, ofrece reintentar.

### Primer administrador

El registro público siempre crea cuentas con perfil **usuario**. Para tener el primer administrador, editar en MongoDB Atlas el documento de un usuario (colección `usuarios`) y cambiar `perfil` a `"administrador"`. Desde ahí, el resto se gestiona en **Dashboard → Usuarios**.

---

## Funcionalidades por sprint

### Sprint 1 — Proyecto base, registro y login

- Pantallas de registro, login, publicaciones y Mi Perfil, con navegación entre ellas.
- Favicon propio (joystick) e identidad visual uniforme en toda la app.
- **Registro** con nombre, apellido, correo, nombre de usuario, contraseña, repetir contraseña, fecha de nacimiento, descripción y foto de perfil (se sube a Cloudinary).
  - Validaciones con mensajes claros en cada campo.
  - "Repetir contraseña" informa si coincide **recién cuando el usuario termina de escribir** (después de una pausa o al salir del campo), sin mensajes mientras tipea.
  - La cuenta siempre se crea con perfil **usuario**.
- **Login** por correo **o** nombre de usuario (ambos únicos en la base).
- Contraseña de al menos 8 caracteres, con una mayúscula y un número; se guarda encriptada con bcrypt.
- Modales propios en lugar de `alert()`.

### Sprint 2 — Publicaciones y perfil

- Listado de publicaciones paginado (botón "Cargar más"), ordenado por fecha por defecto o por cantidad de me gusta, con filtro por categoría.
- Cada publicación es un componente (`app-publicacion-card`).
- Publicaciones con título, mensaje, imagen opcional, **categoría** (reseña, guía, clip, pregunta, noticia, busco equipo) y **juego**.
- **Edición de publicaciones** (solo el autor): texto, categoría, juego e imagen. Quedan marcadas como "editado".
- Me gusta / quitar me gusta (uno por usuario).
- Baja lógica de publicaciones propias; también oculta sus comentarios.
- **Mi Perfil:** todos los datos y la foto, las últimas 3 publicaciones con sus comentarios, **edición de datos y foto** y cambio de contraseña.

### Sprint 3 — Comentarios y sesión

- **Detalle de publicación** con la imagen completa (sin recortes; clic para verla en tamaño original) y sus comentarios.
- Comentarios paginados ("Cargar más"), los más recientes primero, editables por su autor y marcados como "editado".
- **Actualización en vivo:** los comentarios nuevos, los me gusta y las ediciones aparecen solos, sin recargar. En el listado, un cartel avisa cuando hay publicaciones nuevas.
- **Pantalla "cargando"** con spinner al abrir la app (por cualquier URL, también al recargar): valida el token con `POST /auth/autorizar` y redirige a publicaciones o al login.
- Token JWT de 15 minutos con id, correo, nombre de usuario y rol.
- A los 10 minutos, un modal avisa que quedan 5 y ofrece extender la sesión (`POST /auth/refrescar`).
- **Cualquier respuesta 401 redirige al login** con un modal explicativo.

### Sprint 4 — Administración, estadísticas y PWA

- Los administradores pueden **dar de baja cualquier publicación** (desde el listado y desde el detalle).
- **Dashboard / Usuarios** (solo administradores):
  - Listado con búsqueda y filtro por estado.
  - Alta de usuarios con los mismos datos del registro y radio buttons *usuario / administrador*.
  - **Cambio de rol** de un usuario existente (hacer o quitar administrador). No se puede hacer con cuentas deshabilitadas ni con la propia.
  - Deshabilitar y habilitar cuentas. Un usuario deshabilitado no puede ingresar y recibe un aviso al intentarlo.
- **Dashboard / Estadísticas** (solo administradores), cada gráfico con su propio lapso de tiempo (atajos de 7, 30, 90 días o 1 año, o fechas a elección):
  - **Barras:** publicaciones realizadas por cada usuario.
  - **Líneas:** comentarios realizados por día.
  - **Torta:** comentarios en cada publicación.
- **PWA:** manifest, íconos propios y service worker (`frontend/ngsw-config.json`).
- **Pipes y directivas propias** (ver [más abajo](#pipes-y-directivas-propias)).
- **Arrastrar y soltar** imágenes en todos los formularios que suben fotos.

---

## Autenticación y sesión

1. Login y registro devuelven el token en el cuerpo de la respuesta y también en una **cookie HttpOnly** (`autorizacion`).
2. El front guarda el token en `localStorage` (`checkpoint_token`) y lo envía en cada petición como `Authorization: Bearer <token>`.
3. El backend busca el token primero en el encabezado y, si no está, en la cookie. Así funciona aunque el navegador bloquee cookies de otro dominio.
4. `JwtGuard` valida la firma, el vencimiento y que el usuario exista y siga habilitado. El rol se toma de la base de datos, así que un cambio de rol se aplica en la siguiente petición.
5. `AdminGuard` restringe las rutas de administración (403 si no es administrador).

---

## Endpoints de la API

### Autenticación — `/auth`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/registro` | Registro (multipart; campo `file` para la foto). Siempre crea perfil "usuario" |
| POST | `/auth/login` | Login con `credencial` (correo o usuario) y `password` |
| POST | `/auth/autorizar` | Valida el token y devuelve el usuario y el vencimiento |
| POST | `/auth/refrescar` | Devuelve un token nuevo de 15 minutos |
| POST | `/auth/logout` | Borra la cookie de sesión |

### Publicaciones — `/publicaciones` (requiere sesión)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/publicaciones?offset&limit&orden&usuarioId&categoria` | Listado paginado (`orden` = `fecha` o `meGustas`) |
| GET | `/publicaciones/:id` | Detalle |
| POST | `/publicaciones` | Alta (multipart: título, descripción, categoría, juego, `file`) |
| PUT | `/publicaciones/:id` | Edición, solo el autor (`quitarImagen=true` para quitar la imagen) |
| DELETE | `/publicaciones/:id` | Baja lógica (autor o administrador) |
| POST | `/publicaciones/:id/like` | Dar me gusta |
| DELETE | `/publicaciones/:id/like` | Quitar me gusta |

### Comentarios — `/comentarios` (requiere sesión)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/comentarios/publicacion/:id?limit&offset` | Comentarios de una publicación, más recientes primero |
| POST | `/comentarios/publicacion/:id` | Nuevo comentario |
| PUT | `/comentarios/:id` | Editar (marca `modificado: true`) |
| DELETE | `/comentarios/:id` | Baja lógica (autor o administrador) |

### Usuarios — `/usuarios` (requiere sesión)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| PUT | `/usuarios/perfil` | Todos | Editar mi perfil (multipart; `quitarImagen=true` para quitar la foto) |
| PUT | `/usuarios/perfil/password` | Todos | Cambiar mi contraseña |
| GET | `/usuarios?busqueda&estado` | Admin | Listado (`estado` = `todos`, `activos` o `inactivos`) |
| POST | `/usuarios` | Admin | Alta con perfil a elección |
| PATCH | `/usuarios/:id/perfil` | Admin | Cambiar el rol (`{ "perfil": "administrador" }`) |
| DELETE | `/usuarios/:id` | Admin | Deshabilitar (baja lógica) |
| POST | `/usuarios/:id/habilitar` | Admin | Habilitar (alta lógica) |

### Estadísticas — `/estadisticas` (solo administradores)

Todas aceptan `?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`. Sin fechas, toman los últimos 30 días.

| Método | Ruta | Gráfico |
|---|---|---|
| GET | `/estadisticas/publicaciones-por-usuario` | Barras |
| GET | `/estadisticas/comentarios-por-dia` | Líneas |
| GET | `/estadisticas/comentarios-por-publicacion` | Torta (las 10 más comentadas) |

---

## Códigos de estado

Las respuestas correctas nunca devuelven 4xx y los errores nunca devuelven 200.

| Situación | Status |
|---|---|
| Alta de usuario, publicación, comentario o me gusta | **201** Created |
| Lecturas, ediciones, login, autorizar, refrescar, bajas y altas lógicas | **200** OK |
| Datos inválidos, ID mal formado, contraseña actual incorrecta, cambiar el propio rol | **400** Bad Request |
| Sin token, token vencido o inválido, credenciales incorrectas, cuenta deshabilitada | **401** Unauthorized |
| Sin permiso (editar algo ajeno, rutas de administrador) | **403** Forbidden |
| Recurso inexistente o dado de baja | **404** Not Found |
| Correo o usuario repetido, me gusta duplicado, quitar un me gusta inexistente, cambiar el rol de una cuenta deshabilitada | **409** Conflict |

> En la consola del navegador es normal ver algún `401`: aparece cuando la app valida una sesión vencida, y la app responde enviando al login.

---

## Estructura del proyecto

```
backend/src/
├── auth/            Registro, login, autorizar, refrescar; guards JWT y admin
├── usuarios/        Perfil propio y administración de usuarios
├── publicaciones/   Publicaciones, me gusta y controlador de estadísticas
├── comentarios/     Comentarios de cada publicación
├── cloudinary/      Subida de imágenes
└── common/          Pipe de validación de IDs de MongoDB

frontend/src/app/
├── core/
│   ├── guards/        Rutas privadas, públicas y de administrador
│   ├── interceptors/  Token en cada petición y manejo global de 401 / 403
│   ├── models/        Interfaces de datos
│   ├── services/      Comunicación con la API y contador de sesión
│   └── utils/         Lógica compartida de me gusta
├── pages/
│   ├── pantalla-cargando/  Validación inicial de la sesión
│   ├── login/ · registro/
│   ├── publicaciones/      Listado y tarjeta de publicación
│   ├── publicacion-detalle/
│   ├── mi-perfil/
│   └── dashboard/          usuarios/ · estadisticas/
└── shared/
    ├── components/   Modal, navbar, spinner, logo, gráfico, formulario de usuario, editor de publicación
    ├── directives/   Directivas propias
    ├── pipes/        Pipes propios
    └── utils/        Verificación de contraseñas y actualización en vivo
```

---

## Pipes y directivas propias

### Pipes (`frontend/src/app/shared/pipes`)

| Pipe | Ejemplo |
|---|---|
| `tiempoRelativo` | `2026-11-10T20:00` → "hace 5 min", "ayer", "hace 3 días" |
| `abreviarNumero` | `1530` → "1,5 k" |
| `edad` | `1998-05-20` → "28 años" |
| `categoria` | `"busco-equipo"` → "Busco equipo" |

### Directivas (`frontend/src/app/shared/directives`)

| Directiva | Qué hace |
|---|---|
| `appImagenFallback` | Si una imagen no carga, muestra el avatar por defecto |
| `*appSoloAdmin` | Directiva estructural: muestra el contenido solo a administradores |
| `appAutoResize` | El textarea crece a medida que se escribe |
| `appSoltarArchivo` | Convierte un elemento en zona para arrastrar y soltar una imagen |

---
