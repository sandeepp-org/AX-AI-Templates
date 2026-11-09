#!/usr/bin/env bash
# Remove util-* packages locally with dependency guards, then heal graph from upstream.
# Usage: remove-packages.sh [--force] util-foo [util-bar ...]
# Default behavior blocks removal when the package is mandatory or still referenced.
# --force bypasses these guards and strips workspace refs.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_lib.sh"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: remove-packages.sh [--force] util-foo [util-bar ...]"
  echo "Deletes packages/<name>, removes workspace: refs to those @util/* names from all package.json,"
  echo "then runs ensure-workspace-packages.sh."
  echo "By default this command refuses to remove mandatory packages and packages still referenced"
  echo "by kept package.json files. Use --force to bypass."
  exit 0
fi

template_load_env
template_require_cmds jq git pnpm

FORCE=0
to_remove=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    -h | --help)
      echo "Usage: remove-packages.sh [--force] util-foo ..."
      exit 0
      ;;
    *)
      to_remove+=("$1")
      shift
      ;;
  esac
done

if [[ ${#to_remove[@]} -eq 0 ]]; then
  echo "template: pass at least one util-* directory name to remove." >&2
  exit 1
fi

removed_npms=()
for d in "${to_remove[@]}"; do
  template_validate_util_dir "$d"
  removed_npms+=("$(template_dir_to_npm_name "$d")")
done

if [[ "$FORCE" != 1 ]]; then
  for d in "${to_remove[@]}"; do
    if template_is_mandatory_util_dir "$d"; then
      echo "template: cannot remove mandatory package packages/$d (see scripts/template/package-policy.json)." >&2
      exit 1
    fi
  done

  for idx in "${!to_remove[@]}"; do
    d="${to_remove[$idx]}"
    npm="${removed_npms[$idx]}"
    dependents="$(template_find_workspace_dependents "$npm" "${to_remove[@]}")"
    if [[ -n "$dependents" ]]; then
      template_mark_mandatory_util_dir "$d"
      echo "template: cannot remove packages/$d; still required by:" >&2
      while IFS= read -r ref; do
        [[ -z "$ref" ]] && continue
        echo "  - $ref" >&2
      done <<<"$dependents"
      echo "template: packages/$d was added to scripts/template/package-policy.json mandatoryPackages." >&2
      echo "template: remove dependents first, or use --force to override." >&2
      exit 1
    fi
  done
fi

for d in "${to_remove[@]}"; do
  echo "template: removing packages/$d"
  rm -rf "$REPO_ROOT/packages/$d"
done

template_strip_workspace_refs "${removed_npms[@]}"

exec "$SCRIPT_DIR/ensure-workspace-packages.sh"
