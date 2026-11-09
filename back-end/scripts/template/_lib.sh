#!/usr/bin/env bash
# Shared helpers for template package sync (upstream read-only → local clone).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE_POLICY_FILE="$SCRIPT_DIR/package-policy.json"

# Loads UPSTREAM_URL and UPSTREAM_REF from scripts/template/upstream.env, git remote upstream, or env (no exit).
template_read_upstream_env() {
  local env_file="$SCRIPT_DIR/upstream.env"
  if [[ -f "$env_file" ]]; then
    # shellcheck disable=SC1090
    set -a && source "$env_file" && set +a
  fi
  if [[ -z "${UPSTREAM_URL:-}" ]] && git -C "$REPO_ROOT" remote get-url upstream &>/dev/null; then
    UPSTREAM_URL="$(git -C "$REPO_ROOT" remote get-url upstream)"
  fi
  UPSTREAM_REF="${UPSTREAM_REF:-main}"
}

# Same as template_read_upstream_env but exits if UPSTREAM_URL is still unset (clone scripts need it).
template_load_env() {
  template_read_upstream_env
  if [[ -z "${UPSTREAM_URL:-}" ]]; then
    echo "template: set UPSTREAM_URL (scripts/template/upstream.env from upstream.env.example, or git remote upstream)." >&2
    exit 1
  fi
}

template_require_cmds() {
  local missing=()
  for c in "$@"; do
    command -v "$c" &>/dev/null || missing+=("$c")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "template: missing commands: ${missing[*]}" >&2
    exit 1
  fi
}

# Maps util-foo-bar → @util/foo-bar (directory name → npm package name).
template_dir_to_npm_name() {
  local d="$1"
  local rest="${d#util-}"
  if [[ "$rest" == "$d" ]]; then
    echo "template: invalid package directory (expected util-*): $d" >&2
    exit 1
  fi
  echo "@util/${rest}"
}

# Validates directory argument (e.g. util-redis).
template_validate_util_dir() {
  local d="$1"
  if [[ ! "$d" =~ ^util-[a-z0-9][a-z0-9.-]*$ ]]; then
    echo "template: invalid package directory name: $d (expected util-<name>)" >&2
    exit 1
  fi
}

# Shallow clone of upstream at UPSTREAM_REF into destination (whole repo, depth 1).
template_upstream_clone_once() {
  local dest_clone="$1"
  rm -rf "$dest_clone"
  mkdir -p "$(dirname "$dest_clone")"
  if git clone --depth 1 -b "$UPSTREAM_REF" --single-branch "$UPSTREAM_URL" "$dest_clone" 2>/dev/null; then
    return 0
  fi
  git clone --depth 1 "$UPSTREAM_URL" "$dest_clone"
  if ! git -C "$dest_clone" fetch --depth 1 origin "$UPSTREAM_REF"; then
    git -C "$dest_clone" fetch --depth 1 origin "refs/tags/${UPSTREAM_REF}:refs/tags/${UPSTREAM_REF}" || true
  fi
  git -C "$dest_clone" checkout FETCH_HEAD 2>/dev/null || git -C "$dest_clone" checkout "$UPSTREAM_REF"
}

# Copy packages/<pkg_dir> from clone root into REPO_ROOT/packages/<pkg_dir>.
template_copy_tree_from_clone() {
  local clone_root="$1"
  local pkg_dir="$2"
  local src="$clone_root/packages/$pkg_dir"
  local dst="$REPO_ROOT/packages/$pkg_dir"
  if [[ ! -d "$src" ]]; then
    echo "template: upstream has no path packages/$pkg_dir (ref $UPSTREAM_REF)." >&2
    exit 1
  fi
  mkdir -p "$REPO_ROOT/packages"
  rm -rf "$dst"
  cp -R "$src" "$dst"
}

# Lists @util/* names that appear with workspace: protocol in a package.json file.
template_workspace_util_names_in_file() {
  local f="$1"
  jq -r '
    [
      (.dependencies // empty | to_entries[]),
      (.devDependencies // empty | to_entries[]),
      (.peerDependencies // empty | to_entries[])
    ]
    | .[]
    | select(
        (.value | type == "string")
        and (.value | startswith("workspace:"))
        and (.key | startswith("@util/"))
      )
    | .key
  ' "$f" 2>/dev/null || true
}

# Prints sorted unique util-* directory names required by the repo (from all package.json files).
template_collect_required_util_dirs() {
  local f name rest dirs=()
  while IFS= read -r -d '' f; do
    while IFS= read -r name; do
      [[ -z "$name" ]] && continue
      rest="${name#@util/}"
      dirs+=("util-${rest}")
    done < <(template_workspace_util_names_in_file "$f")
  done < <(find "$REPO_ROOT" \
    \( -path "$REPO_ROOT/node_modules" -o -path "$REPO_ROOT/.git" -o -path "$REPO_ROOT/dist" -o -path "$REPO_ROOT/.turbo" \) -prune -o \
    -name package.json -print0)

  if [[ ${#dirs[@]} -eq 0 ]]; then
    return 0
  fi
  printf '%s\n' "${dirs[@]}" | sort -u
}

# Removes workspace: refs to given npm package names from every package.json (excluding node_modules).
template_strip_workspace_refs() {
  local names_json
  names_json="$(printf '%s\n' "$@" | jq -R . | jq -s .)"
  local f tmp
  while IFS= read -r -d '' f; do
    tmp="$(mktemp)"
    jq --argjson removed "$names_json" '
      reduce $removed[] as $p (.;
        .dependencies //= {}
        | .devDependencies //= {}
        | .peerDependencies //= {}
        | .dependencies |= if ((.[$p] // "") | test("^workspace:")) then del(.[$p]) else . end
        | .devDependencies |= if ((.[$p] // "") | test("^workspace:")) then del(.[$p]) else . end
        | .peerDependencies |= if ((.[$p] // "") | test("^workspace:")) then del(.[$p]) else . end
      )
    ' "$f" >"$tmp" && mv "$tmp" "$f"
  done < <(find "$REPO_ROOT" \
    \( -path "$REPO_ROOT/node_modules" -o -path "$REPO_ROOT/.git" \) -prune -o \
    -name package.json -print0)
}

# Returns 0 when package-policy.json marks a util-* directory as mandatory.
template_is_mandatory_util_dir() {
  local pkg_dir="$1"
  if [[ ! -f "$TEMPLATE_POLICY_FILE" ]]; then
    return 1
  fi
  jq -e --arg dir "$pkg_dir" '(.mandatoryPackages // []) | index($dir) != null' "$TEMPLATE_POLICY_FILE" >/dev/null 2>&1
}

# Prints sorted unique mandatory util-* dirs from package-policy.json.
template_list_mandatory_util_dirs() {
  if [[ ! -f "$TEMPLATE_POLICY_FILE" ]]; then
    return 0
  fi
  jq -r '(.mandatoryPackages // [])[]' "$TEMPLATE_POLICY_FILE" 2>/dev/null | sed '/^$/d' | sort -u
}

# Ensures a util-* directory is present in package-policy.json mandatoryPackages.
template_mark_mandatory_util_dir() {
  local pkg_dir="$1"
  local tmp
  mkdir -p "$SCRIPT_DIR"
  if [[ ! -f "$TEMPLATE_POLICY_FILE" ]]; then
    printf '{\n  "mandatoryPackages": []\n}\n' >"$TEMPLATE_POLICY_FILE"
  fi
  tmp="$(mktemp)"
  jq --arg dir "$pkg_dir" '
    .mandatoryPackages = ((.mandatoryPackages // []) + [$dir] | unique | sort)
  ' "$TEMPLATE_POLICY_FILE" >"$tmp" && mv "$tmp" "$TEMPLATE_POLICY_FILE"
}

# Prints dependent package.json paths that reference target npm package via workspace protocol.
# Excludes any packages/<dir>/package.json listed in excluded util-* dirs.
template_find_workspace_dependents() {
  local target_npm="$1"
  shift || true
  local excluded_dirs=("$@")
  local f dir skip
  while IFS= read -r -d '' f; do
    skip=0
    if [[ "$f" == "$REPO_ROOT/packages/"*/package.json ]]; then
      dir="$(basename "$(dirname "$f")")"
      for d in "${excluded_dirs[@]}"; do
        if [[ "$d" == "$dir" ]]; then
          skip=1
          break
        fi
      done
    fi
    [[ "$skip" == 1 ]] && continue
    if jq -e --arg p "$target_npm" '
      [
        (.dependencies // {} | to_entries[]?),
        (.devDependencies // {} | to_entries[]?),
        (.peerDependencies // {} | to_entries[]?)
      ]
      | any(
          .key == $p and (.value | type == "string") and (.value | startswith("workspace:"))
        )
    ' "$f" >/dev/null 2>&1; then
      printf '%s\n' "${f#$REPO_ROOT/}"
    fi
  done < <(find "$REPO_ROOT" \
    \( -path "$REPO_ROOT/node_modules" -o -path "$REPO_ROOT/.git" -o -path "$REPO_ROOT/dist" -o -path "$REPO_ROOT/.turbo" \) -prune -o \
    -name package.json -print0)
}

# Returns npm package name from packages/<dir>/package.json Name field.
template_read_pkg_name_from_dir() {
  local pkg_dir="$1"
  jq -r '.name // empty' "$REPO_ROOT/packages/$pkg_dir/package.json"
}
