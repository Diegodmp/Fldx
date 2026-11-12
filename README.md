# Filmdex

Filmdex es una aplicación web para descubrir películas, gestionar tu watchlist, publicar reseñas y coordinar visionados en grupo. Combina datos de TMDB con una experiencia social centrada en cine.

## Stack

- **Backend:** Laravel 11, PostgreSQL, Sanctum
- **Frontend:** React, Vite, Tailwind CSS
- **API externa:** TMDB

## Funcionalidades principales

- Búsqueda y exploración del catálogo (sección Buscar, ruta `/filmdex`)
- Recomendaciones personalizadas según tu historial
- Watchlist con estados pendiente / vista / puntuada
- Reseñas y valoraciones
- Grupos con watchlist compartida y votaciones de películas
- Notificaciones de actividad en grupos

## Requisitos

- PHP 8.3+
- Composer
- Node.js 20+
- PostgreSQL

## Instalación

```bash
cp .env.example .env
composer install
npm install
php artisan key:generate
php artisan migrate --seed
npm run build
php artisan serve
```

Configura en `.env` tu clave de TMDB (`TMDB_API_KEY`) y la conexión a PostgreSQL. El nombre de la base de datos puede seguir siendo `appcine` en entornos locales existentes.

## Desarrollo

```bash
composer dev
# o por separado:
php artisan serve
npm run dev
```

## Variables de entorno relevantes

| Variable | Descripción |
|----------|-------------|
| `APP_NAME` | Nombre de la aplicación (por defecto: Filmdex) |
| `TMDB_API_KEY` | Clave de API de TMDB |
| `DB_DATABASE` | Nombre de la base de datos |

## Licencia

MIT
