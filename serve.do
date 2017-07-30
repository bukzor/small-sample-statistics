set -eu
redo-ifchange venv

exec >&2

. $PWD/env.sh
ephemeral-port-reserve localhost $(cat run/port) > run/port
exec python -m http.server $(cat run/port)
