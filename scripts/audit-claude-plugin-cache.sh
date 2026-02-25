#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  audit-claude-plugin-cache.sh [--marketplace <name>] [--delete-orphans]

What it does:
  - Reads ~/.claude/plugins/installed_plugins.json (source of truth for "installed").
  - Scans ~/.claude/plugins/cache/*/*/* (cached plugin versions).
  - Reports which cached versions are ACTIVE (referenced by installed_plugins.json)
    vs ORPHAN (present in cache but not installed).

Notes:
  - ORPHAN cache entries can exist even if you never installed the plugin (Discover
    and marketplace update may download plugin bundles for preview).
  - --delete-orphans is destructive: it deletes only ORPHAN version directories.

Examples:
  scripts/audit-claude-plugin-cache.sh
  scripts/audit-claude-plugin-cache.sh --marketplace possiblaw-plugins
  scripts/audit-claude-plugin-cache.sh --marketplace possiblaw-plugins --delete-orphans
EOF
}

marketplace=""
delete_orphans=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --marketplace)
      marketplace="${2:-}"
      if [[ -z "$marketplace" ]]; then
        echo "ERROR: --marketplace requires a value" >&2
        exit 2
      fi
      shift 2
      ;;
    --delete-orphans)
      delete_orphans=1
      shift
      ;;
    *)
      echo "ERROR: Unknown arg: $1" >&2
      echo >&2
      usage >&2
      exit 2
      ;;
  esac
done

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required but not installed." >&2
  exit 1
fi

installed_json="${HOME}/.claude/plugins/installed_plugins.json"
cache_root="${HOME}/.claude/plugins/cache"

if [[ ! -f "$installed_json" ]]; then
  echo "ERROR: Missing $installed_json" >&2
  exit 1
fi

if [[ ! -d "$cache_root" ]]; then
  echo "ERROR: Missing cache directory: $cache_root" >&2
  exit 1
fi

active_paths_file="$(mktemp)"
installed_ids_file="$(mktemp)"
trap 'rm -f "$active_paths_file" "$installed_ids_file"' EXIT

# Keep bash 3.2 compatible (macOS default): no associative arrays.
jq -r '.plugins | to_entries[] | .value[] | .installPath // empty' "$installed_json" | sort -u >"$active_paths_file"
jq -r '.plugins | keys[]' "$installed_json" | sort -u >"$installed_ids_file"

echo "Installed source of truth: $installed_json"
echo "Cache root: $cache_root"
if [[ -n "$marketplace" ]]; then
  echo "Marketplace filter: $marketplace"
fi
echo

echo "Installed plugin IDs (from installed_plugins.json):"
if [[ -n "$marketplace" ]]; then
  jq -r --arg mp "$marketplace" '.plugins | keys[] | select(endswith("@" + $mp))' "$installed_json" | sed 's/^/  - /'
else
  jq -r '.plugins | keys[]' "$installed_json" | sed 's/^/  - /'
fi
echo

scan_root="$cache_root"
if [[ -n "$marketplace" ]]; then
  scan_root="$cache_root/$marketplace"
fi

if [[ ! -d "$scan_root" ]]; then
  echo "No cache directory for scan root: $scan_root"
  exit 0
fi

active_count=0
orphan_count=0
missing_count=0
name_mismatch_count=0

echo "Cached plugin versions:"

# Expected layout: cache/<marketplace>/<plugin>/<version>
depth_min=3
depth_max=3
if [[ -n "$marketplace" ]]; then
  # scan_root is already cache/<marketplace>
  depth_min=2
  depth_max=2
fi
while IFS= read -r version_dir; do
  [[ -z "$version_dir" ]] && continue

  rel="${version_dir#"$cache_root"/}"
  mp="${rel%%/*}"
  rest="${rel#"$mp"/}"
  plugin="${rest%%/*}"
  version="${rel##*/}"
  id="${plugin}@${mp}"

  status="ORPHAN"
  if grep -Fxq "$version_dir" "$active_paths_file"; then
    status="ACTIVE"
  fi

  # If a plugin is installed but none of its cache paths exist, that indicates corruption.
  # We'll also count that later using active_paths.
  if [[ "$status" == "ACTIVE" ]]; then
    active_count=$((active_count + 1))
  else
    orphan_count=$((orphan_count + 1))
  fi

  note=""
  if ! grep -Fxq "$id" "$installed_ids_file"; then
    note=" (plugin id not installed; likely Discover/preview cache)"
  fi

  manifest_note=""
  manifest_path="$version_dir/.claude-plugin/plugin.json"
  if [[ -f "$manifest_path" ]]; then
    manifest_name="$(jq -r '.name // empty' "$manifest_path" 2>/dev/null || true)"
    if [[ -n "$manifest_name" && "$manifest_name" != "$plugin" ]]; then
      name_mismatch_count=$((name_mismatch_count + 1))
      manifest_note=" (NAME_MISMATCH plugin.json name='$manifest_name' expected='$plugin')"
    fi
  else
    manifest_note=" (missing .claude-plugin/plugin.json)"
  fi

  echo "  - $status $id version=$version path=$version_dir$note$manifest_note"

  if [[ "$delete_orphans" -eq 1 && "$status" == "ORPHAN" ]]; then
    rm -rf "$version_dir"
  fi
done < <(find "$scan_root" -mindepth "$depth_min" -maxdepth "$depth_max" -type d 2>/dev/null | sort)

if [[ "$delete_orphans" -eq 1 ]]; then
  echo
  echo "Deleted ORPHAN cache entries."
fi

# Count active paths that are missing on disk.
while IFS= read -r p; do
  [[ -z "$p" ]] && continue
  if [[ ! -d "$p" ]]; then
    missing_count=$((missing_count + 1))
  fi
done <"$active_paths_file"

echo
echo "Summary:"
echo "  ACTIVE cached versions:  $active_count"
echo "  ORPHAN cached versions:  $orphan_count"
echo "  ACTIVE paths missing:    $missing_count"
echo "  NAME_MISMATCH versions:  $name_mismatch_count"

if [[ "$missing_count" -ne 0 ]]; then
  echo
  echo "WARNING: Some installed_plugins.json installPath entries do not exist on disk." >&2
  echo "         Fix by reinstalling the affected plugin(s) or clearing cache + reinstalling." >&2
fi
