AURA Universal REST API
=======================

AURA is an API specification for music libraries. Music players---from HTML5
applications to mobile apps to embedded devices---use AURA to access servers
that host catalogs of music. An AURA server can act as a personal alternative
to centralized cloud services like Spotify or Rdio.

The AURA protocol is a lightweight and open alternative to `DLNA`_ or `DAAP`_.

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
