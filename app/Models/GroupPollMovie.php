<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $poll_id
 * @property int $movie_id
 * @property int $added_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property GroupPoll $poll
 * @property Movie $movie
 * @property User $addedBy
 * @property Collection|GroupPollVote[] $votes
 */
class GroupPollMovie extends Model
{
    protected $table = 'group_poll_movies';

    protected $fillable = [
        'poll_id',
        'movie_id',
        'added_by',
    ];

    protected function casts(): array
    {
        return [
            'poll_id' => 'int',
            'movie_id' => 'int',
            'added_by' => 'int',
        ];
    }

    public function poll(): BelongsTo
    {
        return $this->belongsTo(GroupPoll::class, 'poll_id');
    }

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(GroupPollVote::class, 'poll_movie_id');
    }
}
