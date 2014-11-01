AURA Universal REST API
=======================

AURA is a design for simple, REST API for music libraries. It's the glue between music players and libraries of music.

## Specification

See [the evolving spec](http://auraspec.readthedocs.org/) online. The source for this documentation is under the `docs/` directory in this repository.

## Reference Implementation

This repository also hosts a very simple reference server and client implemented in JavaScript. Here's how to use them:

    $ cd ref/
    $ npm install  # Get the dependencies for the server.
    $ node server.js /path/to/music/dir  # Run the server.
    $ open webclient/index.html  # Open the client in a browser.

The reference implementation is incomplete and extremely preliminary. It demonstrates listing tracks and sending audio files.

## Get Involved

This is an experimental project! We'd like to create an API that's suited to a broad range of music players and music libraries---it should be a good basis for any networked music project idea you have.

If you're interested in helping guide the direction of the AURA project, we'd love to collaborate. Please [get in touch][email].

[email]: mailto:adrian@radbox.org
