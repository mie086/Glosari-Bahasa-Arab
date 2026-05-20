// =========================================================================
// 1. KONFIGURASI PROJEK SUPABASE
// =========================================================================
const SUPABASE_URL = "https://ejivaczazdimurhtlmsj.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaXZhY3phemRpbXVyaHRsbXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzEzMjAsImV4cCI6MjA5NDgwNzMyMH0._pjuat4uPjujjRiZyj1331vySeMXPGU_SGpzdfkfSSg";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================================================
// 2. STATE MANAGEMENT & ELEMEN DOM
// =========================================================================
let dataIstilah = [];
let currentSearch = "";
let selectedSearchItem = null;

const navButtons = document.querySelectorAll(".nav-btn");
const viewSections = document.querySelectorAll(".view-section");
const searchInput = document.getElementById("searchInput");
const suggestionsList = document.getElementById("suggestionsList");
const resultsList = document.getElementById("resultsList");

const adminAuthBox = document.getElementById("adminAuthBox");
const adminDashboardBox = document.getElementById("adminDashboardBox");
const loginForm = document.getElementById("loginForm");
const btnLogKeluar = document.getElementById("btnLogKeluar");

const adminTableBody = document.getElementById("adminTableBody");
const formSection = document.getElementById("formSection");
const termForm = document.getElementById("termForm");
const btnBukaBorang = document.getElementById("btnBukaBorang");
const btnBatal = document.getElementById("btnBatal");
const formTitle = document.getElementById("formTitle");
const builderRowsContainer = document.getElementById("builderRowsContainer");
const btnTambahBarisJadual = document.getElementById("btnTambahBarisJadual");

const inputId = document.getElementById("termId");
const inputTitleMs = document.getElementById("titleMs");
const inputTitleAr = document.getElementById("titleAr");
const inputCategory = document.getElementById("category");
const inputKeywords = document.getElementById("keywords");
const inputDefinition = document.getElementById("definition");
const inputCharacteristics = document.getElementById("characteristics");
const th1 = document.getElementById("th1");
const th2 = document.getElementById("th2");
const th3 = document.getElementById("th3");

const inputCustomTitle = document.getElementById("customTitle");
const inputCustomContent = document.getElementById("customContent");

// =========================================================================
// 3. LOGIK FORMAT TEKS DINAMIK
// =========================================================================
window.applyFormat = function(textareaId, type, colorValue = null) {
    const textarea = document.getElementById(textareaId);
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const originalText = textarea.value;
    const selectedText = originalText.substring(start, end);

    let tagOpen = "";
    let tagClose = "";
    let modifiedText = "";

    switch (type) {
        case 'b':
            tagOpen = "<b>"; tagClose = "</b>";
            modifiedText = tagOpen + selectedText + tagClose;
            break;
        case 'u':
            tagOpen = "<u>"; tagClose = "</u>";
            modifiedText = tagOpen + selectedText + tagClose;
            break;
        case 'i':
            tagOpen = "<i>"; tagClose = "</i>";
            modifiedText = tagOpen + selectedText + tagClose;
            break;
        case 'color':
            tagOpen = `<span style="color:${colorValue}">`; tagClose = "</span>";
            break;
        case 'bullet':
            if (selectedText.trim().length > 0) {
                const lines = selectedText.split('\n').map(line => line.trim() ? `<li>${line}</li>` : '').filter(l => l).join('');
                modifiedText = `<ul>${lines}</ul>`;
            } else {
                modifiedText = "<ul><li>Teks Senarai</li></ul>";
            }
            break;
        case 'number':
            if (selectedText.trim().length > 0) {
                const lines = selectedText.split('\n').map(line => line.trim() ? `<li>${line}</li>` : '').filter(l => l).join('');
                modifiedText = `<ol>${lines}</ol>`;
            } else {
                modifiedText = "<ol><li>Teks Senarai</li></ol>";
            }
            break;
    }

    if (type !== 'bullet' && type !== 'number') {
        modifiedText = tagOpen + selectedText + tagClose;
    }

    textarea.value = originalText.substring(0, start) + modifiedText + originalText.substring(end);

    textarea.focus();
    textarea.selectionStart = start;
    textarea.selectionEnd = start + modifiedText.length;
    textarea.dispatchEvent(new Event('input'));
};

// =========================================================================
// 4. LOGIK AUTENTIKASI (PENGESAHAN USER UNTUK RLS TINGGI)
// =========================================================================
async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateAdminUI(session);
}

function updateAdminUI(session) {
    if (session) {
        adminAuthBox.style.display = "none";
        adminDashboardBox.style.display = "block";
        renderAdminList();
    } else {
        adminAuthBox.style.display = "block";
        adminDashboardBox.style.display = "none";
    }
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Gagal Log Masuk: " + error.message);
    } else {
        updateAdminUI(data.session);
    }
});

btnLogKeluar.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    updateAdminUI(null);
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateAdminUI(session);
});

// =========================================================================
// 5. OPERASI CRUD PANGKALAN DATA (SUPABASE API)
// =========================================================================
async function loadDataFromSupabase() {
    const { data, error } = await supabaseClient
        .from('istilah_arab')
        .select('*')
        .order('title_ms', { ascending: true });
    
    if (error) {
        console.error("Ralat memuatkan data dari Supabase:", error.message);
        return;
    }
    dataIstilah = data;
    renderAdminList();
}

termForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = inputId.value || "term-" + Date.now();
    const chrArray = inputCharacteristics.value.split("\n").filter(line => line.trim() !== "");
    const kwArray = inputKeywords.value.split(",").map(k => k.trim().toLowerCase()).filter(k => k !== "");

    const rowItems = builderRowsContainer.querySelectorAll(".builder-row-item");
    const rowsData = [];
    rowItems.forEach(row => {
        const v1 = row.querySelector(".col-1").value;
        const v2 = row.querySelector(".col-2").value;
        const v3 = row.querySelector(".col-3").value;
        if (v1 || v2 || v3) rowsData.push([v1, v2, v3]);
    });

    const tableDataObject = {
        headers: [th1.value, th2.value, th3.value],
        rows: rowsData,
        custom_title: inputCustomTitle.value.trim(),
        custom_content: inputCustomContent.value.trim()
    };

    const termObject = {
        id: id,
        title_ms: inputTitleMs.value,
        title_ar: inputTitleAr.value,
        category: inputCategory.value,
        definition: inputDefinition.value,
        characteristics: chrArray,
        table_data: tableDataObject,
        keywords: kwArray
    };

    const { error } = await supabaseClient
        .from('istilah_arab')
        .upsert([termObject]);

    if (error) {
        alert("Ralat Keselamatan RLS / Sistem: " + error.message);
    } else {
        selectedSearchItem = null;
        searchInput.value = "";
        closeForm();
        await loadDataFromSupabase();
        renderSearchCard();
    }
});

window.deleteItem = async function(id) {
    if (confirm("Adakah anda pasti mahu memadam istilah ini dari pangkalan data cloud?")) {
        const { error } = await supabaseClient
            .from('istilah_arab')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Ralat Keselamatan RLS: " + error.message);
        } else {
            selectedSearchItem = null;
            searchInput.value = "";
            await loadDataFromSupabase();
            renderSearchCard();
        }
    }
};

// =========================================================================
// 6. INTERFASI JADUAL & HUBUNGAN UI
// =========================================================================
function createTableRowInput(val1 = "", val2 = "", val3 = "") {
    const rowDiv = document.createElement("div");
    rowDiv.className = "builder-row-item";
    rowDiv.innerHTML = `
        <input type="text" class="form-control col-1" style="padding:8px;" placeholder="Lajur 1" value="${val1}">
        <input type="text" class="form-control col-2 arabic-input" style="padding:8px;" placeholder="Arab" value="${val2}">
        <input type="text" class="form-control col-3" style="padding:8px;" placeholder="Lajur 3" value="${val3}">
        <button type="button" class="btn btn-danger btn-remove-row" style="padding: 8px 12px;">X</button>
    `;
    rowDiv.querySelector(".btn-remove-row").addEventListener("click", () => rowDiv.remove());
    builderRowsContainer.appendChild(rowDiv);
}

btnTambahBarisJadual.addEventListener("click", () => createTableRowInput());

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(btn => btn.classList.remove("active"));
        viewSections.forEach(sec => sec.classList.remove("active"));
        button.classList.add("active");
        const targetSection = button.getAttribute("data-target");
        document.getElementById(targetSection).classList.add("active");
        if(targetSection === 'sectionAdmin') closeForm();
    });
});

function handleSearchInput(e) {
    currentSearch = e.target.value.trim();
    if (currentSearch === "") {
        selectedSearchItem = null;
        suggestionsList.style.display = "none";
        renderSearchCard();
        return;
    }

    const matches = dataIstilah.filter(item => {
        const searchLower = currentSearch.toLowerCase();
        return item.title_ms.toLowerCase().includes(searchLower) ||
            item.title_ar.includes(searchLower) ||
            item.keywords.some(kw => kw.includes(searchLower));
    });

    suggestionsList.innerHTML = "";
    if (matches.length > 0) {
        matches.forEach(item => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.innerHTML = `
                <div class="suggestion-info">
                    <span class="suggestion-title">${item.title_ms}</span>
                    <span class="suggestion-cat">${item.category ? item.category : ''}</span>
                </div>
                <div class="suggestion-arabic">${item.title_ar}</div>
            `;
            div.addEventListener("click", () => {
                selectedSearchItem = item;
                searchInput.value = item.title_ms;
                suggestionsList.style.display = "none";
                renderSearchCard();
            });
            suggestionsList.appendChild(div);
        });
    } else {
        suggestionsList.innerHTML = `<div class="no-match-item">Tiada pilihan yang sepadan</div>`;
    }
    suggestionsList.style.display = "block";
}

function renderSearchCard() {
    resultsList.innerHTML = "";
    if (!selectedSearchItem) {
        resultsList.innerHTML = `
            <div class="welcome-message">
                <strong>Selamat Datang!</strong><br>Sila taip nama terma di atas untuk memaparkan pilihan carian.
            </div>`;
        return;
    }

    const card = document.createElement("div");
    card.className = "card";
    
    const chrHTML = selectedSearchItem.characteristics.map(c => {
        let firstColon = c.indexOf(':');
        if (firstColon !== -1) {
            let title = c.substring(0, firstColon);
            let desc = c.substring(firstColon + 1);
            
            if (title.includes('style="') && !title.substring(title.indexOf('style="')).includes('">')) {
                let nextColon = c.indexOf(':', firstColon + 1);
                if (nextColon !== -1) {
                    title = c.substring(0, nextColon);
                    desc = c.substring(nextColon + 1);
                }
            }
            return `<li><strong>${title}:</strong>${desc}</li>`;
        }
        return `<li>${c}</li>`;
    }).join("");

    let generatedCustomSectionHtml = "";
    if (selectedSearchItem.table_data && selectedSearchItem.table_data.custom_title) {
        let formattedContent = selectedSearchItem.table_data.custom_content 
            ? selectedSearchItem.table_data.custom_content.replace(/\n/g, "<br>") 
            : "";
        generatedCustomSectionHtml = `
            <div class="section-title" style="margin-top: 18px;">${selectedSearchItem.table_data.custom_title}:</div>
            <div class="custom-content-block" style="margin-bottom: 18px; line-height: 1.6;">${formattedContent}</div>
        `;
    }

    let generatedTableHtml = "";
    const tData = selectedSearchItem.table_data;
    if (tData && tData.headers && tData.headers.some(h => h !== "") && tData.rows && tData.rows.length > 0) {
        generatedTableHtml = `
            <div class="section-title">Contoh Struktur / Tasrif:</div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>${tData.headers[0] || ""}</th>
                            <th style="text-align: right;">${tData.headers[1] || ""}</th>
                            <th>${tData.headers[2] || ""}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tData.rows.map(row => `
                            <tr>
                                <td>${row[0] || ""}</td>
                                <td class="arabic-text">${row[1] || ""}</td>
                                <td>${row[2] || ""}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>`;
    }

    card.innerHTML = `
        <div class="card-header">
            <div class="card-title-group">
                <div class="title-ms">${selectedSearchItem.title_ms}</div>
                ${selectedSearchItem.category ? `<span class="category-badge">${selectedSearchItem.category}</span>` : ''}
            </div>
            <div class="title-ar">${selectedSearchItem.title_ar}</div>
        </div>
        <div class="card-body">
            <div class="definition">${selectedSearchItem.definition}</div>
            <div class="section-title">Ciri-Ciri Utama:</div>
            <ul class="characteristics-list">${chrHTML}</ul>
            
            ${generatedCustomSectionHtml}
            ${generatedTableHtml}
        </div>`;
    resultsList.appendChild(card);
}

function renderAdminList() {
    adminTableBody.innerHTML = "";
    dataIstilah.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.title_ms}</strong></td>
            <td class="td-arabic">${item.title_ar}</td>
            <td><span class="badge">${item.category ? item.category : 'Kosong'}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-edit" onclick="editItem('${item.id}')">Ubah</button>
                    <button class="btn btn-danger" onclick="deleteItem('${item.id}')">Padam</button>
                </div>
            </td>`;
        adminTableBody.appendChild(tr);
    });
}

window.editItem = function(id) {
    const item = dataIstilah.find(item => item.id === id);
    if (!item) return;

    formTitle.textContent = "Ubah Maklumat Istilah";
    inputId.value = item.id;
    inputTitleMs.value = item.title_ms;
    inputTitleAr.value = item.title_ar;
    inputCategory.value = item.category || "";
    inputKeywords.value = item.keywords ? item.keywords.join(", ") : "";
    inputDefinition.value = item.definition;
    inputCharacteristics.value = item.characteristics.join("\n");
    
    builderRowsContainer.innerHTML = "";
    if (item.table_data) {
        th1.value = item.table_data.headers ? (item.table_data.headers[0] || "") : "";
        th2.value = item.table_data.headers ? (item.table_data.headers[1] || "") : "";
        th3.value = item.table_data.headers ? (item.table_data.headers[2] || "") : "";
        
        inputCustomTitle.value = item.table_data.custom_title || "";
        inputCustomContent.value = item.table_data.custom_content || "";

        if (item.table_data.rows) {
            item.table_data.rows.forEach(row => createTableRowInput(row[0], row[1], row[2]));
        }
    } else {
        th1.value = ""; th2.value = ""; th3.value = "";
        inputCustomTitle.value = ""; inputCustomContent.value = "";
    }

    formSection.classList.add("active");
    formSection.scrollIntoView({ behavior: "smooth" });
};

btnBukaBorang.addEventListener("click", () => {
    termForm.reset();
    inputId.value = "";
    builderRowsContainer.innerHTML = "";
    inputCustomTitle.value = "";
    inputCustomContent.value = "";
    formTitle.textContent = "Tambah Istilah Baru";
    formSection.classList.add("active");
    createTableRowInput();
    createTableRowInput();
});

btnBatal.addEventListener("click", closeForm);
function closeForm() { 
    formSection.classList.remove("active"); 
    termForm.reset(); 
    inputId.value = ""; 
    builderRowsContainer.innerHTML = "";
    inputCustomTitle.value = "";
    inputCustomContent.value = "";
}

searchInput.addEventListener("input", handleSearchInput);
document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.style.display = "none";
    }
});

checkUserSession();
loadDataFromSupabase();
renderSearchCard();
