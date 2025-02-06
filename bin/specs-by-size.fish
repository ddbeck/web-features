#!/usr/bin/env fish

for spec in ./features/draft/spec/*.yml
    echo (yq '.compat_features | length' $spec) $spec
end | sort -k1 -n --reverse
