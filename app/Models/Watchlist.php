<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Watchlist
 * 
 * @property int $id
 * @property int $user_id
 * @property int $movie_id
 * @property string $status
 * @property int|null $rating
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property User $user
 * @property Movie $movie
 *
 * @package App\Models
 */
class Watchlist extends Model
{
	protected $table = 'watchlist';

	protected $casts = [
		'user_id' => 'int',
		'movie_id' => 'int',
		'rating' => 'int'
	];

	protected $fillable = [
		'user_id',
		'movie_id',
		'status',
		'rating'
	];

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function movie()
	{
		return $this->belongsTo(Movie::class);
	}
}
