<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Notification
 * 
 * @property int $id
 * @property int $user_id
 * @property string $type
 * @property array $data
 * @property Carbon|null $read_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property User $user
 *
 * @package App\Models
 */
class Notification extends Model
{
	protected $table = 'notifications';

	protected $casts = [
		'user_id' => 'int',
		'data' => 'array',
		'read_at' => 'datetime'
	];

	protected $fillable = [
		'user_id',
		'type',
		'data',
		'read_at'
	];

	public function user()
	{
		return $this->belongsTo(User::class);
	}
}
