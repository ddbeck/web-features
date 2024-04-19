#!/usr/bin/env fish

find . -iname node_modules -type d -exec rm -r {} +
rm -r packages/compute-baseline/dist
rm packages/web-features/index.{d.ts,js,json} packages/web-features/types.ts
