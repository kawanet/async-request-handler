ALL=\
	lib/async-request-handler.js \
	esm/async-request-handler.mjs \

all: $(ALL)

clean:
	/bin/rm -f $(ALL) esm/*.js test/*.js

esm/%.mjs: esm/%.js
	cp $^ $@

esm/%.js: lib/%.ts
	./node_modules/.bin/tsc -p tsconfig-esm.json

lib/%.js: lib/%.ts
	./node_modules/.bin/tsc -p tsconfig.json

test: all
	./node_modules/.bin/mocha test/*.js

.PHONY: all clean test
