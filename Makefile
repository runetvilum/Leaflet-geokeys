UGLIFY = node_modules/.bin/uglifyjs
BROWSERIFY = node_modules/.bin/browserify

# the default rule when someone runs simply `make`
all: \
	dist/matrikelnr.js

node_modules/.install: package.json
	npm install && touch node_modules/.install

geokeys%js:
	@cat $(filter %.js,$^) > $@

dist:
	mkdir -p dist

# assemble an uncompressed but complete library for development
dist/matrikelnr.uncompressed.js: node_modules/.install dist $(shell $(BROWSERIFY) --list index.js)
	$(BROWSERIFY) --debug index.js > $@

# compress matrikelnr.js with [uglify-js](https://github.com/mishoo/UglifyJS),
# with name manging (m) and compression (c) enabled
dist/matrikelnr.js: dist/matrikelnr.uncompressed.js
	$(UGLIFY) $< -c -m -o $@

clean:
	rm -rf dist/*
