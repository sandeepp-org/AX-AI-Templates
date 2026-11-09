#!/usr/bin/env bash
# Commit packages/*, push to origin, open or print a PR to upstream main.
# Usage: contribute-package-pr.sh [branch-name] [commit-message]
# Requires: origin = your fork; upstream or UPSTREAM_URL for compare / gh repo.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_lib.sh"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: contribute-package-pr.sh [branch-name] [commit-message]"
  echo "Stages only packages/, commits, pushes to origin, then opens a PR to base main (gh) or prints compare URL."
  exit 0
fi

template_require_cmds git

BRANCH="${1:-package-sync-$(date +%Y%m%d-%H%M%S)}"
MSG="${2:-chore(template): contribute packages}"

cd "$REPO_ROOT"

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
fi

git add packages
if git diff --staged --quiet; then
  echo "template: nothing to commit under packages/." >&2
  exit 1
fi

git commit -m "$MSG"
git push -u origin "$BRANCH"

template_read_upstream_env
UPSTREAM_REMOTE_URL="${UPSTREAM_URL:-}"
if [[ -z "$UPSTREAM_REMOTE_URL" ]] && git remote get-url upstream &>/dev/null; then
  UPSTREAM_REMOTE_URL="$(git remote get-url upstream)"
fi

origin_url="$(git remote get-url origin)"
fork_owner=""
fork_repo=""
if [[ "$origin_url" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
  fork_owner="${BASH_REMATCH[1]}"
  fork_repo="${BASH_REMATCH[2]%.git}"
fi

up_owner=""
up_repo=""
if [[ -n "$UPSTREAM_REMOTE_URL" ]] && [[ "$UPSTREAM_REMOTE_URL" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
  up_owner="${BASH_REMATCH[1]}"
  up_repo="${BASH_REMATCH[2]%.git}"
fi

compare_url=""
if [[ -n "$up_owner" && -n "$up_repo" && -n "$fork_owner" ]]; then
  compare_url="https://github.com/${up_owner}/${up_repo}/compare/main...${fork_owner}:${BRANCH}?expand=1"
fi

if command -v gh &>/dev/null && gh auth status &>/dev/null && [[ -n "$up_owner" && -n "$up_repo" ]]; then
  export GH_PROMPT_DISABLED=1
  if gh pr create --repo "${up_owner}/${up_repo}" --base main --head "${fork_owner}:${BRANCH}" --title "$MSG" --body "Contributed via scripts/template/contribute-package-pr.sh" 2>/dev/null; then
    echo "template: opened PR on ${up_owner}/${up_repo} (base main)."
    exit 0
  fi
  if gh pr create --base main --title "$MSG" --body "Contributed via scripts/template/contribute-package-pr.sh" 2>/dev/null; then
    echo "template: opened PR (detected parent upstream)."
    exit 0
  fi
  echo "template: gh pr create failed; open this compare URL instead:" >&2
else
  echo "template: install GitHub CLI (gh) and auth, or open this URL:" >&2
fi

if [[ -n "$compare_url" ]]; then
  echo "$compare_url"
else
  echo "template: set git remote upstream or UPSTREAM_URL to build a compare URL (fork owner: ${fork_owner:-unknown})." >&2
fi
