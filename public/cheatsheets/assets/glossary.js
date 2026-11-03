/* Shared glossary: definitions and Python bridges, without changing copyable code. */
(() => {
  const entries = [
    ['Promise', 'Promise<T> · resultado futuro', 'Representa un resultado pendiente, cumplido (resolve) o rechazado (reject). T es el tipo del valor exitoso. Una función async siempre devuelve una Promise.', 'async function getRate(): Promise<number> {\n  return await client.getRate();\n}\nconst rate = await getRate();\n\n// Adaptar una API de callbacks (un resultado):\nfunction readRate(): Promise<number> {\n  return new Promise((resolve, reject) => {\n    readRateCallback((error, rate) => {\n      if (error) reject(error);\n      else resolve(rate);\n    });\n  });\n}', 'Python/FastAPI: async def get_rate() -> float: return await client.get_rate(). Se parece a un awaitable; una coroutine de Python empieza al esperarla o programarla, mientras el ejecutor de new Promise corre inmediatamente.'],
    ['DRY', 'DRY · Don’t Repeat Yourself', 'Una regla de negocio debe tener una fuente de verdad. Extrae el cálculo de comisión repetido; no unas código sólo porque se parece.', 'function commission(cents: number): number {\n  return Math.max(Math.round(cents * 0.005), 5);\n}', 'Python: def commission(cents: int) -> int: ...; ambos casos de uso llaman a la misma función. La política de redondeo se define aparte.'],
    ['SRP', 'SRP · Single Responsibility Principle', 'Una unidad debe tener una razón coherente para cambiar. Separa transporte HTTP, reglas de negocio y persistencia.', '', 'FastAPI: el router valida/recibe el DTO y llama al servicio; el servicio aplica reglas; el repositorio habla con SQLAlchemy. No significa una función por línea.'],
    ['CQS', 'CQS · Command–Query Separation', 'Una query consulta; un command cambia estado. Un get que inserta en la base de datos oculta un efecto secundario. Nombra explícitamente createTransaction.', '', 'Python: get_transaction() consulta; create_transaction() persiste. Un comando puede devolver el recurso creado como decisión práctica de API.'],
    ['KISS', 'KISS · Keep It Simple', 'Elige la solución más clara que cumpla el requisito. Un if legible suele explicar mejor dos casos que un ternario anidado.', '', 'Python: usa if/else si una expresión condicional complica la lectura.'],
    ['DTO|DTOs', 'DTO · Data Transfer Object', 'Describe los datos que cruzan una frontera. El tipo de TypeScript no valida HTTP en runtime; Nest necesita validadores y un ValidationPipe configurado.', '', 'FastAPI: un modelo de entrada de Pydantic (BaseModel) validado por el framework.'],
    ['MVC', 'MVC · Model–View–Controller', 'Separa datos/dominio, presentación y entrada. Ver carpetas controllers/services no demuestra por sí solo MVC; una API Nest también puede tener arquitectura por capas.', '', 'FastAPI: router → servicio → repositorio es una analogía de capas. La respuesta JSON es la representación HTTP.'],
    ['REST', 'REST · recursos sobre HTTP', 'Modela recursos y usa la semántica HTTP. Para este endpoint de creación, 201 y una representación son una buena elección; POST no obliga siempre a devolver un objeto.', '', 'FastAPI: @app.post("/transactions", status_code=201) con response_model. El contrato decide el cuerpo y los errores.'],
    ['subscribe', 'subscribe · escuchar un Observable', 'Registra callbacks y devuelve una Subscription, no el valor emitido. Un return en el callback sólo sale del callback. Un Observable puede emitir cero, uno o varios valores.', 'const rate = await firstValueFrom(\n  client.getRate(currency).pipe(timeout(5000))\n);', 'Python: no hay equivalente directo en FastAPI. Para un resultado usa await; para un flujo, async for. firstValueFrom cierra la suscripción tras el primer valor y rechaza si termina vacío.'],
    ['callback', 'Callback · función pasada a otra función', 'La otra función la invoca cuando corresponde. Devolver un valor desde ella no lo devuelve automáticamente desde la función exterior.', '', 'Python: loop.call_soon(callback). Al adaptar callbacks puedes usar asyncio.Future con set_result / set_exception; normalmente prefieres una API awaitable.'],
    ['async|await', 'async / await · esperar sin bloquear', 'async devuelve una Promise; await espera su resultado y propaga el rechazo como excepción. No vuelve no bloqueante un cálculo pesado ni una API síncrona.', '', 'FastAPI: async def + await. El I/O debe ser asíncrono; trabajo CPU pesado necesita otra estrategia.'],
    ['idempotencia', 'Idempotencia · repetir sin duplicar el efecto', 'Repetir la misma operación lógica conserva el efecto final. Una Idempotency-Key necesita almacenamiento y unicidad atómica; el header solo no evita duplicados.', '', 'FastAPI + Postgres: clave única por cliente/operación, verificar el mismo payload y guardar resultado junto con la mutación en una transacción.'],
    ['encapsulación', 'Encapsulación · ocultar decisiones internas', 'Expón una operación clara y guarda sus detalles detrás del servicio. El consumidor pide una tasa; el servicio decide cómo resolver EUR.', '', 'Python: ExchangeService.get_rate_to_eur(currency) guarda la regla y la integración con el proveedor.'],
    ['efecto secundario', 'Efecto secundario · cambio observable', 'Además de devolver un valor, una función cambia estado: escribe en DB, envía un mensaje o modifica un objeto externo.', '', 'Python: session.add() / commit() tienen efectos. calculate_commission(amount) puede ser pura si sólo calcula y devuelve.'],
    ['any', 'any · desactiva comprobaciones de tipos', 'Permite acceder a cualquier propiedad sin verificación estática. Para datos desconocidos usa unknown y valida antes de utilizarlos.', '', 'Python: typing.Any también evita comprobaciones del analizador. Pydantic valida la entrada en runtime.']
  ];
  const content = document.querySelector('main');
  if (!content) return;
  // Nest lifecycle names overlap with everyday JS/stream terminology.
  const nestOnly = new Set(['provider|providers', 'pipe|pipes', 'guard|guards', 'interceptor|interceptors', 'filter|filters']);
  const isNestSheet = location.pathname.endsWith('/04-nestjs.html');
  entries.push(...window.cheatsheetTerms.filter((entry) => isNestSheet || !nestOnly.has(entry[0])));
  const lookup = new Map();
  entries.forEach((entry) => entry[0].split('|').forEach((alias) => lookup.set(alias.toLowerCase(), entry)));
  lookup.set('promises', entries[0]);
  lookup.set('callbacks', entries[9]);
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const alternatives = [...lookup.keys()].sort((a, b) => b.length - a.length).map(escape);
  const pattern = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + alternatives.join('|') + ')(?![\\p{L}\\p{N}_])', 'giu');
  const present = new Set([...content.textContent.matchAll(pattern)].map((match) => lookup.get(match[0].toLowerCase())));
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement.closest('script, pre, a, button, summary, .hint-guide') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const tip = document.createElement('aside');
  tip.id = 'term-hint'; tip.className = 'term-hint'; tip.hidden = true; tip.setAttribute('role', 'tooltip');
  document.body.append(tip);
  let active; let timer;
  const hide = () => { clearTimeout(timer); tip.hidden = true; active?.removeAttribute('aria-describedby'); active = null; };
  const scheduleHide = () => { timer = setTimeout(hide, 180); };
  const show = (button, entry) => {
    hide(); active = button;
    const title = document.createElement('strong'); title.textContent = entry[1];
    const definition = document.createElement('p'); definition.textContent = entry[2];
    const python = document.createElement('p'); python.textContent = entry[4];
    tip.replaceChildren(title, definition);
    if (entry[3]) { const code = document.createElement('pre'); code.textContent = entry[3]; tip.append(code); }
    tip.append(python); tip.hidden = false; button.setAttribute('aria-describedby', tip.id);
    const rect = button.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - tip.offsetWidth - 8));
    const below = rect.bottom + 8;
    const top = below + tip.offsetHeight <= window.innerHeight - 8 ? below : Math.max(8, rect.top - tip.offsetHeight - 8);
    tip.style.left = `${left}px`; tip.style.top = `${top}px`;
  };
  const makeButton = (label, entry) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'hint-term'; button.textContent = label;
    button.setAttribute('aria-label', `${label}: ver definición y equivalente en Python`);
    button.addEventListener('mouseenter', () => show(button, entry));
    button.addEventListener('mouseleave', scheduleHide);
    button.addEventListener('focus', () => show(button, entry));
    button.addEventListener('blur', hide);
    button.addEventListener('click', () => show(button, entry));
    return button;
  };
  nodes.forEach((node) => {
    const fragment = document.createDocumentFragment(); let cursor = 0;
    for (const match of node.textContent.matchAll(pattern)) {
      fragment.append(node.textContent.slice(cursor, match.index));
      const key = match[0].toLowerCase();
      const button = makeButton(match[0], lookup.get(key));
      fragment.append(button); cursor = match.index + match[0].length;
    }
    fragment.append(node.textContent.slice(cursor)); node.replaceWith(fragment);
  });
  // Terms that appear only in code, headings or links are still discoverable here.
  if (present.size) {
    const glossary = document.createElement('details'); glossary.className = 'page-glossary';
    const summary = document.createElement('summary'); summary.textContent = `Ayuda de conceptos · ${present.size} términos en esta hoja`;
    const guide = document.createElement('p'); guide.textContent = 'Pasa el cursor, usa Tab o toca un término para ver su definición y su equivalente en Python/FastAPI. Esc cierra la ayuda.';
    const chips = document.createElement('div'); chips.className = 'glossary-terms';
    [...present].sort((a, b) => a[1].localeCompare(b[1], 'es')).forEach((entry) => chips.append(makeButton(entry[0].split('|')[0], entry)));
    glossary.append(summary, guide, chips);
    const lead = content.querySelector('.lead');
    if (lead) lead.after(glossary); else content.prepend(glossary);
    content.querySelector('.hint-guide')?.remove();
  }
  tip.addEventListener('mouseenter', () => clearTimeout(timer));
  tip.addEventListener('mouseleave', scheduleHide);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') hide(); });
  document.addEventListener('pointerdown', (event) => { if (!tip.contains(event.target) && !event.target.closest('.hint-term')) hide(); });
  window.addEventListener('resize', hide);
  document.addEventListener('scroll', (event) => { if (!tip.contains(event.target)) hide(); }, true);
})();
