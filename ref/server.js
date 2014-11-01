'use strict';

var fs = require('fs');
var musicmetadata = require('musicmetadata');
var walk = require('walk');
var path = require('path');
var express = require('express');
var cors = require('cors');

// Read a track dictionary for a music file.
var trackDict = function(path, func) {
  var parser = musicmetadata(fs.createReadStream(path));
  parser.on('metadata', function (metadata) {
    func({
      'path': path,
      'artist': metadata.artist[0],
      'title': metadata.title,
      'album': metadata.album,
    });
  });
};

// Read all the music files in a directory (recursively) and record all of
// their metadata dictionaries in a giant array.
var readMetadata = function (basedir, func) {
  var md = [];
  var walker = walk.walk(basedir);
  walker.on("file", function (root, stats, next) {
    var p = path.join(root, stats.name);
    trackDict(p, function (d) {
      console.log('read: ' + p);
      md.push(d);
    });
    next();
  }).on("end", function () {
    // Add IDs to each.
    for (var i = 0; i < md.length; ++i) {
      md[i].id = i.toString();
    }
    func(md);
  });
};

// Read the metadata and start the server.
readMetadata(process.argv[2] || '.', function (tracks) {
  var loadTrack = function (req, res, next) {
    var id = parseInt(req.params.id);
    if (isNaN(id) || id < 0 || id > tracks.length) {
      res.status(404).end();
    } else {
      req.track = tracks[id];
      next();
    }
  };

  // The Express Router contains all the AURA endpoints.
  var aura = express.Router();
  // Enable cross-origin resource sharing.
  aura.use(cors());

  // Utility for JSON endpoints to set the content type.
  var jtype = function(req, res, next) {
    res.set('Content-Type', 'application/vnd.api+json');
    next();
  };

  // AURA API endpoints.
  aura.get('/tracks', jtype, function (req, res) {
    res.json({ 'tracks': tracks });
  });
  aura.get('/tracks/:id', jtype, loadTrack, function (req, res) {
    res.json({ 'tracks': req.track });
  });
  aura.get('/tracks/:id/audio', loadTrack, function (req, res) {
    res.sendFile(req.track.path);
  });

  // An Express Application to host the API under the /aura prefix.
  var app = express();
  app.use('/aura', aura);

  var server = app.listen(8338, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('http://%s:%s', host, port);
  });
});
