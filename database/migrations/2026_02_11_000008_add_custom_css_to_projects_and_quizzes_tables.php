<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->text('custom_css')->nullable();
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->text('custom_css')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('custom_css');
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn('custom_css');
        });
    }
};
