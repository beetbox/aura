Core API Specification
======================

This document describes the core AURA protocol, which is a simple `REST`_ API
built on `JSON`_ resources. The core protocol includes basic, read-only
access to *tracks* and, optionally, organization into *albums* and *artists*.
It exposes both metadata and audio.

The API adheres to the `JSON API`_ specification wherever reasonable for
consistency.

This description uses words like "SHOULD" and "MUST" in all caps to invoke
their meaning according to `RFC 2119`_.

.. _RFC 2119: http://tools.ietf.org/html/rfc2119
.. _JSON: http://www.json.org
.. _JSON API: http://jsonapi.org
.. _REST: http://en.wikipedia.org/wiki/Representational_state_transfer

Organization
------------

The API root **SHOULD** appear under a prefix named ``/aura/``. This
facilitates servers with multiple APIs, allows for human-readable content at
the root on the same server, and provides for forward compatibility: future
versions of this spec may recommend ``/aura2/``, for example.

The MIME type for all responses **SHOULD** be ``application/vnd.api+json``.

.. _server-info:

Server Information
------------------

.. http:get:: /aura
    :synopsis: Server information and status.

    The "root" endpoint exposes global information and status for the AURA
    server. The response dictionary has a single key, ``server``, which
    **MUST** contain these keys:

    * **aura-version** (string): The version of the AURA spec implemented.
    * **host** (string): The name of the server software.
    * **host-version** (string): The version number of the server.
    * **auth-required** (bool): Whether the user has access to the server. For
      unsecured servers, this may be true even before authenticating.
    * **features** (array): A set of strings indicating capabilities of the
      server. The rest of this document lists optional features that
      **SHOULD** be indicated by a string present in this array. Proprietary,
      unspecified features may also appear here.

.. sourcecode:: http

    GET /aura HTTP/1.1

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/vnd.api+json

    {
      "server": {
        "aura-version": "0.1.0",
        "host": "beets",
        "host-version": "1.6.4",
        "auth-required": false,
        "features": [
          "albums",
          "artists"
        ]
      }
    }


Resources and Collections
-------------------------

The core resource in AURA is the *track*, which represents a single audio
file and its associated metadata.

The server may also optionally group tracks into *albums* and *artists*. Since
tracks represent the music itself, albums and artists are not
required---clients **SHOULD** disable features that depend on browsing by
album, for example, when the server only exposes individual tracks.
Clients can still filter tracks by metadata that indicates the album or artist
they belong to. AURA's optional concepts of *albums* and *artists* are
appropriate when the server supports metadata that is independent of the
constituent tracks: cover art for albums, for example, or home towns for
artists.

Every resource is represented as a JSON object. Each resource type has a list
of keys that are *required* on each object and a list of *optional* fields
that the server may support. Servers may also provide other, non-standard
fields not listed in this specification. The optional fields are included in
an effort to standardize the name and format of common (albeit not universal)
metadata.

.. _links:

Links
'''''

Resources can link to each other: for example, a track can link to its
containing album and, conversely, an album can link to its tracks.

Links appear under the ``links`` key within the resource object. For example,
a track object may link to its album like this:

.. sourcecode:: http

    GET /aura/tracks/42 HTTP/1.1

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/vnd.api+json

    {
      "tracks": [{
        "id": "42",
        ...other track data here...,
        "links": {
          "album": "21"
        }
      }]
    }

The client can request inclusion of linked resources. The client provides an
``include`` request parameter containing a comma-separated list of resources.
The response then **MUST** include any objects referenced in ``links``
under a ``linked`` key in the top-level response object. (This kind of
response is called a `compound document`_ in JSON API.) For example:

.. sourcecode:: http

    GET /aura/tracks/42?include=album HTTP/1.1

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/vnd.api+json

    {
      "tracks": [{
        "id": "42",
        ...,
        "links": {
          "album": "21"
        }
      }],
      "linked": {
        "albums": [{
          "id": "21",
          ...
        }]
      }
    }

.. _compound document: http://jsonapi.org/format/#document-structure-compound-documents

Filtering
'''''''''

Servers provide filtered lists of resources according to metadata. To request
a subset of a collection, the client uses request parameters specifying the
fields or links to filter on. If the client sends a parameter ``key=value``,
the server **MUST** respond with only those resources whose ``key`` field
exactly matches ``value``.

For example, the request ``/aura/tracks?title=Blackbird`` finds the track
titled "Blackbird" and ``/aura/tracks?album=42`` gets all the tracks for the
album with id 42.

Filtering is by exact match only (i.e., no substring or case-insensitive
matching is performed). More flexible queries may be eventually be specified
in an AURA extension.


Tracks
------

An AURA server **MUST** expose a collection of tracks (i.e., individual songs).

.. http:get:: /aura/tracks
    :synopsis: All tracks in the library.

    The collection of all tracks in the library. The response is a JSON
    object with at least the key ``tracks``, which maps to a JSON array of
    track objects.

.. http:get:: /aura/tracks/(id)
    :synopsis: A specific track.

    An individual track resource. The response is a JSON object where key
    ``tracks`` maps to a single track object.

Required Fields
'''''''''''''''

Track resources **MUST** have these keys:

* ``id``, string: A unique identifier.
* ``title``, string: The song's name.
* ``artist``, string: The recording artist.

Optional Fields
'''''''''''''''

Tracks **MAY** have these keys:

* ``album``, string: The name of the release the track appears on.
* ``track``, integer: The index of the track on its album.
* ``tracktotal``, integer: The number of tracks on the album.
* ``disc``, integer: The index of the medium in the album.
* ``disctotal``, integer: The number of media in the album.
* ``year``, integer: The year the track was released.
* ``month``, integer: The release date's month.
* ``day``, integer: The release date's day of the month.
* ``bpm``, integer: Tempo, in beats per minute.
* ``genre``, string: The track's musical genre.
* ``mbid``, string: A `MusicBrainz`_ recording id.
* ``composer``, string: The name of the music's composer.
* ``albumartist``, string: The artist for the release the track appears on.

These optional fields reflect audio metadata:

* ``type``, string: The MIME type of the associated audio file.
* ``length``, integer: The duration of the audio.
* ``samplerate``, integer: The number of samples per second in the audio.
* ``bitrate``, integer: The number of bits per second in the encoding.
* ``bitdepth``, integer: The number of bits per sample.

Links
'''''

Track resources **MAY** link to a single album with the ``album`` key and a
single artist under the ``artist`` key. The valid ``include`` values for
retrieving compound documents are ``artist`` and ``album`` (see :ref:`links`).

Albums
------

Album resources are optional. If a server supports albums, it **MUST**
indicate the support by including the string "albums" in its ``features`` list
(see :ref:`server-info`). If the server does not support albums, it **MUST**
respond with an HTTP 404 error for all ``/aura/albums`` URLs.

.. http:get:: /aura/albums
    :synopsis: All albums in the library.

    The collection of all albums in the library. The response is a JSON
    object with at least the key ``albums``, which maps to a JSON array of
    album objects.

.. http:get:: /aura/albums/(id)
    :synopsis: A specific album.

    An individual album resource. The response is a JSON object where key
    ``albums`` maps to a single track object.

Required Fields
'''''''''''''''

Each album object **MUST** have at least these keys:

* ``id``, string: A unique identifier.
* ``title``, string: The album's name.
* ``artist``, artist: The name of the artist responsible for the release (or
  another indicator such as "Various Artists" when no specific artist is
  relevant).

Optional Fields
'''''''''''''''

Albums **MAY** have these keys:

* ``tracktotal``, integer: The number of tracks on the album.
* ``disctotal``, integer: The number of media in the album.
* ``year``, integer: The year the album was released.
* ``month``, integer: The release date's month.
* ``day``, integer: The release date's day of the month.
* ``genre``, string: The album's musical genre.
* ``mbid``, string: A `MusicBrainz`_ release id.

Links
'''''

Album resources **MUST** link to their constituent tracks under the ``tracks``
key. They **MAY** also link to a single artist under the ``artist`` key.
These keys are also the valid values for the ``include`` parameter (see
:ref:`links`).


Artists
-------

Artist resources are optional. If a server supports artists, it **MUST**
indicate the support by including the string "artists" in its ``features``
list (see :ref:`server-info`). If the server does not support artists, it
**MUST** respond with an HTTP 404 error for all ``/aura/artists`` URLs.

.. http:get:: /aura/artists
    :synopsis: All artists in the library.

    The collection of all artists in the library. The response is a JSON
    object with at least the key ``artists``, which maps to a JSON array of
    artists objects.

.. http:get:: /aura/artists/(id)
    :synopsis: A specific artist.

    An individual artist resource. The response is a JSON object where key
    ``artists`` maps to a single track object.

Required Fields
'''''''''''''''

Each artist **MUST** have at least these keys:

* ``id``, string: A unique identifier.
* ``name``, string: The artist's name.

Optional Fields
'''''''''''''''

Artists **MAY** have these keys:

* ``mbid``, string: A `MusicBrainz`_ artist id.

.. _musicbrainz: http://musicbrainz.org

Links
'''''

Artist resources **MUST** link to their associated tracks under the ``tracks``
key and **MAY** link to their albums artist under the ``albums`` key.
These keys are also the valid values for the ``include`` parameter (see
:ref:`links`).

Audio
-----

The server supplies audio files for each track.

.. http:get:: /aura/tracks/(id)/audio
    :synopsis: Download the audio file for a track.

    Download the audio file for a track.

    The file is returned in an arbitrary audio file format. The server
    **MUST** set the ``Content-Type`` header to indicate the format.

    The server **SHOULD** use the HTTP `Content-Disposition`_ header to supply
    a filename.

    The server **SHOULD** support HTTP `range requests`_ to facilitate seeking
    in the file.

Alternate Audio Formats
'''''''''''''''''''''''

The server **MAY** provide multiple encodings
of the same audio (i.e., by transcoding the file). The server decides
which version of the file to send via `HTTP content negotiation`_.
Specifically, the client **MAY** specify requested MIME content types in
the ``Accept`` header. The server **SHOULD** respond with one of the
requested types or a 406 Not Acceptable status. (An omitted ``Accept``
header is considered equivalent to ``audio/*``.)

.. _range requests: https://tools.ietf.org/html/draft-ietf-httpbis-p5-range-26
.. _HTTP content negotiation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation#The_Accept.3a_header
.. _Content-Disposition: http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.5.1


Images
------

Images can be associated with tracks, albums, and artists. Most pertinently,
albums may have associated cover art.

When a resource has associated images, it **MUST** have the key ``images``.
The value is the number of images. The first image is considered the "primary"
image.

The client can then fetch each image file by its index. The first image has
number 1. Attempting to retrieve any image beyond the reported number of
images **MUST** yield an HTTP 404 error. For valid indices, the response's
``Content-Type`` header **MUST** indicate the type of the image file returned.

.. http:get:: /aura/tracks/(id)/images/(number)
    :synopsis: Get an image associated with a track.

    Get an image associated with a track.


.. http:get:: /aura/albums/(id)/images/(number)
    :synopsis: Get an album art image.

    Get an album art image.

.. http:get:: /aura/artists/(id)/image/(number)
    :synopsis: Get the image for an artist.

    Get the image for an artist.
