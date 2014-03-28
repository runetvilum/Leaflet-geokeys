'use strict';

var util = require('./util'),
    urlhelper = require('./url'),
    request = require('./request');

// Low-level geocoding interface - wraps specific API calls and their
// return values.
module.exports = function (_) {

    var geocoder = {}, url, geoSearch;

    geocoder.getURL = function (_) {
        return url;
    };

    geocoder.setURL = function (_) {
        url = urlhelper.jsonify(_);

        return geocoder;
    };

    geocoder.queryURL = function (_) {
        util.strict(_, 'string');
        if (!geocoder.getURL()) throw new Error('Url not set');
        return L.Util.template(geocoder.getURL(), {
            query: encodeURIComponent(_)
        });
    };

    geocoder.query = function (_, callback) {
        util.strict(_, 'string');
        util.strict(callback, 'function');
        request(geocoder.queryURL(_), function (err, json) {
            if (json) {
                var res = {};
                if (json && json.data) {
                    res.results = json.data;
                } else if (json && json.features) {
                    res.results = json.features;
                }
                callback(null, res);
            } else callback(err || true);
        });

        return geocoder;
    };

    if (typeof _ === 'string') {
        geocoder.setURL(_);
    }

    return geocoder;
};