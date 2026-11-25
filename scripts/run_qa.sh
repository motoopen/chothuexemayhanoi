#!/usr/bin/env bash
# Local mirror of the CI gate. Usage: scripts/run_qa.sh [site_dir]
set -euo pipefail
SITE="${1:-_site}"
jekyll build -d "$SITE" >/dev/null
python3 scripts/check_site_links.py "$SITE"
python3 scripts/check_blog_quality.py "$SITE"
python3 scripts/schema_snapshot.py compare "$SITE" qa/schema-baseline.json
test -s "$SITE/llms.txt" && grep -q "0857 255 868" "$SITE/llms.txt"
test "$(grep -c '/chothuexemayhanoi/blog/' "$SITE/llms-full.txt")" -ge 301
python3 -c "import json,sys; d=json.load(open(sys.argv[1])); assert d['name']=='Motoopen'" "$SITE/du-lieu/motoopen-business.json"
if grep -R -n -E '\{%|\{\{' "$SITE" --include='*.html' --include='*.txt' --include='*.json' --include='*.xml' | grep -v motoai | head -5 | grep -q .; then echo "Unrendered Liquid"; exit 1; fi
echo "LOCAL QA PASS"
