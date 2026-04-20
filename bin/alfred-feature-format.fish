#!/usr/bin/env fish

set alfredarg $argv

function get-feature
    bkt --ttl=1h --discard-failures -- curl --silent --location "https://github.com/web-platform-dx/web-features/releases/download/next/data.json" \
        | jq --arg from_alfred $alfredarg '.features[$from_alfred]'
end

set name (get-feature | jq --raw-output .name)
set description (get-feature | jq --raw-output .description_html | pandoc --from html --to plain | string collect | string replace --all '"' "&quot;")
set explorerurl (echo "https://web-platform-dx.github.io/web-features-explorer/features/$argv/")
set sourceurl (echo "https://github.com/web-platform-dx/web-features/blob/main/features/$argv.yml")
set disturl (echo "$sourceurl.dist")

echo "[`$alfredarg`]($explorerurl \"$name: $description\") ([source]($sourceurl), [dist]($disturl))"
