@extends('layouts.app')

@section('content')
<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h1 class="h4">Monitoring Status Website — 40 Cabang</h1>
        <div>
            <button id="refreshBtn" class="btn btn-outline-secondary btn-sm">Refresh</button>
            <span class="ms-3 text-muted" id="lastUpdated">-</span>
        </div>
    </div>

    <div class="mb-3 d-flex justify-content-between align-items-center">
        <div id="stats">
            <!-- Filled by JS: Online/Offline counts, cached indicator -->
        </div>
        <div>
            <span id="loading" class="text-muted small me-2" style="display:none">Loading…</span>
        </div>
    </div>

    <section id="grid" class="row g-3">
        <!-- Cards rendered by JS -->
    </section>
</div>
@endsection

@push('styles')
<style>
    .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 8px;
    }
</style>
@endpush

@push('scripts')
<script src="/js/monitoring.js"></script>
@endpush