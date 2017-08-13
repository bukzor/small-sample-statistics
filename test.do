set -eux

redo-ifchange node_modules

exec mocha >&2
