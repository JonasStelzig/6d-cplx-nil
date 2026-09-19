# 6d complex nilmanifold atlas

A visual exploration of the cohomological structure of 6-dimensional nilmanifolds with
left-invariant complex structure: for every entry of their classification, the
decomposition of the bicomplex of left-invariant forms into squares and zigzags, indexed
by zigzag multiplicity vector, with the Dolbeault, Bott–Chern, Aeppli and de Rham numbers
and the pages of the Frölicher spectral sequence.

**https://jonasstelzig.github.io/6d-cplx-nil/**

> **Caveat.** This site is the output of a 'vibe-coding' experiment by Jonas Stelzig
> (using Claude Code). The data underlying it is computed by code written by an LLM (with
> sanity checks against available partial results in the literature), with methodology
> detailed on the site's About page. I have not redone the computation by hand (I am also
> not sure it would make me more confident..). If you use this data for anything
> important, double check it and if you find a mistake, please let me know.

Mistakes and questions are welcome as
[issues on this repository](https://github.com/JonasStelzig/6d-cplx-nil/issues).

## What is here

Only the site, which GitHub Pages serves from this repository as it stands. Opening
`index.html` from a local copy works too, with no server and no network access.

| path | contents |
|---|---|
| `index.html`, `js/`, `css/` | the atlas |
| `data/nil3.json` | all the data: every family of the classification with its strata and their loci, and every multiplicity vector with its invariants |
| `data/nil3.js` | the same data, as the script the page loads |
| `vendor/katex/` | KaTeX 0.18.7, which typesets the mathematics |

The code that computed the data is not part of this repository.

## Addresses

Every multiplicity vector, family and stratum has its own address, for example
`#/vector/V25`, `#/family/h5-nonabelian`, or `#/family/h5-nonabelian/V25` for a single
stratum; detail pages show it as a permalink. Vector ids are never reassigned: a later
version of the atlas may add vectors, but V25 will always denote the same multiplicity
vector.

## Citing

`CITATION.cff` has the details, and GitHub's "Cite this repository" button formats them.
Please cite the work the atlas is built on as well; it is listed on the About page.

## Licence

© 2026 Jonas Stelzig.

- **Data and text — CC BY 4.0** (`LICENSE-CC-BY-4.0`): `data/`, which includes the text
  of the About page, and this README.
- **Code — MIT** (`LICENSE`): everything else, in particular `index.html`, `js/` and
  `css/`.

**Not licensed by this project.** The atlas is built on published mathematics, which
remains its authors' and should be cited as such: the classification of Ceballos, Otal,
Ugarte and Villacampa (J. Geom. Anal. 26 (2016), 252–286), with the two entries missing
from it, restored in a corrigendum in preparation by Otal, Ugarte and Villacampa and given
in Chen, *Computation of the multiplicities of zigzags* (arXiv:2603.20543), Ex. 4.8. Its
structure equations and parameter regions are reproduced in the family fields `latex`,
`pretty`, `eq_display`, `region_latex` and `region_pretty` of `data/nil3.json` and
`data/nil3.js`; neither licence above extends to them.

**Third-party software.** `vendor/katex/` is KaTeX: its code is MIT, © Khan Academy and
other contributors (`vendor/katex/LICENSE`); its fonts are under the SIL Open Font License
1.1, © Design Science, Inc. and Khan Academy (`vendor/katex/fonts/OFL.txt`). Details are in
`vendor/katex/README.txt`.
