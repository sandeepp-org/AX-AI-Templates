#!/usr/bin/env bash
# Replace local packages/* trees from upstream at UPSTREAM_REF.
# Usage: update-packages-from-upstream.sh [--dry-run] util-foo [util-bar ...]

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_lib.sh"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: update-packages-from-upstream.sh [--dry-run] util-foo ..."
  echo "Overwrites packages/<name> with upstream content, then pnpm install."
  exit 0
fi

DRY=0
pkgs=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY=1; shift ;;
    *) pkgs+=("$1"); shift ;;
  esac
done

if [[ ${#pkgs[@]} -eq 0 ]]; then
  echo "template: pass at least one util-* package to update." >&2
  exit 1
fi

for d in "${pkgs[@]}"; do
  template_validate_util_dir "$d"
done

if [[ "$DRY" == 1 ]]; then
  template_read_upstream_env
  echo "template: UPSTREAM_URL=${UPSTREAM_URL:-unset} UPSTREAM_REF=$UPSTREAM_REF"
  for d in "${pkgs[@]}"; do
    echo "template: dry-run — would replace packages/$d from upstream ($UPSTREAM_REF)"
  done
  exit 0
fi

template_load_env
template_require_cmds jq git pnpm

tmp="$(mktemp -d)"
cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT

template_upstream_clone_once "$tmp/up"

for d in "${pkgs[@]}"; do
  echo "template: updating packages/$d from upstream ($UPSTREAM_REF)..."
  template_copy_tree_from_clone "$tmp/up" "$d"
done

(cd "$REPO_ROOT" && pnpm install)
echo "template: update complete."
