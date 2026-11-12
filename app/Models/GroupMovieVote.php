<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $group_movie_id
 * @property int $user_id
 * @property string $vote
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property GroupMovie $groupMovie
 * @property User $user
 */
class GroupMovieVote extends Model
{
    public const VOTE_UP = 'up';

    public const VOTE_DOWN = 'down';

    protected $table = 'group_movie_votes';

    protected $fillable = [
        'group_movie_id',
        'user_id',
        'vote',
    ];

    protected function casts(): array
    {
        return [
            'group_movie_id' => 'int',
            'user_id' => 'int',
        ];
    }

    public function groupMovie(): BelongsTo
    {
        return $this->belongsTo(GroupMovie::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
