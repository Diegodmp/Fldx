<?php

namespace App\Support;

class TmdbGenres
{
    public const NAMES = [
        28 => 'Acción',
        12 => 'Aventura',
        16 => 'Animación',
        35 => 'Comedia',
        80 => 'Crimen',
        99 => 'Documental',
        18 => 'Drama',
        10751 => 'Familia',
        14 => 'Fantasía',
        36 => 'Historia',
        27 => 'Terror',
        10402 => 'Música',
        9648 => 'Misterio',
        10749 => 'Romance',
        878 => 'Ciencia ficción',
        10770 => 'Película de TV',
        53 => 'Suspense',
        10752 => 'Bélica',
        37 => 'Western',
    ];

    public static function name(int $genreId): ?string
    {
        return self::NAMES[$genreId] ?? null;
    }
}
