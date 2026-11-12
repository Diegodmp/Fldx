<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Movie
 * 
 * @property int $id
 * @property int $tmdb_id
 * @property string $title
 * @property string|null $overview
 * @property string|null $poster_path
 * @property int|null $release_year
 * @property int|null $duration
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Collection|Watchlist[] $watchlists
 * @property Collection|Review[] $reviews
 * @property Collection|Group[] $groups
 * @property Collection|Genre[] $genres
 *
 * @package App\Models
 */
class Movie extends Model
{
	protected $table = 'movies';

	protected $casts = [
		'tmdb_id' => 'int',
		'release_year' => 'int',
		'duration' => 'int',
		'genre_ids' => 'array',
	];

	protected $fillable = [
		'tmdb_id',
		'title',
		'overview',
		'poster_path',
		'release_year',
		'duration',
		'genre_ids',
	];

	public function watchlists()
	{
		return $this->hasMany(Watchlist::class);
	}

	public function reviews()
	{
		return $this->hasMany(Review::class);
	}

	public function groups()
	{
		return $this->belongsToMany(Group::class, 'group_movies')
					->withPivot('id', 'proposed_by', 'votes_up', 'votes_down')
					->withTimestamps();
	}

	public function genres()
	{
		return $this->belongsToMany(Genre::class, 'movie_genre');
	}
}
