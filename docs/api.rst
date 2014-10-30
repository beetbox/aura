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

The rest of this section describes concepts common to all three resource
types.

Links
'''''

A track **MAY** contain links to its associated album and artist resources if
present. These appear as a dictionary under the ``links`` key wherein the
``artist`` and ``album`` keys are associated with their respective IDs. If the
server supports artist or album links but the link is not present (e.g., a
track is a single with no associated album), the value **MAY** be null instead
of an id.

Optionally included under ``linked`` in a JSON API `compound document`_.

``/aura/tracks/42?include=artist,album``
``/aura/albums/42?include=artist,tracks``
``/aura/artists/42?include=albums,tracks``

.. _compound document: http://jsonapi.org/format/#document-structure-compound-documents

Filtering
'''''''''

Strict matching only, using query parameters on each collection.

``/aura/tracks?title=Blackbird``
``/aura/tracks?album=42``


Tracks
------

An AURA server **MUST** expose a collection of tracks (i.e., individual songs).

A track resource **MUST** have an ``id`` attribute, which is a uniquely
identifying string. It **SHOULD** also have these attributes:

* ``title``
* ``artist``
* ``album``

It **MAY** have other attributes, including:

* ``track``, the index of the track on its album.
* ``disc``, the index of the medium in the album.
* ``year``, the release date's year.

The response is a JSON dictionary with a ``tracks`` key mapping either to an
array of dictionaries (for the collection) or a single dictionary (when a
specific ID is used) Here's an example:

.. sourcecode:: http

    GET /aura/tracks/42 HTTP/1.1

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/vnd.api+json

    {
      "tracks": {
        "id": "42",
        "title": "Back in the U.S.S.R.",
        "links": {
          "artist": "3",
          "album": "4"
        }
      }
    }

.. http:get:: /aura/tracks

    The collection of all tracks present, represented as an array.

.. http:get:: /aura/tracks/(id)

    An individual track resource. In a one-element array.

Other APIs to get media:

Albums
------

.. http:get:: /aura/albums

.. http:get:: /aura/albums/(id)

**MAY**, or 404


Artists
-------

.. http:get:: /aura/artists

.. http:get:: /aura/artists/(id)

**MAY**, or 404


Audio
-----

.. http:get:: /aura/tracks/(id)/audio
    :synopsis: Download the audio file for a track.

    Download the audio file for a track.

    The server **SHOULD** support HTTP `range requests`_ to facilitate seeking
    in the file.

Audio Formats
'''''''''''''

The file is returned in an arbitrary audio file format. The server
**MUST** set the ``Content-Type`` header to indicate the format.

*Formats and transcoding.* The server **MAY** provide multiple encodings
of the same audio (i.e., by transcoding the file). The server decides
which version of the file to send via `HTTP content negotiation`_.
Specifically, the client **MAY** specify requested MIME content types in
the ``Accept`` header. The server **SHOULD** respond with one of the
requested types or a 406 Not Acceptable status. (An omitted ``Accept``
header is considered equivalent to ``audio/*``.)

.. _range requests: https://tools.ietf.org/html/draft-ietf-httpbis-p5-range-26
.. _HTTP content negotiation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation#The_Accept.3a_header


Images
------

TODO: Probably support multiple images. Labeled?

.. http:get:: /aura/tracks/(id)/image
    :synopsis: Get an image associated with a track.

    Image.


.. http:get:: /aura/albums/(id)/image
    :synopsis: Get an album art image.

    Image.

.. http:get:: /aura/artists/(id)/image
    :synopsis: Get an album art image.

    Image.
