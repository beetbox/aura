AURA Universal REST API
=======================

AURA is an API specification for music libraries. Music players---from HTML5
applications to mobile apps to embedded devices---can use AURA to talk to
servers that host a catalog of music.

AURA is a lightweight and open alternative to the `DLNA`_ protocols and ad-hoc
proprietary interfaces such as `DAAP`_.

The API specification is organized as a *core API* that reflects the basic
concepts and optional *extensions*. While not every sever will implement the
same extensions, clients can assume that those that do will implement them in
the same way.

.. _dlna: http://www.dlna.org
.. _daap: http://en.wikipedia.org/wiki/Digital_Audio_Access_Protocol

Contents:

.. toctree::
    :maxdepth: 2

    api

Also see the `complete list of endpoints <http-routingtable.html>`_.
