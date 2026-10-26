(() => {
  "use strict";

  const API_URL = "https://script.google.com/macros/s/AKfycbyjTFxSTI6RoXpgbMYcvHyQvwu-Y9UUcQmD8IroQoiip1A3Ce2VGYNuIVPkZ27ZVxWg/exec?mode=1";
  // const API_URL = "https://script.google.com/macros/s/AKfycbwiMDu1iwIesyr5NFMxkzl52q8gXzQQQ1myAw7dxjI/dev";
  
  const STORAGE_KEY = "localView";

  const $ = (id) => document.getElementById(id);
  const container = $("container");
  // const searchInput = $("search");
  // const brandSelect = $("brand");
  const viewButtons = document.querySelectorAll("[data-view]");

  let products = [];
  let view = loadView();

  /* ---------- helpers ---------- */
  function loadView() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // support the old stored values too
      return saved === "table-view" || saved === "table" ? "table" : "cards";
    } catch { return "cards"; }
  }

  function saveView() {
    try { localStorage.setItem(STORAGE_KEY, view); } catch { /* storage blocked */ }
  }

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

  // const formatNumber = (value) => {
  //   const n = Number(String(value).replace(/[\s,]/g, ""));
  //   return Number.isFinite(n) ? n.toLocaleString("en-US") : String(value ?? "");
  // };

  // const normalize = (text) => String(text ?? "").toLowerCase().trim();

  // function parseRows(rows) {
  //   return (rows || [])
  //     .filter((row) => row && row[3])
  //     .map((row) => ({
  //       brand: String(row[0] ?? "").trim(),
  //       name: [row[1].split("_").join(" "), row[2]].filter(Boolean).join(" ").trim(),
  //       price: formatNumber(row[3]),
  //       first: formatNumber(row[4] ?? ""),
  //       monthly: formatNumber(row[5] ?? "")
  //     }));
  // }

  /* ---------- rendering ---------- */
  function showLoading() {
    container.innerHTML = '<div class="state"><div class="spinner"></div>جارٍ تحميل الأسعار…</div>';
  }

  function showError() {
    container.innerHTML = `
      <div class="state error">
        <p>تعذّر تحميل الأسعار. تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.</p>
        <button type="button" id="retry">إعادة المحاولة</button>
      </div>`;
    $("retry").addEventListener("click", load);
  }

  const money = (v) => (v ? `${escapeHTML(v)}` : "—");

  function cardHTML(p) {
    return `
      <article class="card">
        <span class="brand">${escapeHTML(p.brand)}</span>
        <h2 class="name">${escapeHTML(p.name)}</h2>
        <div class="monthly"><small>كل شهر</small><strong>${money(p.monthly)}</strong></div>
        <dl class="rows">
          <div><dt>السعر</dt><dd>${money(p.price)}</dd></div>
          <div><dt>الدفعة</dt><dd>${money(p.first)}</dd></div>
        </dl>
      </article>`;
  }

  function rowHTML(p) {
    return `
      <tr>
        <td>${escapeHTML(p.brand)}</td>
        <td class="name">${escapeHTML(p.name)}</td>
        <td>${money(p.price)}</td>
        <td>${money(p.first)}</td>
        <td class="monthly-cell">${money(p.monthly)}</td>
      </tr>`;
  }

  // function filtered() {
  //   const q = normalize(searchInput.value);
  //   const c = brandSelect.value;
  //   return products.filter((p) =>
  //     (!c || p.brand === c) &&
  //     (!q || normalize(`${p.brand} ${p.name}`).includes(q))
  //   );
  // }

  function render() {
    // const list = filtered();
    const list = products; // no filtering for now
    // console.table(list);

    if (!list.length) {
      container.innerHTML = '<div class="state">لا توجد نتائج. جرّب اسمًا آخر أو اختر «كل الشركات».</div>';
      return;
    }

    if (view === "cards") {
      container.innerHTML = `<div class="cards">${list.map(cardHTML).join("")}</div>`;
    } else {
      container.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>العلامة</th><th>الاسم</th><th>السعر</th><th>الدفعة</th><th>كل شهر</th></tr>
            </thead>
            <tbody>${list.map(rowHTML).join("")}</tbody>
          </table>
        </div>`;
    }
  }

  function updateToggle() {
    viewButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
  }

  // function fillCompanies() {
  //   const names = [...new Set(products.map((p) => p.brand).filter(Boolean))];
  //   brandSelect.innerHTML =
  //     '<option value="">كل الشركات</option>' +
  //     names.map((n) => `<option value="${escapeHTML(n)}">${escapeHTML(n)}</option>`).join("");
  // }

  /* ---------- data ---------- */
  async function load() {
    showLoading();
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const parsedData = JSON.parse(json);
      products = parsedData.list;

      const dateEl = $("date");
      if (parsedData.date) {
        dateEl.textContent = `آخر تحديث: ${parsedData.date}`;
        dateEl.hidden = false;
      }

      // fillCompanies();
      render();
    } catch (err) {
      console.error(err);
      showError();
    }
  }

  /* ---------- events ---------- */
  viewButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      view = btn.dataset.view;
      saveView();
      updateToggle();
      render();
    })
  );
  // searchInput.addEventListener("input", render);
  // brandSelect.addEventListener("change", render);

  updateToggle();
  load();
})();
