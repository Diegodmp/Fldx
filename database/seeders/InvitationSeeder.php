<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\GroupInvitation;
use App\Models\User;
use Illuminate\Database\Seeder;

class InvitationSeeder extends Seeder
{
    public function run(): void
    {
        $mainUser = User::query()->where('email', DemoData::MAIN_EMAIL)->firstOrFail();
        $secondaryUser = User::query()->where('email', DemoData::SECONDARY_EMAIL)->firstOrFail();
        $carlos = User::query()->where('email', 'amigo2@example.com')->firstOrFail();
        $maria = User::query()->where('email', 'amigo1@example.com')->firstOrFail();

        $inviteGroup = Group::query()->updateOrCreate(
            ['name' => 'Sala vintage', 'owner_id' => $secondaryUser->id],
            ['description' => 'Clásicos del cine para ver en buena compañía.'],
        );

        $inviteGroup->users()->syncWithoutDetaching([
            $secondaryUser->id => ['role' => 'admin'],
            $maria->id => ['role' => 'member'],
        ]);

        GroupInvitation::query()->updateOrCreate(
            [
                'group_id' => $inviteGroup->id,
                'user_id' => $mainUser->id,
            ],
            [
                'invited_by' => $secondaryUser->id,
                'email' => $mainUser->email,
                'status' => GroupInvitation::STATUS_PENDING,
            ],
        );

        $rejectedGroup = Group::query()->updateOrCreate(
            ['name' => 'Estrenos 2026', 'owner_id' => $mainUser->id],
            ['description' => 'Grupo privado de estrenos recientes.'],
        );

        $rejectedGroup->users()->syncWithoutDetaching([
            $mainUser->id => ['role' => 'admin'],
        ]);

        GroupInvitation::query()->updateOrCreate(
            [
                'group_id' => $rejectedGroup->id,
                'user_id' => $carlos->id,
            ],
            [
                'invited_by' => $mainUser->id,
                'email' => $carlos->email,
                'status' => GroupInvitation::STATUS_REJECTED,
            ],
        );

        $this->command?->info('Invitaciones: 1 pendiente, 1 rechazada.');
    }
}
