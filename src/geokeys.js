'use strict';
var geocoder = require('./geocoder');

var GeoKeysControl = L.Control.extend({
    includes: L.Mixin.Events,
    proj: proj4('+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs', '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'),
    version: require('../package.json').version,
    options: {
        position: 'topleft',
        pointZoom: 16,
        keepOpen: false,
        placeholder: 'Search'
    },

    initialize: function (_, options) {
        L.Util.setOptions(this, options);
        this.geocoder = geocoder(_);
    },


    _toggle: function (e) {
        if (e) L.DomEvent.stop(e);
        if (L.DomUtil.hasClass(this._container, 'active')) {
            L.DomUtil.removeClass(this._container, 'active');
            this._results.innerHTML = '';
            this._input.blur();
        } else {
            L.DomUtil.addClass(this._container, 'active');
            this._input.focus();
            this._input.select();
        }
    },

    _closeIfOpen: function (e) {
        if (L.DomUtil.hasClass(this._container, 'active') && !this.options.keepOpen) {
            L.DomUtil.removeClass(this._container, 'active');
            this._results.innerHTML = '';
            this._input.blur();
        }
    },

    onAdd: function (map) {

        var container = L.DomUtil.create('div', 'leaflet-control-mapbox-geocoder leaflet-bar leaflet-control'),
            link = L.DomUtil.create('a', 'leaflet-control-mapbox-geocoder-toggle mapbox-icon mapbox-icon-geocoder', container),
            results = L.DomUtil.create('div', 'leaflet-control-mapbox-geocoder-results', container),
            wrap = L.DomUtil.create('div', 'leaflet-control-mapbox-geocoder-wrap', container),
            form = L.DomUtil.create('form', 'leaflet-control-mapbox-geocoder-form', wrap),
            input = L.DomUtil.create('input', '', form);

        link.href = '#';
        link.innerHTML = '&nbsp;';

        input.type = 'text';
        input.setAttribute('placeholder', this.options.placeholder);

        L.DomEvent.addListener(form, 'submit', this._geocode, this);
        L.DomEvent.addListener(input, 'keyup', this._geocode, this);
        L.DomEvent.disableClickPropagation(container);

        this._map = map;
        this._results = results;
        this._input = input;
        this._form = form;

        if (this.options.keepOpen) {
            L.DomUtil.addClass(container, 'active');
        } else {
            this._map.on('click', this._closeIfOpen, this);
            L.DomEvent.addListener(link, 'click', this._toggle, this);
        }

        return container;
    },

    _geocode: function (e) {
        L.DomEvent.preventDefault(e);
        L.DomUtil.addClass(this._container, 'searching');

        var map = this._map;
        var onload = L.bind(function (err, resp) {
            L.DomUtil.removeClass(this._container, 'searching');
            if (err || !resp || !resp.results || !resp.results.length) {
                this.fire('error', {
                    error: err
                });
            } else {
                this._results.innerHTML = '';
                if (resp.results.length === 1) {
                    this.fire('autoselect', {
                        data: resp
                    });
                    chooseResult(resp.results[0]);
                    this._closeIfOpen();
                } else {
                    for (var i = 0; i < resp.results.length; i++) {
                        var res = resp.results[i];
                        var name;
                        if (res.properties && res.properties.matnr) {
                            name = res.properties.matnr
                        } else if (res.presentationString) {
                            name = res.presentationString;
                        }
                        if (name) {
                            var r = L.DomUtil.create('a', '', this._results);
                            r.innerHTML = name;
                            r.href = '#';
                            (L.bind(function (result) {
                                L.DomEvent.addListener(r, 'click', function (e) {
                                    chooseResult(result);
                                    L.DomEvent.stop(e);
                                    this.fire('select', {
                                        data: result
                                    });
                                }, this);
                            }, this))(resp.results[i]);
                        }
                    }
                }
                this.fire('found', resp);
            }
        }, this);

        var chooseResult = L.bind(function (result) {

            if (result.bbox || result.geometryWkt || (result.xMin && result.xMax && result.yMin && result.yMax)) {
                var low, high;
                if (result.bbox) {
                    var _ = result.bbox;
                    low = this.proj.forward([_[0], _[1]]);
                    high = this.proj.forward([_[2], _[3]]);
                } else if (result.geometryWkt) {
                    //var bounds = omnivore.wkt.parse(result.geometryWkt).getBounds();
                    var wkt = new Wkt.Wkt();
                    wkt.read(result.geometryWkt);
                    var bounds = wkt.toObject().getBounds();
                    low = this.proj.forward([bounds.getWest(), bounds.getSouth()]);
                    high = this.proj.forward([bounds.getEast(), bounds.getNorth()]);
                } else {
                    low = this.proj.forward([result.xMin, result.yMin]);
                    high = this.proj.forward([result.xMax, result.yMax]);
                }
                this._map.fitBounds(L.latLngBounds([[low[1], low[0]], [high[1], high[0]]]));
            } else if (result.x && result.y) {
                var p = this.proj.forward([result.x, result.y]);
                this._map.setView([p[1], p[0]], (map.getZoom() === undefined) ?
                    this.options.pointZoom :
                    Math.max(map.getZoom(), this.options.pointZoom));
            }
        }, this);

        this.geocoder.query(this._input.value, onload);

    }
});

module.exports = function (_, options) {
    return new GeoKeysControl(_, options);
};