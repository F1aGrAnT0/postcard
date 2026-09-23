/* ============================================================
   Промтелеком — логика сайта
   Тарифы хранятся в ОДНОМ массиве (единый источник данных):
   и главная, и каталог рендерятся из него, поэтому цены
   и состав тарифов не могут разойтись.
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

/* ---------- SPA-навигация ---------- */
function sp(p) {
    $$(".pc").forEach(e => e.classList.remove("a"));
    const page = $("#p-" + p);
    if (page) page.classList.add("a");
    $$(".nl[data-nav]").forEach(n => n.classList.toggle("a", n.dataset.nav === p));
    window.scrollTo({ top: 0, behavior: "instant" });
}

/* ---------- Тема ---------- */
function th() {
    const v = $("#vp");
    v.setAttribute("data-theme", v.getAttribute("data-theme") === "light" ? "dark" : "light");
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
    const home = TARIFFS.filter(t => t.audience === "home").slice(0, 3);
    $("#home-tariffs").innerHTML = home.map(t => cardHTML(t, true)).join("");

    // Каталог: с фильтрами
    const list = filteredTariffs("home");
    const el = $("#catalog-tariffs");
    el.innerHTML = list.length
        ? list.map(t => cardHTML(t, true)).join("")
        : `<div class="tempty">По выбранным фильтрам тарифов не найдено. Попробуйте изменить условия.</div>`;

    // Бизнес
    $("#b2b-tariffs").innerHTML = TARIFFS.filter(t => t.audience === "business")
        .map(t => cardHTML(t, false)).join("");
}

/* ---------- Сравнение ---------- */
function toggleCompare(id, btn) {
    if (cmpSet.has(id)) {
        cmpSet.delete(id);
    } else {
        if (cmpSet.size >= 3) { alert("Можно сравнить не более 3 тарифов"); return; }
        cmpSet.add(id);
    }
    updateCompareUI();
    renderTariffs();
    // renderTariffs пересоздаёт кнопки — восстанавливаем активное состояние через updateCompareUI после рендера
    updateCompareUI();
}

function updateCompareUI() {
    const bar = $("#cbar");
    $$("[data-cmp]").forEach(b => b.classList.toggle("a", cmpSet.has(b.dataset.cmp)));
    if (cmpSet.size > 0) {
        bar.classList.add("o");
        $("#cbar-count").textContent = cmpSet.size;
    } else {
        bar.classList.remove("o");
    }
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
    const target = $("#p-tariffs").classList.contains("a")
        ? $("#catalog-tariffs")
        : $("#home-tariffs");
    target.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- Инициализация ---------- */
document.addEventListener("DOMContentLoaded", () => {
    renderTariffs();

    // делегирование кликов: заказ / сравнение
    document.addEventListener("click", e => {
        const ord = e.target.closest("[data-order]");
        if (ord) { openOrder(ord.dataset.order); return; }
        const cmp = e.target.closest("[data-cmp]");
        if (cmp) { toggleCompare(cmp.dataset.cmp, cmp); }
    });

    // фильтры каталога
    $$(".chip[data-filter]").forEach(ch => ch.addEventListener("click", () => {
        $$(".chip[data-filter]").forEach(c => c.classList.remove("a"));
        ch.classList.add("a");
        curFilter = ch.dataset.filter;
        renderTariffs();
        updateCompareUI();
    }));
    $("#speed-filter").addEventListener("change", e => {
        curSpeed = Number(e.target.value);
        renderTariffs();
        updateCompareUI();
    });

    // формы и модалки
    $("#addr-form").addEventListener("submit", checkAddress);
    $("#of-form").addEventListener("submit", submitOrder);
    $("#btn-cmp-open").addEventListener("click", openCompare);
    $("#btn-cmp-clear").addEventListener("click", () => { cmpSet.clear(); renderTariffs(); updateCompareUI(); });
    $$(".ov").forEach(ov => ov.addEventListener("click", e => { if (e.target === ov) ov.classList.remove("o"); }));
    $$("[data-close]").forEach(b => b.addEventListener("click", () => b.closest(".ov").classList.remove("o")));
});
