#!/usr/bin/env python3
"""
RegMap AI Enterprise — One-Time Model Setup
Run this ONCE with internet access before going offline.
Downloads spaCy and sentence-transformers models (~90MB total).
"""

import subprocess
import sys


def run(cmd):
    print(f"  → {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ⚠ Warning: {result.stderr.strip()}")
    else:
        print(f"  ✓ Done")
    return result.returncode == 0


def main():
    print("=" * 60)
    print("RegMap AI Enterprise — Model Setup")
    print("=" * 60)

    print("\n[1/2] Downloading spaCy English model (en_core_web_sm)...")
    ok = run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    if not ok:
        print("      Install spaCy first: pip install spacy")

    print("\n[2/2] Pre-caching sentence-transformers (all-MiniLM-L6-v2)...")
    try:
        from sentence_transformers import SentenceTransformer
        print("  → Downloading all-MiniLM-L6-v2 (~90MB)...")
        SentenceTransformer("all-MiniLM-L6-v2")
        print("  ✓ Model cached")
    except ImportError:
        print("  ⚠ sentence-transformers not installed. Run: pip install sentence-transformers")
    except Exception as e:
        print(f"  ⚠ Download failed: {e}")

    print("\n" + "=" * 60)
    print("Setup complete. RegMap AI will now operate fully offline.")
    print("Start the server:  python app.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
