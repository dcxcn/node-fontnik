'use strict';

/* jshint node: true */

var fontnik = require('..');
var test = require('tape');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var zdata = fs.readFileSync(__dirname + '/fixtures/range.0.256.pbf');
var Protobuf = require('pbf');
var Glyphs = require('./format/glyphs');
var UPDATE = process.env.UPDATE;

function nobuffer(key, val) {
    return key !== '_buffer' && key !== 'bitmap' ? val : undefined;
}

function jsonEqual(t, key, json) {
    if (UPDATE) fs.writeFileSync(__dirname + '/expected/' + key + '.json', JSON.stringify(json, null, 2));
    t.deepEqual(json, require('./expected/' + key + '.json'));
}

var expected = JSON.parse(fs.readFileSync(__dirname + '/expected/load.json').toString());
var firasans = fs.readFileSync(path.resolve(__dirname + '/../fonts/firasans-medium/FiraSans-Medium.ttf'));
var opensans = fs.readFileSync(path.resolve(__dirname + '/../fonts/open-sans/OpenSans-Regular.ttf'));

test('load', function(t) {
    t.test('loads: fira sans', function(t) {
        fontnik.load(firasans, function(err, faces) {
            t.error(err);
            t.equal(faces[0].points.length, 789);
            t.equal(faces[0].family_name, 'Fira Sans');
            t.equal(faces[0].style_name, 'Medium');
            t.end();
        });
    });

    t.test('loads: open sans', function(t) {
        fontnik.load(opensans, function(err, faces) {
            t.error(err);
            t.equal(faces[0].points.length, 882);
            t.equal(faces[0].family_name, 'Open Sans');
            t.equal(faces[0].style_name, 'Regular');
            t.end();
        });
    });

    t.test('invalid font loading', function(t) {
        t.throws(function() {
            fontnik.load(undefined, function(err, faces) {});
        }, /First argument must be a font buffer/);
        t.end();
    });

    t.test('non existent font loading', function(t) {
        var doesnotexistsans = new Buffer('baloney');
        fontnik.load(doesnotexistsans, function(err, faces) {
            t.ok(err.message.indexOf('Font buffer is not an object'));
            t.end();
        });
    });

    t.test('load typeerror callback', function(t) {
        t.throws(function() {
            fontnik.load(firasans);
        }, /Callback must be a function/);
        t.end();
    });

});

test('range', function(t) {
    var data;
    zlib.inflate(zdata, function(err, d) {
        if (err) throw err;
        data = d;
    });

    t.test('ranges', function(t) {
        fontnik.range({font: opensans, start: 0, end: 256}, function(err, res) {
            t.error(err);
            t.ok(res);
            t.deepEqual(res, data);
            var vt = new Glyphs(new Protobuf(new Uint8Array(res)));
            var json = JSON.parse(JSON.stringify(vt, nobuffer));
            jsonEqual(t, 'range', json);
            t.end();
        });
    });

    t.test('longrange', function(t) {
        fontnik.range({font: opensans, start: 0, end: 1024}, function(err, data) {
            t.error(err);
            t.ok(data);
            t.end();
        });
    });

    t.test('shortrange', function(t) {
        fontnik.range({font: opensans, start: 34, end: 38}, function(err, res) {
            var vt = new Glyphs(new Protobuf(new Uint8Array(res)));
            var codes = Object.keys(vt.stacks['Open Sans Regular'].glyphs);
            t.deepEqual(codes, ['34','35','36','37','38']);
            t.end();
        });
    });

    t.test('range typeerror options', function(t) {
        t.throws(function() {
            fontnik.range(opensans, function(err, data) {});
        }, /Font buffer is not an object/);
        t.end();
    });

    t.test('range filepath does not exist', function(t) {
        var doesnotexistsans = new Buffer('baloney');
        fontnik.range({font: doesnotexistsans, start: 0, end: 256}, function(err, faces) {
            t.ok(err.message.indexOf('Font buffer is not an object'));
            t.end();
        });
    });

    t.test('range typeerror start', function(t) {
        t.throws(function() {
            fontnik.range({font: opensans, start: 'x', end: 256}, function(err, data) {});
        }, /option `start` must be a number from 0-65535/);
        t.throws(function() {
            fontnik.range({font: opensans, start: -3, end: 256}, function(err, data) {});
        }, /option `start` must be a number from 0-65535/);
        t.end();
    });

    t.test('range typeerror end', function(t) {
        t.throws(function() {
            fontnik.range({font: opensans, start: 0, end: 'y'}, function(err, data) {});
        }, /option `end` must be a number from 0-65535/);
        t.throws(function() {
            fontnik.range({font: opensans, start: 0, end: 10000000}, function(err, data) {});
        }, /option `end` must be a number from 0-65535/);
        t.end();
    });

    t.test('range typeerror lt', function(t) {
        t.throws(function() {
            fontnik.range({font: opensans, start: 256, end: 0}, function(err, data) {});
        }, /`start` must be less than or equal to `end`/);
        t.end();
    });

    t.test('range typeerror callback', function(t) {
        t.throws(function() {
            fontnik.range({font: opensans, start: 0, end: 256}, '');
        }, /Callback must be a function/);
        t.throws(function() {
            fontnik.range({font: opensans, start: 0, end: 256});
        }, /Callback must be a function/);
        t.end();
    });
});