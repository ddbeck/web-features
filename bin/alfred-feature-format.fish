#!/usr/bin/env fish

bkt --ttl=1h -- curl --silent --location "https://github.com/web-platform-dx/web-features/releases/latest/download/data.json" \
    | jq \
    --arg from_alfred $argv \
    --arg explorer 'https://web-platform-dx.github.io/web-features-explorer/features/' \
    --arg github 'https://github.com/web-platform-dx/web-features/blob/main/features/' \
    --raw-output \
    '.features[$from_alfred] | "[\($from_alfred)](\($explorer)\($from_alfred) \"\(.description_html)\") ([source](\($github)\($from_alfred).yml), [dist](\($github)\($from_alfred).yml.dist))"'
