<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Review
 * 
 * @property int $id
 * @property int $user_id
 * @property int $movie_id
 * @property string $body
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property User $user
 * @property Movie $movie
 *
 * @package App\Models
 */
class Review extends Model
{
	protected $table = 'reviews';

	protected $casts = [
		'user_id' => 'int',
		'movie_id' => 'int',
		'rating' => 'int',
		'watched_at' => 'date',
	];

	protected $fillable = [
		'user_id',
		'movie_id',
		'body',
		'rating',
		'watched_at',
	];

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function movie()
	{
		return $this->belongsTo(Movie::class);
	}

	public function likes()
	{
		return $this->hasMany(ReviewLike::class);
	}

	public function replies()
	{
		return $this->hasMany(ReviewReply::class);
	}
}
