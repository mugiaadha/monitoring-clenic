<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MonitoringController;

// Monitoring dashboard
Route::get('/', [MonitoringController::class, 'index'])->name('monitoring.index');
Route::get('/statuses', [MonitoringController::class, 'statuses'])->name('monitoring.statuses');
