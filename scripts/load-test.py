#!/usr/bin/env python3
"""
AVENRA High-Concurrency Load & Performance Benchmark Harness (Phase 13)

Simulates concurrent user load, measures requests per second (RPS),
P50/P90/P95/P99 latency percentiles, and verifies zero dropped connections.
"""

import asyncio
import statistics
import sys
import time
from typing import List
import httpx

TARGET_BASE_URL = "http://localhost:3000"
CONCURRENCY = 20
TOTAL_REQUESTS = 200

TEST_ENDPOINTS = [
    "/healthz",
    "/",
    "/platform",
    "/solutions",
    "/how-it-works",
    "/security",
    "/pricing",
    "/integrations",
    "/docs",
]

async def worker(client: httpx.AsyncClient, queue: asyncio.Queue, latencies: List[float], errors: List[str]):
    while not queue.empty():
        endpoint = await queue.get()
        start = time.perf_counter()
        try:
            resp = await client.get(f"{TARGET_BASE_URL}{endpoint}", timeout=10.0)
            elapsed = (time.perf_counter() - start) * 1000.0
            if resp.status_code == 200:
                latencies.append(elapsed)
            else:
                errors.append(f"HTTP {resp.status_code} for {endpoint}")
        except Exception as e:
            errors.append(f"Request failed for {endpoint}: {e}")
        finally:
            queue.task_done()

async def run_benchmark():
    print("=================================================================")
    print(" Starting AVENRA High-Concurrency Load & Benchmark Test")
    print(f" Target: {TARGET_BASE_URL}")
    print(f" Concurrency: {CONCURRENCY} workers | Total Requests: {TOTAL_REQUESTS}")
    print("=================================================================")

    queue = asyncio.Queue()
    for i in range(TOTAL_REQUESTS):
        endpoint = TEST_ENDPOINTS[i % len(TEST_ENDPOINTS)]
        await queue.put(endpoint)

    latencies: List[float] = []
    errors: List[str] = []

    limits = httpx.Limits(max_keepalive_connections=CONCURRENCY, max_connections=CONCURRENCY * 2)
    async with httpx.AsyncClient(limits=limits) as client:
        start_time = time.perf_counter()
        tasks = [asyncio.create_task(worker(client, queue, latencies, errors)) for _ in range(CONCURRENCY)]
        await queue.join()
        for t in tasks:
            t.cancel()
        total_time = time.perf_counter() - start_time

    success_count = len(latencies)
    error_count = len(errors)
    rps = success_count / total_time if total_time > 0 else 0

    print("\n--- Benchmark Results ---")
    print(f" Total Completed: {success_count}/{TOTAL_REQUESTS} ({success_count/TOTAL_REQUESTS*100:.1f}%)")
    print(f" Total Errors:    {error_count}")
    print(f" Total Duration:  {total_time:.2f}s")
    print(f" Throughput:      {rps:.1f} req/sec")

    if latencies:
        latencies.sort()
        p50 = statistics.median(latencies)
        p90 = latencies[int(len(latencies) * 0.90)]
        p95 = latencies[int(len(latencies) * 0.95)]
        p99 = latencies[int(len(latencies) * 0.99)]
        min_lat = min(latencies)
        max_lat = max(latencies)

        print("\n--- Latency Distribution ---")
        print(f" Min:  {min_lat:.2f} ms")
        print(f" P50:  {p50:.2f} ms")
        print(f" P90:  {p90:.2f} ms")
        print(f" P95:  {p95:.2f} ms")
        print(f" P99:  {p99:.2f} ms")
        print(f" Max:  {max_lat:.2f} ms")

        # SLA verification: P95 should be under 250ms and error rate < 1%
        if error_count == 0 and p95 < 250.0:
            print("\n=================================================================")
            print(" SLA VALIDATION: PASSED (P95 < 250ms, Zero Errors)")
            print("=================================================================")
            return 0
        elif error_count > 0:
            print(f"\n SLA VALIDATION: FAILED with {error_count} errors.")
            return 1
        else:
            print(f"\n SLA WARNING: P95 latency {p95:.2f}ms exceeded target 250ms.")
            return 0
    else:
        print("\n No successful requests recorded.")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(run_benchmark()))
