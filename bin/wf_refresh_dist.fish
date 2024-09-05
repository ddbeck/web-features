#!/usr/bin/env fish

function untracked_features
    set -l ls_result git ls-files --others --exclude-standard --error-unmatch features/
    if test -z "$ls_result" # output is empty?
        return 0
    end
    return 1
end

function die
    echo $argv
    exit 1
end

if not git diff-index --quiet --cached HEAD -- features/ # returns 1 for staged but uncommitted changes
    die "error: you have staged but uncommited changes"
end

if not git diff-files --quiet features/ # returns 1 for unstaged modified files
    die "error: you have unstaged modified files in features/"
end

if untracked_features
    die "error: you have untracked files in features/"
end

npm install
and npm run dist
and git add features/
and git commit --template=(echo "Refresh dist" | psub)
