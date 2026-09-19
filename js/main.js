/* nil3 atlas — views over the generated dataset in data/nil3.js (window.NIL3). */

(function () {
  "use strict";

  var UI = window.NIL3UI;
  var D = window.NIL3;
  var root = document.getElementById("main");
  var SITE_TITLE = "6d complex nilmanifold atlas";
  var SORTS = ["types", "deg", "squares"];
  var state = { tab: "atlas", detail: null, stratum: null, missing: null,
                q: "", orbit: "", sort: "types", style: readStyle() };

  /* Diagram style is a per-viewer convenience, so it lives in localStorage.  Every
     access is guarded: some contexts throw on the accessor itself. */
  function readStyle() {
    try {
      var v = window.localStorage.getItem("nil3.style");
      if (v === "minimal" || v === "fancy") return v;
    } catch (e) { /* private window, blocked storage, thumbnailer */ }
    return "minimal";
  }

  function writeStyle(v) {
    try { window.localStorage.setItem("nil3.style", v); } catch (e) { /* ignore */ }
  }

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  /* ---------------- mathematics ----------------------------------------- */

  /* Labels are typeset by the vendored KaTeX.  Every label also carries a plain-text
     form, shown whenever KaTeX is absent or cannot parse the LaTeX, so a label can come
     out less pretty but is never lost. */
  function tex(tag, latex, plain, opts) {
    opts = opts || {};
    var e = h(tag, opts.class ? { class: opts.class } : {});
    if (latex && window.katex) {
      try {
        window.katex.render(latex, e, { throwOnError: true, displayMode: !!opts.display });
        e.classList.add("math");
        return e;
      } catch (err) { /* fall through to the plain form */ }
    }
    e.textContent = plain || "";
    return e;
  }

  /* A line break is allowed after the separators of inline mathematics.  KaTeX breaks
     only at top-level relations and operators, so a long parameter region would
     otherwise run off a narrow screen at its commas and semicolons. */
  function breakable(latex) {
    return latex && latex.replace(/([,;])\\ /g, "$1\\allowbreak\\ ");
  }

  function mathHeading(text, latex, plain) {
    var e = h("h4", {}, [document.createTextNode(text + " ")]);
    e.appendChild(tex("span", latex, plain));
    return e;
  }

  function vectorList() {
    return Object.keys(D.vectors).map(function (k) { return D.vectors[k]; });
  }

  /* Multiplicities are constant on orbits of the Z/2 x Z/2 symmetry (real structure
     and Serre duality), so the decomposition is listed one orbit at a time. */
  function orbitEntries(vec) {
    return D.orbits
      .map(function (o) {
        return { orbit: o, m: vec.mult[o.rep] || 0 };
      })
      .filter(function (e) { return e.m > 0; })
      .sort(function (a, b) {
        if (a.orbit.kind !== b.orbit.kind) return a.orbit.kind === "zigzag" ? -1 : 1;
        if (a.orbit.length !== b.orbit.length) return a.orbit.length - b.orbit.length;
        return a.orbit.rep < b.orbit.rep ? -1 : 1;
      });
  }

  function isEven(o) {
    return o.kind === "zigzag" && o.length % 2 === 0;
  }

  function degBadge(vec) {
    var r = vec.degeneration_page;
    var cls = r === 1 ? "badge ok" : "badge accent";
    var txt = r === 1 ? "E₁ = E∞" : "E" + sub(r) + " = E∞";
    return h("span", { class: cls, text: txt });
  }

  function sub(n) { return "₀₁₂₃₄₅₆₇₈₉".charAt(n) || String(n); }

  /* An imaginary part with i written into the numerator: "12/5" gives "12i/5".  The
     older "12/5i" reads as 12/(5i) = -12i/5, which gets the sign wrong. */
  function imagPart(im) {
    var neg = im.charAt(0) === "-";
    var a = neg ? im.slice(1) : im;
    var slash = a.indexOf("/");
    var num = slash < 0 ? a : a.slice(0, slash);
    return (neg ? "-" : "") + (num === "1" ? "" : num) + "i" + (slash < 0 ? "" : a.slice(slash));
  }

  /* A parameter point {D: {re, im}, c: "1/2"} as readable text. */
  function fmtPoint(w) {
    return Object.keys(w).sort().map(function (k) {
      var v = w[k];
      if (v && typeof v === "object") {
        var re = v.re, im = v.im;
        if (im === "0") v = re;
        else if (re === "0") v = imagPart(im);
        else v = re + (im.charAt(0) === "-" ? "" : "+") + imagPart(im);
      }
      // absBm1 is the derived coordinate |B-1| the h_11/h_12 transcription carries
      var name = k === "lambda" ? "λ" : k === "absBm1" ? "|B−1|" : k;
      return name + " = " + v;
    }).join(", ");
  }

  /* The witness a stratum was confirmed at.  A family with no parameters has only the
     empty point, and "witness:" with nothing after it would read as a missing value. */
  function witnessLine(s) {
    var w = (s.witnesses || []).filter(function (p) { return Object.keys(p).length; })[0];
    return w ? h("div", { class: "algebras", text: "witness: " + fmtPoint(w) }) : null;
  }

  function statusBadge(st) {
    if (st === "proved")
      return h("span", {
        class: "badge ok", text: "proved",
        title: "derived from the rank stratification of the Hom matrices, and " +
               "confirmed by exact evaluation at a witness point in the cell"
      });
    if (st === "certified")
      return h("span", {
        class: "badge ok", text: "certified",
        title: "substituting the defining equations leaves no free parameter, so the " +
               "symbolic computation is a complete proof"
      });
    if (st === "symbolic-generic")
      return h("span", {
        class: "badge", text: "symbolic-generic",
        title: "proved over the function field of the stratum, hence on a " +
               "Zariski-open dense subset of it"
      });
    return h("span", {
      class: "badge warn", text: "[unverified] sampled",
      title: "found by exact evaluation at sample points; the rank stratification " +
             "did not reach it, so its locus is not proved"
    });
  }

  /* ---------------- routes ---------------------------------------------- */

  /* Every view has its own URL, so a multiplicity vector, a family or a single stratum
     can be linked to and cited:

       #/atlas               optionally ?q=…&orbit=…&sort=…
       #/algebras            #/about
       #/vector/V25          #/family/h5-nonabelian      #/family/h5-nonabelian/V25

     These are hash routes rather than paths because a hash needs no server-side
     rewriting: the same URLs work on GitHub Pages and straight from the filesystem.
     Vector ids come from an append-only registry, so a link names the same vector
     across rebuilds, and a stratum is named by its family and vector, which together
     identify it. */

  /* Own properties only: a route segment is arbitrary text, and "constructor" or
     "toString" would otherwise find Object.prototype and pass for a vector. */
  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function familyById(id) {
    for (var i = 0; i < D.families.length; i++)
      if (D.families[i].id === id) return D.families[i];
    return null;
  }

  function parseRoute(hash) {
    var r = { tab: "atlas", detail: null, stratum: null, missing: null,
              q: "", orbit: "", sort: "types" };
    var s = String(hash || "").replace(/^#\/?/, "");
    var qi = s.indexOf("?");
    var path = qi < 0 ? s : s.slice(0, qi);
    var query = qi < 0 ? "" : s.slice(qi + 1);
    var parts;
    try {
      parts = path.split("/").filter(Boolean).map(decodeURIComponent);
    } catch (e) {
      r.missing = "that address could not be read";
      return r;
    }
    var head = parts[0] || "atlas";

    if (head === "atlas" && parts.length <= 1) {
      // A mangled link should say what was wrong with it, not quietly show something
      // other than what its sender saw.  Valid settings still apply.
      r.isAtlas = true;
      var bad = [];
      query.split("&").forEach(function (kv) {
        if (!kv) return;
        var i = kv.indexOf("=");
        var k = i < 0 ? kv : kv.slice(0, i);
        var v;
        try { v = decodeURIComponent((i < 0 ? "" : kv.slice(i + 1)).replace(/\+/g, " ")); }
        catch (e) { bad.push("the " + k + " setting could not be read"); return; }
        if (k === "q") r.q = v;
        else if (k === "orbit") {
          if (orbitById(v)) r.orbit = v;
          else bad.push("there is no orbit " + v);
        } else if (k === "sort") {
          if (SORTS.indexOf(v) >= 0) r.sort = v;
          else bad.push("sort must be one of " + SORTS.join(", ") + ", not " + v);
        } else bad.push("the atlas has no setting called " + k);
      });
      if (bad.length) r.missing = bad.join("; ");
      return r;
    }
    if ((head === "algebras" || head === "about") && parts.length === 1) {
      r.tab = head;
      return r;
    }
    if (head === "vector" && parts.length === 2) {
      if (has(D.vectors, parts[1])) { r.tab = "detail"; r.detail = parts[1]; }
      else r.missing = "there is no multiplicity vector " + parts[1] + " in this atlas";
      return r;
    }
    if (head === "family" && (parts.length === 2 || parts.length === 3)) {
      var f = familyById(parts[1]);
      if (!f) {
        r.missing = "there is no family " + parts[1] + " in this atlas";
        return r;
      }
      r.tab = "detail";
      r.detail = "fam:" + f.id;
      if (parts.length === 3) {
        if (has(D.strata, f.id + "/" + parts[2])) r.stratum = parts[2];
        else r.missing = "family " + f.id + " has no stratum carrying " + parts[2];
      }
      return r;
    }
    r.missing = "there is no page at #/" + s;
    return r;
  }

  /* Text with every lone UTF-16 surrogate replaced by U+FFFD; valid pairs are kept.  A
     lone half (text cut through an emoji, then pasted into the filter) would make
     encodeURIComponent throw, and every later page would come up blank. */
  function wellFormed(s) {
    return String(s).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g,
      function (m) { return m.length === 2 ? m : "�"; });
  }

  function atlasHash() {
    var qs = [];
    if (state.q) qs.push("q=" + encodeURIComponent(wellFormed(state.q)));
    if (state.orbit) qs.push("orbit=" + encodeURIComponent(state.orbit));
    if (state.sort !== "types") qs.push("sort=" + state.sort);
    return "#/atlas" + (qs.length ? "?" + qs.join("&") : "");
  }

  function familyHash(fid, vid) {
    return "#/family/" + encodeURIComponent(fid) + (vid ? "/" + encodeURIComponent(vid) : "");
  }

  function vectorHash(vid) {
    return "#/vector/" + encodeURIComponent(vid);
  }

  function currentHash() {
    if (state.tab === "atlas") return atlasHash();
    if (state.tab === "algebras" || state.tab === "about") return "#/" + state.tab;
    if (state.detail.indexOf("fam:") === 0)
      return familyHash(state.detail.slice(4), state.stratum);
    return vectorHash(state.detail);
  }

  function applyRoute(force, savedY) {
    var r = parseRoute(window.location.hash);
    var sameView = r.tab === state.tab && r.detail === state.detail &&
                   r.stratum === state.stratum;
    // Filters belong to the atlas: only an atlas address sets them.  Visiting a vector
    // and coming back, by the page's own links as much as by the browser's Back button,
    // should find the atlas filtered as it was left.
    var sameFilters = !r.isAtlas ||
                      (r.q === state.q && r.orbit === state.orbit && r.sort === state.sort);
    // Typing in the filter rewrites the hash, which fires hashchange; the route then
    // equals the state already on screen, and re-rendering would destroy the input
    // being typed into.
    if (!force && sameView && sameFilters && !r.missing && !state.missing) return;

    var hadNotice = !!state.missing;
    state.tab = r.tab; state.detail = r.detail; state.stratum = r.stratum;
    state.missing = r.missing;
    // Only an address that really is an atlas address sets the filters.  A missing
    // vector or family also shows the atlas, but must not wipe the filters in use.
    if (r.isAtlas) { state.q = r.q; state.orbit = r.orbit; state.sort = r.sort; }

    // Keep the address in its canonical form ("#about" becomes "#/about", a default
    // setting is dropped), so that the tab links and the page's own links always equal
    // it and clicking one adds no empty history entry.  It is replaced before rendering,
    // so settleOn sees the final address.  An address with a notice is left as typed:
    // the notice is about what the reader entered.
    if (!r.missing) {
      var canon = currentHash();
      if (window.location.hash !== canon) {
        try { window.location.replace(canon); } catch (e) { /* stays as it was */ }
      }
    }

    // A view that was showing a "nothing at this address" notice is rebuilt in full,
    // so the notice cannot outlive the address it was about.
    if (!force && sameView && !r.missing && !hadNotice && state.tab === "atlas" &&
        atlasDom && atlasDom.root.parentNode === root) {
      // only the filters moved (back or forward through filter states)
      syncAtlasControls();
      refreshAtlas();
      updateChrome();
      return;
    }
    render(savedY);
  }

  /* Filters change without leaving the page, so the URL is replaced rather than
     pushed: history gets no entry per keystroke, and the view is not rebuilt. */
  function filtersChanged() {
    state.missing = null;
    var note = root.querySelector(".note.route");
    if (note) note.parentNode.removeChild(note);
    refreshAtlas();
    var target = atlasHash();
    if (window.location.hash !== target) {
      try { window.location.replace(target); } catch (e) { /* URL stays as it was */ }
    }
    updateChrome();
  }

  function updateChrome() {
    var cur = state.tab !== "detail" ? state.tab
            : (state.detail.indexOf("fam:") === 0 ? "algebras" : "atlas");
    document.querySelectorAll("nav.tabs a[data-tab]").forEach(function (a) {
      if (a.getAttribute("data-tab") === cur) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
      // returning to the atlas keeps whatever filter was set
      if (a.getAttribute("data-tab") === "atlas") a.setAttribute("href", atlasHash());
    });
    document.title = titleOf();
  }

  function titleOf() {
    if (state.tab === "about") return "About · " + SITE_TITLE;
    if (state.tab === "algebras") return "Lie algebras · " + SITE_TITLE;
    if (state.tab === "detail") {
      if (state.detail.indexOf("fam:") === 0) {
        var f = familyById(state.detail.slice(4));
        return (state.stratum ? "Stratum " + state.stratum + " of " : "") +
               f.lie_algebra + " " + f.kind + " · " + SITE_TITLE;
      }
      return "Multiplicity vector " + state.detail + " · " + SITE_TITLE;
    }
    return SITE_TITLE;
  }

  /* Viewed from the filesystem or a local server, the page's own address is useless to
     anyone else -- and would leak a local user name into whatever it is pasted into. */
  function viewedLocally() {
    var loc = window.location, host = loc.hostname;
    return loc.protocol === "file:" || !host || host === "localhost" ||
           host === "127.0.0.1" || host === "[::1]" || host === "::1";
  }

  /* The address to cite.  Published, it is the page's own URL with this view's route;
     any query string is dropped, since the atlas never uses one and it can only be
     something a visitor arrived with (a tracking parameter, say).  Viewed locally, it is
     built on the published address recorded in the data, or, if there is none yet, it
     is the route alone. */
  function permalink(hash) {
    var note = null, url;
    var site = D.meta && D.meta.site_url;
    if (!viewedLocally()) {
      url = window.location.href.split(/[?#]/)[0] + hash;
    } else if (site) {
      url = (/\.html?$/.test(site) ? site : site.replace(/\/*$/, "/")) + hash;
    } else {
      url = hash;
      note = "viewed locally: put the atlas's published address in front";
    }
    var field = h("input", {
      class: "permalink-url", type: "text", readonly: "readonly", value: url,
      "aria-label": "permalink to this page"
    });
    var status = h("span", { class: "permalink-status", "aria-live": "polite" });
    var copy = h("button", {
      type: "button", class: "permalink-copy", text: "copy",
      onclick: function () {
        field.focus();
        field.select();
        var done = function () { status.textContent = "copied"; };
        var manual = function () { status.textContent = "selected, copy with the keyboard"; };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText)
            navigator.clipboard.writeText(url).then(done, manual);
          else manual();
        } catch (e) { manual(); }
      }
    });
    return h("div", { class: "permalink" }, [
      h("span", { class: "permalink-label", text: "permalink" }), field, copy, status,
      note ? h("span", { class: "permalink-note", text: note }) : null
    ]);
  }

  /* ---------------- atlas: one card per multiplicity vector -------------- */

  /* The atlas toolbar is built once and kept.  Rebuilding it on every keystroke is
     exactly what made the filter lose focus after each character: the input element was
     destroyed and recreated, and the caret went with it.  Typing now refreshes only the
     card list, so the input is never detached. */
  var atlasDom = null;

  /* Number of multiplicity vectors in which this orbit has nonzero multiplicity. */
  var _occurs = null;
  function occursIn(o) {
    if (!_occurs) {
      _occurs = {};
      D.orbits.forEach(function (x) {
        var n = 0;
        Object.keys(D.vectors).forEach(function (k) {
          if ((D.vectors[k].mult[x.rep] || 0) > 0) n++;
        });
        _occurs[x.id] = n;
      });
    }
    return _occurs[o.id];
  }

  function orbitById(id) {
    for (var i = 0; i < D.orbits.length; i++)
      if (D.orbits[i].id === id) return D.orbits[i];
    return null;
  }

  /* The multiplicity vector as shown on a card: every orbit with nonzero multiplicity
     except the squares, which are left for the detail view. */
  function zigzagOrbits(v) {
    return orbitEntries(v).filter(function (e) { return e.orbit.kind !== "square"; });
  }

  function filteredVectors() {
    var vecs = vectorList();
    if (state.q) {
      var q = state.q.toLowerCase();
      vecs = vecs.filter(function (v) {
        return v.algebras.join(" ").toLowerCase().indexOf(q) >= 0 ||
               v.id.toLowerCase().indexOf(q) >= 0;
      });
    }
    if (state.orbit) {
      var o = orbitById(state.orbit);
      // multiplicities are constant on an orbit, so the representative decides
      if (o) vecs = vecs.filter(function (v) { return (v.mult[o.rep] || 0) > 0; });
    }
    vecs.sort(function (a, b) {
      var d = state.sort === "deg" ? a.degeneration_page - b.degeneration_page
            : state.sort === "squares" ? a.n_squares - b.n_squares
            : zigzagOrbits(b).length - zigzagOrbits(a).length;
      // ties by id number, not by key order: once ids pass V99 the data's keys sort as
      // strings, which would put V100 between V10 and V11
      return d || (parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10));
    });
    return vecs;
  }

  function buildAtlasDom() {
    var input = h("input", {
      type: "search", placeholder: "Lie algebra, e.g. h_5", value: state.q
    });
    input.addEventListener("input", function (e) {
      // cleaned here as well as in atlasHash, so the state and the URL stay in step
      state.q = wellFormed(e.target.value);
      filtersChanged();
    });

    var sortSel = h("select", {}, [
      h("option", { value: "types", text: "distinct orbits" }),
      h("option", { value: "deg", text: "degeneration page" }),
      h("option", { value: "squares", text: "squares" })
    ]);
    sortSel.value = state.sort;
    sortSel.addEventListener("change", function (e) {
      state.sort = e.target.value;
      filtersChanged();
    });

    var orbitSel = h("select", {}, [h("option", { value: "", text: "any orbit" })]);
    var groups = [];
    D.orbits.forEach(function (o) {
      var key = o.kind === "square" ? "squares" : "zigzags of length " + o.length;
      var g = null;
      groups.forEach(function (x) { if (x.key === key) g = x; });
      if (!g) { g = { key: key, items: [] }; groups.push(g); }
      g.items.push(o);
    });
    groups.forEach(function (g) {
      var grp = document.createElement("optgroup");
      grp.label = g.key;
      g.items.forEach(function (o) {
        // How many multiplicity vectors actually contain this orbit.  11 of the 30
        // never occur at all in dimension 3, and saying so beats offering a filter
        // that silently returns nothing.
        var n = occursIn(o);
        grp.appendChild(h("option", {
          value: o.id,
          text: o.rep + (o.size > 1 ? " (orbit of " + o.size + ")" : "") +
                "  ·  " + (n ? n + " vector" + (n === 1 ? "" : "s")
                                  : "never occurs")
        }));
      });
      orbitSel.appendChild(grp);
    });
    orbitSel.value = state.orbit || "";
    orbitSel.addEventListener("change", function (e) {
      state.orbit = e.target.value;
      filtersChanged();
    });

    var count = h("span", { class: "count" });
    var preview = h("span", { class: "orbprev" });
    var bar = h("div", { class: "toolbar" }, [
      h("label", { text: "Lie algebra " }), input,
      h("label", { text: " containing orbit " }), orbitSel, preview,
      h("label", { text: " sort " }), sortSel,
      count
    ]);
    var cards = h("div", { class: "cards wide" });
    atlasDom = { root: h("div", {}, [bar, cards]), cards: cards, count: count,
                 preview: preview, input: input, orbitSel: orbitSel, sortSel: sortSel };
  }

  function syncAtlasControls() {
    if (atlasDom.input.value !== state.q) atlasDom.input.value = state.q;
    atlasDom.orbitSel.value = state.orbit || "";
    atlasDom.sortSel.value = state.sort;
  }

  function refreshAtlas() {
    var vecs = filteredVectors();
    atlasDom.cards.innerHTML = "";
    vecs.forEach(function (v) {
      var ent = zigzagOrbits(v);
      var gallery = h("div", { class: "gallery" });
      ent.forEach(function (e) { gallery.appendChild(orbCard(e.orbit, e.m, true)); });
      atlasDom.cards.appendChild(h("a", { class: "card", href: vectorHash(v.id) }, [
        h("h3", { text: v.id }),
        h("div", { class: "badges" }, [
          degBadge(v),
          h("span", { class: "badge", text: ent.length +
            (ent.length === 1 ? " orbit" : " orbits") }),
          h("span", { class: "badge", text: v.n_squares +
            (v.n_squares === 1 ? " square" : " squares") }),
          h("span", { class: "badge", text: "b" + sub(1) + " = " + v.betti["1"] })
        ]),
        gallery,
        h("div", { class: "algebras", text: v.algebras.join("  ") })
      ]));
    });
    atlasDom.count.textContent = vecs.length + " of " +
      Object.keys(D.vectors).length + " multiplicity vectors";

    atlasDom.preview.innerHTML = "";
    var o = state.orbit ? orbitById(state.orbit) : null;
    if (o) {
      var svg = UI.orbitSVG(o.members, D.zigzags, {
        box: 12, labels: false, orbit: o,
        style: state.style === "fancy" ? "checker" : "minimal"
      });
      svg.classList.add("zz-inline");
      atlasDom.preview.appendChild(svg);
    }
  }

  function atlasView() {
    if (!atlasDom) buildAtlasDom();
    syncAtlasControls();
    refreshAtlas();
    return atlasDom.root;
  }

  function orbCard(o, m, small) {
    var c = h("div", { class: "zzcard" + (isEven(o) ? " even" : "") });
    var svg = UI.orbitSVG(o.members, D.zigzags,
                          { box: small ? 17 : 26, labels: !small, orbit: o,
                            style: state.style === "fancy" ? "checker" : "minimal" });
    if (!small) svg.classList.add("zz-large");
    c.appendChild(svg);
    c.appendChild(h("span", { class: "mult", text: "×" + m }));
    if (!small) {
      c.appendChild(h("span", { class: "zid", text: o.rep }));
      if (o.size > 1)
        c.appendChild(h("span", {
          class: "orbsz", text: " orbit of " + o.size
        }));
    }
    return c;
  }

  /* ---------------- browse by Lie algebra ------------------------------- */

  function algebraView() {
    var byAlg = {};
    D.families.forEach(function (f) {
      (byAlg[f.lie_algebra] = byAlg[f.lie_algebra] || []).push(f);
    });
    var wrap = h("div", {});
    wrap.appendChild(h("p", { class: "prose", text:
      "The 18 six-dimensional nilpotent Lie algebras admitting a complex structure, " +
      "with COUV's classification of those structures up to equivalence. Each entry " +
      "is split into the strata on which the zigzag multiplicity vector is constant." }));
    var cards = h("div", { class: "cards" });
    Object.keys(byAlg).forEach(function (alg) {
      byAlg[alg].forEach(function (f) {
        var strata = f.strata.map(function (sid) { return D.strata[sid]; });
        var card = h("a", { class: "card", href: familyHash(f.id) }, [
          h("h3", { text: f.lie_algebra + "  ·  " + f.kind }),
          tex("div", breakable(f.latex), f.pretty, { class: "eqn" }),
          h("div", { class: "badges" }, [
            h("span", { class: "badge", text: strata.length + " strat" +
              (strata.length === 1 ? "um" : "a") }),
            h("span", { class: "badge", text: f.n_points + (f.n_points === 1 ? " sample point" : " sample points") }),
            f.complete
              ? h("span", {
                  class: "badge ok", text: "stratification complete",
                  title: "every stratum of this family is proved; the list is proved " +
                         "to have no others"
                })
              : h("span", {
                  class: "badge warn", text: "list not proved complete",
                  title: "every stratum shown is real, but an unresolved degeneracy " +
                         "locus could hide a further thin stratum"
                })
          ])
        ]);
        cards.appendChild(card);
      });
    });
    wrap.appendChild(cards);
    return wrap;
  }

  /* ---------------- detail --------------------------------------------- */

  function detailView() {
    if (state.detail.indexOf("fam:") === 0)
      return h("div", {}, [
        h("a", { class: "back", href: "#/algebras", text: "← Lie algebras" }),
        familyDetail(state.detail.slice(4))
      ]);
    return h("div", {}, [
      h("a", { class: "back", href: atlasHash(), text: "← atlas" }),
      vectorDetail(D.vectors[state.detail])
    ]);
  }

  function familyDetail(fid) {
    var f = familyById(fid);
    var left = h("div", {}, [
      h("h2", { text: f.lie_algebra + "  ·  " + f.kind }),
      // arriving at one stratum, the address to pass on is that stratum's
      permalink(familyHash(f.id, state.stratum)),
      tex("div", f.eq_display, "dω¹ = 0\n" + f.pretty, { class: "eqn", display: true }),
      f.region_pretty
        ? h("div", {}, [h("h4", { text: "parameter region" }),
                        tex("div", breakable(f.region_latex), f.region_pretty,
                            { class: "eqn" })])
        : null,
      h("h4", { text: "strata" })
    ]);
    f.strata.forEach(function (sid) {
      var s = D.strata[sid];
      var v = D.vectors[s.vector];
      left.appendChild(h("div", { class: "locus", "data-stratum": v.id }, [
        tex("div", breakable(s.locus_latex), s.locus, { class: "who" }),
        h("div", { class: "badges" }, [
          statusBadge(s.status), degBadge(v)
        ]),
        witnessLine(s),
        h("div", { class: "locus-links" }, [
          h("a", { href: vectorHash(v.id), text: "multiplicity vector " + v.id + " →" }),
          h("a", {
            class: "stratum-link", href: familyHash(f.id, v.id), text: "link to this stratum",
            title: "a permanent address for this stratum: " + f.id + " / " + v.id
          })
        ])
      ]));
    });
    var right = h("div", {}, [
      h("h4", { text: "source" }),
      h("p", { class: "prose", text: f.source })
    ]);
    return h("div", { class: "detail" }, [left, right]);
  }

  function vectorDetail(v) {
    var ent = orbitEntries(v);
    // The card already carries the zigzag part of the vector; what the detail view adds
    // is the squares and the cohomology, so the two are shown apart.
    var zz = ent.filter(function (e) { return e.orbit.kind !== "square"; });
    var sq = ent.filter(function (e) { return e.orbit.kind === "square"; });
    var gallery = h("div", { class: "gallery" });
    zz.forEach(function (e) { gallery.appendChild(orbCard(e.orbit, e.m, false)); });
    var sqGallery = h("div", { class: "gallery" });
    sq.forEach(function (e) { sqGallery.appendChild(orbCard(e.orbit, e.m, false)); });

    var left = h("div", {}, [
      h("h2", { text: "Multiplicity vector " + v.id }),
      permalink(vectorHash(v.id)),
      h("div", { class: "badges" }, [
        degBadge(v),
        h("span", { class: "badge", text: zz.length +
          (zz.length === 1 ? " zigzag orbit" : " zigzag orbits") }),
        h("span", { class: "badge", text: v.n_squares +
          (v.n_squares === 1 ? " square" : " squares") }),
        h("span", { class: "badge", text: "dim " + v.total_dim })
      ]),
      h("div", { class: "legend" }, state.style !== "fancy" ? [
        h("span", { text: "horizontal arrows are ∂, vertical are ∂̄" }),
        h("span", { text: "red border = even zigzag (obstructs Frölicher degeneration)" })
      ] : [
        h("span", {}, [h("span", { class: "swatch", style: "background:var(--del)" }),
                       h("span", { text: " ∂" })]),
        h("span", {}, [h("span", { class: "swatch", style: "background:var(--delbar)" }),
                       h("span", { text: " ∂̄" })]),
        h("span", { text: "red border = even zigzag (obstructs Frölicher degeneration)" })
      ]),
      h("p", { class: "prose", text:
        "One diagram per orbit of the ℤ/2 × ℤ/2 action generated by the real " +
        "structure (mirror in p = q) and Serre duality (the point reflection " +
        "(p,q) ↦ (3−p, 3−q)); their product is the mirror in p + q = 3. " +
        "Multiplicities are constant on orbits, so the whole orbit is drawn together, " +
        "its members nudged apart inside each box. Coordinates label boxes, not " +
        "lattice points." }),
      h("h4", { text: "zigzags" }),
      gallery,
      sq.length ? h("h4", { text: "squares" }) : null,
      sq.length ? sqGallery : null,
      sq.length ? h("p", { class: "prose", text:
        "Squares are invisible to every cohomology theory and their multiplicity is " +
        "therefore of less interest. Moreover, in all forms of M their multiplicity " +
        "is infinite. The count here describes the 64-dimensional invariant model " +
        "only." }) : null,
      h("h4", { text: "realised by" })
    ]);
    v.strata.forEach(function (sid) {
      var s = D.strata[sid];
      var f = familyById(s.family);
      left.appendChild(h("div", { class: "locus" }, [
        h("a", { class: "who", href: familyHash(f.id, v.id),
                 text: f.lie_algebra + " · " + f.kind }),
        tex("div", breakable(f.latex), f.pretty, { class: "eqn" }),
        tex("div", breakable(s.locus_latex), s.locus),
        witnessLine(s),
        h("div", { class: "badges" }, [statusBadge(s.status)])
      ]));
    });

    var right = h("div", {}, [
      mathHeading("Dolbeault", "h^{p,q}", "h^{p,q}"), UI.pqTable(v.dolbeault),
      mathHeading("Bott–Chern", "h^{p,q}_{BC}", "h^{p,q}_BC"), UI.pqTable(v.bott_chern),
      mathHeading("Aeppli", "h^{p,q}_{A}", "h^{p,q}_A"), UI.pqTable(v.aeppli),
      mathHeading("de Rham", "b_k", "b_k"),
      UI.rowTable(v.betti, function (k) { return "b" + sub(Number(k)); })
    ]);
    Object.keys(v.frolicher).sort().forEach(function (r) {
      if (Number(r) > v.degeneration_page + 0) return;
      right.appendChild(mathHeading("Frölicher", "E_{" + r + "}", "E_" + r));
      right.appendChild(UI.pqTable(v.frolicher[r]));
    });

    return h("div", { class: "detail" }, [left, right]);
  }

  /* ---------------- about ---------------------------------------------- */

  /* The About text may use TeX: $…$ or \(…\) inline, $$…$$ or \[…\] displayed.
     A literal dollar sign in prose must be written <span class="no-tex">$</span>.
     Neither \$ nor &#36; works there: the vendored auto-render does not treat a
     backslash before an opening $ as an escape, and an entity is decoded before it
     reads the text.  (\$ is fine inside mathematics, as in $\$5$.) */
  function aboutView() {
    var e = h("div", { class: "prose", html: D.meta.about_html });
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(e, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false }
          ],
          ignoredClasses: ["no-tex"],
          throwOnError: false
        });
      } catch (err) { /* the TeX source stays readable as it is */ }
    }
    return e;
  }

  /* ---------------- shell ---------------------------------------------- */

  /* savedY, when given, is where the reader was the last time they left this address;
     returning puts them back there, before any centring on a stratum. */
  function render(savedY) {
    root.innerHTML = "";
    updateChrome();
    if (state.missing)
      root.appendChild(h("div", { class: "note route", role: "status",
        text: "Nothing to show at this address: " + state.missing + "." }));
    var v = state.tab === "atlas" ? atlasView()
          : state.tab === "algebras" ? algebraView()
          : state.tab === "about" ? aboutView()
          : detailView();
    root.appendChild(v);
    if (typeof savedY === "number") {
      window.scrollTo(0, savedY);
      return;
    }
    if (state.stratum) {
      var target = root.querySelector('[data-stratum="' + state.stratum + '"]');
      if (target) {
        target.classList.add("target");
        settleOn(target, window.location.hash);
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  /* KaTeX's fonts arrive after the first layout, and typeset maths is narrower in them
     than in the fallback, so the page shortens and a stratum centred too early ends up
     off screen.  Centre it now, and again once those fonts are in -- unless the reader
     has moved on to another address in the meantime. */
  function settleOn(target, hash) {
    target.scrollIntoView({ block: "center" });
    if (!document.fonts || !document.fonts.load) return;
    Promise.all([document.fonts.load("1em KaTeX_Main"),
                 document.fonts.load("italic 1em KaTeX_Math")]).then(function () {
      if (window.location.hash === hash && target.isConnected)
        target.scrollIntoView({ block: "center" });
    }, function () { /* fonts unavailable: the first centring stands */ });
  }

  ["minimal", "fancy"].forEach(function (name) {
    var btn = document.getElementById("style-" + name);
    if (!btn) return;
    btn.addEventListener("click", function () {
      state.style = name;
      writeStyle(name);
      syncStyleButtons();
      render(window.scrollY);          // restyling should not move the reader
    });
  });

  function syncStyleButtons() {
    ["minimal", "fancy"].forEach(function (name) {
      var btn = document.getElementById("style-" + name);
      if (btn) btn.setAttribute("aria-pressed", String(state.style === name));
    });
  }
  syncStyleButtons();

  /* Where the reader was is remembered per address, so Back -- or the page's own
     "← atlas" link -- returns them to the card they opened instead of the top.  The
     browser's own restoration is switched off: it acts before hashchange, on the page
     being left, and the re-render would undo it anyway.  With it off, scrollY in the
     handler still belongs to the page being left. */
  var scrollMemo = {};
  try {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  } catch (e) { /* older browsers: positions are simply not restored */ }
  window.addEventListener("hashchange", function (e) {
    if (e.oldURL) scrollMemo[e.oldURL] = window.scrollY;
    applyRoute(false, e.newURL && has(scrollMemo, e.newURL) ? scrollMemo[e.newURL] : undefined);
  });
  applyRoute(true);
})();
