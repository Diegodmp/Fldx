<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $group_id
 * @property int $invited_by
 * @property int|null $user_id
 * @property string|null $email
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Group $group
 * @property User|null $user
 * @property User $invitedBy
 */
class GroupInvitation extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_REJECTED = 'rejected';

    protected $table = 'group_invitations';

    protected $fillable = [
        'group_id',
        'invited_by',
        'user_id',
        'email',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'group_id' => 'int',
            'invited_by' => 'int',
            'user_id' => 'int',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
