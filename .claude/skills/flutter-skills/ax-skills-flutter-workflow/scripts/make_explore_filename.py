#!/usr/bin/env python3
from datetime import datetime


def main() -> int:
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    print(f"explore-{ts}.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())