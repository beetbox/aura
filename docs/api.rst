Core API Specification
======================

The API root **SHOULD** appear under a prefix named ``/aura/``. This
facilitates servers with multiple APIs, allows for human-readable content on
the same server, and provides for forward compatibility: future versions of
this spec may recommend ``/aura2/``, for example.

Tracks
------

.. http:get:: /aura/tracks

    Foo bar.

.. http:get:: /aura/tracks/(id)

    Baz.

.. http:get:: /aura/tracks/(id)/audio

    Audio file.

.. http:get:: /aura/tracks/(id)/image

    Image.


Albums
------

``GET /aura/albums/``

``GET /aura/albums/<id>``

``GET /aura/tracks/<id>/image``


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
