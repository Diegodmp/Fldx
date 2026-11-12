<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private const LIST_LIMIT = 30;

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $notifications = Notification::query()
            ->where('user_id', $userId)
            ->latest()
            ->limit(self::LIST_LIMIT)
            ->get();

        $unreadCount = Notification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Todas las notificaciones han sido marcadas como leídas.',
        ]);
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereKey($id)
            ->first();

        if (!$notification) {
            return response()->json([
                'message' => 'Notificación no encontrada.',
            ], 404);
        }

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json($notification->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $notification = Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereKey($id)
            ->first();

        if (!$notification) {
            return response()->json([
                'message' => 'Notificación no encontrada.',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notificación eliminada correctamente.',
        ]);
    }
}
