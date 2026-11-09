#!/usr/bin/env bash
# Ensure every @util/* workspace dependency exists under packages/* by copying from UPSTREAM.
# Usage: ensure-workspace-packages.sh
# Requires: UPSTREAM_URL, UPSTREAM_REF (see upstream.env.example).

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_lib.sh"

template_load_env
template_require_cmds jq git pnpm

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: ensure-workspace-packages.sh"
  echo "Copies missing packages/* trees from UPSTREAM (depth-1 clone), then runs pnpm install."
  exit 0
fi

missing=()
while IFS= read -r dir; do
  [[ -z "$dir" ]] && continue
  template_validate_util_dir "$dir"
  if [[ ! -d "$REPO_ROOT/packages/$dir" ]]; then
    missing+=("$dir")
  fi
done < <(template_collect_required_util_dirs)

if [[ ${#missing[@]} -eq 0 ]]; then
  (cd "$REPO_ROOT" && pnpm install)
  exit 0
fi

tmp="$(mktemp -d)"
cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT

template_upstream_clone_once "$tmp/up"

for dir in "${missing[@]}"; do
  echo "template: restoring packages/$dir from upstream ($UPSTREAM_REF)..."
  template_copy_tree_from_clone "$tmp/up" "$dir"
done

(cd "$REPO_ROOT" && pnpm install)
echo "template: done."
