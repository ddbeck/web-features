#!/usr/bin/env fish

set -l release (begin
  echo main
  echo latest
  git tag | rg '^v'
end | fzf)

if test $release = latest
    set release (gh release view --json tagName --jq .tagName)
end

if git checkout --quiet --detach $release
    echo $release
    if npm install --silent
        echo ```
        npx tsx ./scripts/stats.ts
        echo ```
    end
    if git checkout --quiet -
        npm install --silent
    end
end
