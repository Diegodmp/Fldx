<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => DemoData::MAIN_EMAIL],
            [
                'name' => 'Prueba',
                'password' => Hash::make(DemoData::PASSWORD),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => DemoData::SECONDARY_EMAIL],
            [
                'name' => 'Jonathan Pérez Galindo',
                'password' => Hash::make(DemoData::PASSWORD),
            ],
        );

        foreach (DemoData::FRIENDS as $friend) {
            User::query()->updateOrCreate(
                ['email' => $friend['email']],
                [
                    'name' => $friend['name'],
                    'password' => Hash::make(DemoData::PASSWORD),
                ],
            );
        }

        $this->command?->info(sprintf(
            'Usuarios demo creados (%d). Contraseña: %s',
            2 + count(DemoData::FRIENDS),
            DemoData::PASSWORD,
        ));
    }
}
