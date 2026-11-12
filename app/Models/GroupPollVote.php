<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $poll_movie_id
 * @property int $user_id
 * @property string $vote
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property GroupPollMovie $pollMovie
 * @property User $user
 */
class GroupPollVote extends Model
{
    public const VOTE_UP = 'up';

    public const VOTE_DOWN = 'down';

    protected $table = 'group_poll_votes';

    protected $fillable = [
        'poll_movie_id',
        'user_id',
        'vote',
    ];

    protected function casts(): array
    {
        return [
            'poll_movie_id' => 'int',
            'user_id' => 'int',
        ];
    }

    public function pollMovie(): BelongsTo
    {
        return $this->belongsTo(GroupPollMovie::class, 'poll_movie_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
