#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$ROOT_DIR/version.js"

BUMP_TYPE="${1:-patch}"
DESCRIPTION="${2:-Update}"

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "version.js not found at $VERSION_FILE"
  exit 1
fi

CURRENT_VERSION=$(grep -oE "VERSION = '[0-9]+\.[0-9]+\.[0-9]+'" "$VERSION_FILE" | sed "s/VERSION = '//;s/'$//")

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "Usage: $0 {major|minor|patch} \"description\""
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
DATE=$(date +%Y-%m-%d)

# Update VERSION constant
sed -i.bak "s/VERSION = '$CURRENT_VERSION'/VERSION = '$NEW_VERSION'/" "$VERSION_FILE"
rm "$VERSION_FILE.bak"

# Add new history entry after the opening bracket using awk for cross-platform compatibility
awk -v ver="$NEW_VERSION" -v dt="$DATE" -v desc="$DESCRIPTION" '
  /VERSION_HISTORY = \[/ {
    print
    print "  { version: \047" ver "\047, date: \047" dt "\047, description: \047" desc "\047 },"
    next
  }
  { print }
' "$VERSION_FILE" > "$VERSION_FILE.tmp" && mv "$VERSION_FILE.tmp" "$VERSION_FILE"

echo "Bumped version: $CURRENT_VERSION -> $NEW_VERSION"
