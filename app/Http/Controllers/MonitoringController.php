<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class MonitoringController extends Controller
{
    public function index()
    {
        return view('monitoring.dashboard');
    }

    // Fetch active branches and check each one's /v1 endpoint.
    public function statuses(Request $request)
    {
        // cache key and TTL (seconds). Can override with MONITORING_CACHE_TTL in .env
        $cacheKey = 'monitoring:statuses';
        $ttl = (int) env('MONITORING_CACHE_TTL', 5);

        // allow bypassing cache with ?refresh=1
        if (!$request->boolean('refresh')) {
            if (Cache::has($cacheKey)) {
                $cached = Cache::get($cacheKey);
                return response()->json([
                    'data' => $cached['data'] ?? [],
                    'meta' => [
                        'cached' => true,
                        'cached_at' => $cached['cached_at'] ?? null,
                        'ttl' => $ttl,
                    ],
                ]);
            }
        }
        // 1) Fetch branches from the provided API
        try {
            $res = Http::timeout(5)->get('https://emr.clenicapp.com/api/get-branches');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch branches: ' . $e->getMessage()], 500);
        }

        if (!$res->ok()) {
            return response()->json(['error' => 'Branches API returned non-200 status: ' . $res->status()], 500);
        }
        $data = $res->json();

        // The API returns { data: ["glie","kanbada", ...] }
        $items = [];
        if (is_array($data)) {
            $items = isset($data['data']) && is_array($data['data']) ? $data['data'] : $data;
        }

        // Keep only non-empty strings, trim them
        $branches = array_values(array_filter(array_map(function ($v) {
            return is_string($v) ? trim($v) : null;
        }, $items)));

        // Safety limit
        $branches = array_slice($branches, 0, 200);

        if (empty($branches)) {
            return response()->json(['error' => 'No branches found from API'], 500);
        }

        $batchSize = 20; // adjust to control concurrency
        $results = [];

        foreach (array_chunk($branches, $batchSize) as $chunk) {
            // Use a short timeout and pool requests per chunk to avoid blocking too long
            $responses = Http::timeout(3)->pool(function ($pool) use ($chunk) {
                $calls = [];
                foreach ($chunk as $sub) {
                    $domain = preg_replace('/\.(clenicapp\.com)$/i', '', $sub);
                    $url = "https://{$domain}.clenicapp.com/v1";
                    $calls[] = $pool->get($url);
                }
                return $calls;
            });

            foreach ($chunk as $i => $sub) {
                $resp = $responses[$i] ?? null;
                $status = null;
                if ($resp && is_object($resp) && method_exists($resp, 'status')) {
                    try {
                        $status = $resp->status();
                    } catch (\Exception $e) {
                        $status = null;
                    }
                }

                $domain = preg_replace('/\.(clenicapp\.com)$/i', '', $sub);
                $results[] = [
                    'name' => $sub,
                    'url' => "https://{$domain}.clenicapp.com/v1",
                    'status' => $status,
                    'ok' => $status === 200,
                    'last_checked' => now()->setTimezone(config('app.timezone'))->toDateTimeString(),
                ];
            }

            // small delay between batches to avoid burst traffic
            usleep(100_000); // 100ms
        }

        // store in cache with a TTL in seconds
        $envelope = [
            'data' => $results,
            'cached_at' => now()->setTimezone(config('app.timezone'))->toDateTimeString(),
        ];
        Cache::put($cacheKey, $envelope, now()->addSeconds($ttl));

        return response()->json([
            'data' => $results,
            'meta' => [
                'cached' => false,
                'cached_at' => $envelope['cached_at'],
                'ttl' => $ttl,
            ],
        ]);
    }
}
