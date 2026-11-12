<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class GroupUser
 * 
 * @property int $group_id
 * @property int $user_id
 * @property string $role
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Group $group
 * @property User $user
 *
 * @package App\Models
 */
class GroupUser extends Model
{
	protected $table = 'group_user';
	public $incrementing = false;

	protected $casts = [
		'group_id' => 'int',
		'user_id' => 'int'
	];

	protected $fillable = [
		'role'
	];

	public function group()
	{
		return $this->belongsTo(Group::class);
	}

	public function user()
	{
		return $this->belongsTo(User::class);
	}
}
