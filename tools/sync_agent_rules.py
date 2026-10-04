#!/usr/bin/env python3
"""Sync suite rules, the interop design doc and decision records from suite-contract into project repos.

Usage:
    python tools/sync_agent_rules.py <path-to-project-repo> [<more repos>...]
    python tools/sync_agent_rules.py --dry-run <repo> ...

For each repo:
  1. Replaces the block between <!-- suite-rules:begin --> and <!-- suite-rules:end -->
     in <repo>/AGENTS.md with agents/SUITE_RULES.md (appends the block if markers are missing).
  2. Copies docs/SUITE_INTEROP.md      -> <repo>/docs/suite/SUITE_INTEROP.md
  3. Copies docs/OPEN_QUESTIONS.md     -> <repo>/docs/suite/OPEN_QUESTIONS.md   (if present)
  4. Mirrors docs/decisions/*.md       -> <repo>/docs/suite/decisions/
     Files in the target decisions folder that no longer exist in the source are removed,
     but only if they carry the read-only header written by this script.

Every copied file gets a read-only header recording the protocol version (first line of VERSION).
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES_SRC = ROOT / "agents" / "SUITE_RULES.md"
INTEROP_SRC = ROOT / "docs" / "SUITE_INTEROP.md"
OPEN_Q_SRC = ROOT / "docs" / "OPEN_QUESTIONS.md"
DECISIONS_SRC = ROOT / "docs" / "decisions"
VERSION_FILE = ROOT / "VERSION"

BEGIN = "<!-- suite-rules:begin -->"
END = "<!-- suite-rules:end -->"
HEADER_MARK = "<!-- 只读副本：由 suite-contract 同步"

DRY_RUN = False


def read_version() -> str:
    if VERSION_FILE.exists():
        return VERSION_FILE.read_text(encoding="utf-8").splitlines()[0].strip()
    return "unversioned"


def header(version: str) -> str:
    return (
        f"{HEADER_MARK}，协议版本 {version}。"
        f"请勿在此修改，改动请提交到 suite-contract。 -->\n\n"
    )


def write(path: Path, content: str) -> None:
    old = path.read_text(encoding="utf-8") if path.exists() else None
    if old == content:
        print(f"  unchanged {path}")
        return
    action = "update" if old is not None else "create"
    if DRY_RUN:
        print(f"  [dry-run] would {action} {path}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  {action}d {path}")


def sync_rules(repo: Path) -> None:
    agents = repo / "AGENTS.md"
    rules = RULES_SRC.read_text(encoding="utf-8").strip()
    block = f"{BEGIN}\n{rules}\n{END}"

    if not agents.exists():
        write(agents, f"# AI 助手开发约定\n\n{block}\n")
        return

    text = agents.read_text(encoding="utf-8")
    if BEGIN in text and END in text:
        head, rest = text.split(BEGIN, 1)
        _, tail = rest.split(END, 1)
        new_text = f"{head}{block}{tail}"
    else:
        new_text = text.rstrip() + f"\n\n{block}\n"
    write(agents, new_text)


def copy_doc(src: Path, dst: Path, version: str) -> None:
    write(dst, header(version) + src.read_text(encoding="utf-8"))


def sync_decisions(repo: Path, version: str) -> None:
    dst_dir = repo / "docs" / "suite" / "decisions"
    sources = sorted(DECISIONS_SRC.glob("*.md")) if DECISIONS_SRC.is_dir() else []
    names = {p.name for p in sources}

    for src in sources:
        copy_doc(src, dst_dir / src.name, version)

    if dst_dir.is_dir():
        for stale in sorted(dst_dir.glob("*.md")):
            if stale.name in names:
                continue
            if stale.read_text(encoding="utf-8").startswith(HEADER_MARK):
                if DRY_RUN:
                    print(f"  [dry-run] would remove stale {stale}")
                else:
                    stale.unlink()
                    print(f"  removed stale {stale}")
            else:
                print(f"  WARNING: {stale} was not written by this script; left untouched")


def main(argv: list[str]) -> int:
    global DRY_RUN
    args = argv[1:]
    if "--dry-run" in args:
        DRY_RUN = True
        args = [a for a in args if a != "--dry-run"]
    if not args:
        print(__doc__)
        return 1

    version = read_version()
    for arg in args:
        repo = Path(arg).resolve()
        if not repo.is_dir():
            print(f"skip: {repo} is not a directory")
            continue
        print(f"[{repo.name}] protocol {version}")
        sync_rules(repo)
        copy_doc(INTEROP_SRC, repo / "docs" / "suite" / "SUITE_INTEROP.md", version)
        if OPEN_Q_SRC.exists():
            copy_doc(OPEN_Q_SRC, repo / "docs" / "suite" / "OPEN_QUESTIONS.md", version)
        sync_decisions(repo, version)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
