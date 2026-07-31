/* Fetch-based Markdown -> HTML renderer for the Per-Module Requirement review view.
   No build, no external deps. Each page has <div id="content" data-src="....md">.
   We fetch the .md (single source of truth = docs/requirements/.../modules/*.md) and render.
   If fetch is blocked (opened via file://), show a graceful note + direct link.
   Serve over HTTP (as the docs-site does) for full rendering. */
(function () {
  function mapLink(u) {
    if (/^https?:|^mailto:|^#/.test(u)) return u;
    var hash = ''; var hi = u.indexOf('#');
    if (hi >= 0) { hash = u.slice(hi); u = u.slice(0, hi); }
    var base = u.split('/').pop();
    // sibling module docs -> their html view in this folder
    var mods = {
      'README.md': 'index.html', 'permission-matrix.md': 'permission-matrix.html',
      'customer.md': 'customer.html', 'quotation.md': 'quotation.html', 'po.md': 'po.html',
      'so.md': 'so.html', 'stock.md': 'stock.html', 'bom.md': 'bom.html',
      'production.md': 'production.html', 'supply-planning.md': 'supply-planning.html',
      'oem-flow.md': 'oem-flow.html', 'ownbrand-flow.md': 'ownbrand-flow.html',
      'dashboard.md': 'dashboard.html',
      'goods-receipt.md': 'goods-receipt.html', 'pr.md': 'pr.html',
      'supplier.md': 'supplier.html', 'qc.md': 'qc.html', 'shipping.md': 'shipping.html',
      'delivery-note.md': 'delivery-note.html',
      'return.md': 'return.html', 'invoice.md': 'invoice.html',
      'traceability.md': 'traceability.html', 'settings.md': 'settings.html',
      'platform.md': 'platform.html', 'non-functional.md': 'non-functional.html',
      'deletion-policy.md': 'deletion-policy.html',
      'comment-convention.md': 'comment-convention.html',
      'numbering-on-save.md': 'numbering-on-save.html',
      'po-output-quality-audit.md': 'po-output-quality-audit.html'
    };
    if (mods[base] && !/requirements\//.test(u)) return mods[base] + hash;
    // PO principle docs already published as hub views
    // (deletion-policy folded into module view above; root deletion-policy.md remains historical at ../docs/deletion-policy.html)
    var hubDocs = {
      'entity-status-map.md': '../docs/entity-status-map.html',
      'status-journeys.md': '../docs/status-journeys.html',
      'brief.md': '../docs/brief.html',
      'mock-data-spec.md': '../docs/mock-data-spec.html'
    };
    if (hubDocs[base]) return hubDocs[base] + hash;
    // other requirement .md -> raw source under docs/requirements (resolves over HTTP)
    if (/\.md$/.test(base)) return '../../../../requirements/erp-v2-ui-first/' + base + hash;
    return u + hash;
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function slug(s) { return s.toLowerCase().replace(/[`*]/g, '').replace(/[^\w฀-๿]+/g, '-').replace(/^-+|-+$/g, ''); }
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
    var out = [], cur = '';
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
    var el = document.getElementById('content');
    if (!el) return;
    var src = el.getAttribute('data-src');
    if (!src) return;
    fetch(src).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (md) { el.innerHTML = render(md); })
      .catch(function () {
        el.innerHTML = '<div class="srcnote">⚠ ไม่สามารถโหลดเอกสารได้ (อาจเปิดผ่าน file://). ' +
          'กรุณาเปิดผ่าน HTTP (docs-site) หรือดูต้นฉบับโดยตรง: ' +
          '<a href="' + src + '"><code>' + src + '</code></a></div>';
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
