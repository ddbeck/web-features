#!/usr/bin/env fish

argparse c/choose -- $argv
set previous_release (gh release view --json tagName --jq .tagName)
set a_release $previous_release
set b_release next

if set -ql _flag_choose
    set releases (gh release list --exclude-drafts --limit=1000 --json tagName --jq '.[].tagName | select(startswith("v") or startswith("next"))')
    set a_release (string join0 $releases head | fzf --read0 --preview 'cat {+f}' --bind 'tab:toggle+end-of-line+unix-line-discard' --multi)
    set b_release (string join0 $releases head | fzf --read0 --preview 'cat {+f}' --bind 'tab:toggle+end-of-line+unix-line-discard' --multi)
end

function get_release_json
    if [ $argv != head ]
        bkt --ttl=2m -- curl --silent --location "https://github.com/web-platform-dx/web-features/releases/download/$argv/data.json"
    else
        get_head_json
    end
end

function get_head_json
    npm run --silent build
    cat ./packages/web-features/data.json
end

function status_was_is
    set -l statuses_query_a '[.features | to_entries[] | select(.value.kind == "feature") | { (.key): { was: .value.status.baseline } }] | add'
    set -l statuses_query_b '[.features | to_entries[] | select(.value.kind == "feature") | { (.key): { is: .value.status.baseline } }] | add'
    begin
        get_release_json $a_release | jq $statuses_query_a
        get_release_json $b_release | jq $statuses_query_b
    end | jq -s 'reduce .[] as $obj ({}; . * $obj)' \
        | jq '[to_entries[] | select((.value.was != null) and (.value.was != .value.is)) | {(.key): .value}] | add'
end

echo "##" Status changes

echo
echo Newly available:
status_was_is | jq --raw-output '. | to_entries[] | select(.value.is == "low") | "- " + .key + " (was `" + (.value.was | tostring) + "`)"'

echo
echo Widely available:
status_was_is | jq --raw-output '. | to_entries[] | select(.value.is == "high") | "- " + .key + " (was `" + (.value.was | tostring) + "`)"'

echo
echo Limited availability:
status_was_is | jq --raw-output '. | to_entries[] | select((.value.is == false) and (.value.was != null)) | "- " + .key + " (was `" + (.value.was | tostring) + "`)"'
