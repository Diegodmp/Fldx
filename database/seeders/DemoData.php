<?php

namespace Database\Seeders;

final class DemoData
{
    public const PASSWORD = '12345678';

    public const MAIN_EMAIL = 'prueba@gmail.com';

    public const SECONDARY_EMAIL = 'thejonathan38a10@gmail.com';

    /** @var list<array{email: string, name: string}> */
    public const FRIENDS = [
        ['email' => 'amigo1@example.com', 'name' => 'María García'],
        ['email' => 'amigo2@example.com', 'name' => 'Carlos Ruiz'],
        ['email' => 'amigo3@example.com', 'name' => 'Laura Martín'],
    ];

    /** @var array<int, string> */
    public const GENRES = [
        28 => 'Acción',
        12 => 'Aventura',
        35 => 'Comedia',
        80 => 'Crimen',
        18 => 'Drama',
        14 => 'Fantasía',
        36 => 'Historia',
        9648 => 'Misterio',
        10749 => 'Romance',
        878 => 'Ciencia ficción',
        53 => 'Suspense',
    ];

    /**
     * Películas con tmdb_id y poster_path reales para pósters y enlaces.
     *
     * @var list<array{tmdb_id: int, title: string, poster_path: string, genre_ids: list<int>, release_year: int, duration: int}>
     */
    public const MOVIES = [
        ['tmdb_id' => 335984, 'title' => 'Blade Runner 2049', 'poster_path' => '/gajva2LUIjZQYJiy4EeiKKW2O4.jpg', 'genre_ids' => [878, 18, 53], 'release_year' => 2017, 'duration' => 164],
        ['tmdb_id' => 496243, 'title' => 'Parásitos', 'poster_path' => '/7IiTTgloJzvGI1TAYXCGM7N4vN.jpg', 'genre_ids' => [35, 18, 53], 'release_year' => 2019, 'duration' => 132],
        ['tmdb_id' => 76341, 'title' => 'Mad Max: Furia en el camino', 'poster_path' => '/8fubExeS0s9DWIbmuUdoqcaHP4.jpg', 'genre_ids' => [28, 12, 878], 'release_year' => 2015, 'duration' => 120],
        ['tmdb_id' => 238, 'title' => 'El padrino', 'poster_path' => '/3bhkrj58dta7j.jpg', 'genre_ids' => [18, 80], 'release_year' => 1972, 'duration' => 175],
        ['tmdb_id' => 157336, 'title' => 'Interestelar', 'poster_path' => '/gEUUQjqn2SSQl041pdL5GkBf3c.jpg', 'genre_ids' => [878, 18, 12], 'release_year' => 2014, 'duration' => 169],
        ['tmdb_id' => 680, 'title' => 'Pulp Fiction', 'poster_path' => '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', 'genre_ids' => [53, 80, 18], 'release_year' => 1994, 'duration' => 154],
        ['tmdb_id' => 313369, 'title' => 'La La Land', 'poster_path' => '/uDO8zWDhfXjbOk6DTKWq6Fpdb3F.jpg', 'genre_ids' => [35, 18, 10749], 'release_year' => 2016, 'duration' => 128],
        ['tmdb_id' => 155, 'title' => 'El caballero oscuro', 'poster_path' => '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'genre_ids' => [28, 80, 18, 53], 'release_year' => 2008, 'duration' => 152],
        ['tmdb_id' => 603, 'title' => 'Matrix', 'poster_path' => '/f89U3ADr1OOdZxjFORQfykLlWij.jpg', 'genre_ids' => [28, 878, 53], 'release_year' => 1999, 'duration' => 136],
        ['tmdb_id' => 194, 'title' => 'Amélie', 'poster_path' => '/y765ir4X5O1E18wm5JWcPkYOK9.jpg', 'genre_ids' => [35, 18, 10749], 'release_year' => 2001, 'duration' => 122],
        ['tmdb_id' => 98, 'title' => 'Gladiator', 'poster_path' => '/ty8iR7L0i1AkR6yQotM6ZdJBp.jpg', 'genre_ids' => [28, 18, 36], 'release_year' => 2000, 'duration' => 155],
        ['tmdb_id' => 329865, 'title' => 'Arrival', 'poster_path' => '/x2FJsf1ElAgr63Y3PNPt1NRWI63.jpg', 'genre_ids' => [878, 18, 9648], 'release_year' => 2016, 'duration' => 116],
    ];
}
