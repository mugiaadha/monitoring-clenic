@extends('layouts.app')

@section('content')
<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h1 class="h4">Monitoring Status Website — 40 Cabang</h1>
        <div class="d-flex align-items-center gap-2">
            <div class="btn-group btn-group-sm" role="group" aria-label="View toggle">
                <button id="btnGrid" class="btn btn-outline-primary active" title="Grid view">Grid</button>
                <button id="btnList" class="btn btn-outline-primary" title="List view">List</button>
            </div>
            <button id="refreshBtn" class="btn btn-outline-secondary btn-sm">Refresh</button>
            <span class="ms-3 text-muted" id="lastUpdated">-</span>
        </div>
    </div>

    <div class="mb-3">
        <div class="row gy-2 align-items-center">
            <div class="col-md-6 d-flex align-items-center gap-2" id="stats">
                <!-- Filled by JS: Online/Offline counts -->
            </div>
            <div class="col-md-6 d-flex justify-content-md-end gap-2">
                <input id="searchInput" class="form-control form-control-sm" placeholder="Cari cabang..."
                    style="max-width:260px">
                <select id="sortSelect" class="form-select form-select-sm" style="max-width:160px">
                    <option value="default">Urutkan: Default</option>
                    <option value="online">Hanya Online</option>
                    <option value="offline">Hanya Offline</option>
                </select>
            </div>
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

    /* Grid: make URL and date smaller (more compact) */
    #grid .text-muted.small {
        font-size: 0.68rem;
    }

    #grid .text-muted.small.mt-1 {
        font-size: 0.62rem;
    }

    /* Table: compact URL and date */
    #grid.table td.small,
    #grid.table td .text-muted.small {
        font-size: 0.72rem;
    }
</style>
@endpush

@push('scripts')
<script src="/js/monitoring.js"></script>
@endpush