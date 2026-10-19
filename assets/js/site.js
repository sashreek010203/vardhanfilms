/* ==========================================================
   Vardhan Dhaimodkar — site script
   Reads everything from the /content folder and builds the page.
   You never need to edit this file to update content.
   ========================================================== */
(function () {
  "use strict";

  // Order the roles appear in on the Filmography roll.
  var ROLE_ORDER = ["Director", "Editor", "Associate Editor", "Assistant Editor"];
  var CATEGORY_ORDER = ["Feature Film", "Web Series", "Television", "Short Film", "Documentary", "Music Video", "Ad / Brand Film"];
  // Headings used on the Filmography roll (anything not listed is shown as-is).
  var CATEGORY_HEADINGS = {
    "Feature Film": "Feature Films", "Short Film": "Short Films", "Documentary": "Documentaries",
    "Music Video": "Music Videos", "Ad / Brand Film": "Ads, Corporate & Brand Films"
  };

  // ---------- small helpers ----------
  function $(id) { return document.getElementById(id); }
  function str(v) { return v == null ? "" : String(v).trim(); }
  function list(v) { return Array.isArray(v) ? v : (str(v) ? [v] : []); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== "") n.textContent = text;
    return n;
  }
  function isUrl(v) { return /^https?:\/\//i.test(str(v)); }
  function orderBy(order, a, b) {
    var ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  }
  function digits(v) { return str(v).replace(/[^\d+]/g, ""); }
  function storage(fn) { try { return fn(window.sessionStorage); } catch (e) { return null; } }

  function loadJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + " (" + r.status + ")");
      return r.json();
    }).catch(function (err) {
      showError("Could not read " + path + ". If you edited it by hand, check for a missing comma or quote. (" + err.message + ")");
      return {};
    });
  }

  function showError(msg) {
    var box = $("load-error");
    box.hidden = false;
    box.appendChild(el("div", "", msg));
    console.error(msg);
  }

  // ---------- video links ----------
  // Accepts any normal YouTube or Vimeo link and works out how to embed it.
  function parseVideo(url) {
    url = str(url);
    if (!isUrl(url)) return null;
    var m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
    if (m) {
      return {
        type: "youtube",
        embed: "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1&rel=0&modestbranding=1",
        // sharpest first; older videos only have the smaller one
        thumbs: ["https://i.ytimg.com/vi/" + m[1] + "/maxresdefault.jpg", "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg"],
        url: url
      };
    }
    m = url.match(/vimeo\.com\/(?:.*?\/)?(\d{6,})(?:\/([\da-f]{6,}))?/i);
    if (m) {
      return {
        type: "vimeo",
        embed: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1&title=0&byline=0&portrait=0" + (m[2] ? "&h=" + m[2] : ""),
        thumbs: [],
        url: url
      };
    }
    return { type: "link", embed: "", thumbs: [], url: url };
  }

  // ---------- profile ----------
  function renderProfile(p) {
    document.querySelectorAll("[data-bind]").forEach(function (node) {
      var v = str(p[node.getAttribute("data-bind")]);
      if (v) node.textContent = v;
    });
    if (str(p.name)) document.title = str(p.name) + (str(p.title) ? " — " + str(p.title) : "");

    var photo = str(p.portrait);
    if (photo) {
      var css = "url('" + photo.replace(/'/g, "%27") + "')";
      $("hero-image").style.backgroundImage = css;
      $("about-photo").style.backgroundImage = css;
    }

    // Showreel button
    var reel = parseVideo(p.showreel_url);
    var reelBtn = $("play-reel");
    if (reel) {
      reelBtn.hidden = false;
      reelBtn.addEventListener("click", function () {
        openVideo(reel, "Showreel", str(p.showreel_password) ? "Password: " + str(p.showreel_password) : "");
      });
    }

    // Bio — blank line between paragraphs
    var bio = $("bio");
    str(p.bio).split(/\n\s*\n/).forEach(function (para) {
      if (str(para)) bio.appendChild(el("p", "", str(para)));
    });

    if (str(p.quote)) {
      var q = $("quote");
      q.hidden = false;
      q.appendChild(el("span", "", "“" + str(p.quote).replace(/^["“]|["”]$/g, "") + "”"));
      if (str(p.quote_by)) q.appendChild(el("cite", "", "— " + str(p.quote_by)));
    }

    var edu = $("education");
    list(p.education).forEach(function (e) {
      if (!e || !str(e.institution)) return;
      var li = el("li");
      li.appendChild(el("strong", "", str(e.institution) + (str(e.place) ? ", " + str(e.place) : "")));
      li.appendChild(el("span", "", str(e.qualification)));
      edu.appendChild(li);
    });

    [["software", "software"], ["languages", "languages"]].forEach(function (pair) {
      var ul = $(pair[1]);
      list(p[pair[0]]).forEach(function (s) { if (str(s)) ul.appendChild(el("li", "", str(s))); });
    });

    var hl = $("highlights");
    list(p.highlights).forEach(function (h) {
      if (!h || (!str(h.title) && !str(h.text))) return;
      var card = el("div", "highlight reveal");
      card.appendChild(el("h4", "", str(h.title)));
      card.appendChild(el("p", "", str(h.text)));
      hl.appendChild(card);
    });
    if (!hl.children.length) hl.hidden = true;

    var houses = list(p.production_houses).map(str).filter(Boolean);
    if (houses.length) {
      $("houses-wrap").hidden = false;
      var track = $("houses");
      // two copies so the scroll loops seamlessly
      houses.concat(houses).forEach(function (h) { track.appendChild(el("span", "", h)); });
    }

    // Contact
    var links = $("contact-links");
    function contact(label, text, href) {
      if (!str(text)) return;
      var a = el("a", "contact-link");
      a.href = href;
      if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
      a.appendChild(el("small", "", label));
      a.appendChild(el("span", "", text));
      links.appendChild(a);
    }
    contact("Email", p.email, "mailto:" + str(p.email));
    contact("WhatsApp", p.whatsapp, "https://wa.me/" + digits(p.whatsapp).replace(/^\+/, ""));
    contact("Call", p.phone, "tel:" + digits(p.phone));
    contact("Call", p.phone_2, "tel:" + digits(p.phone_2));

    var social = $("social");
    [["IMDb", p.imdb], ["Instagram", p.instagram], ["Facebook", p.facebook], ["LinkedIn", p.linkedin], ["YouTube", p.youtube], ["Download CV", p.cv_file]]
      .forEach(function (s) {
        if (!str(s[1])) return;
        var a = el("a", "", s[0]);
        a.href = str(s[1]);
        a.target = "_blank";
        a.rel = "noopener";
        social.appendChild(a);
      });
  }

  // ---------- work grid ----------
  function renderWork(data) {
    var projects = list(data.projects).filter(function (p) { return p && str(p.title); });
    var watchable = projects.filter(function (p) { return parseVideo(p.video_link); });
    // featured first, keep the order otherwise
    watchable.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });

    var grid = $("reel-grid");
    var filtersBox = $("filters");

    function card(p, i) {
      var video = parseVideo(p.video_link);
      var b = el("button", "reel reveal" + (p.featured ? " featured" : ""));
      b.type = "button";
      b.setAttribute("aria-label", "Play " + str(p.title));

      var frame = el("div", "reel-frame");
      var thumbs = (str(p.thumbnail) ? [str(p.thumbnail)] : []).concat(video.thumbs);
      var titleCard = function () { frame.insertBefore(el("div", "reel-titlecard", str(p.title)), frame.firstChild); };
      if (thumbs.length) {
        var img = el("img");
        img.alt = "";
        img.loading = "lazy";
        var next = function () {
          if (!thumbs.length) { img.remove(); titleCard(); return; }
          img.src = thumbs.shift();
        };
        img.onerror = next;
        // YouTube serves a tiny grey placeholder when a size or video is missing
        img.onload = function () { if (img.naturalWidth <= 120) next(); };
        frame.appendChild(img);
        next();
      } else {
        titleCard();
      }
      var play = el("span", "reel-play");
      play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
      frame.appendChild(play);
      b.appendChild(frame);

      var meta = el("div", "reel-meta");
      var left = el("div");
      left.appendChild(el("h3", "reel-title", str(p.title)));
      left.appendChild(el("div", "reel-sub", [list(p.roles).join(" · "), str(p.category), str(p.year)].filter(Boolean).join("  /  ")));
      meta.appendChild(left);
      meta.appendChild(el("span", "reel-num", "SC " + String(i + 1).padStart(2, "0")));
      b.appendChild(meta);

      b.addEventListener("click", function () {
        openVideo(video, str(p.title), [list(p.roles).join(" · "), str(p.category)].filter(Boolean).join(" — "));
      });
      return b;
    }

    function show(filter) {
      grid.innerHTML = "";
      var items = watchable.filter(function (p) {
        if (filter === "All") return true;
        return list(p.roles).indexOf(filter) >= 0 || str(p.category) === filter;
      });
      items.forEach(function (p, i) { grid.appendChild(card(p, i)); });
      if (!items.length) grid.appendChild(el("p", "empty-note", "Nothing here yet."));
      observeReveals();
    }

    // Build filter buttons from whatever roles/categories exist
    var roles = [], cats = [];
    watchable.forEach(function (p) {
      list(p.roles).forEach(function (r) { if (str(r) && roles.indexOf(r) < 0) roles.push(r); });
      if (str(p.category) && cats.indexOf(p.category) < 0) cats.push(p.category);
    });
    roles.sort(orderBy.bind(null, ROLE_ORDER));
    cats.sort(orderBy.bind(null, CATEGORY_ORDER));
    ["All"].concat(roles, cats).forEach(function (f, i) {
      var btn = el("button", "filter", f === "Ad / Brand Film" ? "Ads & Brand" : f);
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
      btn.addEventListener("click", function () {
        filtersBox.querySelectorAll(".filter").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
        btn.setAttribute("aria-selected", "true");
        show(f);
      });
      filtersBox.appendChild(btn);
    });
    if (roles.length + cats.length < 2) filtersBox.hidden = true;
    show("All");

    renderCredits(projects);
  }

  // ---------- credits roll ----------
  function renderCredits(projects) {
    var box = $("credits-list");
    var byRole = {};
    projects.forEach(function (p) {
      list(p.roles).forEach(function (r) {
        r = str(r);
        if (!r) return;
        (byRole[r] = byRole[r] || []).push(p);
      });
    });
    var roleLabels = { "Director": "Directed", "Editor": "Edited", "Associate Editor": "Associate Editor", "Assistant Editor": "Assistant Editor" };

    Object.keys(byRole).sort(orderBy.bind(null, ROLE_ORDER)).forEach(function (role) {
      var g = el("div", "credit-group reveal");
      g.appendChild(el("h3", "credit-role", roleLabels[role] || role));
      var byCat = {};
      byRole[role].forEach(function (p) { var c = str(p.category) || "Other"; (byCat[c] = byCat[c] || []).push(p); });
      Object.keys(byCat).sort(orderBy.bind(null, CATEGORY_ORDER)).forEach(function (cat) {
        g.appendChild(el("p", "credit-cat", CATEGORY_HEADINGS[cat] || cat));
        byCat[cat].forEach(function (p) {
          var row = el("div", "credit-row");
          var t = el("div", "credit-title");
          var video = parseVideo(p.video_link);
          if (video) {
            var a = el("a", "", str(p.title));
            a.href = video.url;
            a.addEventListener("click", function (e) { if (video.embed) { e.preventDefault(); openVideo(video, str(p.title), cat); } });
            if (!video.embed) { a.target = "_blank"; a.rel = "noopener"; }
            t.appendChild(a);
          } else {
            t.textContent = str(p.title);
          }
          var d = el("div", "credit-detail", [str(p.note), str(p.year)].filter(Boolean).join(" · "));
          if (/progress/i.test(str(p.status))) d.appendChild(el("span", "badge", "In post"));
          row.appendChild(t);
          row.appendChild(d);
          g.appendChild(row);
        });
      });
      box.appendChild(g);
    });
  }

  // ---------- laurels ----------
  function laurelSVG() {
    // One branch drawn along an oval, then mirrored for the other side.
    var cx = 130, cy = 92, rx = 86, ry = 72, leaves = "";
    function pt(deg) { var a = deg * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a), Math.cos(a), Math.sin(a)]; }
    function leaf(x, y, w, h, rot) {
      return '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + w.toFixed(1) + '" ry="' + h + '" transform="rotate(' + rot.toFixed(0) + " " + x.toFixed(1) + " " + y.toFixed(1) + ')"/>';
    }
    for (var i = 0; i < 10; i++) {
      var deg = 112 + i * 14, p = pt(deg), size = 11.5 - i * 0.45;
      leaves += leaf(p[0] + p[2] * 7, p[1] + p[3] * 7, size, 3.8, deg + 90 - 34);
      leaves += leaf(p[0] - p[2] * 5, p[1] - p[3] * 5, size * 0.8, 3.2, deg + 90 + 34);
    }
    var a = pt(106), b = pt(246);
    var stem = '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M' + a[0].toFixed(1) + " " + a[1].toFixed(1) +
      " A" + rx + " " + ry + " 0 0 1 " + b[0].toFixed(1) + " " + b[1].toFixed(1) + '"/>';
    var branch = '<g fill="currentColor">' + stem + leaves + "</g>";
    return '<svg viewBox="0 0 260 180" aria-hidden="true">' + branch + '<g transform="translate(260 0) scale(-1 1)">' + branch + "</g></svg>";
  }

  function renderAwards(data) {
    var grid = $("laurel-grid");
    var svg = laurelSVG();
    var awards = list(data.awards).filter(function (a) { return a && str(a.festival); });
    awards.forEach(function (a) {
      var selection = /selection|nominat/i.test(str(a.result));
      var item = el("div", "laurel reveal" + (selection ? " selection" : ""));
      item.innerHTML = svg;
      var t = el("div", "laurel-text");
      t.appendChild(el("div", "laurel-result", str(a.result)));
      t.appendChild(el("div", "laurel-fest", str(a.festival)));
      if (str(a.year)) t.appendChild(el("div", "laurel-year", str(a.year)));
      if (str(a.film)) t.appendChild(el("div", "laurel-film", str(a.film)));
      item.appendChild(t);
      grid.appendChild(item);
    });
    if (!awards.length) $("laurels").hidden = true;
  }

  // ---------- video popup ----------
  var lastFocus = null;
  function openVideo(video, title, caption) {
    if (!video) return;
    if (!video.embed) { window.open(video.url, "_blank", "noopener"); return; }
    lastFocus = document.activeElement;
    var frame = $("lightbox-frame");
    frame.innerHTML = "";
    var iframe = document.createElement("iframe");
    iframe.src = video.embed;
    iframe.title = title || "Video";
    iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
    var cap = $("lightbox-caption");
    cap.innerHTML = "";
    cap.appendChild(el("strong", "", title));
    var right = el("span", "", caption || "");
    var ext = el("a", "", " Open on " + (video.type === "vimeo" ? "Vimeo" : "YouTube") + " ↗");
    ext.href = video.url; ext.target = "_blank"; ext.rel = "noopener";
    right.appendChild(document.createTextNode("  "));
    right.appendChild(ext);
    cap.appendChild(right);
    $("lightbox").hidden = false;
    document.body.style.overflow = "hidden";
    $("lightbox-close").focus();
  }
  function closeVideo() {
    $("lightbox").hidden = true;
    $("lightbox-frame").innerHTML = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  $("lightbox-close").addEventListener("click", closeVideo);
  $("lightbox").addEventListener("click", function (e) { if (e.target === this) closeVideo(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("lightbox").hidden) closeVideo(); });

  // ---------- page chrome ----------
  var nav = $("nav");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  $("nav-toggle").addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    this.setAttribute("aria-expanded", open);
  });
  $("nav-links").addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("open"); $("nav-toggle").setAttribute("aria-expanded", "false"); }
  });

  $("year").textContent = new Date().getFullYear();

  // Running timecode in the viewfinder (24 fps)
  var start = Date.now(), tc = $("timecode");
  function pad(n) { return String(n).padStart(2, "0"); }
  setInterval(function () {
    var ms = Date.now() - start, s = Math.floor(ms / 1000);
    tc.textContent = pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(Math.floor((ms % 1000) / 1000 * 24));
  }, 42);

  // Fade sections in as they scroll into view
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  function observeReveals() {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (n) { io ? io.observe(n) : n.classList.add("in"); });
  }

  // Countdown leader: once per visit, skipped for reduced motion
  function runLeader(done) {
    var leader = $("leader");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || storage(function (s) { return s.getItem("leaderSeen"); })) { leader.remove(); return done(); }
    storage(function (s) { s.setItem("leaderSeen", "1"); });
    var n = 3, num = $("leader-num");
    var finish = function () { clearInterval(timer); leader.classList.add("done"); setTimeout(function () { leader.remove(); }, 600); done(); };
    var timer = setInterval(function () { n--; if (n <= 0) finish(); else num.textContent = n; }, 550);
    leader.addEventListener("click", finish, { once: true });
  }

  // ---------- go ----------
  Promise.all([
    loadJSON("content/profile.json"),
    loadJSON("content/work.json"),
    loadJSON("content/awards.json")
  ]).then(function (res) {
    [[renderProfile, res[0]], [renderWork, res[1]], [renderAwards, res[2]]].forEach(function (job) {
      try { job[0](job[1] || {}); } catch (e) { showError("Something in the content could not be shown: " + e.message); }
    });
    observeReveals();
    // Content arrives after the page opens, so re-jump to #section links once it's in place
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  });

  runLeader(function () { document.body.classList.add("ready"); });
})();
