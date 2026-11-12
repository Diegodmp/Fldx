<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Class User
 * 
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $avatar
 * 
 * @property Collection|Watchlist[] $watchlists
 * @property Collection|Review[] $reviews
 * @property Collection|GroupMovie[] $group_movies
 * @property Collection|Group[] $groups
 * @property Collection|Notification[] $notifications
 *
 * @package App\Models
 */
class User extends Authenticatable
{
	use HasApiTokens, HasFactory;

	protected $table = 'users';

	protected $casts = [
		'email_verified_at' => 'datetime'
	];

	protected $hidden = [
		'password',
		'remember_token'
	];

	protected $fillable = [
		'name',
		'email',
		'password',
		'avatar'
	];

	public function watchlists()
	{
		return $this->hasMany(Watchlist::class);
	}

	public function reviews()
	{
		return $this->hasMany(Review::class);
	}

	public function group_movies()
	{
		return $this->hasMany(GroupMovie::class, 'proposed_by');
	}

	public function groups()
	{
		return $this->belongsToMany(Group::class)
					->withPivot('role')
					->withTimestamps();
	}

	public function notifications()
	{
		return $this->hasMany(Notification::class);
	}

	public function following()
	{
		return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id')
			->withTimestamps();
	}

	public function followers()
	{
		return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id')
			->withTimestamps();
	}

	/**
	 * @return \Illuminate\Support\Collection<int, int>
	 */
	public function friends()
	{
		$followingIds = $this->following()->pluck('users.id');
		$followerIds = $this->followers()->pluck('users.id');

		return $followingIds->intersect($followerIds)->values();
	}

	public function friendsCount(): int
	{
		return $this->friends()->count();
	}
}
