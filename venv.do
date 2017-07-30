set -eux

redo-ifchange bin/venv-update

exec ./bin/venv-update >&2
