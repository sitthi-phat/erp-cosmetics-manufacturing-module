/* Self-contained Markdown -> HTML renderer for the ESSENCE Hub Document Hub.
   No build, no external deps. Renders every <script type="text/markdown" data-target="#id">
   block (verbatim source) into its target element. Rewrites internal .md links to the
   matching .html view so no raw .md links leak into the reading views. */
(function () {
  // map a source .md path/basename to its HTML view (or original source if none)
  function mapLink(u) {
    if (/^https?:|^mailto:|^#/.test(u)) return u;
    var hash = '';
    var hi = u.indexOf('#');
    if (hi >= 0) { hash = u.slice(hi); u = u.slice(0, hi); }
    var base = u.split('/').pop();
    var docPages = {
      'entity-status-map.md': 'entity-status-map.html',
      'status-journeys.md': 'status-journeys.html',
      'deletion-policy.md': 'deletion-policy.html',
      'brief.md': 'brief.html',
      'mock-data-spec.md': 'mock-data-spec.html',
      'mock-data-journeys.md': 'mock-data-journeys.html',
      'po-stage2-review.md': 'po-reviews.html#stage2-review',
      'po-spec-depth-audit.md': 'po-reviews.html#depth-audit',
      'po-mockup-review.md': 'po-reviews.html#mockup-review',
      'po-mockup-review-r4.md': 'po-reviews.html#mockup-review-r4'
    };
    if (docPages[base]) {
      var t = docPages[base];
      return hash && t.indexOf('#') < 0 ? t + hash : t;
    }
    // ADR files -> combined adrs.html with anchor
    var adr = base.match(/^(\d{3})-.*\.md$/);
    if (adr) return 'adrs.html#adr-' + adr[1];
    // other .md (feedback/directives etc.) -> point to the real source under docs/requirements (resolves 200)
    if (/\.md$/.test(base)) {
      if (/\/adr\//.test(u) || /^0\d\d-/.test(base)) return '../../../../../docs/adr/' + base + hash;
      return '../../../../../docs/requirements/erp-v2-ui-first/' + base + hash;
    }
    return u + hash;
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function slug(s) {
    return s.toLowerCase().replace(/[`*]/g, '').replace(/[^\w฀-๿]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, function (m, c) { return '<code>' + c + '</code>'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, t, u) { return '<a href="' + mapLink(u.trim()) + '">' + t + '</a>'; });
    return s;
  }
  function cells(r) {
    r = r.trim().replace(/^\|/, '').replace(/\|$/, '');
    var out = [], cur = '', esc0 = false;
    for (var i = 0; i < r.length; i++) {
      var ch = r[i];
      if (ch === '\\') { cur += r[i + 1] || ''; i++; continue; }
      if (ch === '|') { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map(function (c) { return c.trim(); });
  }
  function render(md) {
    var lines = md.replace(/\r\n/g, '\n').replace(/\t/g, '    ').split('\n');
    var html = [], i = 0;
    function isP(l) {
      return !(/^\s*$/.test(l) || /^(#{1,6})\s/.test(l) || /^\s*[-*+]\s+/.test(l) ||
        /^\s*\d+\.\s+/.test(l) || /^\s*\|.*\|\s*$/.test(l) || /^```/.test(l) ||
        /^\s*>/.test(l) || /^\s*(---|\*\*\*|___)\s*$/.test(l));
    }
    while (i < lines.length) {
      var l = lines[i];
      if (/^```/.test(l)) {
        var buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(esc(lines[i])); i++; }
        i++; html.push('<pre><code>' + buf.join('\n') + '</code></pre>'); continue;
      }
      if (/^\s*(---|\*\*\*|___)\s*$/.test(l)) { html.push('<hr>'); i++; continue; }
      var h = l.match(/^(#{1,6})\s+(.*?)\s*#*$/);
      if (h) { var lv = h[1].length; html.push('<h' + lv + ' id="' + slug(h[2]) + '">' + inline(h[2]) + '</h' + lv + '>'); i++; continue; }
      if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
        var header = l; var rows = []; i += 2;
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++; }
        var th = cells(header).map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('');
        var body = rows.map(function (r) { return '<tr>' + cells(r).map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('');
        html.push('<table><thead><tr>' + th + '</tr></thead><tbody>' + body + '</tbody></table>'); continue;
      }
      if (/^\s*>/.test(l)) {
        var buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        html.push('<blockquote>' + render(buf.join('\n')) + '</blockquote>'); continue;
      }
      if (/^\s*[-*+]\s+/.test(l)) {
        var items = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push(inline(lines[i].replace(/^\s*[-*+]\s+/, ''))); i++; }
        html.push('<ul>' + items.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>'); continue;
      }
      if (/^\s*\d+\.\s+/.test(l)) {
        var items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(inline(lines[i].replace(/^\s*\d+\.\s+/, ''))); i++; }
        html.push('<ol>' + items.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol>'); continue;
      }
      if (/^\s*$/.test(l)) { i++; continue; }
      var pbuf = [l]; i++;
      while (i < lines.length && isP(lines[i])) { pbuf.push(lines[i]); i++; }
      html.push('<p>' + inline(pbuf.join(' ')) + '</p>');
    }
    return html.join('\n');
  }
  function run() {
    var blocks = document.querySelectorAll('script[type="text/markdown"]');
    for (var i = 0; i < blocks.length; i++) {
      var s = blocks[i];
      var tgt = document.querySelector(s.getAttribute('data-target'));
      if (tgt) tgt.innerHTML = render(s.textContent);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
