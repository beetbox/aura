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

    * **aura-version**, string: The version of the AURA spec implemented.
    * **host**, string: The name of the server software.
    * **host-version**, string: The version number of the server.
    * **auth-required**, bool: Whether the user has access to the server. For
      unsecured servers, this may be true even before authenticating.
    * **features**, string array: The capabilities of the server. The rest of
      this document lists optional features that **SHOULD** be indicated by a
      string present in this array. Proprietary, unspecified features may also
      appear here.

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
          "albums": ["21"]
        }
      }]
    }

The client can request inclusion of linked resources. The client provides an
``include`` request parameter containing a comma-separated list of resources.
The response then **MUST** include any objects referenced in ``links``
under a ``linked`` key in the top-level response object. (This kind of
response is called a `compound document`_ in JSON API.) For example:

.. sourcecode:: http

    GET /aura/tracks/42?include=albums HTTP/1.1

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/vnd.api+json

    {
      "tracks": [{
        "id": "42",
        ...,
        "links": {
          "albums": ["21"]
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
titled "Blackbird".

Filtering is by exact match only (i.e., no substring or case-insensitive
matching is performed). More flexible queries may be eventually be specified
in an AURA extension.

Pagination
''''''''''

Collection endpoints can return truncated results to avoid potential
performance issues on both the client and the server. Pagination works using
an opaque *continuation token* that describes how to retrieve the next chunk
of results. (In practice, the token could be the offset in the collection, the
id of the next item to return, or a reference to a database cursor.)
Truncation can be requested by the client or unilaterally imposed by the
server.

Pagination applies to ``GET`` requests for the three collection endpoints
(``/aura/tracks``, ``/aura/albums``, and ``/aura/artists``). A server **MAY**
return a subset of the resources in a collection for any such request. If it
does so, it **MUST** include a ``continue`` key in the response JSON document.
The ``continue`` value is an opaque string.

The client **MAY** provide the string as a ``continue`` parameter in a
subsequent ``GET`` request for the same resource. The server **MUST** then
respond with a new set of resources. If there are no more resources in the
collection, the server **MUST** not include the ``continue`` key in the
response. The concatenation of all resources produced in a sequence of these
continued responses **MUST** be the full sequence of resources in the
collection (i.e., no overlapping and no gaps), provided that the collection is
not modified during the sequence.

A continuation token is not guaranteed to be useful after a single use. Once a
token is used in a request, the server **MAY** respond to subsequent requests
with the same token with an HTTP 410 "Gone" error. The server may also
invalidate unused tokens after an implementation-defined expiration
period. (This is critical for servers that retain state for each in-progress
pagination sequence.)

The client **MAY** include a ``limit`` parameter (an integer) with a
collection ``GET`` request. The server **MUST** respond with *at most* that
number of resources, although it may return fewer. (A ``continue`` token must
be supplied if there are more results, as above.)

For example, a client could request a "page" of results with a single result:

.. sourcecode:: http

    GET /aura/tracks?limit=1

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/vnd.api+json

    {
      "tracks": [{
        ...track data here...
      }],
      "continue": "sometoken"
    }

The client can then issue another request for the next chunk:

.. sourcecode:: http

    GET /aura/tracks?limit=1&continue=sometoken

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/vnd.api+json

    {
      "tracks": [{
        ...another track data here...
      }]
    }

The absence of a ``continue`` key indicates that the sequence is finished
(there are only two tracks in the library).


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
* ``artist``, string array: The recording artists.

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
* ``genre``, string array: The track's musical genres.
* ``mbid``, string: A `MusicBrainz`_ recording id.
* ``composer``, string array: The names of the music's composers.
* ``albumartist``, string array: The artists for the release the track appears
  on.
* ``comments``, string: Free-form, user-specified information.

These optional fields reflect audio metadata:

* ``type``, string: The MIME type of the associated audio file.
* ``duration``, float: The (approximate) length of the audio in seconds.
* ``framerate``, integer: The number of frames per second in the audio.
* ``framecount``, integer: The total number of frames in the audio.
  (The exact length can be calculated as the product of the frame rate and
  frame count.)
* ``channels``, integer: The number of audio channels. (A frame consists of one
  sample per channel.)
* ``bitrate``, integer: The number of bits per second in the encoding.
* ``bitdepth``, integer: The number of bits per sample.
* ``size``, integer: The size of the audio file in bytes.

Links
'''''

Track resources **MAY** link to albums they appear on and their recording
artists using the ``albums`` and ``artists`` keys. The valid ``include``
values for retrieving compound documents are, correspondingly, ``artists`` and
``albums`` (see :ref:`links`).

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
* ``artist``, string array: The names of the artists responsible for the
  release (or another indicator such as "Various Artists" when no specific
  artist is relevant).

Optional Fields
'''''''''''''''

Albums **MAY** have these keys:

* ``tracktotal``, integer: The number of tracks on the album.
* ``disctotal``, integer: The number of media in the album.
* ``year``, integer: The year the album was released.
* ``month``, integer: The release date's month.
* ``day``, integer: The release date's day of the month.
* ``genre``, string array: The album's musical genres.
* ``mbid``, string: A `MusicBrainz`_ release id.

Links
'''''

Album resources **MUST** link to their constituent tracks under the ``tracks``
key. They **MAY** also link their performing artists under the ``artists``
key. These keys are also the valid values for the ``include`` parameter (see
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

Audio Formats and Quality
'''''''''''''''''''''''''

The server can provide multiple encodings of the same audio---i.e., by
transcoding the file. This can help when the client supports a limited range
of audio codecs (e.g., in browser environments) and when bandwidth is limited
(e.g., to avoid streaming lossless audio over a mobile connection).

The server decides which version of the file to send using `HTTP content
negotiation`_. Specifically, the client **MAY** specify the kinds of content
it requests in the HTTP ``Accept`` header. The header is a comma-separated
list of types, which consist of a MIME type and (optionally) some parameters.
To request audio under a maximum bitrate, the client uses a ``bitrate``
parameter to specify the maximum bits per second it is willing to accept.

For example, the header ``Accept: audio/ogg, audio/mpeg`` requests audio in
either MP3 or Ogg Vorbis format with no quality constraints. Similarly,
``Accept: audio/ogg;bitrate=128000`` requests Vobris audio at a bitrate of
128kbps or lower.

The server **SHOULD** respond with one of the requested types or a 406 Not
Acceptable status (i.e., if it does not support transcoding). An omitted
``Accept`` header is considered equivalent to ``audio/*``.

.. _range requests: https://tools.ietf.org/html/draft-ietf-httpbis-p5-range-26
.. _HTTP content negotiation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation#The_Accept.3a_header
.. _Content-Disposition: http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.5.1


Images
------

Images can be associated with tracks, albums, and artists. Most pertinently,
albums may have associated cover art.

Each kind of resource is associated with its images via links (see
:ref:`links`). The id for an image need not be globally unique; it only needs
to be unique for the linked resource---a simple index, suffices for example.
Clients can request information about resources either by explicitly
requesting the image collection for a resource or by using an
``?include=images`` parameter, as with other links. Unlike other resources,
requesting a specific image returns the actual image data.

For the image file endpoints, the response's ``Content-Type`` header **MUST**
indicate the type of the image file returned.

.. http:get:: /aura/tracks/(id)/images
    :synopsis: Get information about images associated with a track.

    Get the collection of metadata about the images associated with a track.

.. http:get:: /aura/tracks/(id)/images/(image_id)
    :synopsis: Get an image associated with a track.

    Get an image file associated with a track.

.. http:get:: /albums/(id)/images
    :synopsis: Get information about album art images.

    Get the collection of metadata about album art images.

.. http:get:: /aura/albums/(id)/images/(image_id)
    :synopsis: Get an album art image.

    Get an album art image file.

.. http:get:: /aura/artists/(id)/images
    :synopsis: Get information about images for an artist.

    Get the collection of metadata about the images for an artist.

.. http:get:: /aura/artists/(id)/image/(image_id)
    :synopsis: Get an image for an artist.

    Get the image file for an artist.

For example, a track with images indicates those images' ids via an ``images``
key on the ``links`` object. Specifying ``images`` in the ``include``
parameter requests more data under the response's ``linked`` key:

.. sourcecode:: http

    GET /aura/tracks/42?include=images

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/vnd.api+json

    {
      "tracks": [{
        "id": "42",
        "links": {
          "images": ["1"]
        }
      }],
      "linked": {
        "imaages": [{ "id": "1", ... }]
      }
    }

Optional Fields
'''''''''''''''

Image metadata resources are only required to have an ``id`` field. These
other fields are optional:

* ``role``, string: A description of the image's purpose: "cover" for primary
  album art, etc.
* ``type``, string: The MIME type of the image.
* ``width``, integer: The image's width in pixels.
* ``height``, integer: The image's height in pixels.
* ``size``, integer: The size of the image data in bytes.
