<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GroupPoll;
use App\Models\GroupPollMovie;
use App\Models\GroupPollVote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoteController extends Controller
{
    public function active(Request $request): JsonResponse
    {
        $user = $request->user();
        $groupIds = $user->groups()->pluck('groups.id')->all();

        if ($groupIds === []) {
            return response()->json(['votes' => []]);
        }

        $polls = GroupPoll::query()
            ->whereIn('group_id', $groupIds)
            ->where('status', GroupPoll::STATUS_OPEN)
            ->with([
                'group' => static fn ($query) => $query->withCount('users'),
                'movies.movie',
            ])
            ->get();

        $votes = [];

        foreach ($polls as $poll) {
            if ($poll->movies->isEmpty()) {
                continue;
            }

            $pollMovieIds = $poll->movies->pluck('id')->all();
            $voteCounts = $this->voteCountsByPollMovie($pollMovieIds);
            $userVotes = $this->userVotesByPollMovie($user->id, $pollMovieIds);

            if (count($userVotes) >= count($pollMovieIds)) {
                continue;
            }

            $leading = $this->findLeadingCandidate($poll->movies, $voteCounts);

            if ($leading === null) {
                continue;
            }

            $counts = $voteCounts[$leading->id] ?? ['votes_up' => 0, 'votes_down' => 0];
            $totalMembers = (int) ($poll->group?->users_count ?? 0);

            $votes[] = [
                'poll_id' => $poll->id,
                'group_id' => $poll->group_id,
                'group_name' => $poll->group?->name ?? '',
                'movie' => [
                    'tmdb_id' => $leading->movie?->tmdb_id,
                    'title' => $leading->movie?->title ?? '',
                    'poster_path' => $leading->movie?->poster_path,
                ],
                'votes_up' => $counts['votes_up'],
                'votes_down' => $counts['votes_down'],
                'total_members' => $totalMembers,
            ];
        }

        return response()->json(['votes' => $votes]);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, GroupPollMovie>  $candidates
     * @param  array<int, array{votes_up: int, votes_down: int}>  $voteCounts
     */
    private function findLeadingCandidate($candidates, array $voteCounts): ?GroupPollMovie
    {
        $leading = null;
        $leadingScore = -1;

        foreach ($candidates as $candidate) {
            $counts = $voteCounts[$candidate->id] ?? ['votes_up' => 0, 'votes_down' => 0];
            $score = $counts['votes_up'] + $counts['votes_down'];

            if ($score > $leadingScore) {
                $leadingScore = $score;
                $leading = $candidate;
            }
        }

        return $leading;
    }

    /**
     * @param  array<int, int>  $pollMovieIds
     * @return array<int, array{votes_up: int, votes_down: int}>
     */
    private function voteCountsByPollMovie(array $pollMovieIds): array
    {
        $result = [];

        foreach ($pollMovieIds as $pollMovieId) {
            $result[$pollMovieId] = [
                'votes_up' => 0,
                'votes_down' => 0,
            ];
        }

        if ($pollMovieIds === []) {
            return $result;
        }

        $rows = GroupPollVote::query()
            ->whereIn('poll_movie_id', $pollMovieIds)
            ->selectRaw('poll_movie_id, vote, COUNT(*) as total')
            ->groupBy('poll_movie_id', 'vote')
            ->get();

        foreach ($rows as $row) {
            $key = $row->vote === GroupPollVote::VOTE_UP ? 'votes_up' : 'votes_down';
            $result[$row->poll_movie_id][$key] = (int) $row->total;
        }

        return $result;
    }

    /**
     * @param  array<int, int>  $pollMovieIds
     * @return array<int, string>
     */
    private function userVotesByPollMovie(int $userId, array $pollMovieIds): array
    {
        if ($pollMovieIds === []) {
            return [];
        }

        return GroupPollVote::query()
            ->where('user_id', $userId)
            ->whereIn('poll_movie_id', $pollMovieIds)
            ->pluck('vote', 'poll_movie_id')
            ->all();
    }
}
