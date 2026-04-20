#!/usr/bin/env fish

bkt --ttl=1h --discard-failures -- curl --silent --location "https://github.com/web-platform-dx/web-features/releases/download/next/data.json" | jq '.features | { items: [to_entries[] | select(.value.kind == "feature") | { uid: .key, type: "default", title: .value.name, subtitle: .value.description, arg: .key, match: "\(.key): \(.value.name)"}] }'
