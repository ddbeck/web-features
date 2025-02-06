#!/usr/bin/env fish

npm install --silent
and npx tsx ./scripts/stats.ts --verbose | jq --raw-output '.currentBurndown[]'
