#!/bin/sh
xgettext  --from-code=UTF-8 -k_ -kN_  -o TeaTimer.pot ../src/*.js ../src/schemas/*.xml

for fn in *.po; do
	msgmerge -U "$fn" TeaTimer.pot
done
