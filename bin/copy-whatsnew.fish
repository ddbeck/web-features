#!/usr/bin/env fish

# Get yesterday's date
set yesterday (gdate -d "yesterday" +%Y-%m-%d)

# Get last Thursday's date
set today_weekday (gdate +%u) # 1=Monday, 7=Sunday
set days_since_thursday (math "$today_weekday + 3")
if test $days_since_thursday -gt 7
    set days_since_thursday (math "$days_since_thursday - 7")
end
set last_thursday (gdate -d "$days_since_thursday days ago" +%Y-%m-%d)

# Get the latest comment URL using GitHub CLI
set issue_url "https://github.com/web-platform-dx/web-features/issues/788"
set latest_comment_id (gh api --paginate 'repos/web-platform-dx/web-features/issues/788/comments' --jq 'sort_by(.created_at) | .[-1].id')
set latest_comment_url "$issue_url#issuecomment-$latest_comment_id"

# Template with replacements
markdown-file-to-rtf-pasteboard.fish (echo "* What's new
    * Releases: TK
    * Highlights:
        * TK
    * [Merged this week](https://github.com/web-platform-dx/web-features/pulls?q=is%3Apr+merged%3A$last_thursday..$yesterday+sort%3Aupdated-desc+)
    * [Statistics]($latest_comment_url)" | psub)
