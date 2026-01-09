#!/usr/bin/env fish

bkt --ttl=1h -- curl --silent --location "https://github.com/web-platform-dx/web-features/releases/latest/download/data.json" | jq '.features | { items: [to_entries[] | select(.value.kind == "feature") | { uid: .key, type: "default", title: .value.name, subtitle: .value.description, arg: .key, match: "\(.key): \(.value.name)"}] }'
