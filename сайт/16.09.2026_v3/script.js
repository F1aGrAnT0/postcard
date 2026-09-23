/* ============================================================
   Промтелеком — логика сайта
   Тарифы хранятся в ОДНОМ массиве (единый источник данных):
   и главная, и каталог рендерятся из него, поэтому цены
   и состав тарифов не могут разойтись.
   Навигация — обычные ссылки между HTML-страницами.
   ============================================================ */

"use strict";

/* ---------- Единый источник данных по тарифам ---------- */
const TARIFFS = [
    {
        id: "start",
        name: "Старт + ТВ",
        speed: 100,
        type: "tv",              // internet | tv | phone (tv = интернет+ТВ, phone = интернет+ТВ+телефон)
        price: 450,
        regular: 600,
        promo: "3 месяца",
        features: ["Интернет 100 Мбит/с", "120+ каналов ТВ", "Wi-Fi роутер"],
        connection: "Бесплатно",
        equipment: "Роутер в рассрочку от 150 ₽/мес",
        audience: "home",
        tag: "Выгодный старт"
    },
    {
        id: "optimal",
        name: "Оптимальный + ТВ",
        speed: 100,
        type: "tv",
        price: 600,
        regular: 600,
        promo: null,
        features: ["Интернет 100 Мбит/с", "130 каналов ТВ", "Wi-Fi роутер"],
        connection: "Бесплатно",
        equipment: "Роутер в рассрочку от 150 ₽/мес",
        audience: "home",
        popular: true
    },
    {
        id: "comfort",
        name: "Комфорт + ТВ и телефон",
        speed: 100,
        type: "phone",
        price: 550,
        regular: 776,
        promo: "3 месяца",
        features: ["Интернет 100 Мбит/с", "130 каналов ТВ", "Городской телефон", "Wi-Fi роутер"],
        connection: "Бесплатно",
        equipment: "Роутер в рассрочку от 150 ₽/мес",
        audience: "home"
    },
    {
        id: "max",
        name: "Максимум",
        speed: 1000,
        type: "internet",
        price: 850,
        regular: 850,
        promo: null,
        features: ["Интернет до 1 Гбит/с", "Безлимитный трафик", "Статический IP", "Premium-роутер"],
        connection: "Бесплатно",
        equipment: "Роутер от 3 900 ₽",
        audience: "home"
    },
    {
        id: "ultra",
        name: "Ультра",
        speed: 1000,
        type: "internet",
        price: 1200,
        regular: 1200,
        promo: null,
        features: ["Симметричный 1 Гбит/с", "Mesh-система Wi-Fi", "Выделенная линия", "Статический IP"],
        connection: "Бесплатно",
        equipment: "Mesh-комплект от 9 900 ₽",
        audience: "home"
    },
    {
        id: "bstart",
        name: "Бизнес-Старт",
        speed: 100,
        type: "internet",
        price: 1500,
        regular: 1500,
        promo: null,
        features: ["Скорость до 100 Мбит/с", "SLA 99,9%", "Статический IP"],
        connection: "По договорённости",
        equipment: "Оборудование по спецификации",
        audience: "business"
    },
    {
        id: "bpro",
        name: "Бизнес-Про",
        speed: 500,
        type: "internet",
        price: 3500,
        regular: 3500,
        promo: null,
        features: ["Скорость до 500 Мбит/с", "SLA 99,95%", "Блок IP-адресов", "Приоритетная поддержка"],
        connection: "По договорённости",
        equipment: "Оборудование по спецификации",
        audience: "business"
    },
    {
        id: "bpremium",
        name: "Бизнес-Премиум",
        speed: 1000,
        type: "internet",
        price: null,             // цена по запросу
        regular: null,
        promo: null,
        features: ["Выделенный канал от 1 Гбит/с", "SLA 99,99%", "Индивидуальное решение", "Персональный менеджер"],
        connection: "Индивидуально",
        equipment: "Оборудование по спецификации",
        audience: "business"
    }
];

/* ---------- Состояние ---------- */
let cmpSet = new Set();     // id тарифов, выбранных для сравнения
let curFilter = "all";
let curSpeed = 0;

/* ---------- Утилиты ---------- */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const fmt = n => (n === null || n === undefined) ? "по запросу" : n.toLocaleString("ru-RU") + " ₽";

function speedLabel(t) {
    return t.speed >= 1000 ? "1 Гбит/с" : t.speed + " Мбит/с";
}

/* ---------- Тема (запоминается между страницами) ---------- */
function th() {
    const v = $("#vp");
    const next = v.getAttribute("data-theme") === "light" ? "dark" : "light";
    v.setAttribute("data-theme", next);
    try { localStorage.setItem("pt-theme", next); } catch (e) {}
}
function tm() { $("#mo").classList.toggle("o"); }
function tc() { $("#cm").classList.toggle("o"); }

/* ---------- Рендер тарифной карточки ---------- */
function cardHTML(t, withCompare) {
    const promo = t.promo
        ? `<div class="tpromo">Промо: ${fmt(t.price)} — ${t.promo}</div>`
        : "";
    const old = (t.regular && t.regular > t.price)
        ? `<div class="told">далее ${fmt(t.regular)}/мес</div>`
        : "";
    const price = t.price === null
        ? `<div class="tp">по запросу</div>`
        : `<div class="tp">${fmt(t.price)} <span>/мес</span></div>`;
    const badge = t.popular ? `<div class="pd">Популярный</div>`
                : t.tag ? `<div class="pd">${t.tag}</div>` : "";
    const cmp = withCompare
        ? `<button class="cmp ${cmpSet.has(t.id) ? "a" : ""}" data-cmp="${t.id}">Сравнить</button>`
        : "";

    return `
    <div class="tc ${t.popular ? "p" : ""}">
        ${badge}
        <div class="tsp">${speedLabel(t)}</div>
        <div class="tn">${t.name}</div>
        ${price}
        ${promo}${old}
        <div class="teq">Подключение: ${t.connection}<br>Оборудование: ${t.equipment}</div>
        <ul class="tl">${t.features.map(f => `<li>${f}</li>`).join("")}</ul>
        <div class="tbtns">
            <button class="btn" data-order="${t.id}">${t.price === null ? "Узнать цену" : "Подключить"}</button>
            ${cmp}
        </div>
    </div>`;
}

/* ---------- Фильтрация ---------- */
function filteredTariffs(audience) {
    return TARIFFS.filter(t => t.audience === audience)
        .filter(t => curFilter === "all" || t.type === curFilter)
        .filter(t => !curSpeed || t.speed <= curSpeed || (curSpeed === 1000 && t.speed >= 1000));
}

function renderTariffs() {
    // Главная: популярные (до 3)
    const elHome = $("#home-tariffs");
    if (elHome) {
        elHome.innerHTML = TARIFFS.filter(t => t.audience === "home").slice(0, 3)
            .map(t => cardHTML(t, true)).join("");
    }

    // Каталог: с фильтрами
    const el = $("#catalog-tariffs");
    if (el) {
        const list = filteredTariffs("home");
        el.innerHTML = list.length
            ? list.map(t => cardHTML(t, true)).join("")
            : `<div class="tempty">По выбранным фильтрам тарифов не найдено. Попробуйте изменить условия.</div>`;
    }

    // Бизнес
    const elB = $("#b2b-tariffs");
    if (elB) {
        elB.innerHTML = TARIFFS.filter(t => t.audience === "business")
            .map(t => cardHTML(t, false)).join("");
    }
}

/* ---------- Сравнение ---------- */
function toggleCompare(id) {
    if (cmpSet.has(id)) {
        cmpSet.delete(id);
    } else {
        if (cmpSet.size >= 3) { alert("Можно сравнить не более 3 тарифов"); return; }
        cmpSet.add(id);
    }
    renderTariffs();
    updateCompareUI();
}

function updateCompareUI() {
    const bar = $("#cbar");
    if (!bar) return;
    $$("[data-cmp]").forEach(b => b.classList.toggle("a", cmpSet.has(b.dataset.cmp)));
    bar.classList.toggle("o", cmpSet.size > 0);
    $("#cbar-count").textContent = cmpSet.size;
}

function openCompare() {
    const list = TARIFFS.filter(t => cmpSet.has(t.id));
    if (!list.length) return;
    const rows = [
        ["Скорость",      t => speedLabel(t)],
        ["Цена",          t => fmt(t.price) + (t.regular && t.regular > t.price ? ` / далее ${fmt(t.regular)}` : "") + (t.price !== null ? " /мес" : "")],
        ["Промо-период",  t => t.promo || "—"],
        ["Подключение",   t => t.connection],
        ["Оборудование",  t => t.equipment],
        ["Включено",      t => t.features.join(", ")]
    ];
    $("#cmp-body").innerHTML = `
        <table class="cmt">
            <tr><th></th>${list.map(t => `<td><b>${t.name}</b></td>`).join("")}</tr>
            ${rows.map(([label, fn]) =>
                `<tr><th>${label}</th>${list.map(t => `<td>${fn(t)}</td>`).join("")}</tr>`
            ).join("")}
        </table>`;
    $("#ov-cmp").classList.add("o");
}

/* ---------- Оформление заявки ---------- */
function openOrder(id) {
    const t = TARIFFS.find(x => x.id === id);
    if (!t) return;
    $("#of-tariff").value = `${t.name} — ${speedLabel(t)}${t.price !== null ? ", " + fmt(t.price) + "/мес" : ""}`;
    $("#of-success").classList.add("hidden");
    $("#of-form").classList.remove("hidden");
    $("#ov-order").classList.add("o");
}

function submitOrder(e) {
    e.preventDefault();
    // Здесь в production — отправка заявки в CRM/биллинг
    $("#of-form").classList.add("hidden");
    $("#of-success").classList.remove("hidden");
}

/* ---------- Проверка адреса ---------- */
function checkAddress(e) {
    e.preventDefault();
    const inp = $("#addr-input");
    const msg = $("#addr-msg");
    const v = inp.value.trim();
    if (v.length < 5) {
        msg.textContent = "Введите улицу и номер дома, например: Ленина, 12";
        msg.classList.remove("ok");
        return;
    }
    // Демо-логика: в production запрос к системе покрытия/биллингу
    const n = TARIFFS.filter(t => t.audience === "home").length;
    msg.textContent = `По адресу «${v}» доступно ${n} тарифов. Подробности ниже ↓`;
    msg.classList.add("ok");
    const target = $("#catalog-tariffs") || $("#home-tariffs");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- Инициализация ---------- */
document.addEventListener("DOMContentLoaded", () => {
    // восстановление темы
    try {
        const saved = localStorage.getItem("pt-theme");
        if (saved) $("#vp").setAttribute("data-theme", saved);
    } catch (e) {}

    renderTariffs();

    // делегирование кликов: заказ / сравнение
    document.addEventListener("click", e => {
        const ord = e.target.closest("[data-order]");
        if (ord) { openOrder(ord.dataset.order); return; }
        const cmp = e.target.closest("[data-cmp]");
        if (cmp) { toggleCompare(cmp.dataset.cmp); }
    });

    // фильтры каталога
    $$(".chip[data-filter]").forEach(ch => ch.addEventListener("click", () => {
        $$(".chip[data-filter]").forEach(c => c.classList.remove("a"));
        ch.classList.add("a");
        curFilter = ch.dataset.filter;
        renderTariffs();
        updateCompareUI();
    }));
    const speedSel = $("#speed-filter");
    if (speedSel) speedSel.addEventListener("change", e => {
        curSpeed = Number(e.target.value);
        renderTariffs();
        updateCompareUI();
    });

    // формы и модалки
    const addrForm = $("#addr-form");
    if (addrForm) addrForm.addEventListener("submit", checkAddress);

    const ofForm = $("#of-form");
    if (ofForm) ofForm.addEventListener("submit", submitOrder);

    const btnOpen = $("#btn-cmp-open");
    if (btnOpen) btnOpen.addEventListener("click", openCompare);
    const btnClear = $("#btn-cmp-clear");
    if (btnClear) btnClear.addEventListener("click", () => { cmpSet.clear(); renderTariffs(); updateCompareUI(); });

    $$(".ov").forEach(ov => ov.addEventListener("click", e => { if (e.target === ov) ov.classList.remove("o"); }));
    $$("[data-close]").forEach(b => b.addEventListener("click", () => b.closest(".ov").classList.remove("o")));
});

/* ============================================================
   ПЛАТЁЖНЫЙ ВЕЕР
   Открытие: клик по "Оплатить" или Enter/Space (это <a role="button">).
   Закрытие: клик вне, Esc, уход мыши с задержкой 150 мс
   (задержка спасает от случайного закрытия, на тач-устройствах
   срабатывает "клик вне" — там mouseleave нет).
   ============================================================ */
const paywrap = document.getElementById("paywrap");
if (paywrap) {
    const payMain = document.getElementById("payMain");
    let hideTimer = null;

    const openFan  = () => { paywrap.classList.add("open");  payMain.setAttribute("aria-expanded", "true"); };
    const closeFan = () => { paywrap.classList.remove("open", "tip"); payMain.setAttribute("aria-expanded", "false"); };

    payMain.addEventListener("click", e => {
        e.preventDefault();           // href="#" — не даём странице прыгнуть наверх
        e.stopPropagation();
        paywrap.classList.contains("open") ? closeFan() : openFan();
    });

    // "?" — переключает облачко, не закрывая веер
    paywrap.querySelector(".pq").addEventListener("click", e => {
        e.stopPropagation();
        paywrap.classList.toggle("tip");
    });
    document.getElementById("ptip").addEventListener("click", e => e.stopPropagation());

    // клик/тап вне — закрыть
    document.addEventListener("pointerdown", e => {
        if (!paywrap.contains(e.target)) closeFan();
    });
    // Esc — закрыть
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeFan();
    });
    // уход мыши + 150 мс — закрыть; возврат мыши — отменить
    paywrap.addEventListener("mouseleave", () => {
        hideTimer = setTimeout(closeFan, 150);
    });
    paywrap.addEventListener("mouseenter", () => clearTimeout(hideTimer));
}
