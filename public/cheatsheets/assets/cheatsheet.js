// Renderiza bloques <script type="text/plain" data-lang="ts" data-kind="bad|good"> como <pre><code>,
// para escribir código crudo (con < > &) sin escapar HTML. Además: TOC, copiar, tema, expandir.
(function () {
  const root = document.documentElement;
  try { const t = localStorage.getItem('cs-theme'); if (t) root.dataset.theme = t; } catch (e) {}

  document.querySelectorAll('script[type="text/plain"][data-lang]').forEach((s) => {
    const raw = s.textContent.replace(/^\n/, '').replace(/\s+$/, '');
    const lines = raw.split('\n');
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    const text = lines.map((l) => l.slice(indent)).join('\n');
    const wrap = document.createElement('div');
    wrap.className = 'codewrap' + (s.dataset.kind ? ' ' + s.dataset.kind : '');
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    const map = { ts: 'typescript', js: 'javascript', py: 'python', sh: 'bash', tsx: 'typescript' };
    code.className = 'language-' + (map[s.dataset.lang] || s.dataset.lang);
    code.textContent = text;
    pre.appendChild(code);
    const lang = document.createElement('span'); lang.className = 'lang'; lang.textContent = s.dataset.title || s.dataset.lang;
    const btn = document.createElement('button'); btn.className = 'copy'; btn.textContent = 'copiar';
    btn.onclick = () => { navigator.clipboard.writeText(text).then(() => { btn.textContent = '✓'; setTimeout(() => (btn.textContent = 'copiar'), 1200); }); };
    wrap.append(lang, btn, pre);
    s.replaceWith(wrap);
  });

  const toc = document.querySelector('nav.toc');
  if (toc) {
    document.querySelectorAll('section.card[id]').forEach((sec) => {
      const a = document.createElement('a');
      a.href = '#' + sec.id;
      a.textContent = sec.querySelector('summary').textContent.replace(/P[012]$/, '').trim();
      a.onclick = () => { const d = sec.querySelector('details'); if (d) d.open = true; };
      toc.appendChild(a);
    });
  }

  const header = document.querySelector('header.top');
  if (header) {
    const mk = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; header.appendChild(b); };
    mk('expandir todo', () => document.querySelectorAll('details').forEach((d) => (d.open = true)));
    mk('colapsar', () => document.querySelectorAll('details').forEach((d) => (d.open = false)));
    mk('tema', () => {
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('cs-theme', root.dataset.theme); } catch (e) {}
    });
  }

  if (window.hljs) document.querySelectorAll('pre code').forEach((el) => window.hljs.highlightElement(el));
})();
