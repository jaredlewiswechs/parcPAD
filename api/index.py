"""
Vercel Python serverless entry point for the Newton FastAPI backend.

Vercel's Python runtime detects `app` as an ASGI callable and routes
all matching requests (configured in vercel.json) to this handler.
"""
import sys
import os

# Ensure the project root is on the Python path so `newton` is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from newton.api.server import app  # noqa: F401 — Vercel detects this ASGI app

# Vercel Python runtime expects the ASGI app to be named `app` or `handler`.
# Re-exporting `app` here satisfies that requirement.
