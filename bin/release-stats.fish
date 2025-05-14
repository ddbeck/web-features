#!/usr/bin/env fish

argparse c/choose -- $argv
set releases latest main

if set -ql _flag_choose
    # Provide v2.6.0 or greater, since there's no stats script before then
    set --append releases (git tag | rg '^v(?:2\.(?:[6-9]|[1-9][0-9])|[3-9][0-9]*\.\d+)\.\d+')
    set releases (string join0 $releases | fzf --read0 --preview 'cat {+f}' --bind 'tab:toggle+end-of-line+unix-line-discard' --multi)
end

for rel in $releases
    set -l release $rel
    if test $rel = latest
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
    echo
end
