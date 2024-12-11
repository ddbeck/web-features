#!/usr/bin/env fish

set -l release (begin
  echo main
  git tag | rg '^v'
end | fzf)

if git checkout --quiet --detach $release
    echo $release
    if npm install --silent
        npx tsx ./scripts/stats.ts
    end
    if git checkout --quiet -
        npm install --silent
    end
end
