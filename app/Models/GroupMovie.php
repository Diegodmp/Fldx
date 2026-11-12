<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class GroupMovie
 *
 * @property int $id
 * @property int $group_id
 * @property int $movie_id
 * @property int $proposed_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @property Group $group
 * @property Movie $movie
 * @property User $user
 * @property User $proposedBy
 *
 * @package App\Models
 */
class GroupMovie extends Model
{
	protected $table = 'group_movies';

	protected $casts = [
		'group_id' => 'int',
		'movie_id' => 'int',
		'proposed_by' => 'int',
	];

	protected $fillable = [
		'group_id',
		'movie_id',
		'proposed_by',
	];

	public function group()
	{
		return $this->belongsTo(Group::class);
	}

	public function movie()
	{
		return $this->belongsTo(Movie::class);
	}

	public function user()
	{
		return $this->belongsTo(User::class, 'proposed_by');
	}

	public function proposedBy()
	{
		return $this->belongsTo(User::class, 'proposed_by');
	}
}
