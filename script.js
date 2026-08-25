const SUPABASE_URL = "https://ejivaczazdimurhtlmsj.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaXZhY3phemRpbXVyaHRsbXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzEzMjAsImV4cCI6MjA5NDgwNzMyMH0._pjuat4uPjujjRiZyj1331vySeMXPGU_SGpzdfkfSSg";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// KESELAMATAN FRONTEND: Sanitization & escaping
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
        const decoded = result.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#0*39;/gi, "'").replace(/&#x0*27;/gi, "'").replace(/&amp;/gi, "&");
        if (decoded === result) break;
        result = decoded;
    }
    return result;
}

function sanitizeHtml(html) {
    return DOMPurify.sanitize(decodeEscapedRichHtml(html), SAFE_HTML_CONFIG);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeAttr(value) { return escapeHtml(value); }
function sanitizeEditorHtml(html) { return sanitizeHtml(html); }

// Pembolehubah Global
let dataIstilah = [];
let dataAyat = []; 
let currentSearch = "";
let selectedSearchItem = null;
let selectedAyatItem = null; 
let lastFocusedTableInput = null; 

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

// =========================================================================
// LOGIK NAVIGASI
// =========================================================================
navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(btn => btn.classList.remove("active"));
        viewSections.forEach(sec => sec.classList.remove("active"));
        button.classList.add("active");
        const targetSection = button.getAttribute("data-target");
        document.getElementById(targetSection).classList.add("active");
        btnFloatingSearch.style.display = (targetSection === 'sectionCarian' || targetSection === 'sectionAyat') ? "flex" : "none";
        if(targetSection === 'sectionAdmin') { closeForm(); closeFormAyat(); }
    });
});

if (btnFloatingSearch) {
    btnFloatingSearch.addEventListener("click", () => {
        const isAyatTab = document.getElementById("sectionAyat").classList.contains("active");
        const targetInput = isAyatTab ? searchAyatInput : searchInput;
        if (targetInput) {
            targetInput.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => { targetInput.focus(); targetInput.select(); }, 400);
        }
    });
}

// =========================================================================
// MUAT DATA & DATALIST
// =========================================================================
async function loadDataFromSupabase() {
    const resIstilah = await supabaseClient.from('istilah_arab').select('*').order('title_ms', { ascending: true });
    if (resIstilah.error) console.error("Ralat istilah:", resIstilah.error.message);
    else dataIstilah = resIstilah.data;

    const resAyat = await supabaseClient.from('koleksi_ayat').select('*');
    if (resAyat.error) console.error("Ralat ayat:", resAyat.error.message);
    else dataAyat = resAyat.data;

    renderAdminList();
    renderAdminAyatList();
    renderAlphabeticalDirectory();
    kemaskiniSenaraiDatalist();
}

function kemaskiniSenaraiDatalist() {
    const listSorof = document.getElementById("senaraiSorof");
    const listNahu = document.getElementById("senaraiNahu");
    const listNombor = document.getElementById("senaraiNombor");
    
    if (!listSorof || !listNahu) return;

    listSorof.innerHTML = ""; listNahu.innerHTML = ""; 
    if(listNombor) listNombor.innerHTML = "";

    dataIstilah.forEach(item => {
        if (item.title_ms) {
            const istilahVal = escapeAttr(item.title_ms.trim().toLowerCase());
            const option = `<option value="${istilahVal}"></option>`;

            if (item.disiplin_ilmu === 'sorof') listSorof.innerHTML += option;
            else if (item.disiplin_ilmu === 'nahu') listNahu.innerHTML += option;
            else if (item.disiplin_ilmu === 'nombor' && listNombor) listNombor.innerHTML += option;
            else {
                listSorof.innerHTML += option;
                listNahu.innerHTML += option;
                if(listNombor) listNombor.innerHTML += option;
            }
        }
    });
}

function stripHtml(html) {
    if (!html) return "";
    let tmp = document.createElement("DIV");
    tmp.innerHTML = sanitizeHtml(html);
    return tmp.textContent || tmp.innerText || "";
}

// =========================================================================
// PAPARAN AWAM: KOLEKSI AYAT
// =========================================================================
function handleSearchAyatInput(e) {
    const val = e.target.value.trim().toLowerCase();
    if (val.length < 3) {
        selectedAyatItem = null; suggestionsAyatList.style.display = "none";
        renderSearchAyatCard(); return;
    }

    const matches = dataAyat.filter(item => {
        const plainAr = stripHtml(item.ayat_ar).toLowerCase();
        const plainMs = stripHtml(item.terjemahan_ms).toLowerCase();
        return (item.kata_kunci && item.kata_kunci.toLowerCase().includes(val)) || plainAr.includes(val) || plainMs.includes(val);
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
            let keywordsHtml = item.kata_kunci && item.kata_kunci.trim() !== "" ? `<div style="font-size: 0.75rem; color: var(--accent-color); margin-top: 6px; display: flex; align-items: center; gap: 4px; font-weight: 500;"><span>🏷️</span> <span>${escapeHtml(item.kata_kunci)}</span></div>` : "";
            div.innerHTML = `<div class="suggestion-info" style="display: flex; flex-direction: column; justify-content: center;"><span class="suggestion-title">${escapeHtml(stripHtml(item.terjemahan_ms).substring(0, 40))}...</span>${keywordsHtml}</div><div class="suggestion-arabic">${escapeHtml(stripHtml(item.ayat_ar).substring(0, 30))}...</div>`;
            div.addEventListener("click", () => {
                selectedAyatItem = item; searchAyatInput.value = ""; 
                suggestionsAyatList.style.display = "none"; renderSearchAyatCard();
                resultsAyatList.scrollIntoView({ behavior: "smooth" });
            });
            suggestionsAyatList.appendChild(div);
        });
    } else {
        suggestionsAyatList.innerHTML = `<div class="no-match-item">Tiada ayat yang sepadan dijumpai</div>`;
    }
    suggestionsAyatList.style.display = "block";
}
searchAyatInput.addEventListener("input", handleSearchAyatInput);

function renderSearchAyatCard() {
    resultsAyatList.innerHTML = "";
    if (!selectedAyatItem) {
        resultsAyatList.innerHTML = `<div class="welcome-message"><strong>Koleksi Ayat & Terjemahan</strong><br>Sila taip kata dasar atau rujukan tatabahasa di atas untuk memaparkan senarai ayat.</div>`;
        return;
    }

    const card = document.createElement("div");
    card.className = "card"; card.style.overflow = "hidden"; 
    
    let displayAyatAr = selectedAyatItem.ayat_ar ? sanitizeHtml(selectedAyatItem.ayat_ar).replace(/admin-highlight/g, "public-highlight") : "";
    let displayTerjemahan = selectedAyatItem.terjemahan_ms ? sanitizeHtml(selectedAyatItem.terjemahan_ms).replace(/admin-highlight/g, "public-highlight") : "";
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = displayAyatAr + " " + displayTerjemahan;
    const marks = tempDiv.querySelectorAll("mark.public-highlight");
    
    const sorofSet = new Set(), nahuSet = new Set(), nomborSet = new Set(), legacySet = new Set();
    
    marks.forEach(m => {
        if (m.getAttribute("data-sorof")) sorofSet.add(m.getAttribute("data-sorof"));
        if (m.getAttribute("data-nahu")) nahuSet.add(m.getAttribute("data-nahu"));
        if (m.getAttribute("data-nombor")) nomborSet.add(m.getAttribute("data-nombor"));
        if (m.getAttribute("data-key")) legacySet.add(m.getAttribute("data-key"));
    });

    let badgesHtml = "";
    if (sorofSet.size > 0 || nahuSet.size > 0 || nomborSet.size > 0 || legacySet.size > 0) {
        let sHtml = "", nHtml = "", nomHtml = "", lHtml = "";

        if (sorofSet.size > 0) sHtml = `<div style="margin-bottom: 16px;"><div style="font-size: 0.75rem; color: #059669; text-align: center; margin-bottom: 8px; font-weight: 700; text-transform: uppercase;">Morfologi (Ilmu Sorof)</div><div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">${Array.from(sorofSet).map(kw => `<span class="badge-keyword badge-sorof" data-target="${escapeAttr(kw)}" data-type="sorof">${escapeHtml(kw)}</span>`).join('')}</div></div>`;
        if (nahuSet.size > 0) nHtml = `<div style="margin-bottom: 12px;"><div style="font-size: 0.75rem; color: #0284c7; text-align: center; margin-bottom: 8px; font-weight: 700; text-transform: uppercase;">Sintaksis (Ilmu Nahu)</div><div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">${Array.from(nahuSet).map(kw => `<span class="badge-keyword badge-nahu" data-target="${escapeAttr(kw)}" data-type="nahu">${escapeHtml(kw)}</span>`).join('')}</div></div>`;
        if (nomborSet.size > 0) nomHtml = `<div style="margin-bottom: 12px;"><div style="font-size: 0.75rem; color: #7e22ce; text-align: center; margin-bottom: 8px; font-weight: 700; text-transform: uppercase;">Penomboran ('Adad)</div><div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">${Array.from(nomborSet).map(kw => `<span class="badge-keyword badge-nombor" data-target="${escapeAttr(kw)}" data-type="nombor">${escapeHtml(kw)}</span>`).join('')}</div></div>`;
        if (legacySet.size > 0 && sorofSet.size === 0 && nahuSet.size === 0 && nomborSet.size === 0) lHtml = `<div style="margin-bottom: 12px;"><div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-bottom: 8px; font-weight: 700; text-transform: uppercase;">Kata Kunci</div><div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">${Array.from(legacySet).map(kw => `<span class="badge-keyword" data-target="${escapeAttr(kw)}" data-type="legacy">${escapeHtml(kw)}</span>`).join('')}</div></div>`;

        badgesHtml = `
        <div style="background-color: #f8fafc; border-top: 1px solid var(--border-color); padding: 20px; margin: 24px -20px -20px -20px;">
            <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-bottom: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Pilih Kata Kunci Untuk Serlahkan Ayat</div>
            ${sHtml}${nHtml}${nomHtml}${lHtml}
            <div id="dynamicDefBox" class="keyword-definition-box">
                <div class="kw-def-title"><span id="defTitleMs"></span><span id="defTitleAr" class="kw-def-ar"></span></div>
                <div id="defContent" class="kw-def-content"></div>
            </div>
        </div>`;
    }

    card.innerHTML = `<div class="card-body"><div style="text-align: center; font-family: var(--font-arabic); font-size: 2.2rem; color: var(--accent-color); direction: rtl; line-height: 1.8; margin-bottom: 24px; margin-top: 10px;">${displayAyatAr}</div><div style="border-top: 1px dashed var(--border-color); padding-top: 20px; font-size: 1.15rem; color: #2d3748; line-height: 1.6; text-align: center;"><strong>Maksud:</strong><br>${displayTerjemahan}</div>${badgesHtml}</div>`;
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
            highlightElements.forEach(h => { h.classList.remove("active", "active-sorof", "active-nahu", "active-nombor"); });
            if(defBox) defBox.classList.remove("active");
            
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
                        if (targetType === 'sorof') defBox.style.borderLeftColor = "#059669";
                        else if (targetType === 'nahu') defBox.style.borderLeftColor = "#0284c7";
                        else if (targetType === 'nombor') defBox.style.borderLeftColor = "#9333ea";
                        else defBox.style.borderLeftColor = "var(--accent-color)";
                        defContent.innerHTML = termObj.definition ? sanitizeHtml(termObj.definition).replace(/\n/g, "<br>") : "<i>Tiada penerangan khusus disediakan di dalam Kamus Istilah.</i>";
                    } else {
                        defTitleMs.textContent = targetKey; defTitleAr.textContent = "";
                        defBox.style.borderLeftColor = "#cbd5e0";
                        defContent.innerHTML = `<i>Tiada rekod terperinci dijumpai di dalam Kamus Istilah.</i>`;
                    }
                    defBox.classList.add("active");
                }
            }
        });
    });
}

document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) suggestionsList.style.display = "none";
    if (!searchAyatInput.contains(e.target) && !suggestionsAyatList.contains(e.target)) suggestionsAyatList.style.display = "none";
});

// =========================================================================
// PANEL ADMIN: KAWALAN PAPARAN JADUAL
// =========================================================================
btnTabJadualIstilah.addEventListener("click", () => {
    jadualIstilahWrapper.style.display = "block"; jadualAyatWrapper.style.display = "none";
    btnTabJadualIstilah.classList.replace("btn-secondary", "btn-primary");
    btnTabJadualIstilah.style.backgroundColor = ""; btnTabJadualIstilah.style.color = "";
    btnTabJadualAyat.classList.replace("btn-primary", "btn-secondary");
    btnTabJadualAyat.style.backgroundColor = "var(--border-color)"; btnTabJadualAyat.style.color = "var(--text-color)";
});

btnTabJadualAyat.addEventListener("click", () => {
    jadualIstilahWrapper.style.display = "none"; jadualAyatWrapper.style.display = "block";
    btnTabJadualAyat.classList.replace("btn-secondary", "btn-primary");
    btnTabJadualAyat.style.backgroundColor = ""; btnTabJadualAyat.style.color = "";
    btnTabJadualIstilah.classList.replace("btn-primary", "btn-secondary");
    btnTabJadualIstilah.style.backgroundColor = "var(--border-color)"; btnTabJadualIstilah.style.color = "var(--text-color)";
});

// =========================================================================
// PANEL ADMIN: VISUAL EDITOR AYAT (Sorof, Nahu, Nombor)
// =========================================================================
function addHighlight() {
    const modal = document.getElementById("customPromptModal");
    const inputArab = document.getElementById("promptArab");
    const inputMelayu = document.getElementById("promptMelayu");
    const inputSorof = document.getElementById("promptKataKunciSorof");
    const inputNahu = document.getElementById("promptKataKunciNahu");
    const inputNombor = document.getElementById("promptKataKunciNombor");
    
    if(inputArab) inputArab.value = "";
    if(inputMelayu) inputMelayu.value = "";
    if(inputSorof) inputSorof.value = "";
    if(inputNahu) inputNahu.value = "";
    if(inputNombor) inputNombor.value = "";
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
        const anchorNode = selection.anchorNode;
        const editorArab = document.getElementById("ayatArEditor");
        const editorMelayu = document.getElementById("terjemahanMsEditor");

        if (editorArab && editorArab.contains(anchorNode)) inputArab.value = selectedText;
        else if (editorMelayu && editorMelayu.contains(anchorNode)) inputMelayu.value = selectedText;
        else inputArab.value = selectedText;
    }

    modal.style.display = "flex";
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
        const kataKunciNombor = document.getElementById("promptKataKunciNombor") ? document.getElementById("promptKataKunciNombor").value.trim() : "";

        if (!perkataanArab || (!kataKunciSorof && !kataKunciNahu && !kataKunciNombor)) {
            alert("Sila isi Perkataan Arab dan sekurang-kurangnya satu Kata Kunci (Sorof, Nahu, atau Penomboran).");
            return;
        }

        const editorArab = document.getElementById("ayatArEditor");
        const editorMelayu = document.getElementById("terjemahanMsEditor");
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const regexArab = new RegExp(`(${escapeRegExp(perkataanArab)})`);
        let regexMelayu = null;

        // PENAMBAHBAIKAN KESELAMATAN: Sanitasi amaran (Alert Escaping)
        if (!regexArab.test(editorArab.innerHTML)) {
            alert(`Ralat: Perkataan Arab "${escapeHtml(perkataanArab)}" tidak dijumpai di dalam teks editor Arab. Sila periksa ejaan.`);
            return; 
        }

        if (perkataanMelayu !== "") {
            regexMelayu = new RegExp(`(${escapeRegExp(perkataanMelayu)})`);
            if (!regexMelayu.test(editorMelayu.innerHTML)) {
                alert(`Ralat: Terjemahan "${escapeHtml(perkataanMelayu)}" tidak dijumpai di dalam teks editor Melayu.`);
                return; 
            }
        }

        let dataAttributes = "";
        let tooltipTitles = [];
        
        if (kataKunciSorof) { dataAttributes += ` data-sorof="${escapeAttr(kataKunciSorof.toLowerCase())}"`; tooltipTitles.push(`Sorof: ${kataKunciSorof}`); }
        if (kataKunciNahu) { dataAttributes += ` data-nahu="${escapeAttr(kataKunciNahu.toLowerCase())}"`; tooltipTitles.push(`Nahu: ${kataKunciNahu}`); }
        if (kataKunciNombor) { dataAttributes += ` data-nombor="${escapeAttr(kataKunciNombor.toLowerCase())}"`; tooltipTitles.push(`Nombor: ${kataKunciNombor}`); }
        
        const combinedTooltip = escapeAttr(tooltipTitles.join(" | "));
        const markElementHtml = `<mark class="admin-highlight"${dataAttributes} title="${combinedTooltip}">$1</mark>`;

        editorArab.innerHTML = editorArab.innerHTML.replace(regexArab, markElementHtml);
        if (regexMelayu) editorMelayu.innerHTML = editorMelayu.innerHTML.replace(regexMelayu, markElementHtml);

        updateKeywordsList();
        document.getElementById("customPromptModal").style.display = "none";
    });
}

const btnCustomPromptCancel = document.getElementById("btnCustomPromptCancel");
if (btnCustomPromptCancel) btnCustomPromptCancel.addEventListener("click", () => document.getElementById("customPromptModal").style.display = "none");

function removeHighlight() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    let node = selection.anchorNode;
    if (node.nodeType === 3) node = node.parentNode; 
    
    if (node.tagName === "MARK" && node.classList.contains("admin-highlight")) {
        const text = document.createTextNode(node.textContent);
        node.parentNode.replaceChild(text, node);
        updateKeywordsList();
    } else { alert("Sila klik tepat pada perkataan berwarna kuning (highlight) yang ingin dibuang pautannya."); }
}

function updateKeywordsList() {
    const marks1 = Array.from(ayatArEditor.querySelectorAll("mark.admin-highlight"));
    const marks2 = Array.from(terjemahanMsEditor.querySelectorAll("mark.admin-highlight"));
    const allMarks = [...marks1, ...marks2];
    
    const sorofSet = new Set(), nahuSet = new Set(), nomborSet = new Set(), legacySet = new Set();
    
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
    if (inputHiddenAll) inputHiddenAll.value = Array.from(new Set([...sorofSet, ...nahuSet, ...nomborSet, ...legacySet])).join(", ");
}

ayatArEditor.addEventListener('input', updateKeywordsList);
terjemahanMsEditor.addEventListener('input', updateKeywordsList);

// =========================================================================
// PANEL ADMIN: CRUD KOLEKSI AYAT
// =========================================================================
btnBukaBorangAyat.addEventListener("click", () => {
    closeForm(); ayatForm.reset(); inputAyatId.value = "";
    ayatArEditor.innerHTML = ""; terjemahanMsEditor.innerHTML = "";
    updateKeywordsList(); formAyatTitle.textContent = "Tambah Koleksi Ayat Baru"; formAyatSection.classList.add("active");
});

btnBatalAyat.addEventListener("click", closeFormAyat);
function closeFormAyat() { 
    formAyatSection.classList.remove("active"); ayatForm.reset(); inputAyatId.value = ""; 
    ayatArEditor.innerHTML = ""; terjemahanMsEditor.innerHTML = ""; updateKeywordsList();
}

function renderAdminAyatList(filterText = "") {
    adminTableAyatBody.innerHTML = "";
    const lowerFilter = filterText.toLowerCase();

    const filteredData = dataAyat.filter(item => {
        const plainAr = stripHtml(item.ayat_ar).toLowerCase();
        const plainMs = stripHtml(item.terjemahan_ms).toLowerCase();
        return plainAr.includes(lowerFilter) || plainMs.includes(lowerFilter) || (item.kata_kunci && item.kata_kunci.toLowerCase().includes(lowerFilter));
    });

    if (filteredData.length === 0) { adminTableAyatBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 24px; color: var(--text-muted);">Tiada rekod ayat dijumpai.</td></tr>`; return; }

    filteredData.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="td-arabic" style="font-size: 1.1rem;">${escapeHtml(stripHtml(item.ayat_ar))}</td><td><strong>${escapeHtml(stripHtml(item.terjemahan_ms))}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">Kata kunci: ${escapeHtml(item.kata_kunci)}</span></td><td><div class="actions-cell" style="display:flex; gap:6px;"><button class="btn btn-edit" type="button" data-action="edit-ayat" data-id="${escapeAttr(item.id)}">Ubah</button><button class="btn btn-danger" type="button" data-action="delete-ayat" data-id="${escapeAttr(item.id)}">Padam</button></div></td>`;
        adminTableAyatBody.appendChild(tr);
    });
}

if (adminSearchAyatInput) adminSearchAyatInput.addEventListener("input", (e) => renderAdminAyatList(e.target.value.trim()));

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
    }
});

ayatForm.addEventListener("submit", async (e) => {
    e.preventDefault(); updateKeywordsList();
    const ayatObject = { ayat_ar: sanitizeEditorHtml(ayatArEditor.innerHTML.trim()), terjemahan_ms: sanitizeEditorHtml(terjemahanMsEditor.innerHTML.trim()), kata_kunci: inputKataKunciAyat.value.trim() };
    if (inputAyatId.value) ayatObject.id = inputAyatId.value;
    const { error } = await supabaseClient.from('koleksi_ayat').upsert([ayatObject]);
    if (error) alert("Ralat Keselamatan RLS: " + error.message);
    else { selectedAyatItem = null; searchAyatInput.value = ""; closeFormAyat(); await loadDataFromSupabase(); renderSearchAyatCard(); }
});

function editAyat(id) {
    const item = dataAyat.find(item => item.id === id);
    if (!item) return;
    closeForm(); formAyatTitle.textContent = "Ubah Koleksi Ayat"; inputAyatId.value = item.id;
    ayatArEditor.innerHTML = sanitizeEditorHtml(item.ayat_ar || ""); terjemahanMsEditor.innerHTML = sanitizeEditorHtml(item.terjemahan_ms || "");
    updateKeywordsList(); formAyatSection.classList.add("active"); formAyatSection.scrollIntoView({ behavior: "smooth" });
}

async function deleteAyat(id) {
    if (confirm("Adakah anda pasti mahu memadam koleksi ayat ini?")) {
        const { error } = await supabaseClient.from('koleksi_ayat').delete().eq('id', id);
        if (error) alert("Ralat Keselamatan RLS: " + error.message);
        else { selectedAyatItem = null; searchAyatInput.value = ""; await loadDataFromSupabase(); renderSearchAyatCard(); }
    }
}

// =========================================================================
// DIREKTORI ABJAD, CARIAN ISTILAH, DAN ADMIN ISTILAH
// =========================================================================
function renderAlphabeticalDirectory() {
    if (!alphabeticalDirectory) return;
    alphabeticalDirectory.innerHTML = `<div class="directory-container"><div class="directory-title">📁 Senarai Indeks Istilah (Ikut Abjad)</div><div id="directoryGroups"></div></div>`;
    const groupsDiv = document.getElementById("directoryGroups");
    const groups = {};
    dataIstilah.forEach(item => {
        if (!item.title_ms) return;
        const firstLetter = item.title_ms.trim().charAt(0).toUpperCase();
        if (!groups[firstLetter]) groups[firstLetter] = [];
        groups[firstLetter].push(item);
    });
    const sortedLetters = Object.keys(groups).sort();
    if (sortedLetters.length === 0) { groupsDiv.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 12px;">Tiada istilah untuk dipaparkan.</div>`; return; }

    sortedLetters.forEach(letter => {
        const letterGroup = document.createElement("div"); letterGroup.className = "dir-letter-group";
        letterGroup.innerHTML = `<div class="dir-letter-header"><span>Huruf ${letter} (${groups[letter].length} Istilah)</span><span class="dir-toggle-icon">▼</span></div><div class="dir-letter-content">${groups[letter].map(item => `<div class="dir-item" data-id="${escapeAttr(item.id)}"><span>${escapeHtml(item.title_ms)}</span><span class="dir-item-ar">${escapeHtml(item.title_ar || "")}</span></div>`).join("")}</div>`;
        const header = letterGroup.querySelector(".dir-letter-header"), content = letterGroup.querySelector(".dir-letter-content"), icon = letterGroup.querySelector(".dir-toggle-icon");
        header.addEventListener("click", () => {
            if (content.classList.contains("open")) { content.classList.remove("open"); icon.textContent = "▼"; } 
            else { content.classList.add("open"); icon.textContent = "▲"; }
        });
        letterGroup.querySelectorAll(".dir-item").forEach(itemEl => {
            itemEl.addEventListener("click", () => {
                const foundItem = dataIstilah.find(i => i.id === itemEl.getAttribute("data-id"));
                if (foundItem) { selectedSearchItem = foundItem; searchInput.value = foundItem.title_ms; renderSearchCard(); resultsList.scrollIntoView({ behavior: "smooth" }); }
            });
        });
        groupsDiv.appendChild(letterGroup);
    });
}

function handleSearchInput(e) {
    currentSearch = e.target.value.trim();
    if (currentSearch === "") { selectedSearchItem = null; suggestionsList.style.display = "none"; renderSearchCard(); return; }

    const matches = dataIstilah.filter(item => {
        const lower = currentSearch.toLowerCase();
        return item.title_ms.toLowerCase().includes(lower) || item.title_ar.includes(lower) || (item.keywords && item.keywords.some(kw => kw.includes(lower)));
    });

    suggestionsList.innerHTML = "";
    if (matches.length > 0) {
        matches.forEach(item => {
            const div = document.createElement("div"); div.className = "suggestion-item";
            let paparanKategori = 'Tiada Kategori';
            if (item.disiplin_ilmu === 'sorof') paparanKategori = 'Sorof';
            else if (item.disiplin_ilmu === 'nahu') paparanKategori = 'Nahu';
            else if (item.disiplin_ilmu === 'nombor') paparanKategori = 'Penomboran';

            div.innerHTML = `<div class="suggestion-info"><span class="suggestion-title">${escapeHtml(item.title_ms)}</span><span class="suggestion-cat">${escapeHtml(paparanKategori)}</span></div><div class="suggestion-arabic">${escapeHtml(item.title_ar)}</div>`;
            div.addEventListener("click", () => {
                selectedSearchItem = item; searchInput.value = item.title_ms; suggestionsList.style.display = "none";
                renderSearchCard(); resultsList.scrollIntoView({ behavior: "smooth" });
            });
            suggestionsList.appendChild(div);
        });
    } else { suggestionsList.innerHTML = `<div class="no-match-item">Tiada pilihan yang sepadan</div>`; }
    suggestionsList.style.display = "block";
}
searchInput.addEventListener("input", handleSearchInput);

function renderSearchCard() {
    resultsList.innerHTML = "";
    if (!selectedSearchItem) { resultsList.innerHTML = `<div class="welcome-message" style="margin-bottom: 24px;"><strong>Selamat Datang!</strong><br>Sila taip nama terma di atas atau pilih daripada indeks abjad untuk memaparkan pilihan carian.</div>`; return; }

    const card = document.createElement("div"); card.className = "card"; card.style.marginBottom = "32px";
    
    let formattedCharacteristics = "";
    if (selectedSearchItem.characteristics && selectedSearchItem.characteristics.length > 0) {
        selectedSearchItem.characteristics.forEach(c => {
            try {
                if (c.startsWith('{') && c.endsWith('}')) {
                    const parsed = JSON.parse(c);
                    if (parsed.mainTitle) formattedCharacteristics += `<div style="margin-top: 24px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 16px;"><span style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">${escapeHtml(parsed.mainTitle)}</span></div>`;
                    if (parsed.subTitle) formattedCharacteristics += `<div style="margin-top: 12px; margin-bottom: 8px; font-size: 1.05rem; font-weight: bold; color: var(--primary-color);">${escapeHtml(parsed.subTitle)}:</div>`;
                    if (parsed.content) formattedCharacteristics += `<div class="definition" style="margin-bottom: 16px; line-height: 1.6;">${sanitizeHtml(parsed.content).replace(/\n/g, "<br>")}</div>`;
                    
                    if (parsed.table_data && parsed.table_data.headers && parsed.table_data.rows && parsed.table_data.rows.length > 0) {
                        const tTitle = parsed.table_data.table_title ? String(parsed.table_data.table_title).trim() : "";
                        const tHeaders = parsed.table_data.headers || []; const tRows = parsed.table_data.rows || [];
                        let hasColumn4 = tHeaders[3]?.trim() !== "" || tRows.some(row => row[3]?.trim() !== "");
                        let th4Html = hasColumn4 ? `<th style="text-align: center;">${sanitizeHtml(tHeaders[3] || "")}</th>` : "";
                        let titleHtml = tTitle !== "" ? `<div style="margin-top: 20px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 12px;"><span style="font-size: 1.15rem; font-weight: 700; color: var(--primary-color);">${escapeHtml(tTitle)}</span></div>` : "";

                        formattedCharacteristics += `${titleHtml}<div class="table-container" style="margin-bottom: 24px;"><table><thead><tr><th>${sanitizeHtml(tHeaders[0] || "")}</th><th style="text-align: center;">${sanitizeHtml(tHeaders[1] || "")}</th><th style="text-align: center;">${sanitizeHtml(tHeaders[2] || "")}</th>${th4Html}</tr></thead><tbody>${tRows.map(row => { let td4Html = hasColumn4 ? `<td style="text-align: center;">${sanitizeHtml(row[3] || "")}</td>` : ""; return `<tr><td>${sanitizeHtml(row[0] || "")}</td><td style="text-align: center;">${sanitizeHtml(row[1] || "")}</td><td style="text-align: center;">${sanitizeHtml(row[2] || "")}</td>${td4Html}</tr>`; }).join("")}</tbody></table></div>`;
                    }
                } else formattedCharacteristics += `<div style="margin-bottom: 8px; line-height: 1.6;">${sanitizeHtml(c).replace(/\n/g, "<br>")}</div>`;
            } catch (e) { formattedCharacteristics += `<div style="margin-bottom: 8px; line-height: 1.6;">${sanitizeHtml(c).replace(/\n/g, "<br>")}</div>`; }
        });
    }

    let legacyStandaloneTableHtml = "";
    if (selectedSearchItem.table_data && selectedSearchItem.table_data.headers && selectedSearchItem.table_data.rows && selectedSearchItem.table_data.rows.length > 0) {
        const tableTitle = selectedSearchItem.table_data.table_title ? String(selectedSearchItem.table_data.table_title).trim() : "";
        const tHeadersLegacy = selectedSearchItem.table_data.headers || []; const tRowsLegacy = selectedSearchItem.table_data.rows || [];
        let hasColumn4Legacy = tHeadersLegacy[3]?.trim() !== "" || tRowsLegacy.some(row => row[3]?.trim() !== "");
        let th4LegacyHtml = hasColumn4Legacy ? `<th style="text-align: center;">${sanitizeHtml(tHeadersLegacy[3] || "")}</th>` : "";
        let legacyTitleHtml = tableTitle !== "" ? `<div style="margin-top: 24px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 16px;"><span style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">${escapeHtml(tableTitle)}</span></div>` : "";

        legacyStandaloneTableHtml = `${legacyTitleHtml}<div class="table-container"><table><thead><tr><th>${sanitizeHtml(tHeadersLegacy[0] || "")}</th><th style="text-align: center;">${sanitizeHtml(tHeadersLegacy[1] || "")}</th><th style="text-align: center;">${sanitizeHtml(tHeadersLegacy[2] || "")}</th>${th4LegacyHtml}</tr></thead><tbody>${tRowsLegacy.map(row => { let td4LegacyHtml = hasColumn4Legacy ? `<td style="text-align: center;">${sanitizeHtml(row[3] || "")}</td>` : ""; return `<tr><td>${sanitizeHtml(row[0] || "")}</td><td style="text-align: center;">${sanitizeHtml(row[1] || "")}</td><td style="text-align: center;">${sanitizeHtml(row[2] || "")}</td>${td4LegacyHtml}</tr>`; }).join("")}</tbody></table></div>`;
    }

    let formattedDefinition = selectedSearchItem.definition ? sanitizeHtml(selectedSearchItem.definition).replace(/\n/g, "<br>") : "";
    let paparanKategori = '';
    if (selectedSearchItem.disiplin_ilmu === 'sorof') paparanKategori = 'Sorof';
    else if (selectedSearchItem.disiplin_ilmu === 'nahu') paparanKategori = 'Nahu';
    else if (selectedSearchItem.disiplin_ilmu === 'nombor') paparanKategori = 'Penomboran';

    card.innerHTML = `<div class="card-header"><div class="card-title-group"><div class="title-ms">${escapeHtml(selectedSearchItem.title_ms)}</div>${paparanKategori ? `<span class="category-badge">${escapeHtml(paparanKategori)}</span>` : ''}</div><div class="title-ar">${escapeHtml(selectedSearchItem.title_ar)}</div></div><div class="card-body"><div class="definition">${formattedDefinition}</div><div class="definition" style="line-height: 1.6;">${formattedCharacteristics}</div>${legacyStandaloneTableHtml}</div>`;
    resultsList.appendChild(card);
}

function renderAdminList(filterText = "") {
    adminTableBody.innerHTML = "";
    const lowerFilter = filterText.toLowerCase();

    const filteredData = dataIstilah.filter(item => {
        return item.title_ms.toLowerCase().includes(lowerFilter) || item.title_ar.includes(lowerFilter) || (item.disiplin_ilmu && item.disiplin_ilmu.toLowerCase().includes(lowerFilter)) || (item.keywords && item.keywords.some(kw => kw.includes(lowerFilter)));
    });

    if (filteredData.length === 0) { adminTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: var(--text-muted);">Tiada istilah yang sepadan dengan carian anda.</td></tr>`; return; }

    filteredData.forEach(item => {
        const tr = document.createElement("tr");
        let paparanKategori = 'Kosong';
        if (item.disiplin_ilmu === 'sorof') paparanKategori = 'Sorof';
        else if (item.disiplin_ilmu === 'nahu') paparanKategori = 'Nahu';
        else if (item.disiplin_ilmu === 'nombor') paparanKategori = 'Penomboran';

        tr.innerHTML = `<td><strong>${escapeHtml(item.title_ms)}</strong></td><td class="td-arabic">${escapeHtml(item.title_ar)}</td><td><span class="badge">${escapeHtml(paparanKategori)}</span></td><td><div class="actions-cell"><button class="btn btn-edit" type="button" data-action="edit-item" data-id="${escapeAttr(item.id)}">Ubah</button><button class="btn btn-danger" type="button" data-action="delete-item" data-id="${escapeAttr(item.id)}">Padam</button></div></td>`;
        adminTableBody.appendChild(tr);
    });
}

if (adminSearchInput) adminSearchInput.addEventListener("input", (e) => renderAdminList(e.target.value.trim()));

termForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = inputId.value || "term-" + Date.now();
    const kwArray = inputKeywords.value.split(",").map(k => k.trim().toLowerCase()).filter(k => k !== "");
    const ciriElements = ciriSectionsContainer.querySelectorAll(".ciri-section-item");
    const chrArray = [];
    
    ciriElements.forEach(item => {
        const mTitle = item.querySelector(".ciri-main-title-input").value.trim(), sTitle = item.querySelector(".ciri-sub-title-input").value.trim(), content = item.querySelector(".ciri-content-input").value.trim();
        const tableBox = item.querySelector(".ciri-table-builder");
        let embeddedTableObj = null;
        if (tableBox && tableBox.style.display !== "none") {
            const tTitle = tableBox.querySelector(".ciri-table-title").value.trim(), h1 = sanitizeEditorHtml(tableBox.querySelector(".th-1").value.trim()), h2 = sanitizeEditorHtml(tableBox.querySelector(".th-2").value.trim()), h3 = sanitizeEditorHtml(tableBox.querySelector(".th-3").value.trim()), h4 = sanitizeEditorHtml(tableBox.querySelector(".th-4").value.trim());
            const rItems = tableBox.querySelectorAll(".builder-row-item");
            const rowsData = [];
            rItems.forEach(row => {
                const v1 = sanitizeEditorHtml(row.querySelector(".col-1").value.trim()), v2 = sanitizeEditorHtml(row.querySelector(".col-2").value.trim()), v3 = sanitizeEditorHtml(row.querySelector(".col-3").value.trim()), v4 = sanitizeEditorHtml(row.querySelector(".col-4").value.trim());
                if (v1 || v2 || v3 || v4) rowsData.push([v1, v2, v3, v4]);
            });
            if (h1 || h2 || h3 || h4 || rowsData.length > 0) embeddedTableObj = { table_title: tTitle, headers: [h1, h2, h3, h4], rows: rowsData };
        }
        if (mTitle || sTitle || content || embeddedTableObj) chrArray.push(JSON.stringify({ mainTitle: mTitle, subTitle: sTitle, content: sanitizeEditorHtml(content), table_data: embeddedTableObj }));
    });

    const termObject = {
        id: id, title_ms: inputTitleMs.value, title_ar: inputTitleAr.value, disiplin_ilmu: inputDisiplin ? inputDisiplin.value : null,
        definition: sanitizeEditorHtml(inputDefinition.value), characteristics: chrArray, table_data: null, keywords: kwArray
    };

    const { error } = await supabaseClient.from('istilah_arab').upsert([termObject]);
    if (error) alert("Ralat Keselamatan RLS / Sistem: " + error.message);
    else { selectedSearchItem = null; searchInput.value = ""; closeForm(); await loadDataFromSupabase(); renderSearchCard(); }
});

function editItem(id) {
    const item = dataIstilah.find(item => item.id === id);
    if (!item) return;
    closeFormAyat(); formTitle.textContent = "Ubah Maklumat Istilah"; inputId.value = item.id;
    inputTitleMs.value = item.title_ms; inputTitleAr.value = item.title_ar;
    if (inputDisiplin) inputDisiplin.value = item.disiplin_ilmu || ""; 
    inputKeywords.value = item.keywords ? item.keywords.join(", ") : ""; inputDefinition.value = item.definition;
    ciriSectionsContainer.innerHTML = "";
    if (item.characteristics && item.characteristics.length > 0) {
        let hasLegacy = false, legacyText = [];
        item.characteristics.forEach(c => {
            try {
                if (c.startsWith('{') && c.endsWith('}')) { const parsed = JSON.parse(c); createCiriSectionInput(parsed.mainTitle || "", parsed.subTitle || "", parsed.content || "", parsed.table_data || null); } 
                else { legacyText.push(c); hasLegacy = true; }
            } catch(e) { legacyText.push(c); hasLegacy = true; }
        });
        if (hasLegacy && legacyText.length > 0) createCiriSectionInput("", "", legacyText.join("\n"), null);
    } else createCiriSectionInput();
    formSection.classList.add("active"); formSection.scrollIntoView({ behavior: "smooth" });
}

async function deleteItem(id) {
    if (confirm("Adakah anda pasti mahu memadam istilah ini dari pangkalan data cloud?")) {
        const { error } = await supabaseClient.from('istilah_arab').delete().eq('id', id);
        if (error) alert("Ralat Keselamatan RLS: " + error.message);
        else { selectedSearchItem = null; searchInput.value = ""; await loadDataFromSupabase(); renderSearchCard(); }
    }
}

btnBukaBorang.addEventListener("click", () => {
    closeFormAyat(); termForm.reset(); inputId.value = ""; ciriSectionsContainer.innerHTML = "";
    formTitle.textContent = "Tambah Istilah Baru"; formSection.classList.add("active"); createCiriSectionInput();
});

btnBatal.addEventListener("click", closeForm);
function closeForm() { formSection.classList.remove("active"); termForm.reset(); inputId.value = ""; ciriSectionsContainer.innerHTML = ""; }

function createCiriSectionInput(mainTitleVal = "", subTitleVal = "", contentVal = "", tableDataVal = null) {
    const uniqueId = "ciriContent_" + Date.now() + Math.floor(Math.random() * 1000), tableContainerId = "ciriTableBox_" + Date.now() + Math.floor(Math.random() * 1000), rowsContainerId = "ciriTableRows_" + Date.now() + Math.floor(Math.random() * 1000);
    const sectionDiv = document.createElement("div"); sectionDiv.className = "ciri-section-item"; sectionDiv.style = "background: #fff; padding: 16px; border: 1px dashed #cbd5e0; border-radius: 8px; margin-bottom: 12px; position: relative;";
    
    let isTableVisible = tableDataVal ? "block" : "none", btnToggleText = tableDataVal ? "✓ Buang Jadual" : "+ Tambah Jadual Contoh", btnToggleClass = tableDataVal ? "btn-danger" : "btn-primary";
    let tTitle = tableDataVal?.table_title || "", th1_val = tableDataVal?.headers?.[0] || "", th2_val = tableDataVal?.headers?.[1] || "", th3_val = tableDataVal?.headers?.[2] || "", th4_val = tableDataVal?.headers?.[3] || "";

    sectionDiv.innerHTML = `<button type="button" class="btn btn-danger btn-remove-section" style="position: absolute; top: 12px; right: 12px; padding: 4px 10px;" title="Padam Seksyen Ini">X</button><div class="form-group" style="margin-top: 4px; margin-right: 40px;"><label>Tajuk Besar (Pilihan)</label><input type="text" class="form-control ciri-main-title-input" placeholder="Contoh: Baris akhir berubah" value="${escapeAttr(mainTitleVal)}"></div><div class="form-group" style="margin-top: 4px;"><label>Subtajuk (Pilihan)</label><input type="text" class="form-control ciri-sub-title-input" placeholder="Contoh: Rafa' / Nasab / Jar" value="${escapeAttr(subTitleVal)}"></div><div class="form-group" style="margin-bottom:12px;"><label>Penerangan</label><div class="text-toolbar"><button type="button" class="toolbar-btn" data-format-target="${uniqueId}" data-format="b">B</button><button type="button" class="toolbar-btn" data-format-target="${uniqueId}" data-format="u"><u>U</u></button><button type="button" class="toolbar-btn" data-format-target="${uniqueId}" data-format="i"><i>I</i></button><button type="button" class="toolbar-btn" data-format-target="${uniqueId}" data-format="bullet">• Senarai</button><div class="color-picker-wrapper"><input type="color" class="toolbar-color" data-format-target="${uniqueId}" data-format="color"></div></div><textarea id="${uniqueId}" class="form-control ciri-content-input" rows="3" placeholder="Masukkan penerangan lengkap ciri ini...">${escapeHtml(contentVal)}</textarea></div><button type="button" class="btn ${btnToggleClass} btn-toggle-table" style="padding: 4px 10px; font-size: 0.8rem; margin-bottom: 4px;">${btnToggleText}</button><div class="ciri-table-builder" id="${tableContainerId}" style="display: ${isTableVisible}; background: #f7fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px;"><div class="form-group" style="margin-bottom: 8px;"><label style="font-size: 0.85rem; color: var(--accent-color); font-weight: 600;">Tajuk Jadual (Pilihan)</label><input type="text" class="form-control ciri-table-title" placeholder="Contoh: Contoh Tasrif / Struktur" value="${escapeAttr(tTitle)}"></div><div class="text-toolbar" style="margin-bottom: 8px; width: 100%;"><button type="button" class="toolbar-btn" data-table-format="b" title="Tebal">B</button><button type="button" class="toolbar-btn" data-table-format="u" title="Garis Bawah"><u>U</u></button><button type="button" class="toolbar-btn" data-table-format="i" title="Senget"><i>I</i></button></div><div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px;"><input type="text" class="form-control th-1 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 1" value="${escapeAttr(th1_val)}"><input type="text" class="form-control th-2 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 2" value="${escapeAttr(th2_val)}"><input type="text" class="form-control th-3 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 3" value="${escapeAttr(th3_val)}"><input type="text" class="form-control th-4 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 4" value="${escapeAttr(th4_val)}"></div><div class="ciri-rows-area" id="${rowsContainerId}" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;"></div><button type="button" class="btn btn-primary btn-add-row-ciri" style="padding: 4px 8px; font-size: 0.75rem;">+ Tambah Baris Data</button></div>`;

    const tableBox = sectionDiv.querySelector(`#${tableContainerId}`), btnToggleTable = sectionDiv.querySelector(".btn-toggle-table"), rowsArea = sectionDiv.querySelector(`#${rowsContainerId}`), btnAddRowCiri = sectionDiv.querySelector(".btn-add-row-ciri");

    function addCiriTableRow(v1 = "", v2 = "", v3 = "", v4 = "") {
        const rowDiv = document.createElement("div"); rowDiv.className = "builder-row-item"; rowDiv.style = "display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 6px; align-items: center;";
        rowDiv.innerHTML = `<input type="text" class="form-control col-1 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 1" value="${escapeAttr(v1)}"><input type="text" class="form-control col-2 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 2" value="${escapeAttr(v2)}"><input type="text" class="form-control col-3 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 3" value="${escapeAttr(v3)}"><input type="text" class="form-control col-4 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 4" value="${escapeAttr(v4)}"><button type="button" class="btn btn-danger btn-remove-row" style="padding: 4px 8px; font-size:0.75rem;">X</button>`;
        rowDiv.querySelector(".btn-remove-row").addEventListener("click", () => rowDiv.remove()); rowsArea.appendChild(rowDiv);
    }

    if (tableDataVal && tableDataVal.rows) tableDataVal.rows.forEach(r => addCiriTableRow(r[0], r[1], r[2], r[3]));
    btnAddRowCiri.addEventListener("click", () => addCiriTableRow());

    btnToggleTable.addEventListener("click", () => {
        if (tableBox.style.display === "none") { tableBox.style.display = "block"; btnToggleTable.textContent = "✓ Buang Jadual"; btnToggleTable.classList.replace("btn-primary", "btn-danger"); if (rowsArea.children.length === 0) { addCiriTableRow(); addCiriTableRow(); } } 
        else { tableBox.style.display = "none"; btnToggleTable.textContent = "+ Tambah Jadual Contoh"; btnToggleTable.classList.replace("btn-danger", "btn-primary"); }
    });

    sectionDiv.querySelector(".btn-remove-section").addEventListener("click", () => sectionDiv.remove()); ciriSectionsContainer.appendChild(sectionDiv);
}
if(btnTambahCiri) btnTambahCiri.addEventListener("click", () => createCiriSectionInput());

document.addEventListener('focusin', function(e) { if (e.target && e.target.classList.contains('table-input-target')) lastFocusedTableInput = e.target; });
document.addEventListener("click", (e) => { const button = e.target.closest("button[data-format-target]"); if (button) applyFormat(button.getAttribute("data-format-target"), button.getAttribute("data-format")); });
document.addEventListener("change", (e) => { const input = e.target.closest("input[data-format-target][data-format=\"color\"]"); if (input) applyFormat(input.getAttribute("data-format-target"), "color", input.value); });
document.addEventListener("click", (e) => { const button = e.target.closest("button[data-table-format]"); if (button) applyTableFormat(button.getAttribute("data-table-format")); });
document.addEventListener("click", (e) => { const button = e.target.closest("button[data-highlight-action]"); if (button) { if (button.getAttribute("data-highlight-action") === "add") addHighlight(); if (button.getAttribute("data-highlight-action") === "remove") removeHighlight(); } });

function applyTableFormat(type, colorValue = null) {
    if (type === "color" && !/^#[0-9a-f]{6}$/i.test(String(colorValue || ""))) return;
    if (!lastFocusedTableInput) { alert("Sila klik di dalam mana-mana petak jadual terlebih dahulu."); return; }
    const input = lastFocusedTableInput, start = input.selectionStart, end = input.selectionEnd, originalText = input.value, selectedText = originalText.substring(start, end);
    let tagOpen = "", tagClose = "";
    switch (type) { case 'b': tagOpen = "<b>"; tagClose = "</b>"; break; case 'u': tagOpen = "<u>"; tagClose = "</u>"; break; case 'i': tagOpen = "<i>"; tagClose = "</i>"; break; case 'color': tagOpen = `<span style="color:${colorValue}">`; tagClose = "</span>"; break; }
    const modifiedText = tagOpen + selectedText + tagClose; input.value = originalText.substring(0, start) + modifiedText + originalText.substring(end);
    input.focus(); input.selectionStart = start; input.selectionEnd = start + modifiedText.length; input.dispatchEvent(new Event('input'));
}

function applyFormat(textareaId, type, colorValue = null) {
    if (type === "color" && !/^#[0-9a-f]{6}$/i.test(String(colorValue || ""))) return;
    const textarea = document.getElementById(textareaId); if (!textarea) return;
    const start = textarea.selectionStart, end = textarea.selectionEnd, originalText = textarea.value, selectedText = originalText.substring(start, end);
    let tagOpen = "", tagClose = "", modifiedText = "";
    switch (type) {
        case 'b': case 'u': case 'i': tagOpen = `<${type}>`; tagClose = `</${type}>`; modifiedText = tagOpen + selectedText + tagClose; break;
        case 'color': tagOpen = `<span style="color:${colorValue}">`; tagClose = "</span>"; modifiedText = tagOpen + selectedText + tagClose; break;
        case 'bullet': modifiedText = selectedText.trim().length > 0 ? `<ul class="inline-bullet-list">${selectedText.split('\n').map(line => line.trim() ? `<li>${line.trim()}</li>` : '').filter(l => l).join(' ')}</ul>` : `<ul class="inline-bullet-list"><li>Teks Senarai</li></ul>`; break;
    }
    textarea.value = originalText.substring(0, start) + modifiedText + originalText.substring(end);
    textarea.value = textarea.value.replace(/<\/ul>([\s\n]*?)<ul>/gi, '$1');
    textarea.focus(); textarea.selectionStart = start; textarea.selectionEnd = start + modifiedText.length; textarea.dispatchEvent(new Event('input'));
}

// =========================================================================
// KESELAMATAN LOG MASUK & KAWALAN PAPARAN (UI DINAMIK)
// =========================================================================

let jumlahPercubaanGagal = 0;
let kunciLogMasukSehingga = 0;
let pemasaKiraanDetik;

const loginMsgBox = document.getElementById("loginMessageAlert");
const loginBtn = loginForm.querySelector("button[type='submit']");
const emailInput = document.getElementById("loginEmail");
const passInput = document.getElementById("loginPassword");

function paparMesejLogMasuk(teks, jenis = "error") {
    if(!loginMsgBox) return;
    loginMsgBox.style.display = "block";
    loginMsgBox.className = jenis === "error" ? "alert-error" : "alert-warning";
    loginMsgBox.innerHTML = teks;
}

function mulakanKiraanDetik() {
    loginBtn.disabled = true;
    emailInput.disabled = true;
    passInput.disabled = true;
    loginBtn.style.opacity = "0.5";

    clearInterval(pemasaKiraanDetik); 

    pemasaKiraanDetik = setInterval(() => {
        const bakiMs = kunciLogMasukSehingga - Date.now();
        
        if (bakiMs <= 0) {
            clearInterval(pemasaKiraanDetik);
            jumlahPercubaanGagal = 0;
            kunciLogMasukSehingga = 0;
            
            loginMsgBox.style.display = "none";
            loginBtn.disabled = false;
            emailInput.disabled = false;
            passInput.disabled = false;
            loginBtn.style.opacity = "1";
        } else {
            const bakiSaat = Math.ceil(bakiMs / 1000);
            paparMesejLogMasuk(`Sistem dikunci sementara untuk keselamatan.<br>Sila tunggu <strong>${bakiSaat} saat</strong>.`, "warning");
        }
    }, 1000);

    const bakiSaat = Math.ceil((kunciLogMasukSehingga - Date.now()) / 1000);
    paparMesejLogMasuk(`Sistem dikunci sementara untuk keselamatan.<br>Sila tunggu <strong>${bakiSaat} saat</strong>.`, "warning");
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // 1. Semak jika sistem sedang dikunci (Rate-limiting)
    if (Date.now() < kunciLogMasukSehingga) {
        mulakanKiraanDetik();
        return;
    }

    const email = emailInput.value.trim();
    const password = passInput.value;

    // Paparkan status 'Loading'
    loginBtn.disabled = true;
    loginBtn.textContent = "Log Masuk...";

    // 2. Pengesahan terus ke Backend Supabase (Lebih Selamat)
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    // Kembalikan butang ke asal
    loginBtn.disabled = false;
    loginBtn.textContent = "Log Masuk";

    if (error) { 
        jumlahPercubaanGagal++;
        if (jumlahPercubaanGagal >= 3) {
            kunciLogMasukSehingga = Date.now() + 60000; // Kunci log masuk selama 1 minit
            mulakanKiraanDetik();
        } else {
            paparMesejLogMasuk(`E-mel atau kata laluan tidak sah.<br>Baki percubaan anda: <strong>${3 - jumlahPercubaanGagal} kali</strong>`, "error");
        }
    } 
    else { 
        // Berjaya log masuk
        jumlahPercubaanGagal = 0;
        if(loginMsgBox) loginMsgBox.style.display = "none";
        updateAdminUI(data.session); 
    }
});

async function checkUserSession() { const { data: { session } } = await supabaseClient.auth.getSession(); updateAdminUI(session); }

function updateAdminUI(session) {
    if (session) { 
        adminAuthBox.style.display = "none"; 
        adminDashboardBox.style.display = "block"; 
        renderAdminList(); 
        renderAdminAyatList(); 
    } 
    else { 
        adminAuthBox.style.display = "block"; 
        adminDashboardBox.style.display = "none"; 
    }
}

btnLogKeluar.addEventListener("click", async () => { await supabaseClient.auth.signOut(); updateAdminUI(null); });
supabaseClient.auth.onAuthStateChange((_event, session) => { updateAdminUI(session); });

checkUserSession(); loadDataFromSupabase(); renderSearchCard(); renderSearchAyatCard();
