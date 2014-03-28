UGLIFY = node_modules/.bin/uglifyjs
BROWSERIFY = node_modules/.bin/browserify

# the default rule when someone runs simply `make`
all: \
	dist/geokeys.js

node_modules/.install: package.json
	npm install && touch node_modules/.install

geokeys%js:
	@cat $(filter %.js,$^) > $@

dist:
	mkdir -p dist

# assemble an uncompressed but complete library for development
dist/geokeys.uncompressed.js: node_modules/.install dist $(shell $(BROWSERIFY) --list index.js)
	$(BROWSERIFY) --debug index.js > $@

# compress geokeys.js with [uglify-js](https://github.com/mishoo/UglifyJS),
# with name manging (m) and compression (c) enabled
dist/geokeys.js: dist/geokeys.uncompressed.js
	$(UGLIFY) $< -c -m -o $@

clean:
	rm -rf dist/*
