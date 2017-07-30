set -eu
redo-ifchange venv

exec >&2

. $PWD/env.sh
ephemeral-port-reserve localhost $(cat run/port) > run/port
PORT=$(cat run/port)
cd src
exec python -m http.server $PORT
