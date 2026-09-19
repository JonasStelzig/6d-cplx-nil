/* SVG rendering for the nil3 atlas.

   Coordinates label BOXES, not lattice points: the (p,q) plane is a 4x4 board and a
   summand's dots sit at box midpoints, so an arrow runs from one box to an adjacent one.
   p increases to the right, q upwards.

   One diagram per orbit of the Z/2 x Z/2 action (real structure + Serre duality), since
   multiplicities are constant on orbits.  All members of the orbit are drawn together.

   Offsets are computed in nil3/symmetry.py and shipped with the data; this file only
   applies them.  Two properties matter here:

     - an offset is CONSTANT across a member's dots, so both endpoints of an arrow move
       together and every arrow stays strictly horizontal or strictly vertical;
     - the offsets within an orbit have pairwise distinct x and pairwise distinct y,
       which is what stops two dots in a box coinciding and two arrows in a row or a
       column overlapping.

   An orbit whose members never share a box gets zero offsets and is drawn centred, and
   the non-zero assignment is equivariant, so the picture carries the orbit's own mirror
   symmetry rather than an arbitrary ordering.  Transverse crossings are left alone.

   Plain script, no ES modules: the page must work opened straight from the filesystem. */

var NIL3UI = window.NIL3UI || {};

(function (ns) {
  "use strict";

  var N3 = 3;                    // complex dimension: boxes are {0..N3}^2
  var SVGNS = "http://www.w3.org/2000/svg";
  var uid = 0;

  function el(name, attrs, parent) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* The four corners of a square summand, as a zigzag-shaped record. */
  function squareShape(id) {
    var p = Number(id.charAt(2)), q = Number(id.charAt(3));
    var dots = [[p, q], [p + 1, q], [p, q + 1], [p + 1, q + 1]];
    return {
      id: id, length: 4, dots: dots, even: false, square: true,
      arrows: [
        { from: 0, to: 1, kind: "del" },
        { from: 2, to: 3, kind: "del" },
        { from: 0, to: 2, kind: "delbar" },
        { from: 1, to: 3, kind: "delbar" }
      ]
    };
  }

  function shapeOf(id, zigzags) {
    return id.charAt(0) === "S" ? squareShape(id) : zigzags[id];
  }

  /* Offsets come from nil3/symmetry.py: zero when nothing collides, otherwise an
     equivariant assignment, so the picture carries the orbit's own symmetry. */
  function offsetOf(orbit, id, S) {
    var o = (orbit && orbit.offsets && orbit.offsets[id]) || [0, 0];
    // q increases upwards but SVG y increases downwards, so the y-offset is negated.
    // Getting this wrong silently breaks the equivariance on screen (the transpose
    // mirror no longer maps the picture to itself) and lets two arrows overlap.
    return [o[0] * S, -o[1] * S];
  }

  /* One orbit drawn on the checkerboard.  members is a list of summand ids. */
  function orbitSVG(members, zigzags, opts) {
    opts = opts || {};
    var orbit = opts.orbit || null;
    var minimal = opts.style === "minimal";
    var plain = minimal || opts.style === "plain";
    var S = opts.box || 24;                 // box side
    var ml = opts.labels === false ? 4 : 13;  // room for axis labels
    var mb = opts.labels === false ? 4 : 12;
    var W = ml + (N3 + 1) * S + 4;
    var H = 4 + (N3 + 1) * S + mb;

    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("class", "zz");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", orbitLabel(members, zigzags));

    function bx(p) { return ml + p * S; }
    function by(q) { return 4 + (N3 - q) * S; }
    function cx(p) { return bx(p) + S / 2; }
    function cy(q) { return by(q) + S / 2; }

    // checkerboard
    for (var p = 0; p <= N3; p++) {
      for (var q = 0; q <= N3; q++) {
        el("rect", {
          x: bx(p), y: by(q), width: S, height: S,
          class: "zz-box" + (plain ? " zz-box-plain"
                                   : ((p + q) % 2 ? " zz-box-alt" : ""))
        }, svg);
      }
    }

    // axis labels on box midpoints
    if (opts.labels !== false) {
      for (var i = 0; i <= N3; i++) {
        var tp = el("text", {
          x: cx(i), y: H - 3, class: "zz-axis", "text-anchor": "middle"
        }, svg);
        tp.textContent = i;
        var tq = el("text", {
          x: ml - 4, y: cy(i) + 3, class: "zz-axis", "text-anchor": "end"
        }, svg);
        tq.textContent = i;
      }
    }

    var defs = el("defs", {}, svg);
    var pref = "m" + (uid++);
    if (!minimal) ["d", "db"].forEach(function (kind) {
      var m = el("marker", {
        id: pref + "-" + kind, viewBox: "0 0 10 10", refX: 8.6, refY: 5,
        markerWidth: 4.2, markerHeight: 4.2, orient: "auto-start-reverse"
      }, defs);
      el("path", {
        d: "M 0 0 L 10 5 L 0 10 z",
        class: kind === "d" ? "zz-head-d" : "zz-head-db"
      }, m);
    });

    var k = members.length;
    // Scale the dot with the box.  A radius fixed in pixels looks fine at the detail
    // size but crowds the small atlas preview, where the separation between two
    // members' dots is the same fraction of a much smaller box.
    var r = Math.max(1.25, S * (k > 2 ? 0.085 : 0.10));

    members.forEach(function (id, mi) {
      var z = shapeOf(id, zigzags);
      if (!z) return;
      var off = offsetOf(orbit, id, S);
      var ox = off[0], oy = off[1];

      z.arrows.forEach(function (a) {
        var f = z.dots[a.from], t = z.dots[a.to];
        var isDel = a.kind === "del";
        var x1 = cx(f[0]) + ox, y1 = cy(f[1]) + oy;
        var x2 = cx(t[0]) + ox, y2 = cy(t[1]) + oy;
        var dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
        var inset = r + S * 0.05;
        var attrs = {
          x1: x1 + dx * inset, y1: y1 + dy * inset,
          x2: x2 - dx * inset, y2: y2 - dy * inset,
          // In the minimal style del and delbar are told apart by direction alone -
          // horizontal versus vertical - so neither colour nor an arrowhead is needed.
          class: "zz-arrow " + (minimal ? "zz-mono"
                                        : (isDel ? "zz-del" : "zz-delbar"))
        };
        if (!minimal)
          attrs["marker-end"] = "url(#" + pref + "-" + (isDel ? "d" : "db") + ")";
        el("line", attrs, svg);
      });

      z.dots.forEach(function (d) {
        el("circle", {
          cx: cx(d[0]) + ox, cy: cy(d[1]) + oy, r: r,
          class: "zz-dot" + (z.square ? " zz-dot-sq" : "")
        }, svg);
      });
    });

    return svg;
  }

  function orbitLabel(members, zigzags) {
    var z = shapeOf(members[0], zigzags);
    var pos = z.dots.map(function (d) { return "(" + d[0] + "," + d[1] + ")"; });
    return (z.square ? "square" : "zigzag of length " + z.length) +
      " on " + pos.join(", ") +
      (members.length > 1
        ? ", with " + (members.length - 1) + " further summand" +
          (members.length > 2 ? "s" : "") + " in its symmetry orbit"
        : "");
  }

  /* A 4x4 table of numbers indexed by "p,q", q descending down the rows. */
  function pqTable(map, opts) {
    opts = opts || {};
    var t = document.createElement("table");
    t.className = "pq" + (opts.className ? " " + opts.className : "");
    var head = t.createTHead().insertRow();
    head.appendChild(document.createElement("th"));
    for (var p = 0; p <= N3; p++) {
      var th = document.createElement("th");
      th.textContent = "p=" + p;
      head.appendChild(th);
    }
    var body = t.createTBody();
    for (var q = N3; q >= 0; q--) {
      var r = body.insertRow();
      var rh = document.createElement("th");
      rh.textContent = "q=" + q;
      r.appendChild(rh);
      for (var pp = 0; pp <= N3; pp++) {
        var c = r.insertCell();
        var v = map[pp + "," + q];
        v = (v === undefined ? 0 : v);
        c.textContent = v;
        if (v === 0) c.className = "zero";
      }
    }
    return t;
  }

  function rowTable(map, labelFn, opts) {
    opts = opts || {};
    var t = document.createElement("table");
    t.className = "pq row" + (opts.className ? " " + opts.className : "");
    var keys = Object.keys(map).sort(function (a, b) { return Number(a) - Number(b); });
    var head = t.createTHead().insertRow();
    var body = t.createTBody().insertRow();
    keys.forEach(function (k) {
      var th = document.createElement("th");
      th.textContent = labelFn(k);
      head.appendChild(th);
      body.insertCell().textContent = map[k];
    });
    return t;
  }

  ns.orbitSVG = orbitSVG;
  ns.orbitLabel = orbitLabel;
  ns.shapeOf = shapeOf;
  ns.pqTable = pqTable;
  ns.rowTable = rowTable;
  ns.N3 = N3;
})(NIL3UI);

window.NIL3UI = NIL3UI;
