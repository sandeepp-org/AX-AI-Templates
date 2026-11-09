#!/usr/bin/env bash
# Copy packages from upstream; optionally link into app/frontend; then ensure transitive workspace deps.
# Usage: add-packages-from-upstream.sh [--force] [--link-app] [--link-frontend] util-foo [util-bar ...]

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_lib.sh"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: add-packages-from-upstream.sh [--force] [--link-app] [--link-frontend] util-foo ..."
  echo "  --force        Replace existing packages/<name> if present."
  echo "  --link-app     pnpm --filter app add <pkg>@workspace:* for each added util package."
  echo "  --link-frontend  pnpm --filter frontend add <pkg>@workspace:* for each."
  exit 0
fi

template_load_env
template_require_cmds jq git pnpm

FORCE=0
LINK_APP=0
LINK_FE=0
pkgs=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    --link-app) LINK_APP=1; shift ;;
    --link-frontend) LINK_FE=1; shift ;;
    *) pkgs+=("$1"); shift ;;
  esac
done

if [[ ${#pkgs[@]} -eq 0 ]]; then
  echo "template: pass at least one util-* package to add." >&2
  exit 1
fi

for d in "${pkgs[@]}"; do
  template_validate_util_dir "$d"
  if [[ -d "$REPO_ROOT/packages/$d" && "$FORCE" != 1 ]]; then
    echo "template: packages/$d already exists. Use update-packages-from-upstream.sh or --force." >&2
    exit 1
  fi
done

tmp="$(mktemp -d)"
cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT

template_upstream_clone_once "$tmp/up"

for d in "${pkgs[@]}"; do
  echo "template: adding packages/$d from upstream ($UPSTREAM_REF)..."
  template_copy_tree_from_clone "$tmp/up" "$d"
done

# Auto-install transitive workspace package dependencies for newly added packages.
"$SCRIPT_DIR/ensure-workspace-packages.sh"

if [[ "$LINK_APP" == 1 ]]; then
  for d in "${pkgs[@]}"; do
    pkg_name="$(template_read_pkg_name_from_dir "$d")"
    if [[ -z "$pkg_name" ]]; then
      echo "template: could not read .name for packages/$d" >&2
      exit 1
    fi
    (cd "$REPO_ROOT" && pnpm --filter app add "${pkg_name}@workspace:*")
  done
fi

if [[ "$LINK_FE" == 1 ]]; then
  for d in "${pkgs[@]}"; do
    pkg_name="$(template_read_pkg_name_from_dir "$d")"
    if [[ -z "$pkg_name" ]]; then
      echo "template: could not read .name for packages/$d" >&2
      exit 1
    fi
    (cd "$REPO_ROOT" && pnpm --filter frontend add "${pkg_name}@workspace:*")
  done
fi

echo "template: add complete."
