<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $group_id
 * @property int $created_by
 * @property string $title
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Group $group
 * @property User $createdBy
 * @property Collection|GroupPollMovie[] $movies
 */
class GroupPoll extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    protected $table = 'group_polls';

    protected $fillable = [
        'group_id',
        'created_by',
        'title',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'group_id' => 'int',
            'created_by' => 'int',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function movies(): HasMany
    {
        return $this->hasMany(GroupPollMovie::class, 'poll_id');
    }
}
