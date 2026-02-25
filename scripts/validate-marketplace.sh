#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MARKETPLACE_MANIFEST="$ROOT_DIR/.claude-plugin/marketplace.json"

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required but not installed." >&2
  exit 1
fi

if [[ ! -f "$MARKETPLACE_MANIFEST" ]]; then
  echo "ERROR: Marketplace manifest not found: $MARKETPLACE_MANIFEST" >&2
  exit 1
fi

errors=0
seen_names_file="$(mktemp)"
trap 'rm -f "$seen_names_file"' EXIT

plugin_count="$(jq '.plugins | length' "$MARKETPLACE_MANIFEST")"
echo "Validating $plugin_count marketplace plugin(s)..."

while IFS= read -r plugin_entry; do
  plugin_id="$(jq -r '.name' <<<"$plugin_entry")"
  plugin_source="$(jq -r '.source' <<<"$plugin_entry")"
  marketplace_version="$(jq -r '.version // empty' <<<"$plugin_entry")"
  plugin_dir="$ROOT_DIR/${plugin_source#./}"
  plugin_manifest="$plugin_dir/.claude-plugin/plugin.json"

  if [[ ! -f "$plugin_manifest" ]]; then
    echo "ERROR: Missing plugin manifest for '$plugin_id': $plugin_manifest" >&2
    errors=1
    continue
  fi

  manifest_name="$(jq -r '.name // empty' "$plugin_manifest")"
  manifest_version="$(jq -r '.version // empty' "$plugin_manifest")"

  if [[ -z "$manifest_name" ]]; then
    echo "ERROR: '$plugin_id' has empty .name in $plugin_manifest" >&2
    errors=1
    continue
  fi

  if [[ "$manifest_name" != "$plugin_id" ]]; then
    echo "ERROR: Name mismatch for '$plugin_id': plugin.json name is '$manifest_name'" >&2
    errors=1
  fi

  if [[ "$manifest_name" == "possiblaw" ]]; then
    echo "ERROR: '$plugin_id' plugin.json name must not be 'possiblaw' (namespace collision)" >&2
    errors=1
  fi

  if grep -q "^${manifest_name}|.*$" "$seen_names_file"; then
    first_plugin_id="$(grep "^${manifest_name}|.*$" "$seen_names_file" | head -n 1 | cut -d'|' -f2)"
    echo "ERROR: Duplicate plugin.json name '$manifest_name' in '$plugin_id' and '$first_plugin_id'" >&2
    errors=1
  else
    echo "${manifest_name}|${plugin_id}" >> "$seen_names_file"
  fi

  if [[ -z "$manifest_version" ]]; then
    echo "ERROR: '$plugin_id' has empty .version in $plugin_manifest" >&2
    errors=1
  fi

  # For relative-path sources inside this marketplace repo, keep marketplace.json and
  # plugin.json versions aligned so Claude can reliably detect updates.
  if [[ "${plugin_source}" == ./* ]]; then
    if [[ -z "$marketplace_version" ]]; then
      echo "ERROR: '$plugin_id' is missing .version in $MARKETPLACE_MANIFEST" >&2
      errors=1
    elif [[ "$marketplace_version" != "$manifest_version" ]]; then
      echo "ERROR: Version mismatch for '$plugin_id': marketplace.json version is '$marketplace_version' but plugin.json version is '$manifest_version'" >&2
      errors=1
    fi
  fi

  echo "OK: $plugin_id ($manifest_version)"
done < <(jq -c '.plugins[]' "$MARKETPLACE_MANIFEST")

if [[ "$errors" -ne 0 ]]; then
  echo
  echo "Marketplace validation failed." >&2
  exit 1
fi

echo
echo "Marketplace validation passed."
