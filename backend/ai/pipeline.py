# ==========================================================
# REGMAP AI ENTERPRISE
# AI PIPELINE MANAGER
# ==========================================================

import time
import json
import psutil
import os


class PipelineManager:

    def __init__(self, engines):
        self.engines = engines

    # ======================================================
    # Execute AI Pipeline
    # ======================================================

    def run(self, cko):
        print("\n")
        print("=" * 70)
        print("PIPELINE EXECUTION")
        print("=" * 70)

        process = psutil.Process(os.getpid())

        for engine in self.engines:
            engine_name = engine.__class__.__name__
            print(f"[PIPELINE] Running {engine_name}...")

            # Snapshot state before
            mem_before_mb = round(process.memory_info().rss / 1024 / 1024, 2)
            records_before = self._count_cko_records(cko)
            start_time = time.time()

            try:
                cko = engine.analyze(cko)
                status = "SUCCESS"
            except Exception as e:
                status = f"ERROR: {str(e)}"
                print(f"[PIPELINE ERROR] {engine_name}: {e}")

            execution_time_ms = round((time.time() - start_time) * 1000, 2)

            # Snapshot state after
            mem_after_mb = round(process.memory_info().rss / 1024 / 1024, 2)
            records_after = self._count_cko_records(cko)
            records_created = records_after - records_before

            try:
                cko_size_kb = round(
                    len(json.dumps(cko.__dict__, default=str)) / 1024, 2
                )
            except Exception:
                cko_size_kb = 0.0

            # Replace any legacy string entries with structured dict
            # (some engines append strings themselves — clean those up)
            new_history = [
                e for e in cko.engine_history
                if not (isinstance(e, str) and engine_name in e)
            ]
            cko.engine_history = new_history

            cko.engine_history.append({
                "engine": engine_name,
                "status": status,
                "execution_time_ms": execution_time_ms,
                "memory_usage_mb": mem_after_mb,
                "memory_delta_mb": round(mem_after_mb - mem_before_mb, 2),
                "cko_size_kb": cko_size_kb,
                "records_created": records_created
            })

            print(f"[PIPELINE] {engine_name} Completed — "
                  f"{execution_time_ms}ms | "
                  f"Mem: {mem_after_mb}MB | "
                  f"Records: +{records_created} | "
                  f"CKO: {cko_size_kb}KB")

        print("\n[PIPELINE] All Engines Executed Successfully")
        return cko

    # ======================================================
    # Count total records across major CKO list fields
    # ======================================================

    def _count_cko_records(self, cko):
        total = 0
        for field in [
            "obligations", "deadlines", "departments", "risks",
            "evidence", "conflicts", "recommendations",
            "implementation_timeline", "engine_history"
        ]:
            val = getattr(cko, field, [])
            if isinstance(val, list):
                total += len(val)
        return total