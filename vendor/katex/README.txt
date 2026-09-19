KaTeX 0.18.7, vendored so the atlas renders mathematics with no external requests.

Source   https://registry.npmjs.org/katex/-/katex-0.18.7.tgz
sha512   h+UCwkZ+4Jz8WQ7MLGfj7UVFrRCizGb912fwF4luGdYsC5paYG1vx+jy+KRcC/XkpjGva/P7nAWuxNnPzRvzHw==
         (the integrity value the npm registry publishes for that tarball; checked on download)

Licences -- two, for two kinds of file:

  katex.min.js, katex.min.css, contrib/
           MIT, (c) Khan Academy and other contributors.  See LICENSE.

  fonts/   SIL Open Font License 1.1, (c) 2009-2010 Design Science, Inc. and
           (c) 2014-2018 Khan Academy, with Reserved Font Names KaTeX_AMS,
           KaTeX_Caligraphic, KaTeX_Fraktur, KaTeX_Main, KaTeX_Math, KaTeX_SansSerif,
           KaTeX_Script, KaTeX_Size1-4 and KaTeX_Typewriter.  See fonts/OFL.txt.

The fonts' licence is read from the font files themselves: all twenty declare OFL 1.1
and those copyright holders in their name tables (nameIDs 0, 13 and 14).  The fonts
derive from MathJax's TeX fonts, hence Design Science.  Note that the npm package ships
only the MIT LICENSE, and KaTeX's font repository (github.com/KaTeX/katex-fonts) also
carries an MIT LICENSE; the files are distributed here under the licence they declare,
OFL 1.1, with its notice.

Taken from the package's dist/: katex.min.js, katex.min.css, contrib/auto-render.min.js,
and the woff2 fonts only.  katex.min.css also names .woff and .ttf fallbacks; every
browser that supports woff2 stops at it and never requests those, so they are omitted.
None of those files is modified.  fonts/OFL.txt is not part of the npm package: it was
added alongside the fonts, the licence text taken from https://openfontlicense.org/
documents/OFL.txt with the copyright lines and reserved names from the fonts' own
metadata.
