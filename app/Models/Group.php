<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Group
 * 
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $owner_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property User $user
 * @property Collection|Movie[] $movies
 * @property Collection|User[] $users
 * @property Collection|GroupInvitation[] $invitations
 *
 * @package App\Models
 */
class Group extends Model
{
	protected $table = 'groups';

	protected $casts = [
		'owner_id' => 'int'
	];

	protected $fillable = [
		'name',
		'description',
		'owner_id'
	];

	public function owner()
	{
		return $this->belongsTo(User::class, 'owner_id');
	}

	public function movies()
	{
		return $this->belongsToMany(Movie::class, 'group_movies')
					->withPivot('id', 'proposed_by', 'votes_up', 'votes_down')
					->withTimestamps();
	}

	public function users()
	{
		return $this->belongsToMany(User::class)
					->withPivot('role')
					->withTimestamps();
	}

	public function invitations()
	{
		return $this->hasMany(GroupInvitation::class);
	}
}
