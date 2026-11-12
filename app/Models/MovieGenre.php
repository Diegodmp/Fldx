<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class MovieGenre
 * 
 * @property int $movie_id
 * @property int $genre_id
 * 
 * @property Movie $movie
 * @property Genre $genre
 *
 * @package App\Models
 */
class MovieGenre extends Model
{
	protected $table = 'movie_genre';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'movie_id' => 'int',
		'genre_id' => 'int'
	];

	public function movie()
	{
		return $this->belongsTo(Movie::class);
	}

	public function genre()
	{
		return $this->belongsTo(Genre::class);
	}
}
