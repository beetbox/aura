Core API Specification
======================

The API root **SHOULD** appear under a prefix named ``/aura/``. This
facilitates servers with multiple APIs, allows for human-readable content on
the same server, and provides for forward compatibility: future versions of
this spec may recommend ``/aura2/``, for example.

Responses are in `JSON`_ format, following the `JSON API`_ specification.

.. _JSON: http://www.json.org
.. _JSON API: http://jsonapi.org

This documentation uses such as "SHOULD" and "MUST" in all caps to invoke
their meaning according to `RFC 2119`_.

.. _RFC 2119: http://tools.ietf.org/html/rfc2119

Resources and Collections
-------------------------

There are tracks, albums, and artists. Only tracks are required.

Links
'''''

A track **MAY** contain links to its associated album and artist resources if
present. These appear as a dictionary under the ``links`` key wherein the
``artist`` and ``album`` keys are associated with their respective IDs. If the
server supports artist or album links but the link is not present (e.g., a
track is a single with no associated album), the value **MAY** be null instead
of an id.

Optionally included under ``linked`` in a JSON API "compound document".

``/aura/tracks/42?include=artist,album``
``/aura/albums/42?include=artist,tracks``
``/aura/artists/42?include=albums,tracks``

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

The response is a JSON dictionary with a ``tracks`` key mapping to an array of
dictionaries. The array is still used even when returning only a single
track. Here's an example::

    {
      "tracks": [{
        "id": "1",
        "title": "Back in the U.S.S.R.",
        "links": {
          "artist": "3",
          "album": "4"
        }
      }]
    }

.. http:get:: /aura/tracks

    The collection of all tracks present, represented as an array.

.. http:get:: /aura/tracks/(id)

    An individual track resource. In a one-element array.

Other APIs to get media:

.. http:get:: /aura/tracks/(id)/audio

    Audio file.

.. http:get:: /aura/tracks/(id)/image

    Image.


Albums
------

**MAY**, or 404


Artists
-------

**MAY**, or 404


Extensions
----------

TODO:
Some mechanism for *standardized extensions*, which are optional and
self-reporting. Also allows for proprietary extensions and extensions defined
elsewhere.

``GET /aura/extensions/``

This includes:

* any notion of a complex query (e.g., beets queries) -- maybe that's
  proprietary, or maybe the semantics of the query are not defined
* writable API
* albums? artists?
* auth?
* transcoding
* server-side player
