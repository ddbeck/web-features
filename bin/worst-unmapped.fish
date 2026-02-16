#!/usr/bin/env fish

bkt --ttl=12h -- npx tsx ./scripts/unmapped-compat-keys.ts --format=json | jq --raw-output '.[-20:] | .[] | .key'
