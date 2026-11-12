<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Follow extends Model
{
    protected $table = 'follows';

    protected $fillable = [
        'follower_id',
        'following_id',
    ];

    protected function casts(): array
    {
        return [
            'follower_id' => 'int',
            'following_id' => 'int',
        ];
    }

    public function follower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'follower_id');
    }

    public function following(): BelongsTo
    {
        return $this->belongsTo(User::class, 'following_id');
    }
}
