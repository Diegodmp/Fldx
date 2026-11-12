<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewReply extends Model
{
    protected $table = 'review_replies';

    protected $fillable = [
        'review_id',
        'user_id',
        'body',
    ];

    protected $casts = [
        'review_id' => 'int',
        'user_id' => 'int',
    ];

    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
