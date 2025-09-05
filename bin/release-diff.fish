#!/usr/bin/env fish
set latestRelease (gh release view --json tagName --jq .tagName)

function get_released_json
    bkt --ttl=8h -- curl --silent --location "https://github.com/web-platform-dx/web-features/releases/download/$latestRelease/data.json"
end

function get_next_json
    bkt --ttl=1m -- curl --silent --location "https://github.com/web-platform-dx/web-features/releases/download/next/data.json"
end

diff -u (get_released_json | jq --raw-output '.features | keys[]' | psub) (get_next_json | jq --raw-output '.features | keys[]' | psub)
diff -u (get_released_json | jq --raw-output '.groups | keys[]' | psub) (get_next_json | jq --raw-output '.groups | keys[]' | psub)
