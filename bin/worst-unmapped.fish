#!/usr/bin/env fish

argparse no-deprecations -- $argv

if set -ql _flag_no_deprecations
    echo no deps
else
    exit 1
end

bkt --ttl=12h --discard-failures -- npx tsx ./scripts/unmapped-compat-keys.ts --format=json | jq --raw-output '[.[] | select(.deprecated != true)][-20:] | .[].key'
