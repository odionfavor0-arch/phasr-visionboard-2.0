from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv


def load_backend_env(start: Path) -> None:
    current = start.resolve()
    candidates = [
        current / ".env",
        current.parent / ".env",
        current.parent.parent / ".env",
        current.parent.parent.parent / ".env",
    ]

    seen: set[str] = set()
    for path in candidates:
        key = str(path)
        if key in seen:
            continue
        seen.add(key)
        if path.exists():
            load_dotenv(path, override=False)
