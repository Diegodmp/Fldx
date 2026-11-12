<?php

namespace App\Services;

use App\Models\Group;
use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public const TYPE_GROUP_INVITATION = 'group_invitation';

    public const TYPE_GROUP_INVITATION_ACCEPTED = 'group_invitation_accepted';

    public const TYPE_GROUP_INVITATION_REJECTED = 'group_invitation_rejected';

    public const TYPE_GROUP_WATCHLIST_MOVIE_ADDED = 'group_watchlist_movie_added';

    public const TYPE_GROUP_POLL_CREATED = 'group_poll_created';

    public const TYPE_GROUP_POLL_CLOSED = 'group_poll_closed';

    public const TYPE_GROUP_POLL_MOVIE_ADDED = 'group_poll_movie_added';

    public const TYPE_GROUP_POLL_VOTED = 'group_poll_voted';

    public const TYPE_REVIEW_LIKED = 'review_liked';

    public const TYPE_REVIEW_REPLIED = 'review_replied';

    public function send(int $userId, string $type, array $data): void
    {
        Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'data' => $data,
        ]);
    }

    /**
     * @param array<int, int> $userIds
     */
    public function sendToMany(array $userIds, string $type, array $data): void
    {
        foreach (array_unique($userIds) as $userId) {
            $this->send((int) $userId, $type, $data);
        }
    }

    public function sendToGroupMembersExcept(Group $group, int $exceptUserId, string $type, array $data): void
    {
        $group->loadMissing('users');

        $recipientIds = $group->users
            ->pluck('id')
            ->filter(fn (int $memberId) => $memberId !== $exceptUserId)
            ->all();

        $this->sendToMany($recipientIds, $type, $data);
    }

    public function sendPollVoteNotification(int $pollCreatorId, int $actorId, array $data): void
    {
        if ($pollCreatorId === $actorId) {
            return;
        }

        $pollId = $data['poll_id'] ?? null;

        if ($pollId === null) {
            return;
        }

        $duplicateExists = Notification::query()
            ->where('user_id', $pollCreatorId)
            ->where('type', self::TYPE_GROUP_POLL_VOTED)
            ->whereNull('read_at')
            ->where('data->poll_id', $pollId)
            ->where('data->actor_id', $actorId)
            ->exists();

        if ($duplicateExists) {
            return;
        }

        $this->send($pollCreatorId, self::TYPE_GROUP_POLL_VOTED, $data);
    }

    public function sendReviewLikedNotification(int $reviewAuthorId, int $actorId, array $data): void
    {
        if ($reviewAuthorId === $actorId) {
            return;
        }

        $reviewId = $data['review_id'] ?? null;

        if ($reviewId === null) {
            return;
        }

        $duplicateExists = Notification::query()
            ->where('user_id', $reviewAuthorId)
            ->where('type', self::TYPE_REVIEW_LIKED)
            ->whereNull('read_at')
            ->where('data->review_id', $reviewId)
            ->where('data->actor_id', $actorId)
            ->exists();

        if ($duplicateExists) {
            return;
        }

        $this->send($reviewAuthorId, self::TYPE_REVIEW_LIKED, $data);
    }

    /**
     * @return array<string, mixed>
     */
    public function actorPayload(User $actor): array
    {
        return [
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function groupPayload(Group $group): array
    {
        return [
            'group_id' => $group->id,
            'group_name' => $group->name,
        ];
    }
}
