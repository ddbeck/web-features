#!/usr/bin/env fish

argparse no-deprecations -- $argv

set json (bkt --ttl=12h --discard-failures -- npx tsx ./scripts/unmapped-compat-keys.ts --format=json | jq --compact-output .)

if set -ql _flag_no_deprecations
    echo $json | jq --raw-output '[.[] | select(.deprecated != true)][-20:] | .[].key'
else
    echo $json | jq --raw-output '.[-20:]'
end
