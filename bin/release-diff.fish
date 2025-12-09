#!/usr/bin/env fish

argparse c/choose -- $argv
set previous_release (gh release view --json tagName --jq .tagName)
set a_release $previous_release
set b_release next

if set -ql _flag_choose
    set releases (gh release list --exclude-drafts --limit=1000 --json tagName --jq '.[].tagName | select(startswith("v") or startswith("next"))')
    set a_release (string join0 $releases | fzf --read0 --preview 'cat {+f}' --bind 'tab:toggle+end-of-line+unix-line-discard' --multi)
    set b_release (string join0 $releases | fzf --read0 --preview 'cat {+f}' --bind 'tab:toggle+end-of-line+unix-line-discard' --multi)
end

function get_release_json
    bkt --ttl=2m -- curl --silent --location "https://github.com/web-platform-dx/web-features/releases/download/$argv/data.json"
end

echo features diff:
echo ```diff
diff -u (get_release_json $a_release | jq --raw-output '.features | keys[]' | psub --suffix .features.$a_release.txt) (get_release_json $b_release | jq --raw-output '.features | keys[]' | psub --suffix .features.$b_release.txt)
echo ```

echo
echo groups diff:
echo ```diff
diff -u (get_release_json $a_release | jq --raw-output '.groups | keys[]' | psub --suffix .groups.$a_release.txt) (get_release_json $b_release | jq --raw-output '.groups | keys[]' | psub --suffix .groups.$b_release.txt)
echo ```
