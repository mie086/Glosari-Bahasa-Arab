const SUPABASE_URL = "https://ejivaczazdimurhtlmsj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaXZhY3phemRpbXVyaHRsbXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzEzMjAsImV4cCI6MjA5NDgwNzMyMH0._pjuat4uPjujjRiZyj1331vySeMXPGU_SGpzdfkfSSg";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// KESELAMATAN FRONTEND: Sanitization & Escaping
// ============================================================================
const SAFE_HTML_CONFIG = {
    ALLOWED_TAGS: [
        "b", "strong", "i", "em", "u", "span", "br", "ul", "ol", "li",
        "mark", "div", "table", "thead", "tbody", "tr", "th", "td"
    ],
    ALLOWED_ATTR: ["class", "data-key", "data-sorof", "data-nahu", "data-nombor", "title", "style"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button", "svg", "math"],
    FORBID_ATTR: [
        "id", "name", "href", "src", "srcset", "action", "formaction", "target",
        "onerror", "onload", "onclick", "onmouseover", "onfocus", "onmouseenter"
    ],
    ALLOW_DATA_ATTR: false
};

if (typeof DOMPurify === "undefined") {
    throw new Error("DOMPurify gagal dimuat. Aplikasi dihentikan untuk mengelakkan rendering HTML tidak selamat.");
}

DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (data.attrName === "style") {
        const value = String(data.attrValue || "").trim();
        const isSafeColor = node.nodeName === "SPAN" &&
            /^color\s*:\s*(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\))$/i.test(value);
        if (!isSafeColor) {
            data.keepAttr = false;
        } else {
            data.attrValue = value;
        }
    }
});

const ESCAPED_RICH_TAG_RE = /&lt;\s*\/?\s*(?:b|strong|i|em|u|span|br|ul|ol|li|mark|div|table|thead|tbody|tr|th|td)\b[^&]*?&gt;/i;

function decodeEscapedRichHtml(value) {
    let result = String(value ?? "");
    for (let i = 0; i < 2 && ESCAPED_RICH_TAG_RE.test(result); i++) {
        const decoded = result
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/&quot;/gi, '"')
            .replace(/&#0*39;/gi, "'")
            .replace(/&#x0*27;/gi, "'")
            .replace(/&amp;/gi, "&");
        if (decoded === result) break;
        result = decoded;
    }
    return result;
}

function sanitizeHtml(html) {
    return DOMPurify.sanitize(decodeEscapedRichHtml(html), SAFE_HTML_CONFIG);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
    return escapeHtml(value);
}

function sanitizeEditorHtml(html) {
    return sanitizeHtml(html);
}

// ============================================================================
// PEMBOLEHUBAH GLOBAL & STATE
// ============================================================================
let dataIstilah = [];
let dataAyat = [];
let dataKuiz = [];
let currentSearch = "";
let selectedSearchItem = null;
let selectedAyatItem = null;
let lastFocusedTableInput = null;

// State: Mod Hafalan (Flashcards)
let hafalanDeck = [];
let hafalanIndex = 0;
let hafalanFlipped = false;
let hafalanMasteredIds = new Set();

// State: Latihan Kuiz Awam
let activeQuizList = [];
let currentQuizIdx = 0;
let currentQuizScore = 0;
let quizAnswered = false;
let selectedPadananKiri = null;
let matchedPadananCount = 0;

// DOM Elements: Navigasi & Carian
const navButtons = document.querySelectorAll(".nav-btn");
const viewSections = document.querySelectorAll(".view-section");
const btnFloatingSearch = document.getElementById("btnFloatingSearch");
const searchInput = document.getElementById("searchInput");
const suggestionsList = document.getElementById("suggestionsList");
const resultsList = document.getElementById("resultsList");
const alphabeticalDirectory = document.getElementById("alphabeticalDirectory");
const searchAyatInput = document.getElementById("searchAyatInput");
const suggestionsAyatList = document.getElementById("suggestionsAyatList");
const resultsAyatList = document.getElementById("resultsAyatList");

// DOM Elements: Mod Hafalan
const hafalanSumber = document.getElementById("hafalanSumber");
const hafalanKategori = document.getElementById("hafalanKategori");
const hafalanKategoriGroup = document.getElementById("hafalanKategoriGroup");
const hafalanArahAyat = document.getElementById("hafalanArahAyat");
const hafalanArahGroup = document.getElementById("hafalanArahGroup");
const btnRawakHafalan = document.getElementById("btnRawakHafalan");
const btnResetHafalan = document.getElementById("btnResetHafalan");
const hafalanCounterText = document.getElementById("hafalanCounterText");
const hafalanMasteredCount = document.getElementById("hafalanMasteredCount");
const hafalanProgressFill = document.getElementById("hafalanProgressFill");
const flashcardArea = document.getElementById("flashcardArea");

// DOM Elements: Kuiz Awam
const filterKategoriKuizAwam = document.getElementById("filterKategoriKuizAwam");
const filterJenisKuizAwam = document.getElementById("filterJenisKuizAwam");
const btnMulaKuizAwam = document.getElementById("btnMulaKuizAwam");
const publicQuizContainer = document.getElementById("publicQuizContainer");

// DOM Elements: Admin Auth & Dashboard
const adminAuthBox = document.getElementById("adminAuthBox");
const adminDashboardBox = document.getElementById("adminDashboardBox");
const loginForm = document.getElementById("loginForm");
const btnLogKeluar = document.getElementById("btnLogKeluar");

// DOM Elements: Admin Pengurusan Istilah
const adminTableBody = document.getElementById("adminTableBody");
const formSection = document.getElementById("formSection");
const termForm = document.getElementById("termForm");
const btnBukaBorang = document.getElementById("btnBukaBorang");
const btnBatal = document.getElementById("btnBatal");
const formTitle = document.getElementById("formTitle");
const ciriSectionsContainer = document.getElementById("ciriSectionsContainer");
const btnTambahCiri = document.getElementById("btnTambahCiri");
const adminSearchInput = document.getElementById("adminSearchInput");
const inputId = document.getElementById("termId");
const inputTitleMs = document.getElementById("titleMs");
const inputTitleAr = document.getElementById("titleAr");
const inputDisiplin = document.getElementById("disiplinIlmu");
const inputKeywords = document.getElementById("keywords");
const inputDefinition = document.getElementById("definition");

// DOM Elements: Admin Pengurusan Ayat
const formAyatSection = document.getElementById("formAyatSection");
const ayatForm = document.getElementById("ayatForm");
const btnBukaBorangAyat = document.getElementById("btnBukaBorangAyat");
const btnBatalAyat = document.getElementById("btnBatalAyat");
const formAyatTitle = document.getElementById("formAyatTitle");
const btnTabJadualIstilah = document.getElementById("btnTabJadualIstilah");
const btnTabJadualAyat = document.getElementById("btnTabJadualAyat");
const jadualIstilahWrapper = document.getElementById("jadualIstilahWrapper");
const jadualAyatWrapper = document.getElementById("jadualAyatWrapper");
const adminSearchAyatInput = document.getElementById("adminSearchAyatInput");
const adminTableAyatBody = document.getElementById("adminTableAyatBody");
const inputAyatId = document.getElementById("ayatId");
const ayatArEditor = document.getElementById("ayatArEditor");
const terjemahanMsEditor = document.getElementById("terjemahanMsEditor");
const inputKataKunciAyat = document.getElementById("kataKunciAyat");

// DOM Elements: Admin Kuiz
const formKuizSection = document.getElementById("formKuizSection");
const kuizForm = document.getElementById("kuizForm");
const btnBukaBorangKuiz = document.getElementById("btnBukaBorangKuiz");
const btnBatalKuiz = document.getElementById("btnBatalKuiz");
const formKuizTitle = document.getElementById("formKuizTitle");
const kuizIdInput = document.getElementById("kuizId");
const kuizTajukInput = document.getElementById("kuizTajuk");
const kuizKategoriInput = document.getElementById("kuizKategori");
const kuizJenisInput = document.getElementById("kuizJenis");
const kuizPeneranganInput = document.getElementById("kuizPenerangan");
const dynamicQuizBuilderBox = document.getElementById("dynamicQuizBuilderBox");
const btnTabJadualKuiz = document.getElementById("btnTabJadualKuiz");
const jadualKuizWrapper = document.getElementById("jadualKuizWrapper");
const adminSearchKuizInput = document.getElementById("adminSearchKuizInput");
const adminTableKuizBody = document.getElementById("adminTableKuizBody");

// ============================================================================
// LOGIK NAVIGASI
// ============================================================================
navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(btn => btn.classList.remove("active"));
        viewSections.forEach(sec => sec.classList.remove("active"));
        button.classList.add("active");
        
        const targetSection = button.getAttribute("data-target");
        const targetEl = document.getElementById(targetSection);
        if (targetEl) targetEl.classList.add("active");
        
        if (btnFloatingSearch) {
            btnFloatingSearch.style.display = (targetSection === "sectionCarian" || targetSection === "sectionAyat") ? "flex" : "none";
        }
        
        if (targetSection === "sectionAdmin") {
            closeForm();
            closeFormAyat();
            closeFormKuiz();
        } else if (targetSection === "sectionHafalan") {
            initHafalanDeck();
        } else if (targetSection === "sectionKuiz") {
            if (activeQuizList.length === 0) initPublicQuiz();
        }
    });
});

if (btnFloatingSearch) {
    btnFloatingSearch.addEventListener("click", () => {
        const isAyatTab = document.getElementById("sectionAyat")?.classList.contains("active");
        const targetInput = isAyatTab ? searchAyatInput : searchInput;
        if (targetInput) {
            targetInput.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => {
                targetInput.focus();
                targetInput.select();
            }, 400);
        }
    });
}

// ============================================================================
// MUAT DATA & DATALIST
// ============================================================================
async function loadDataFromSupabase() {
    const resIstilah = await supabaseClient
        .from("istilah_arab")
        .select("*")
        .order("title_ms", { ascending: true });
    if (resIstilah.error) console.error("Ralat istilah:", resIstilah.error.message);
    else dataIstilah = resIstilah.data || [];

    const resAyat = await supabaseClient.from("koleksi_ayat").select("*");
    if (resAyat.error) console.error("Ralat ayat:", resAyat.error.message);
    else dataAyat = resAyat.data || [];

    const resKuiz = await supabaseClient
        .from("koleksi_kuiz")
        .select("*")
        .order("created_at", { ascending: false });
    if (resKuiz.error) console.error("Ralat kuiz:", resKuiz.error.message);
    else dataKuiz = resKuiz.data || [];

    renderAdminList();
    renderAdminAyatList();
    renderAdminKuizList();
    renderAlphabeticalDirectory();
    kemaskiniSenaraiDatalist();
    initHafalanDeck();
    initPublicQuiz();
}

function kemaskiniSenaraiDatalist() {
    const listSorof = document.getElementById("senaraiSorof");
    const listNahu = document.getElementById("senaraiNahu");
    const listNombor = document.getElementById("senaraiNombor");

    if (!listSorof || !listNahu) return;

    listSorof.innerHTML = "";
    listNahu.innerHTML = "";
    if (listNombor) listNombor.innerHTML = "";

    dataIstilah.forEach(item => {
        if (item.title_ms) {
            const istilahVal = escapeAttr(item.title_ms.trim().toLowerCase());
            const option = `<option value="${istilahVal}"></option>`;

            if (item.disiplin_ilmu === "sorof") listSorof.innerHTML += option;
            else if (item.disiplin_ilmu === "nahu") listNahu.innerHTML += option;
            else if (item.disiplin_ilmu === "nombor" && listNombor) listNombor.innerHTML += option;
            else {
                listSorof.innerHTML += option;
                listNahu.innerHTML += option;
                if (listNombor) listNombor.innerHTML += option;
            }
        }
    });
}

function stripHtml(html) {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = sanitizeHtml(html);
    return tmp.textContent || tmp.innerText || "";
}

function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// ============================================================================
// MODUL 1: MOD HAFALAN (FLASHCARDS)
// ============================================================================
function initHafalanDeck(shouldShuffle = false) {
    if (!hafalanSumber || !flashcardArea) return;
    const sumber = hafalanSumber.value;
    const kategori = hafalanKategori ? hafalanKategori.value : "semua";
    const arahAyat = hafalanArahAyat ? hafalanArahAyat.value : "ar_ke_ms";

    // Kawal paparan dropdown mengikut Sumber Hafalan
    if (hafalanKategoriGroup) {
        hafalanKategoriGroup.style.display = sumber === "istilah" ? "block" : "none";
    }
    if (hafalanArahGroup) {
        hafalanArahGroup.style.display = sumber === "ayat" ? "block" : "none";
    }

    let rawList = [];
    if (sumber === "istilah") {
        rawList = dataIstilah
            .filter(item => kategori === "semua" || item.disiplin_ilmu === kategori)
            .map(item => ({
                id: "istilah-" + item.id,
                frontSub: item.disiplin_ilmu ? item.disiplin_ilmu.toUpperCase() : "ISTILAH",
                frontMainAr: item.title_ar || "",
                frontMainMs: item.title_ms || "",
                backTitle: "Definisi & Penerangan",
                backContentHtml: item.definition
                    ? sanitizeHtml(item.definition).replace(/\n/g, "<br>")
                    : "<i>Tiada definisi.</i>"
            }));
    } else {
        rawList = dataAyat.map(item => {
            const notaKataKunci = item.kata_kunci
                ? `<div style="margin-top: 12px; font-size: 0.8rem; color: var(--accent-color);">🏷️ Kata Kunci: ${escapeHtml(item.kata_kunci)}</div>`
                : "";

            // Pilihan 1: Teka daripada Bahasa Melayu -> Bahasa Arab
            if (arahAyat === "ms_ke_ar") {
                return {
                    id: "ayat-" + item.id,
                    frontSub: "TERJEMAHAN MELAYU ➔ ARAB",
                    frontMainAr: "",
                    frontMainMs: stripHtml(item.terjemahan_ms),
                    backTitle: "Ayat Bahasa Arab",
                    backContentHtml:
                        `<div style="font-family: var(--font-arabic); font-size: 2.1rem; color: var(--accent-color); direction: rtl; line-height: 1.8;">${sanitizeHtml(item.ayat_ar)}</div>` +
                        notaKataKunci
                };
            }

            // Pilihan 2 (Default): Teka daripada Bahasa Arab -> Bahasa Melayu
            return {
                id: "ayat-" + item.id,
                frontSub: "AYAT ARAB ➔ MELAYU",
                frontMainAr: stripHtml(item.ayat_ar),
                frontMainMs: "",
                backTitle: "Terjemahan Bahasa Melayu",
                backContentHtml:
                    `<div style="font-size: 1.15rem; font-weight: 600; color: var(--primary-color);">${sanitizeHtml(item.terjemahan_ms)}</div>` +
                    notaKataKunci
            };
        });
    }

    hafalanDeck = shouldShuffle ? shuffleArray(rawList) : rawList;
    hafalanIndex = 0;
    hafalanFlipped = false;
    renderFlashcard();
}

function renderFlashcard() {
    if (!flashcardArea) return;
    const total = hafalanDeck.length;
    const masteredInDeck = hafalanDeck.filter(c => hafalanMasteredIds.has(c.id)).length;

    if (hafalanCounterText) {
        hafalanCounterText.textContent = total > 0 ? `Kad ${hafalanIndex + 1} daripada ${total}` : "Tiada Kad";
    }
    if (hafalanMasteredCount) {
        hafalanMasteredCount.textContent = `${masteredInDeck} / ${total}`;
    }
    if (hafalanProgressFill) {
        const pct = total > 0 ? Math.round((masteredInDeck / total) * 100) : 0;
        hafalanProgressFill.style.width = `${pct}%`;
    }

    if (total === 0) {
        flashcardArea.innerHTML = `<div class="welcome-message">Tiada kad hafalan ditemui untuk pilihan ini.</div>`;
        return;
    }

    const currentCard = hafalanDeck[hafalanIndex];
    const isMastered = hafalanMasteredIds.has(currentCard.id);

    flashcardArea.innerHTML = `
        <div class="flashcard-Scene" id="flashcardInteractive">
            <div class="flashcard-inner ${hafalanFlipped ? "is-flipped" : ""}">
                <div class="flashcard-face flashcard-front">
                    <div class="flashcard-top-meta">
                        <span class="badge">${escapeHtml(currentCard.frontSub)}</span>
                        ${isMastered
                            ? '<span class="badge" style="background:#d1fae5; color:#047857;">✔ Sudah Hafal</span>'
                            : '<span class="badge" style="background:#fef3c7; color:#b45309;">Belum Dihafal</span>'}
                    </div>
                    <div class="flashcard-center-content">
                        ${currentCard.frontMainAr ? `<div class="flashcard-arabic">${escapeHtml(currentCard.frontMainAr)}</div>` : ""}
                        ${currentCard.frontMainMs ? `<div class="flashcard-ms">${escapeHtml(currentCard.frontMainMs)}</div>` : ""}
                    </div>
                    <div class="flashcard-hint">👆 Klik kad untuk lihat jawapan / maksud</div>
                </div>

                <div class="flashcard-face flashcard-back">
                    <div class="flashcard-top-meta">
                        <span class="badge" style="background:#e0f2fe; color:#0369a1;">${escapeHtml(currentCard.backTitle)}</span>
                        ${isMastered ? '<span class="badge" style="background:#d1fae5; color:#047857;">✔ Sudah Hafal</span>' : ""}
                    </div>
                    <div class="flashcard-center-content">
                        <div class="flashcard-back-text">${currentCard.backContentHtml}</div>
                    </div>
                    <div class="flashcard-hint">👆 Klik kad untuk kembali ke hadapan</div>
                </div>
            </div>
        </div>

        <div class="flashcard-actions">
            <button type="button" class="btn btn-secondary" id="btnPrevCard" ${hafalanIndex === 0 ? 'disabled style="opacity:0.5;"' : ""}>⬅ Sebelum</button>
            <button type="button" class="btn ${isMastered ? "btn-danger" : "btn-success"}" id="btnToggleMastered">
                ${isMastered ? "↺ Tandakan Belum Hafal" : "✔ Tandakan Sudah Hafal"}
            </button>
            <button type="button" class="btn btn-primary" id="btnNextCard" ${hafalanIndex === total - 1 ? 'disabled style="opacity:0.5;"' : ""}>Seterusnya ➡</button>
        </div>
    `;

    const cardEl = document.getElementById("flashcardInteractive");
    if (cardEl) {
        cardEl.addEventListener("click", () => {
            hafalanFlipped = !hafalanFlipped;
            const inner = cardEl.querySelector(".flashcard-inner");
            if (inner) inner.classList.toggle("is-flipped", hafalanFlipped);
        });
    }

    const btnPrev = document.getElementById("btnPrevCard");
    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            if (hafalanIndex > 0) {
                hafalanIndex--;
                hafalanFlipped = false;
                renderFlashcard();
            }
        });
    }

    const btnNext = document.getElementById("btnNextCard");
    if (btnNext) {
        btnNext.addEventListener("click", () => {
            if (hafalanIndex < total - 1) {
                hafalanIndex++;
                hafalanFlipped = false;
                renderFlashcard();
            }
        });
    }

    const btnToggle = document.getElementById("btnToggleMastered");
    if (btnToggle) {
        btnToggle.addEventListener("click", () => {
            if (hafalanMasteredIds.has(currentCard.id)) {
                hafalanMasteredIds.delete(currentCard.id);
            } else {
                hafalanMasteredIds.add(currentCard.id);
                if (hafalanIndex < total - 1) {
                    hafalanIndex++;
                    hafalanFlipped = false;
                }
            }
            renderFlashcard();
        });
    }
}

if (hafalanSumber) hafalanSumber.addEventListener("change", () => initHafalanDeck(false));
if (hafalanKategori) hafalanKategori.addEventListener("change", () => initHafalanDeck(false));
if (hafalanArahAyat) hafalanArahAyat.addEventListener("change", () => initHafalanDeck(false));
if (btnRawakHafalan) btnRawakHafalan.addEventListener("click", () => initHafalanDeck(true));
if (btnResetHafalan) {
    btnResetHafalan.addEventListener("click", () => {
        hafalanMasteredIds.clear();
        initHafalanDeck(false);
    });
}

// ============================================================================
// MODUL 2: LATIHAN KUIZ AWAM (PELAJAR)
// ============================================================================
function initPublicQuiz() {
    if (!publicQuizContainer) return;
    const kat = filterKategoriKuizAwam ? filterKategoriKuizAwam.value : "semua";
    const jenis = filterJenisKuizAwam ? filterJenisKuizAwam.value : "semua";

    const filtered = dataKuiz.filter(q => {
        const matchKat = (kat === "semua") || (q.kategori === kat);
        const matchJenis = (jenis === "semua") || (q.jenis_soalan === jenis);
        return matchKat && matchJenis;
    });

    activeQuizList = shuffleArray(filtered);
    currentQuizIdx = 0;
    currentQuizScore = 0;
    quizAnswered = false;
    renderCurrentPublicQuestion();
}

function renderCurrentPublicQuestion() {
    if (!publicQuizContainer) return;

    if (activeQuizList.length === 0) {
        publicQuizContainer.innerHTML = `<div class="welcome-message">Tiada soalan kuiz bagi kategori/format ini buat masa sekarang.</div>`;
        return;
    }

    if (currentQuizIdx >= activeQuizList.length) {
        const total = activeQuizList.length;
        const peratus = Math.round((currentQuizScore / total) * 100);
        publicQuizContainer.innerHTML = `
            <div class="card" style="text-align: center; padding: 32px 20px;">
                <h2 style="color: var(--primary-color); margin-bottom: 8px;">🎉 Tamat Latihan Kuiz!</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Berikut adalah keputusan pencapaian anda:</p>
                <div style="font-size: 3rem; font-weight: 800; color: #8b5cf6; margin-bottom: 12px;">
                    ${currentQuizScore} / ${total} <span style="font-size: 1.5rem;">(${peratus}%)</span>
                </div>
                <button type="button" class="btn btn-primary" id="btnCubaLagiKuiz" style="margin-top: 16px;">🔄 Cuba Sekali Lagi</button>
            </div>
        `;
        const btnRetry = document.getElementById("btnCubaLagiKuiz");
        if (btnRetry) btnRetry.addEventListener("click", initPublicQuiz);
        return;
    }

    const q = activeQuizList[currentQuizIdx];
    quizAnswered = false;
    selectedPadananKiri = null;
    matchedPadananCount = 0;

    let katLabel = "Sorof";
    if (q.kategori === "nahu") katLabel = "Nahu";
    else if (q.kategori === "nombor") katLabel = "Penomboran ('Adad)";

    let bodyHtml = "";
    const d = q.data_soalan || {};

    if (q.jenis_soalan === "pilihan") {
        const opts = Array.isArray(d.options) ? d.options : [];
        bodyHtml = `<div class="quiz-options-grid">` +
            opts.map((opt, idx) => `<button type="button" class="quiz-opt-btn" data-idx="${idx}">${escapeHtml(opt)}</button>`).join("") +
            `</div>`;
    } else if (q.jenis_soalan === "betul_salah") {
        bodyHtml = `
            <div class="quiz-options-grid">
                <button type="button" class="quiz-opt-btn" data-bool="true">✅ Betul / Benar</button>
                <button type="button" class="quiz-opt-btn" data-bool="false">❌ Salah / Palsu</button>
            </div>
        `;
    } else if (q.jenis_soalan === "isi_kosong") {
        const hintHtml = d.petunjuk
            ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">💡 <strong>Petunjuk:</strong> ${escapeHtml(d.petunjuk)}</div>`
            : "";
        bodyHtml = `
            ${hintHtml}
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <input type="text" id="inputJawapanPelajar" class="form-control" placeholder="Taip jawapan anda di sini..." autocomplete="off" style="flex: 1;">
                <button type="button" class="btn btn-primary" id="btnSemakIsiKosong">Semak Jawapan</button>
            </div>
        `;
    } else if (q.jenis_soalan === "padanan") {
        const pasangan = Array.isArray(d.pasangan) ? d.pasangan : [];
        const kiriList = shuffleArray(pasangan.map((p, i) => ({ text: p.kiri, pairId: i })));
        const kananList = shuffleArray(pasangan.map((p, i) => ({ text: p.kanan, pairId: i })));

        bodyHtml = `
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Sila klik item di sebelah kiri, kemudian klik pasangannya yang betul di sebelah kanan:</div>
            <div class="padanan-interactive-grid">
                <div class="padanan-col" id="colPadananKiri">
                    ${kiriList.map(k => `<button type="button" class="padanan-item-btn" data-side="kiri" data-pair="${k.pairId}">${escapeHtml(k.text)}</button>`).join("")}
                </div>
                <div class="padanan-col" id="colPadananKanan">
                    ${kananList.map(k => `<button type="button" class="padanan-item-btn" data-side="kanan" data-pair="${k.pairId}">${escapeHtml(k.text)}</button>`).join("")}
                </div>
            </div>
        `;
    }

    publicQuizContainer.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                <span style="font-weight: 700; color: var(--text-muted); font-size: 0.9rem;">Soalan ${currentQuizIdx + 1} / ${activeQuizList.length}</span>
                <div style="display: flex; gap: 6px;">
                    <span class="badge">${escapeHtml(katLabel)}</span>
                    <span class="badge" style="background: #ede9fe; color: #6d28d9;">Skor Semasa: ${currentQuizScore}</span>
                </div>
            </div>

            <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 20px; line-height: 1.6;">
                ${escapeHtml(q.tajuk_soalan)}
            </div>

            ${bodyHtml}

            <div id="quizFeedbackBox" style="display: none; margin-top: 20px; padding: 16px; border-radius: 8px;"></div>

            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-primary" id="btnSoalanSeterusnya" style="display: none;">
                    ${currentQuizIdx + 1 < activeQuizList.length ? "Soalan Seterusnya ➡" : "Lihat Keputusan 🏁"}
                </button>
            </div>
        </div>
    `;

    bindQuizQuestionEvents(q);
}

function showQuizFeedback(isCorrect, q, extraMsg = "") {
    quizAnswered = true;
    if (isCorrect) currentQuizScore++;

    const fb = document.getElementById("quizFeedbackBox");
    const btnNext = document.getElementById("btnSoalanSeterusnya");
    if (fb) {
        fb.style.display = "block";
        fb.style.backgroundColor = isCorrect ? "#d1fae5" : "#fee2e2";
        fb.style.border = isCorrect ? "1px solid #6ee7b7" : "1px solid #fca5a5";
        fb.style.color = isCorrect ? "#065f46" : "#991b1b";

        const notaHtml = q.penerangan
            ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.15); font-size: 0.9rem;">📌 <strong>Nota Penerangan:</strong><br>${escapeHtml(q.penerangan)}</div>`
            : "";
        fb.innerHTML = `<strong>${isCorrect ? "✔ Tahniah! Jawapan anda tepat." : "❌ Kurang tepat."}</strong> ${extraMsg} ${notaHtml}`;
    }
    if (btnNext) {
        btnNext.style.display = "inline-flex";
        btnNext.addEventListener("click", () => {
            currentQuizIdx++;
            renderCurrentPublicQuestion();
        });
    }
}

function bindQuizQuestionEvents(q) {
    const d = q.data_soalan || {};

    if (q.jenis_soalan === "pilihan") {
        const btns = publicQuizContainer.querySelectorAll(".quiz-opt-btn");
        btns.forEach(btn => {
            btn.addEventListener("click", () => {
                if (quizAnswered) return;
                const chosen = parseInt(btn.getAttribute("data-idx"), 10);
                const correctIdx = parseInt(d.jawapan_betul ?? 0, 10);
                const isCorrect = (chosen === correctIdx);

                btns.forEach((b, i) => {
                    b.disabled = true;
                    if (i === correctIdx) b.classList.add("opt-correct");
                    else if (i === chosen && !isCorrect) b.classList.add("opt-wrong");
                });
                showQuizFeedback(isCorrect, q);
            });
        });
    } else if (q.jenis_soalan === "betul_salah") {
        const btns = publicQuizContainer.querySelectorAll(".quiz-opt-btn");
        btns.forEach(btn => {
            btn.addEventListener("click", () => {
                if (quizAnswered) return;
                const chosen = btn.getAttribute("data-bool") === "true";
                const correctBool = Boolean(d.jawapan_betul);
                const isCorrect = (chosen === correctBool);

                btns.forEach(b => {
                    b.disabled = true;
                    const bVal = b.getAttribute("data-bool") === "true";
                    if (bVal === correctBool) b.classList.add("opt-correct");
                    else if (bVal === chosen && !isCorrect) b.classList.add("opt-wrong");
                });
                showQuizFeedback(isCorrect, q);
            });
        });
    } else if (q.jenis_soalan === "isi_kosong") {
        const inp = document.getElementById("inputJawapanPelajar");
        const btnSemak = document.getElementById("btnSemakIsiKosong");

        const semakFn = () => {
            if (quizAnswered || !inp) return;
            const userVal = inp.value.trim().toLowerCase();
            if (!userVal) return;

            const accepted = Array.isArray(d.jawapan_betul)
                ? d.jawapan_betul.map(a => String(a).trim().toLowerCase())
                : [String(d.jawapan_betul || "").trim().toLowerCase()];

            const isCorrect = accepted.includes(userVal);
            inp.disabled = true;
            if (btnSemak) btnSemak.disabled = true;

            const skemaText = Array.isArray(d.jawapan_betul) ? d.jawapan_betul.join(" / ") : d.jawapan_betul;
            const extra = !isCorrect ? `<br>Jawapan sebenar: <strong>${escapeHtml(skemaText)}</strong>` : "";
            showQuizFeedback(isCorrect, q, extra);
        };

        if (btnSemak) btnSemak.addEventListener("click", semakFn);
        if (inp) {
            inp.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    semakFn();
                }
            });
        }
    } else if (q.jenis_soalan === "padanan") {
        const totalPairs = Array.isArray(d.pasangan) ? d.pasangan.length : 0;
        let hadMistake = false;

        const leftBtns = publicQuizContainer.querySelectorAll("#colPadananKiri .padanan-item-btn");
        const rightBtns = publicQuizContainer.querySelectorAll("#colPadananKanan .padanan-item-btn");

        leftBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                if (quizAnswered || btn.classList.contains("matched")) return;
                leftBtns.forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                selectedPadananKiri = btn;
            });
        });

        rightBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                if (quizAnswered || btn.classList.contains("matched") || !selectedPadananKiri) return;
                const leftPair = selectedPadananKiri.getAttribute("data-pair");
                const rightPair = btn.getAttribute("data-pair");

                if (leftPair === rightPair) {
                    selectedPadananKiri.classList.remove("selected");
                    selectedPadananKiri.classList.add("matched");
                    btn.classList.add("matched");
                    selectedPadananKiri.disabled = true;
                    btn.disabled = true;
                    selectedPadananKiri = null;
                    matchedPadananCount++;

                    if (matchedPadananCount === totalPairs) {
                        showQuizFeedback(!hadMistake, q, hadMistake ? "(Terdapat cubaan padanan yang salah sebentar tadi)" : "");
                    }
                } else {
                    hadMistake = true;
                    btn.classList.add("wrong-shake");
                    setTimeout(() => btn.classList.remove("wrong-shake"), 500);
                }
            });
        });
    }
}

if (btnMulaKuizAwam) btnMulaKuizAwam.addEventListener("click", initPublicQuiz);
if (filterKategoriKuizAwam) filterKategoriKuizAwam.addEventListener("change", initPublicQuiz);
if (filterJenisKuizAwam) filterJenisKuizAwam.addEventListener("change", initPublicQuiz);

// ============================================================================
// PANEL ADMIN: KAWALAN PAPARAN JADUAL
// ============================================================================
function resetTabJadual() {
    [jadualIstilahWrapper, jadualAyatWrapper, jadualKuizWrapper].forEach(w => {
        if (w) w.style.display = "none";
    });
    [btnTabJadualIstilah, btnTabJadualAyat, btnTabJadualKuiz].forEach(b => {
        if (b) {
            b.classList.replace("btn-primary", "btn-secondary");
            b.style.backgroundColor = "var(--border-color)";
            b.style.color = "var(--text-color)";
        }
    });
}

if (btnTabJadualIstilah) {
    btnTabJadualIstilah.addEventListener("click", () => {
        resetTabJadual();
        jadualIstilahWrapper.style.display = "block";
        btnTabJadualIstilah.classList.replace("btn-secondary", "btn-primary");
        btnTabJadualIstilah.style.backgroundColor = "";
        btnTabJadualIstilah.style.color = "";
    });
}

if (btnTabJadualAyat) {
    btnTabJadualAyat.addEventListener("click", () => {
        resetTabJadual();
        jadualAyatWrapper.style.display = "block";
        btnTabJadualAyat.classList.replace("btn-secondary", "btn-primary");
        btnTabJadualAyat.style.backgroundColor = "";
        btnTabJadualAyat.style.color = "";
    });
}

if (btnTabJadualKuiz) {
    btnTabJadualKuiz.addEventListener("click", () => {
        resetTabJadual();
        jadualKuizWrapper.style.display = "block";
        btnTabJadualKuiz.classList.replace("btn-secondary", "btn-primary");
        btnTabJadualKuiz.style.backgroundColor = "#8b5cf6";
        btnTabJadualKuiz.style.color = "#ffffff";
    });
}

// ============================================================================
// PANEL ADMIN: PENGURUSAN KUIZ
// ============================================================================
function renderQuizInputFields(jenis, dataLama = null) {
    if (!dynamicQuizBuilderBox) return;
    dynamicQuizBuilderBox.innerHTML = "";

    if (jenis === "pilihan") {
        const opts = dataLama?.options || ["", "", "", ""];
        const correctIdx = dataLama?.jawapan_betul ?? 0;

        let html = `
            <div style="font-weight: 600; margin-bottom: 10px; color: var(--primary-color);">Pilihan Jawapan (Tanda pada radio jawapan yang betul):</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
        `;
        opts.forEach((opt, idx) => {
            html += `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="radio" name="pilihanJawapanBetul" value="${idx}" ${idx === correctIdx ? "checked" : ""} style="width: 20px; height: 20px;">
                    <input type="text" class="form-control opt-input" placeholder="Pilihan ${idx + 1}" value="${escapeAttr(opt)}" required>
                </div>
            `;
        });
        html += `</div>`;
        dynamicQuizBuilderBox.innerHTML = html;
    } else if (jenis === "betul_salah") {
        const isTrue = dataLama?.jawapan_betul !== false;
        dynamicQuizBuilderBox.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 10px; color: var(--primary-color);">Tentukan Penyataan Ini:</div>
            <div style="display: flex; gap: 24px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="radio" name="jawapanBetulSalah" value="true" ${isTrue ? "checked" : ""}> Betul / Benar
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="radio" name="jawapanBetulSalah" value="false" ${!isTrue ? "checked" : ""}> Salah / Palsu
                </label>
            </div>
        `;
    } else if (jenis === "isi_kosong") {
        const jawapanStr = Array.isArray(dataLama?.jawapan_betul)
            ? dataLama.jawapan_betul.join(", ")
            : (dataLama?.jawapan_betul || "");
        const petunjuk = dataLama?.petunjuk || "";

        dynamicQuizBuilderBox.innerHTML = `
            <div class="form-group" style="margin-bottom: 12px;">
                <label style="font-weight: 600;">Jawapan Tepat yang Diterima (Gunakan koma jika ada variasi ejaan)</label>
                <input type="text" id="jawapanIsiKosong" class="form-control" placeholder="cth: كَتَبَ, kataba" value="${escapeAttr(jawapanStr)}" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Petunjuk / Hint (Pilihan)</label>
                <input type="text" id="petunjukIsiKosong" class="form-control" placeholder="cth: Kata kerja madhi 3 huruf" value="${escapeAttr(petunjuk)}">
            </div>
        `;
    } else if (jenis === "padanan") {
        const pasangan = dataLama?.pasangan || [
            { kiri: "", kanan: "" },
            { kiri: "", kanan: "" }
        ];

        let html = `
            <div style="font-weight: 600; margin-bottom: 6px; color: var(--primary-color);">Pasangan Padanan (Kiri Padan dengan Kanan):</div>
            <div id="padananContainer" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
        `;
        pasangan.forEach(p => {
            html += `
                <div class="padanan-row" style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" class="form-control padanan-kiri" placeholder="Sebelah Kiri (cth: مُفْرَد)" value="${escapeAttr(p.kiri)}" required>
                    <span>↔</span>
                    <input type="text" class="form-control padanan-kanan" placeholder="Sebelah Kanan (cth: Tunggal)" value="${escapeAttr(p.kanan)}" required>
                    <button type="button" class="btn btn-danger btn-remove-padanan" style="padding: 4px 8px;">X</button>
                </div>
            `;
        });
        html += `
            </div>
            <button type="button" class="btn btn-primary" id="btnTambahBarisPadanan" style="padding: 4px 10px; font-size: 0.8rem;">+ Tambah Pasangan</button>
        `;
        dynamicQuizBuilderBox.innerHTML = html;

        const btnAddPadanan = dynamicQuizBuilderBox.querySelector("#btnTambahBarisPadanan");
        if (btnAddPadanan) {
            btnAddPadanan.addEventListener("click", () => {
                const c = dynamicQuizBuilderBox.querySelector("#padananContainer");
                const div = document.createElement("div");
                div.className = "padanan-row";
                div.style = "display: flex; gap: 8px; align-items: center;";
                div.innerHTML = `
                    <input type="text" class="form-control padanan-kiri" placeholder="Sebelah Kiri" required>
                    <span>↔</span>
                    <input type="text" class="form-control padanan-kanan" placeholder="Sebelah Kanan" required>
                    <button type="button" class="btn btn-danger btn-remove-padanan" style="padding: 4px 8px;">X</button>
                `;
                div.querySelector(".btn-remove-padanan").addEventListener("click", () => div.remove());
                c.appendChild(div);
            });
        }

        dynamicQuizBuilderBox.querySelectorAll(".btn-remove-padanan").forEach(btn => {
            btn.addEventListener("click", (e) => e.target.closest(".padanan-row").remove());
        });
    }
}

if (kuizJenisInput) {
    kuizJenisInput.addEventListener("change", (e) => {
        renderQuizInputFields(e.target.value);
    });
}

if (btnBukaBorangKuiz) {
    btnBukaBorangKuiz.addEventListener("click", () => {
        closeForm();
        closeFormAyat();
        kuizForm.reset();
        kuizIdInput.value = "";
        formKuizTitle.textContent = "Tambah Soalan Kuiz Baru";
        renderQuizInputFields(kuizJenisInput.value);
        formKuizSection.classList.add("active");
        formKuizSection.scrollIntoView({ behavior: "smooth" });
    });
}

if (btnBatalKuiz) btnBatalKuiz.addEventListener("click", closeFormKuiz);

function closeFormKuiz() {
    if (!formKuizSection) return;
    formKuizSection.classList.remove("active");
    if (kuizForm) kuizForm.reset();
    if (kuizIdInput) kuizIdInput.value = "";
    if (dynamicQuizBuilderBox) dynamicQuizBuilderBox.innerHTML = "";
}

if (kuizForm) {
    kuizForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const jenis = kuizJenisInput.value;
        let dataSoalanJson = {};

        if (jenis === "pilihan") {
            const optionInputs = dynamicQuizBuilderBox.querySelectorAll(".opt-input");
            const options = Array.from(optionInputs).map(inp => inp.value.trim());
            const selectedRadio = dynamicQuizBuilderBox.querySelector("input[name='pilihanJawapanBetul']:checked");
            const correctIdx = selectedRadio ? parseInt(selectedRadio.value, 10) : 0;

            dataSoalanJson = { options: options, jawapan_betul: correctIdx };
        } else if (jenis === "betul_salah") {
            const selectedRadio = dynamicQuizBuilderBox.querySelector("input[name='jawapanBetulSalah']:checked");
            dataSoalanJson = { jawapan_betul: selectedRadio ? selectedRadio.value === "true" : true };
        } else if (jenis === "isi_kosong") {
            const rawAnswers = dynamicQuizBuilderBox.querySelector("#jawapanIsiKosong").value;
            const petunjuk = dynamicQuizBuilderBox.querySelector("#petunjukIsiKosong").value.trim();
            const answersList = rawAnswers.split(",").map(a => a.trim()).filter(a => a);

            dataSoalanJson = { jawapan_betul: answersList, petunjuk: petunjuk };
        } else if (jenis === "padanan") {
            const rows = dynamicQuizBuilderBox.querySelectorAll(".padanan-row");
            const pasanganList = [];
            rows.forEach(r => {
                const k = r.querySelector(".padanan-kiri").value.trim();
                const kn = r.querySelector(".padanan-kanan").value.trim();
                if (k && kn) pasanganList.push({ kiri: k, kanan: kn });
            });

            if (pasanganList.length < 2) {
                alert("Sila masukkan sekurang-kurangnya 2 pasangan padanan.");
                return;
            }
            dataSoalanJson = { pasangan: pasanganList };
        }

        const payload = {
            tajuk_soalan: kuizTajukInput.value.trim(),
            jenis_soalan: jenis,
            kategori: kuizKategoriInput.value,
            data_soalan: dataSoalanJson,
            penerangan: kuizPeneranganInput.value.trim()
        };

        if (kuizIdInput.value) {
            payload.id = kuizIdInput.value;
        }

        const { error } = await supabaseClient.from("koleksi_kuiz").upsert([payload]);

        if (error) {
            alert("Ralat Keselamatan RLS / Sistem: " + error.message);
        } else {
            closeFormKuiz();
            await loadDataFromSupabase();
        }
    });
}

function renderAdminKuizList(filterText = "") {
    if (!adminTableKuizBody) return;
    adminTableKuizBody.innerHTML = "";
    const lowerFilter = filterText.toLowerCase();

    const filtered = dataKuiz.filter(item => {
        return (item.tajuk_soalan || "").toLowerCase().includes(lowerFilter) ||
               (item.jenis_soalan || "").toLowerCase().includes(lowerFilter) ||
               (item.kategori || "").toLowerCase().includes(lowerFilter);
    });

    if (filtered.length === 0) {
        adminTableKuizBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: var(--text-muted);">Tiada soalan kuiz dijumpai.</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement("tr");

        let formatText = "Aneka Pilihan";
        if (item.jenis_soalan === "betul_salah") formatText = "Betul/Salah";
        else if (item.jenis_soalan === "isi_kosong") formatText = "Isi Kosong";
        else if (item.jenis_soalan === "padanan") formatText = "Padanan";

        let katText = "Sorof";
        if (item.kategori === "nahu") katText = "Nahu";
        else if (item.kategori === "nombor") katText = "Penomboran";

        tr.innerHTML = `
            <td><strong>${escapeHtml(item.tajuk_soalan)}</strong></td>
            <td><span class="badge" style="background:#e0e7ff; color:#4338ca;">${escapeHtml(formatText)}</span></td>
            <td><span class="badge">${escapeHtml(katText)}</span></td>
            <td>
                <div class="actions-cell" style="display:flex; gap:6px;">
                    <button class="btn btn-edit" type="button" data-action="edit-kuiz" data-id="${escapeAttr(item.id)}">Ubah</button>
                    <button class="btn btn-danger" type="button" data-action="delete-kuiz" data-id="${escapeAttr(item.id)}">Padam</button>
                </div>
            </td>
        `;
        adminTableKuizBody.appendChild(tr);
    });
}

if (adminSearchKuizInput) {
    adminSearchKuizInput.addEventListener("input", (e) => {
        renderAdminKuizList(e.target.value.trim());
    });
}

function editKuiz(id) {
    const item = dataKuiz.find(q => String(q.id) === String(id));
    if (!item) return;

    closeForm();
    closeFormAyat();

    formKuizTitle.textContent = "Ubah Soalan Kuiz";
    kuizIdInput.value = item.id;
    kuizTajukInput.value = item.tajuk_soalan;
    kuizKategoriInput.value = item.kategori;
    kuizJenisInput.value = item.jenis_soalan;
    kuizPeneranganInput.value = item.penerangan || "";

    renderQuizInputFields(item.jenis_soalan, item.data_soalan);

    formKuizSection.classList.add("active");
    formKuizSection.scrollIntoView({ behavior: "smooth" });
}

async function deleteKuiz(id) {
    if (confirm("Adakah anda pasti mahu memadam soalan kuiz ini?")) {
        const { error } = await supabaseClient.from("koleksi_kuiz").delete().eq("id", id);
        if (error) alert("Ralat Keselamatan RLS: " + error.message);
        else await loadDataFromSupabase();
    }
}

// ============================================================================
// PAPARAN AWAM: KOLEKSI AYAT
// ============================================================================
function handleSearchAyatInput(e) {
    const val = e.target.value.trim().toLowerCase();
    if (val.length < 3) {
        selectedAyatItem = null;
        suggestionsAyatList.style.display = "none";
        renderSearchAyatCard();
        return;
    }

    const matches = dataAyat.filter(item => {
        const plainAr = stripHtml(item.ayat_ar).toLowerCase();
        const plainMs = stripHtml(item.terjemahan_ms).toLowerCase();
        return (item.kata_kunci && item.kata_kunci.toLowerCase().includes(val)) ||
               plainAr.includes(val) ||
               plainMs.includes(val);
    });

    matches.sort((a, b) => {
        const aMs = stripHtml(a.terjemahan_ms).toLowerCase();
        const bMs = stripHtml(b.terjemahan_ms).toLowerCase();
        if (aMs.startsWith(val) && !bMs.startsWith(val)) return -1;
        if (!aMs.startsWith(val) && bMs.startsWith(val)) return 1;
        return 0;
    });

    suggestionsAyatList.innerHTML = "";
    if (matches.length > 0) {
        matches.forEach(item => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            const keywordsHtml = item.kata_kunci && item.kata_kunci.trim() !== ""
                ? `<div style="font-size: 0.75rem; color: var(--accent-color); margin-top: 6px; display: flex; align-items: center; gap: 4px; font-weight: 500;"><span>🏷️</span> <span>${escapeHtml(item.kata_kunci)}</span></div>`
                : "";
            div.innerHTML = `
                <div class="suggestion-info" style="display: flex; flex-direction: column; justify-content: center;">
                    <span class="suggestion-title">${escapeHtml(stripHtml(item.terjemahan_ms).substring(0, 40))}...</span>
                    ${keywordsHtml}
                </div>
                <div class="suggestion-arabic">${escapeHtml(stripHtml(item.ayat_ar).substring(0, 30))}...</div>
            `;
            div.addEventListener("click", () => {
                selectedAyatItem = item;
                searchAyatInput.value = "";
                suggestionsAyatList.style.display = "none";
                renderSearchAyatCard();
                resultsAyatList.scrollIntoView({ behavior: "smooth" });
            });
            suggestionsAyatList.appendChild(div);
        });
    } else {
        suggestionsAyatList.innerHTML = `<div class="no-match-item">Tiada ayat yang sepadan dijumpai</div>`;
    }
    suggestionsAyatList.style.display = "block";
}

if (searchAyatInput) searchAyatInput.addEventListener("input", handleSearchAyatInput);

function renderSearchAyatCard() {
    if (!resultsAyatList) return;
    resultsAyatList.innerHTML = "";
    if (!selectedAyatItem) {
        resultsAyatList.innerHTML = `
            <div class="welcome-message">
                <strong>Koleksi Ayat & Terjemahan</strong><br>
                Sila taip kata dasar atau rujukan tatabahasa di atas untuk memaparkan senarai ayat.
            </div>
        `;
        return;
    }

    const card = document.createElement("div");
    card.className = "card";
    card.style.overflow = "hidden";

    const displayAyatAr = selectedAyatItem.ayat_ar
        ? sanitizeHtml(selectedAyatItem.ayat_ar).replace(/admin-highlight/g, "public-highlight")
        : "";
    const displayTerjemahan = selectedAyatItem.terjemahan_ms
        ? sanitizeHtml(selectedAyatItem.terjemahan_ms).replace(/admin-highlight/g, "public-highlight")
        : "";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = displayAyatAr + " " + displayTerjemahan;
    const marks = tempDiv.querySelectorAll("mark.public-highlight");

    const sorofSet = new Set();
    const nahuSet = new Set();
    const nomborSet = new Set();
    const legacySet = new Set();

    marks.forEach(m => {
        if (m.getAttribute("data-sorof")) sorofSet.add(m.getAttribute("data-sorof"));
        if (m.getAttribute("data-nahu")) nahuSet.add(m.getAttribute("data-nahu"));
        if (m.getAttribute("data-nombor")) nomborSet.add(m.getAttribute("data-nombor"));
        if (m.getAttribute("data-key")) legacySet.add(m.getAttribute("data-key"));
    });

    let badgesHtml = "";
    if (sorofSet.size > 0 || nahuSet.size > 0 || nomborSet.size > 0 || legacySet.size > 0) {
        let sHtml = "";
        let nHtml = "";
        let nomHtml = "";
        let lHtml = "";

        if (sorofSet.size > 0) {
            sHtml = `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.75rem; color: #059669; text-align: center; margin-bottom: 8px; font-weight: 700; text-transform: uppercase;">Morfologi (Ilmu Sorof)</div>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
                        ${Array.from(sorofSet).map(kw => `<span class="badge-keyword badge-sorof" data-target="${escapeAttr(kw)}" data-type="sorof">${escapeHtml(kw)}</span>`).join("")}
                    </div>
                </div>
            `;
        }
        if (nahuSet.size > 0) {
            nHtml = `
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 0.75rem; color: #0284c7; text-align: center; margin-bottom: 8px; font-weight: 700; text-transform: uppercase;">Sintaksis (Ilmu Nahu)</div>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
                        ${Array.from(nahuSet).map(kw => `<span class="badge-keyword badge-nahu" data-target="${escapeAttr(kw)}" data-type="nahu">${escapeHtml(kw)}</span>`).join("")}
                    </div>
                </div>
            `;
        }
        if (nomborSet.size > 0) {
            nomHtml = `
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 0.75rem; color: #7e22ce; text-align: center; margin-bottom: 8px; font-weight: 700; text-transform: uppercase;">Penomboran ('Adad)</div>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
                        ${Array.from(nomborSet).map(kw => `<span class="badge-keyword badge-nombor" data-target="${escapeAttr(kw)}" data-type="nombor">${escapeHtml(kw)}</span>`).join("")}
                    </div>
                </div>
            `;
        }
        if (legacySet.size > 0 && sorofSet.size === 0 && nahuSet.size === 0 && nomborSet.size === 0) {
            lHtml = `
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-bottom: 8px; font-weight: 700; text-transform: uppercase;">Kata Kunci</div>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
                        ${Array.from(legacySet).map(kw => `<span class="badge-keyword" data-target="${escapeAttr(kw)}" data-type="legacy">${escapeHtml(kw)}</span>`).join("")}
                    </div>
                </div>
            `;
        }

        badgesHtml = `
            <div style="background-color: #f8fafc; border-top: 1px solid var(--border-color); padding: 20px; margin: 24px -20px -20px -20px;">
                <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-bottom: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Pilih Kata Kunci Untuk Serlahkan Ayat</div>
                ${sHtml}${nHtml}${nomHtml}${lHtml}
                <div id="dynamicDefBox" class="keyword-definition-box">
                    <div class="kw-def-title"><span id="defTitleMs"></span><span id="defTitleAr" class="kw-def-ar"></span></div>
                    <div id="defContent" class="kw-def-content"></div>
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="card-body">
            <div style="text-align: center; font-family: var(--font-arabic); font-size: 2.2rem; color: var(--accent-color); direction: rtl; line-height: 1.8; margin-bottom: 24px; margin-top: 10px;">
                ${displayAyatAr}
            </div>
            <div style="border-top: 1px dashed var(--border-color); padding-top: 20px; font-size: 1.15rem; color: #2d3748; line-height: 1.6; text-align: center;">
                <strong>Maksud:</strong><br>${displayTerjemahan}
            </div>
            ${badgesHtml}
        </div>
    `;
    resultsAyatList.appendChild(card);

    const defBox = card.querySelector("#dynamicDefBox");
    const defTitleMs = card.querySelector("#defTitleMs");
    const defTitleAr = card.querySelector("#defTitleAr");
    const defContent = card.querySelector("#defContent");
    const badgeElements = card.querySelectorAll(".badge-keyword");
    const highlightElements = card.querySelectorAll(".public-highlight");

    badgeElements.forEach(badge => {
        badge.addEventListener("click", () => {
            const targetKey = badge.getAttribute("data-target");
            const targetType = badge.getAttribute("data-type");
            const isActive = badge.classList.contains("active");

            badgeElements.forEach(b => b.classList.remove("active"));
            highlightElements.forEach(h => {
                h.classList.remove("active", "active-sorof", "active-nahu", "active-nombor");
            });
            if (defBox) defBox.classList.remove("active");

            if (!isActive) {
                badge.classList.add("active");
                highlightElements.forEach(h => {
                    let isMatch = false;
                    if (targetType === "sorof" && h.getAttribute("data-sorof") === targetKey) isMatch = true;
                    if (targetType === "nahu" && h.getAttribute("data-nahu") === targetKey) isMatch = true;
                    if (targetType === "nombor" && h.getAttribute("data-nombor") === targetKey) isMatch = true;
                    if (targetType === "legacy" && h.getAttribute("data-key") === targetKey) isMatch = true;

                    if (isMatch) {
                        if (targetType === "sorof") h.classList.add("active-sorof");
                        else if (targetType === "nahu") h.classList.add("active-nahu");
                        else if (targetType === "nombor") h.classList.add("active-nombor");
                        else h.classList.add("active");
                    }
                });

                if (defBox) {
                    const termObj = dataIstilah.find(item => item.title_ms.trim().toLowerCase() === targetKey.trim().toLowerCase());
                    if (termObj) {
                        defTitleMs.textContent = termObj.title_ms;
                        defTitleAr.textContent = termObj.title_ar || "";
                        if (targetType === "sorof") defBox.style.borderLeftColor = "#059669";
                        else if (targetType === "nahu") defBox.style.borderLeftColor = "#0284c7";
                        else if (targetType === "nombor") defBox.style.borderLeftColor = "#9333ea";
                        else defBox.style.borderLeftColor = "var(--accent-color)";
                        defContent.innerHTML = termObj.definition
                            ? sanitizeHtml(termObj.definition).replace(/\n/g, "<br>")
                            : "<i>Tiada penerangan khusus disediakan di dalam Kamus Istilah.</i>";
                    } else {
                        defTitleMs.textContent = targetKey;
                        defTitleAr.textContent = "";
                        defBox.style.borderLeftColor = "#cbd5e0";
                        defContent.innerHTML = "<i>Tiada rekod terperinci dijumpai di dalam Kamus Istilah.</i>";
                    }
                    defBox.classList.add("active");
                }
            }
        });
    });
}

document.addEventListener("click", (e) => {
    if (searchInput && suggestionsList && !searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.style.display = "none";
    }
    if (searchAyatInput && suggestionsAyatList && !searchAyatInput.contains(e.target) && !suggestionsAyatList.contains(e.target)) {
        suggestionsAyatList.style.display = "none";
    }
});

// ============================================================================
// PANEL ADMIN: VISUAL EDITOR AYAT
// ============================================================================
function addHighlight() {
    const modal = document.getElementById("customPromptModal");
    const inputArab = document.getElementById("promptArab");
    const inputMelayu = document.getElementById("promptMelayu");
    const inputSorof = document.getElementById("promptKataKunciSorof");
    const inputNahu = document.getElementById("promptKataKunciNahu");
    const inputNombor = document.getElementById("promptKataKunciNombor");

    if (inputArab) inputArab.value = "";
    if (inputMelayu) inputMelayu.value = "";
    if (inputSorof) inputSorof.value = "";
    if (inputNahu) inputNahu.value = "";
    if (inputNombor) inputNombor.value = "";

    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";

    if (selectedText) {
        const anchorNode = selection.anchorNode;
        const editorArab = document.getElementById("ayatArEditor");
        const editorMelayu = document.getElementById("terjemahanMsEditor");

        if (editorArab && editorArab.contains(anchorNode)) inputArab.value = selectedText;
        else if (editorMelayu && editorMelayu.contains(anchorNode)) inputMelayu.value = selectedText;
        else if (inputArab) inputArab.value = selectedText;
    }

    if (modal) modal.style.display = "flex";
    setTimeout(() => {
        if (inputArab && !inputArab.value) inputArab.focus();
        else if (inputMelayu && !inputMelayu.value) inputMelayu.focus();
        else if (inputSorof) inputSorof.focus();
    }, 100);
}

const btnCustomPromptOk = document.getElementById("btnCustomPromptOk");
if (btnCustomPromptOk) {
    btnCustomPromptOk.addEventListener("click", () => {
        const perkataanArab = document.getElementById("promptArab").value.trim();
        const perkataanMelayu = document.getElementById("promptMelayu").value.trim();
        const kataKunciSorof = document.getElementById("promptKataKunciSorof").value.trim();
        const kataKunciNahu = document.getElementById("promptKataKunciNahu").value.trim();
        const inputNomborEl = document.getElementById("promptKataKunciNombor");
        const kataKunciNombor = inputNomborEl ? inputNomborEl.value.trim() : "";

        if (!perkataanArab || (!kataKunciSorof && !kataKunciNahu && !kataKunciNombor)) {
            alert("Sila isi Perkataan Arab dan sekurang-kurangnya satu Kata Kunci (Sorof, Nahu, atau Penomboran).");
            return;
        }

        const editorArab = document.getElementById("ayatArEditor");
        const editorMelayu = document.getElementById("terjemahanMsEditor");
        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const regexArab = new RegExp(`(${escapeRegExp(perkataanArab)})(?![^<]*>)`);
        let regexMelayu = null;

        if (!regexArab.test(editorArab.innerHTML)) {
            alert(`Ralat: Perkataan Arab "${escapeHtml(perkataanArab)}" tidak dijumpai di dalam teks editor Arab. Sila periksa ejaan.`);
            return;
        }

        if (perkataanMelayu !== "") {
            regexMelayu = new RegExp(`(${escapeRegExp(perkataanMelayu)})(?![^<]*>)`);
            if (!regexMelayu.test(editorMelayu.innerHTML)) {
                alert(`Ralat: Terjemahan "${escapeHtml(perkataanMelayu)}" tidak dijumpai di dalam teks editor Melayu.`);
                return;
            }
        }

        let dataAttributes = "";
        const tooltipTitles = [];

        if (kataKunciSorof) {
            dataAttributes += ` data-sorof="${escapeAttr(kataKunciSorof.toLowerCase())}"`;
            tooltipTitles.push(`Sorof: ${kataKunciSorof}`);
        }
        if (kataKunciNahu) {
            dataAttributes += ` data-nahu="${escapeAttr(kataKunciNahu.toLowerCase())}"`;
            tooltipTitles.push(`Nahu: ${kataKunciNahu}`);
        }
        if (kataKunciNombor) {
            dataAttributes += ` data-nombor="${escapeAttr(kataKunciNombor.toLowerCase())}"`;
            tooltipTitles.push(`Nombor: ${kataKunciNombor}`);
        }

        const combinedTooltip = escapeAttr(tooltipTitles.join(" | "));
        const markElementHtml = `<mark class="admin-highlight"${dataAttributes} title="${combinedTooltip}">$1</mark>`;

        editorArab.innerHTML = editorArab.innerHTML.replace(regexArab, markElementHtml);
        if (regexMelayu) editorMelayu.innerHTML = editorMelayu.innerHTML.replace(regexMelayu, markElementHtml);

        updateKeywordsList();
        document.getElementById("customPromptModal").style.display = "none";
    });
}

const btnCustomPromptCancel = document.getElementById("btnCustomPromptCancel");
if (btnCustomPromptCancel) {
    btnCustomPromptCancel.addEventListener("click", () => {
        document.getElementById("customPromptModal").style.display = "none";
    });
}

function removeHighlight() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    let node = selection.anchorNode;
    if (node && node.nodeType === 3) node = node.parentNode;

    if (node && node.tagName === "MARK" && node.classList.contains("admin-highlight")) {
        const text = document.createTextNode(node.textContent);
        node.parentNode.replaceChild(text, node);
        updateKeywordsList();
    } else {
        alert("Sila klik tepat pada perkataan berwarna kuning (highlight) yang ingin dibuang pautannya.");
    }
}

function updateKeywordsList() {
    if (!ayatArEditor || !terjemahanMsEditor) return;
    const marks1 = Array.from(ayatArEditor.querySelectorAll("mark.admin-highlight"));
    const marks2 = Array.from(terjemahanMsEditor.querySelectorAll("mark.admin-highlight"));
    const allMarks = [...marks1, ...marks2];

    const sorofSet = new Set();
    const nahuSet = new Set();
    const nomborSet = new Set();
    const legacySet = new Set();

    allMarks.forEach(m => {
        if (m.getAttribute("data-sorof")) sorofSet.add(m.getAttribute("data-sorof"));
        if (m.getAttribute("data-nahu")) nahuSet.add(m.getAttribute("data-nahu"));
        if (m.getAttribute("data-nombor")) nomborSet.add(m.getAttribute("data-nombor"));
        if (m.getAttribute("data-key")) legacySet.add(m.getAttribute("data-key"));
    });

    const inputSorof = document.getElementById("kataKunciSorofAyat");
    const inputNahu = document.getElementById("kataKunciNahuAyat");
    const inputNombor = document.getElementById("kataKunciNomborAyat");
    const inputHiddenAll = document.getElementById("kataKunciAyat");

    if (inputSorof) inputSorof.value = Array.from(sorofSet).join(", ");
    if (inputNahu) inputNahu.value = [...Array.from(nahuSet), ...Array.from(legacySet)].join(", ");
    if (inputNombor) inputNombor.value = Array.from(nomborSet).join(", ");
    if (inputHiddenAll) {
        inputHiddenAll.value = Array.from(new Set([...sorofSet, ...nahuSet, ...nomborSet, ...legacySet])).join(", ");
    }
}

if (ayatArEditor) ayatArEditor.addEventListener("input", updateKeywordsList);
if (terjemahanMsEditor) terjemahanMsEditor.addEventListener("input", updateKeywordsList);

// ============================================================================
// PANEL ADMIN: CRUD KOLEKSI AYAT & DELEGASI KLIK TUNGGAL
// ============================================================================
if (btnBukaBorangAyat) {
    btnBukaBorangAyat.addEventListener("click", () => {
        closeForm();
        closeFormKuiz();
        ayatForm.reset();
        inputAyatId.value = "";
        ayatArEditor.innerHTML = "";
        terjemahanMsEditor.innerHTML = "";
        updateKeywordsList();
        formAyatTitle.textContent = "Tambah Koleksi Ayat Baru";
        formAyatSection.classList.add("active");
        formAyatSection.scrollIntoView({ behavior: "smooth" });
    });
}

if (btnBatalAyat) btnBatalAyat.addEventListener("click", closeFormAyat);

function closeFormAyat() {
    if (!formAyatSection) return;
    formAyatSection.classList.remove("active");
    if (ayatForm) ayatForm.reset();
    if (inputAyatId) inputAyatId.value = "";
    if (ayatArEditor) ayatArEditor.innerHTML = "";
    if (terjemahanMsEditor) terjemahanMsEditor.innerHTML = "";
    updateKeywordsList();
}

function renderAdminAyatList(filterText = "") {
    if (!adminTableAyatBody) return;
    adminTableAyatBody.innerHTML = "";
    const lowerFilter = filterText.toLowerCase();

    const filteredData = dataAyat.filter(item => {
        const plainAr = stripHtml(item.ayat_ar).toLowerCase();
        const plainMs = stripHtml(item.terjemahan_ms).toLowerCase();
        return plainAr.includes(lowerFilter) ||
               plainMs.includes(lowerFilter) ||
               (item.kata_kunci && item.kata_kunci.toLowerCase().includes(lowerFilter));
    });

    if (filteredData.length === 0) {
        adminTableAyatBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 24px; color: var(--text-muted);">Tiada rekod ayat dijumpai.</td></tr>`;
        return;
    }

    filteredData.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="td-arabic" style="font-size: 1.1rem;">${escapeHtml(stripHtml(item.ayat_ar))}</td>
            <td>
                <strong>${escapeHtml(stripHtml(item.terjemahan_ms))}</strong><br>
                <span style="font-size: 0.75rem; color: var(--text-muted);">Kata kunci: ${escapeHtml(item.kata_kunci)}</span>
            </td>
            <td>
                <div class="actions-cell" style="display:flex; gap:6px;">
                    <button class="btn btn-edit" type="button" data-action="edit-ayat" data-id="${escapeAttr(item.id)}">Ubah</button>
                    <button class="btn btn-danger" type="button" data-action="delete-ayat" data-id="${escapeAttr(item.id)}">Padam</button>
                </div>
            </td>
        `;
        adminTableAyatBody.appendChild(tr);
    });
}

if (adminSearchAyatInput) {
    adminSearchAyatInput.addEventListener("input", (e) => renderAdminAyatList(e.target.value.trim()));
}

document.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    const id = button.getAttribute("data-id");
    if (!id) return;
    switch (button.getAttribute("data-action")) {
        case "edit-ayat": editAyat(id); break;
        case "delete-ayat": deleteAyat(id); break;
        case "edit-item": editItem(id); break;
        case "delete-item": deleteItem(id); break;
        case "edit-kuiz": editKuiz(id); break;
        case "delete-kuiz": deleteKuiz(id); break;
    }
});

if (ayatForm) {
    ayatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        updateKeywordsList();
        const ayatObject = {
            ayat_ar: sanitizeEditorHtml(ayatArEditor.innerHTML.trim()),
            terjemahan_ms: sanitizeEditorHtml(terjemahanMsEditor.innerHTML.trim()),
            kata_kunci: inputKataKunciAyat.value.trim()
        };
        if (inputAyatId.value) ayatObject.id = inputAyatId.value;
        const { error } = await supabaseClient.from("koleksi_ayat").upsert([ayatObject]);
        if (error) alert("Ralat Keselamatan RLS: " + error.message);
        else {
            selectedAyatItem = null;
            searchAyatInput.value = "";
            closeFormAyat();
            await loadDataFromSupabase();
            renderSearchAyatCard();
        }
    });
}

function editAyat(id) {
    const item = dataAyat.find(i => String(i.id) === String(id));
    if (!item) return;
    closeForm();
    closeFormKuiz();
    formAyatTitle.textContent = "Ubah Koleksi Ayat";
    inputAyatId.value = item.id;
    ayatArEditor.innerHTML = sanitizeEditorHtml(item.ayat_ar || "");
    terjemahanMsEditor.innerHTML = sanitizeEditorHtml(item.terjemahan_ms || "");
    updateKeywordsList();
    formAyatSection.classList.add("active");
    formAyatSection.scrollIntoView({ behavior: "smooth" });
}

async function deleteAyat(id) {
    if (confirm("Adakah anda pasti mahu memadam koleksi ayat ini?")) {
        const { error } = await supabaseClient.from("koleksi_ayat").delete().eq("id", id);
        if (error) alert("Ralat Keselamatan RLS: " + error.message);
        else {
            selectedAyatItem = null;
            searchAyatInput.value = "";
            await loadDataFromSupabase();
            renderSearchAyatCard();
        }
    }
}

// ============================================================================
// DIREKTORI ABJAD, CARIAN ISTILAH, DAN ADMIN ISTILAH
// ============================================================================
function renderAlphabeticalDirectory() {
    if (!alphabeticalDirectory) return;
    alphabeticalDirectory.innerHTML = `
        <div class="directory-container">
            <div class="directory-title">📁 Senarai Indeks Istilah (Ikut Abjad)</div>
            <div id="directoryGroups"></div>
        </div>
    `;
    const groupsDiv = document.getElementById("directoryGroups");
    const groups = {};

    dataIstilah.forEach(item => {
        if (!item.title_ms) return;
        const firstLetter = item.title_ms.trim().charAt(0).toUpperCase();
        if (!groups[firstLetter]) groups[firstLetter] = [];
        groups[firstLetter].push(item);
    });

    const sortedLetters = Object.keys(groups).sort();
    if (sortedLetters.length === 0) {
        groupsDiv.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 12px;">Tiada istilah untuk dipaparkan.</div>`;
        return;
    }

    sortedLetters.forEach(letter => {
        const letterGroup = document.createElement("div");
        letterGroup.className = "dir-letter-group";
        letterGroup.innerHTML = `
            <div class="dir-letter-header">
                <span>Huruf ${letter} (${groups[letter].length} Istilah)</span>
                <span class="dir-toggle-icon">▼</span>
            </div>
            <div class="dir-letter-content">
                ${groups[letter].map(item => `
                    <div class="dir-item" data-id="${escapeAttr(item.id)}">
                        <span>${escapeHtml(item.title_ms)}</span>
                        <span class="dir-item-ar">${escapeHtml(item.title_ar || "")}</span>
                    </div>
                `).join("")}
            </div>
        `;
        const header = letterGroup.querySelector(".dir-letter-header");
        const content = letterGroup.querySelector(".dir-letter-content");
        const icon = letterGroup.querySelector(".dir-toggle-icon");

        header.addEventListener("click", () => {
            if (content.classList.contains("open")) {
                content.classList.remove("open");
                icon.textContent = "▼";
            } else {
                content.classList.add("open");
                icon.textContent = "▲";
            }
        });

        letterGroup.querySelectorAll(".dir-item").forEach(itemEl => {
            itemEl.addEventListener("click", () => {
                const foundItem = dataIstilah.find(i => String(i.id) === String(itemEl.getAttribute("data-id")));
                if (foundItem) {
                    selectedSearchItem = foundItem;
                    searchInput.value = foundItem.title_ms;
                    renderSearchCard();
                    resultsList.scrollIntoView({ behavior: "smooth" });
                }
            });
        });
        groupsDiv.appendChild(letterGroup);
    });
}

function handleSearchInput(e) {
    currentSearch = e.target.value.trim();
    if (currentSearch === "") {
        selectedSearchItem = null;
        suggestionsList.style.display = "none";
        renderSearchCard();
        return;
    }

    const matches = dataIstilah.filter(item => {
        const lower = currentSearch.toLowerCase();
        return item.title_ms.toLowerCase().includes(lower) ||
               item.title_ar.includes(lower) ||
               (item.keywords && item.keywords.some(kw => kw.includes(lower)));
    });

    suggestionsList.innerHTML = "";
    if (matches.length > 0) {
        matches.forEach(item => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            let paparanKategori = "Tiada Kategori";
            if (item.disiplin_ilmu === "sorof") paparanKategori = "Sorof";
            else if (item.disiplin_ilmu === "nahu") paparanKategori = "Nahu";
            else if (item.disiplin_ilmu === "nombor") paparanKategori = "Penomboran";

            div.innerHTML = `
                <div class="suggestion-info">
                    <span class="suggestion-title">${escapeHtml(item.title_ms)}</span>
                    <span class="suggestion-cat">${escapeHtml(paparanKategori)}</span>
                </div>
                <div class="suggestion-arabic">${escapeHtml(item.title_ar)}</div>
            `;
            div.addEventListener("click", () => {
                selectedSearchItem = item;
                searchInput.value = item.title_ms;
                suggestionsList.style.display = "none";
                renderSearchCard();
                resultsList.scrollIntoView({ behavior: "smooth" });
            });
            suggestionsList.appendChild(div);
        });
    } else {
        suggestionsList.innerHTML = `<div class="no-match-item">Tiada pilihan yang sepadan</div>`;
    }
    suggestionsList.style.display = "block";
}

if (searchInput) searchInput.addEventListener("input", handleSearchInput);

function renderSearchCard() {
    if (!resultsList) return;
    resultsList.innerHTML = "";
    if (!selectedSearchItem) {
        resultsList.innerHTML = `
            <div class="welcome-message" style="margin-bottom: 24px;">
                <strong>Selamat Datang!</strong><br>
                Sila taip nama terma di atas atau pilih daripada indeks abjad untuk memaparkan pilihan carian.
            </div>
        `;
        return;
    }

    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "32px";

    let formattedCharacteristics = "";
    if (selectedSearchItem.characteristics && selectedSearchItem.characteristics.length > 0) {
        selectedSearchItem.characteristics.forEach(c => {
            try {
                if (c.startsWith("{") && c.endsWith("}")) {
                    const parsed = JSON.parse(c);
                    if (parsed.mainTitle) {
                        formattedCharacteristics += `
                            <div style="margin-top: 24px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 16px;">
                                <span style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">${escapeHtml(parsed.mainTitle)}</span>
                            </div>
                        `;
                    }
                    if (parsed.subTitle) {
                        formattedCharacteristics += `
                            <div style="margin-top: 12px; margin-bottom: 8px; font-size: 1.05rem; font-weight: bold; color: var(--primary-color);">
                                ${escapeHtml(parsed.subTitle)}:
                            </div>
                        `;
                    }
                    if (parsed.content) {
                        formattedCharacteristics += `
                            <div class="definition" style="margin-bottom: 16px; line-height: 1.6;">
                                ${sanitizeHtml(parsed.content).replace(/\n/g, "<br>")}
                            </div>
                        `;
                    }

                    if (parsed.table_data && parsed.table_data.headers && parsed.table_data.rows && parsed.table_data.rows.length > 0) {
                        const tTitle = parsed.table_data.table_title ? String(parsed.table_data.table_title).trim() : "";
                        const tHeaders = parsed.table_data.headers || [];
                        const tRows = parsed.table_data.rows || [];
                        const hasColumn4 = tHeaders[3]?.trim() !== "" || tRows.some(row => row[3]?.trim() !== "");
                        const th4Html = hasColumn4 ? `<th style="text-align: center;">${sanitizeHtml(tHeaders[3] || "")}</th>` : "";
                        const titleHtml = tTitle !== ""
                            ? `<div style="margin-top: 20px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 12px;"><span style="font-size: 1.15rem; font-weight: 700; color: var(--primary-color);">${escapeHtml(tTitle)}</span></div>`
                            : "";

                        const rowsHtml = tRows.map(row => {
                            const td4Html = hasColumn4 ? `<td style="text-align: center;">${sanitizeHtml(row[3] || "")}</td>` : "";
                            return `
                                <tr>
                                    <td>${sanitizeHtml(row[0] || "")}</td>
                                    <td style="text-align: center;">${sanitizeHtml(row[1] || "")}</td>
                                    <td style="text-align: center;">${sanitizeHtml(row[2] || "")}</td>
                                    ${td4Html}
                                </tr>
                            `;
                        }).join("");

                        formattedCharacteristics += `
                            ${titleHtml}
                            <div class="table-container" style="margin-bottom: 24px;">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>${sanitizeHtml(tHeaders[0] || "")}</th>
                                            <th style="text-align: center;">${sanitizeHtml(tHeaders[1] || "")}</th>
                                            <th style="text-align: center;">${sanitizeHtml(tHeaders[2] || "")}</th>
                                            ${th4Html}
                                        </tr>
                                    </thead>
                                    <tbody>${rowsHtml}</tbody>
                                </table>
                            </div>
                        `;
                    }
                } else {
                    formattedCharacteristics += `<div style="margin-bottom: 8px; line-height: 1.6;">${sanitizeHtml(c).replace(/\n/g, "<br>")}</div>`;
                }
            } catch (e) {
                formattedCharacteristics += `<div style="margin-bottom: 8px; line-height: 1.6;">${sanitizeHtml(c).replace(/\n/g, "<br>")}</div>`;
            }
        });
    }

    let legacyStandaloneTableHtml = "";
    if (selectedSearchItem.table_data && selectedSearchItem.table_data.headers && selectedSearchItem.table_data.rows && selectedSearchItem.table_data.rows.length > 0) {
        const tableTitle = selectedSearchItem.table_data.table_title ? String(selectedSearchItem.table_data.table_title).trim() : "";
        const tHeadersLegacy = selectedSearchItem.table_data.headers || [];
        const tRowsLegacy = selectedSearchItem.table_data.rows || [];
        const hasColumn4Legacy = tHeadersLegacy[3]?.trim() !== "" || tRowsLegacy.some(row => row[3]?.trim() !== "");
        const th4LegacyHtml = hasColumn4Legacy ? `<th style="text-align: center;">${sanitizeHtml(tHeadersLegacy[3] || "")}</th>` : "";
        const legacyTitleHtml = tableTitle !== ""
            ? `<div style="margin-top: 24px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 16px;"><span style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">${escapeHtml(tableTitle)}</span></div>`
            : "";

        const legacyRowsHtml = tRowsLegacy.map(row => {
            const td4LegacyHtml = hasColumn4Legacy ? `<td style="text-align: center;">${sanitizeHtml(row[3] || "")}</td>` : "";
            return `
                <tr>
                    <td>${sanitizeHtml(row[0] || "")}</td>
                    <td style="text-align: center;">${sanitizeHtml(row[1] || "")}</td>
                    <td style="text-align: center;">${sanitizeHtml(row[2] || "")}</td>
                    ${td4LegacyHtml}
                </tr>
            `;
        }).join("");

        legacyStandaloneTableHtml = `
            ${legacyTitleHtml}
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>${sanitizeHtml(tHeadersLegacy[0] || "")}</th>
                            <th style="text-align: center;">${sanitizeHtml(tHeadersLegacy[1] || "")}</th>
                            <th style="text-align: center;">${sanitizeHtml(tHeadersLegacy[2] || "")}</th>
                            ${th4LegacyHtml}
                        </tr>
                    </thead>
                    <tbody>${legacyRowsHtml}</tbody>
                </table>
            </div>
        `;
    }

    const formattedDefinition = selectedSearchItem.definition
        ? sanitizeHtml(selectedSearchItem.definition).replace(/\n/g, "<br>")
        : "";
    let paparanKategori = "";
    if (selectedSearchItem.disiplin_ilmu === "sorof") paparanKategori = "Sorof";
    else if (selectedSearchItem.disiplin_ilmu === "nahu") paparanKategori = "Nahu";
    else if (selectedSearchItem.disiplin_ilmu === "nombor") paparanKategori = "Penomboran";

    card.innerHTML = `
        <div class="card-header">
            <div class="card-title-group">
                <div class="title-ms">${escapeHtml(selectedSearchItem.title_ms)}</div>
                ${paparanKategori ? `<span class="category-badge">${escapeHtml(paparanKategori)}</span>` : ""}
            </div>
            <div class="title-ar">${escapeHtml(selectedSearchItem.title_ar)}</div>
        </div>
        <div class="card-body">
            <div class="definition">${formattedDefinition}</div>
            <div class="definition" style="line-height: 1.6;">${formattedCharacteristics}</div>
            ${legacyStandaloneTableHtml}
        </div>
    `;
    resultsList.appendChild(card);
}

function renderAdminList(filterText = "") {
    if (!adminTableBody) return;
    adminTableBody.innerHTML = "";
    const lowerFilter = filterText.toLowerCase();

    const filteredData = dataIstilah.filter(item => {
        return item.title_ms.toLowerCase().includes(lowerFilter) ||
               item.title_ar.includes(lowerFilter) ||
               (item.disiplin_ilmu && item.disiplin_ilmu.toLowerCase().includes(lowerFilter)) ||
               (item.keywords && item.keywords.some(kw => kw.includes(lowerFilter)));
    });

    if (filteredData.length === 0) {
        adminTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: var(--text-muted);">Tiada istilah yang sepadan dengan carian anda.</td></tr>`;
        return;
    }

    filteredData.forEach(item => {
        const tr = document.createElement("tr");
        let paparanKategori = "Kosong";
        if (item.disiplin_ilmu === "sorof") paparanKategori = "Sorof";
        else if (item.disiplin_ilmu === "nahu") paparanKategori = "Nahu";
        else if (item.disiplin_ilmu === "nombor") paparanKategori = "Penomboran";

        tr.innerHTML = `
            <td><strong>${escapeHtml(item.title_ms)}</strong></td>
            <td class="td-arabic">${escapeHtml(item.title_ar)}</td>
            <td><span class="badge">${escapeHtml(paparanKategori)}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-edit" type="button" data-action="edit-item" data-id="${escapeAttr(item.id)}">Ubah</button>
                    <button class="btn btn-danger" type="button" data-action="delete-item" data-id="${escapeAttr(item.id)}">Padam</button>
                </div>
            </td>
        `;
        adminTableBody.appendChild(tr);
    });
}

if (adminSearchInput) {
    adminSearchInput.addEventListener("input", (e) => renderAdminList(e.target.value.trim()));
}

if (termForm) {
    termForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = inputId.value || "term-" + Date.now();
        const kwArray = inputKeywords.value.split(",").map(k => k.trim().toLowerCase()).filter(k => k !== "");
        const ciriElements = ciriSectionsContainer.querySelectorAll(".ciri-section-item");
        const chrArray = [];

        ciriElements.forEach(item => {
            const mTitle = item.querySelector(".ciri-main-title-input").value.trim();
            const sTitle = item.querySelector(".ciri-sub-title-input").value.trim();
            const content = item.querySelector(".ciri-content-input").value.trim();
            const tableBox = item.querySelector(".ciri-table-builder");
            let embeddedTableObj = null;

            if (tableBox && tableBox.style.display !== "none") {
                const tTitle = tableBox.querySelector(".ciri-table-title").value.trim();
                const h1 = sanitizeEditorHtml(tableBox.querySelector(".th-1").value.trim());
                const h2 = sanitizeEditorHtml(tableBox.querySelector(".th-2").value.trim());
                const h3 = sanitizeEditorHtml(tableBox.querySelector(".th-3").value.trim());
                const h4 = sanitizeEditorHtml(tableBox.querySelector(".th-4").value.trim());
                const rItems = tableBox.querySelectorAll(".builder-row-item");
                const rowsData = [];

                rItems.forEach(row => {
                    const v1 = sanitizeEditorHtml(row.querySelector(".col-1").value.trim());
                    const v2 = sanitizeEditorHtml(row.querySelector(".col-2").value.trim());
                    const v3 = sanitizeEditorHtml(row.querySelector(".col-3").value.trim());
                    const v4 = sanitizeEditorHtml(row.querySelector(".col-4").value.trim());
                    if (v1 || v2 || v3 || v4) rowsData.push([v1, v2, v3, v4]);
                });

                if (h1 || h2 || h3 || h4 || rowsData.length > 0) {
                    embeddedTableObj = { table_title: tTitle, headers: [h1, h2, h3, h4], rows: rowsData };
                }
            }

            if (mTitle || sTitle || content || embeddedTableObj) {
                chrArray.push(JSON.stringify({
                    mainTitle: mTitle,
                    subTitle: sTitle,
                    content: sanitizeEditorHtml(content),
                    table_data: embeddedTableObj
                }));
            }
        });

        const termObject = {
            id: id,
            title_ms: inputTitleMs.value,
            title_ar: inputTitleAr.value,
            disiplin_ilmu: inputDisiplin ? inputDisiplin.value : null,
            definition: sanitizeEditorHtml(inputDefinition.value),
            characteristics: chrArray,
            table_data: null,
            keywords: kwArray
        };

        const { error } = await supabaseClient.from("istilah_arab").upsert([termObject]);
        if (error) alert("Ralat Keselamatan RLS / Sistem: " + error.message);
        else {
            selectedSearchItem = null;
            searchInput.value = "";
            closeForm();
            await loadDataFromSupabase();
            renderSearchCard();
        }
    });
}

function editItem(id) {
    const item = dataIstilah.find(i => String(i.id) === String(id));
    if (!item) return;
    closeFormAyat();
    closeFormKuiz();
    formTitle.textContent = "Ubah Maklumat Istilah";
    inputId.value = item.id;
    inputTitleMs.value = item.title_ms;
    inputTitleAr.value = item.title_ar;
    if (inputDisiplin) inputDisiplin.value = item.disiplin_ilmu || "";
    inputKeywords.value = item.keywords ? item.keywords.join(", ") : "";
    inputDefinition.value = item.definition;
    ciriSectionsContainer.innerHTML = "";

    if (item.characteristics && item.characteristics.length > 0) {
        let hasLegacy = false;
        const legacyText = [];
        item.characteristics.forEach(c => {
            try {
                if (c.startsWith("{") && c.endsWith("}")) {
                    const parsed = JSON.parse(c);
                    createCiriSectionInput(parsed.mainTitle || "", parsed.subTitle || "", parsed.content || "", parsed.table_data || null);
                } else {
                    legacyText.push(c);
                    hasLegacy = true;
                }
            } catch (e) {
                legacyText.push(c);
                hasLegacy = true;
            }
        });
        if (hasLegacy && legacyText.length > 0) createCiriSectionInput("", "", legacyText.join("\n"), null);
    } else {
        createCiriSectionInput();
    }

    formSection.classList.add("active");
    formSection.scrollIntoView({ behavior: "smooth" });
}

async function deleteItem(id) {
    if (confirm("Adakah anda pasti mahu memadam istilah ini dari pangkalan data cloud?")) {
        const { error } = await supabaseClient.from("istilah_arab").delete().eq("id", id);
        if (error) alert("Ralat Keselamatan RLS: " + error.message);
        else {
            selectedSearchItem = null;
            searchInput.value = "";
            await loadDataFromSupabase();
            renderSearchCard();
        }
    }
}

if (btnBukaBorang) {
    btnBukaBorang.addEventListener("click", () => {
        closeFormAyat();
        closeFormKuiz();
        termForm.reset();
        inputId.value = "";
        ciriSectionsContainer.innerHTML = "";
        formTitle.textContent = "Tambah Istilah Baru";
        formSection.classList.add("active");
        createCiriSectionInput();
        formSection.scrollIntoView({ behavior: "smooth" });
    });
}

if (btnBatal) btnBatal.addEventListener("click", closeForm);

function closeForm() {
    if (!formSection) return;
    formSection.classList.remove("active");
    if (termForm) termForm.reset();
    if (inputId) inputId.value = "";
    if (ciriSectionsContainer) ciriSectionsContainer.innerHTML = "";
}

function createCiriSectionInput(mainTitleVal = "", subTitleVal = "", contentVal = "", tableDataVal = null) {
    const rand = Math.floor(Math.random() * 10000);
    const uniqueId = "ciriContent_" + Date.now() + "_" + rand;
    const tableContainerId = "ciriTableBox_" + Date.now() + "_" + rand;
    const rowsContainerId = "ciriTableRows_" + Date.now() + "_" + rand;

    const sectionDiv = document.createElement("div");
    sectionDiv.className = "ciri-section-item";
    sectionDiv.style = "background: #fff; padding: 16px; border: 1px dashed #cbd5e0; border-radius: 8px; margin-bottom: 12px; position: relative;";

    const isTableVisible = tableDataVal ? "block" : "none";
    const btnToggleText = tableDataVal ? "✓ Buang Jadual" : "+ Tambah Jadual Contoh";
    const btnToggleClass = tableDataVal ? "btn-danger" : "btn-primary";
    const tTitle = tableDataVal?.table_title || "";
    const th1Val = tableDataVal?.headers?.[0] || "";
    const th2Val = tableDataVal?.headers?.[1] || "";
    const th3Val = tableDataVal?.headers?.[2] || "";
    const th4Val = tableDataVal?.headers?.[3] || "";

    sectionDiv.innerHTML = `
        <button type="button" class="btn btn-danger btn-remove-section" style="position: absolute; top: 12px; right: 12px; padding: 4px 10px;" title="Padam Seksyen Ini">X</button>
        <div class="form-group" style="margin-top: 4px; margin-right: 40px;">
            <label>Tajuk Besar (Pilihan)</label>
            <input type="text" class="form-control ciri-main-title-input" placeholder="Contoh: Baris akhir berubah" value="${escapeAttr(mainTitleVal)}">
        </div>
        <div class="form-group" style="margin-top: 4px;">
            <label>Subtajuk (Pilihan)</label>
            <input type="text" class="form-control ciri-sub-title-input" placeholder="Contoh: Rafa' / Nasab / Jar" value="${escapeAttr(subTitleVal)}">
        </div>
        <div class="form-group" style="margin-bottom:12px;">
            <label>Penerangan</label>
            <div class="text-toolbar">
                <button type="button" class="toolbar-btn" data-format-target="${uniqueId}" data-format="b">B</button>
                <button type="button" class="toolbar-btn" data-format-target="${uniqueId}" data-format="u"><u>U</u></button>
                <button type="button" class="toolbar-btn" data-format-target="${uniqueId}" data-format="i"><i>I</i></button>
                <button type="button" class="toolbar-btn" data-format-target="${uniqueId}" data-format="bullet">• Senarai</button>
                <div class="color-picker-wrapper">
                    <input type="color" class="toolbar-color" data-format-target="${uniqueId}" data-format="color">
                </div>
            </div>
            <textarea id="${uniqueId}" class="form-control ciri-content-input" rows="3" placeholder="Masukkan penerangan lengkap ciri ini...">${escapeHtml(contentVal)}</textarea>
        </div>
        <button type="button" class="btn ${btnToggleClass} btn-toggle-table" style="padding: 4px 10px; font-size: 0.8rem; margin-bottom: 4px;">${btnToggleText}</button>
        <div class="ciri-table-builder" id="${tableContainerId}" style="display: ${isTableVisible}; background: #f7fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px;">
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size: 0.85rem; color: var(--accent-color); font-weight: 600;">Tajuk Jadual (Pilihan)</label>
                <input type="text" class="form-control ciri-table-title" placeholder="Contoh: Contoh Tasrif / Struktur" value="${escapeAttr(tTitle)}">
            </div>
            <div class="text-toolbar" style="margin-bottom: 8px; width: 100%;">
                <button type="button" class="toolbar-btn" data-table-format="b" title="Tebal">B</button>
                <button type="button" class="toolbar-btn" data-table-format="u" title="Garis Bawah"><u>U</u></button>
                <button type="button" class="toolbar-btn" data-table-format="i" title="Senget"><i>I</i></button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                <input type="text" class="form-control th-1 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 1" value="${escapeAttr(th1Val)}">
                <input type="text" class="form-control th-2 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 2" value="${escapeAttr(th2Val)}">
                <input type="text" class="form-control th-3 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 3" value="${escapeAttr(th3Val)}">
                <input type="text" class="form-control th-4 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 4" value="${escapeAttr(th4Val)}">
            </div>
            <div class="ciri-rows-area" id="${rowsContainerId}" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;"></div>
            <button type="button" class="btn btn-primary btn-add-row-ciri" style="padding: 4px 8px; font-size: 0.75rem;">+ Tambah Baris Data</button>
        </div>
    `;

    const tableBox = sectionDiv.querySelector(`#${tableContainerId}`);
    const btnToggleTable = sectionDiv.querySelector(".btn-toggle-table");
    const rowsArea = sectionDiv.querySelector(`#${rowsContainerId}`);
    const btnAddRowCiri = sectionDiv.querySelector(".btn-add-row-ciri");

    function addCiriTableRow(v1 = "", v2 = "", v3 = "", v4 = "") {
        const rowDiv = document.createElement("div");
        rowDiv.className = "builder-row-item";
        rowDiv.style = "display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 6px; align-items: center;";
        rowDiv.innerHTML = `
            <input type="text" class="form-control col-1 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 1" value="${escapeAttr(v1)}">
            <input type="text" class="form-control col-2 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 2" value="${escapeAttr(v2)}">
            <input type="text" class="form-control col-3 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 3" value="${escapeAttr(v3)}">
            <input type="text" class="form-control col-4 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 4" value="${escapeAttr(v4)}">
            <button type="button" class="btn btn-danger btn-remove-row" style="padding: 4px 8px; font-size:0.75rem;">X</button>
        `;
        rowDiv.querySelector(".btn-remove-row").addEventListener("click", () => rowDiv.remove());
        rowsArea.appendChild(rowDiv);
    }

    if (tableDataVal && tableDataVal.rows) {
        tableDataVal.rows.forEach(r => addCiriTableRow(r[0], r[1], r[2], r[3]));
    }
    btnAddRowCiri.addEventListener("click", () => addCiriTableRow());

    btnToggleTable.addEventListener("click", () => {
        if (tableBox.style.display === "none") {
            tableBox.style.display = "block";
            btnToggleTable.textContent = "✓ Buang Jadual";
            btnToggleTable.classList.replace("btn-primary", "btn-danger");
            if (rowsArea.children.length === 0) {
                addCiriTableRow();
                addCiriTableRow();
            }
        } else {
            tableBox.style.display = "none";
            btnToggleTable.textContent = "+ Tambah Jadual Contoh";
            btnToggleTable.classList.replace("btn-danger", "btn-primary");
        }
    });

    sectionDiv.querySelector(".btn-remove-section").addEventListener("click", () => sectionDiv.remove());
    ciriSectionsContainer.appendChild(sectionDiv);
}

if (btnTambahCiri) btnTambahCiri.addEventListener("click", () => createCiriSectionInput());

document.addEventListener("focusin", (e) => {
    if (e.target && e.target.classList.contains("table-input-target")) {
        lastFocusedTableInput = e.target;
    }
});

document.addEventListener("click", (e) => {
    const formatBtn = e.target.closest("button[data-format-target]");
    if (formatBtn) {
        applyFormat(formatBtn.getAttribute("data-format-target"), formatBtn.getAttribute("data-format"));
    }

    const tableFormatBtn = e.target.closest("button[data-table-format]");
    if (tableFormatBtn) {
        applyTableFormat(tableFormatBtn.getAttribute("data-table-format"));
    }

    const highlightBtn = e.target.closest("button[data-highlight-action]");
    if (highlightBtn) {
        const action = highlightBtn.getAttribute("data-highlight-action");
        if (action === "add") addHighlight();
        if (action === "remove") removeHighlight();
    }
});

document.addEventListener("change", (e) => {
    const colorInput = e.target.closest("input[data-format-target][data-format='color']");
    if (colorInput) {
        applyFormat(colorInput.getAttribute("data-format-target"), "color", colorInput.value);
    }
});

function applyTableFormat(type, colorValue = null) {
    if (type === "color" && !/^#[0-9a-f]{6}$/i.test(String(colorValue || ""))) return;
    if (!lastFocusedTableInput) {
        alert("Sila klik di dalam mana-mana petak jadual terlebih dahulu.");
        return;
    }
    const input = lastFocusedTableInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const originalText = input.value;
    const selectedText = originalText.substring(start, end);
    let tagOpen = "";
    let tagClose = "";

    switch (type) {
        case "b": tagOpen = "<b>"; tagClose = "</b>"; break;
        case "u": tagOpen = "<u>"; tagClose = "</u>"; break;
        case "i": tagOpen = "<i>"; tagClose = "</i>"; break;
        case "color": tagOpen = `<span style="color:${colorValue}">`; tagClose = "</span>"; break;
    }

    const modifiedText = tagOpen + selectedText + tagClose;
    input.value = originalText.substring(0, start) + modifiedText + originalText.substring(end);
    input.focus();
    input.selectionStart = start;
    input.selectionEnd = start + modifiedText.length;
    input.dispatchEvent(new Event("input"));
}

function applyFormat(textareaId, type, colorValue = null) {
    if (type === "color" && !/^#[0-9a-f]{6}$/i.test(String(colorValue || ""))) return;
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const originalText = textarea.value;
    const selectedText = originalText.substring(start, end);
    let tagOpen = "";
    let tagClose = "";
    let modifiedText = "";

    switch (type) {
        case "b":
        case "u":
        case "i":
            tagOpen = `<${type}>`;
            tagClose = `</${type}>`;
            modifiedText = tagOpen + selectedText + tagClose;
            break;
        case "color":
            tagOpen = `<span style="color:${colorValue}">`;
            tagClose = "</span>";
            modifiedText = tagOpen + selectedText + tagClose;
            break;
        case "bullet":
            modifiedText = selectedText.trim().length > 0
                ? `<ul class="inline-bullet-list">${selectedText.split("\n").map(line => line.trim() ? `<li>${line.trim()}</li>` : "").filter(l => l).join(" ")}</ul>`
                : `<ul class="inline-bullet-list"><li>Teks Senarai</li></ul>`;
            break;
    }

    textarea.value = originalText.substring(0, start) + modifiedText + originalText.substring(end);
    textarea.value = textarea.value.replace(/<\/ul>([\s\n]*?)<ul>/gi, "$1");
    textarea.focus();
    textarea.selectionStart = start;
    textarea.selectionEnd = start + modifiedText.length;
    textarea.dispatchEvent(new Event("input"));
}

// ============================================================================
// KESELAMATAN LOG MASUK & KAWALAN PAPARAN (UI DINAMIK & KUKUH)
// ============================================================================
let jumlahPercubaanGagal = parseInt(sessionStorage.getItem("jpg") || "0", 10);
let kunciLogMasukSehingga = parseInt(sessionStorage.getItem("kls") || "0", 10);
let pemasaKiraanDetik;

const loginMsgBox = document.getElementById("loginMessageAlert");
const loginBtn = loginForm ? loginForm.querySelector("button[type='submit']") : null;
const emailInput = document.getElementById("loginEmail");
const passInput = document.getElementById("loginPassword");

function simpanStatusKunci() {
    sessionStorage.setItem("jpg", jumlahPercubaanGagal);
    sessionStorage.setItem("kls", kunciLogMasukSehingga);
}

function paparMesejLogMasuk(teks, jenis = "error") {
    if (!loginMsgBox) return;
    loginMsgBox.style.display = "block";
    loginMsgBox.className = jenis === "error" ? "alert-error" : "alert-warning";
    loginMsgBox.innerHTML = sanitizeHtml(teks);
}

function mulakanKiraanDetik() {
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.style.opacity = "0.5";
    }
    if (emailInput) emailInput.disabled = true;
    if (passInput) passInput.disabled = true;

    clearInterval(pemasaKiraanDetik);

    pemasaKiraanDetik = setInterval(() => {
        const bakiMs = kunciLogMasukSehingga - Date.now();

        if (bakiMs <= 0) {
            clearInterval(pemasaKiraanDetik);
            jumlahPercubaanGagal = 0;
            kunciLogMasukSehingga = 0;
            simpanStatusKunci();

            if (loginMsgBox) loginMsgBox.style.display = "none";
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.style.opacity = "1";
            }
            if (emailInput) emailInput.disabled = false;
            if (passInput) passInput.disabled = false;
        } else {
            const bakiSaat = Math.ceil(bakiMs / 1000);
            paparMesejLogMasuk(`Sistem dikunci sementara untuk keselamatan.<br>Sila tunggu <strong>${bakiSaat} saat</strong>.`, "warning");
        }
    }, 1000);

    const bakiSaat = Math.ceil((kunciLogMasukSehingga - Date.now()) / 1000);
    paparMesejLogMasuk(`Sistem dikunci sementara untuk keselamatan.<br>Sila tunggu <strong>${bakiSaat} saat</strong>.`, "warning");
}

if (Date.now() < kunciLogMasukSehingga) {
    mulakanKiraanDetik();
}

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (Date.now() < kunciLogMasukSehingga) {
            mulakanKiraanDetik();
            return;
        }

        const email = emailInput.value.trim();
        const password = passInput.value;

        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = "Log Masuk...";
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = "Log Masuk";
        }

        if (error) {
            jumlahPercubaanGagal++;
            if (jumlahPercubaanGagal >= 3) {
                kunciLogMasukSehingga = Date.now() + 60000;
                simpanStatusKunci();
                mulakanKiraanDetik();
            } else {
                simpanStatusKunci();
                paparMesejLogMasuk(`E-mel atau kata laluan tidak sah.<br>Baki percubaan anda: <strong>${3 - jumlahPercubaanGagal} kali</strong>`, "error");
            }
        } else {
            jumlahPercubaanGagal = 0;
            kunciLogMasukSehingga = 0;
            simpanStatusKunci();

            if (loginMsgBox) loginMsgBox.style.display = "none";
            updateAdminUI(data.session);
        }
    });
}

async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateAdminUI(session);
}

function updateAdminUI(session) {
    if (!adminAuthBox || !adminDashboardBox) return;
    if (session) {
        adminAuthBox.style.display = "none";
        adminDashboardBox.style.display = "block";
        renderAdminList();
        renderAdminAyatList();
        renderAdminKuizList();
    } else {
        adminAuthBox.style.display = "block";
        adminDashboardBox.style.display = "none";
    }
}

if (btnLogKeluar) {
    btnLogKeluar.addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        updateAdminUI(null);
    });
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateAdminUI(session);
});

checkUserSession();
loadDataFromSupabase();
renderSearchCard();
renderSearchAyatCard();
