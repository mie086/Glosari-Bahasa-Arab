const SUPABASE_URL = "https://ejivaczazdimurhtlmsj.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaXZhY3phemRpbXVyaHRsbXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzEzMjAsImV4cCI6MjA5NDgwNzMyMH0._pjuat4uPjujjRiZyj1331vySeMXPGU_SGpzdfkfSSg";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let dataIstilah = [];
let currentSearch = "";
let selectedSearchItem = null;
let lastFocusedTableInput = null; 

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

const ciriSectionsContainer = document.getElementById("ciriSectionsContainer");
const btnTambahCiri = document.getElementById("btnTambahCiri");
const adminSearchInput = document.getElementById("adminSearchInput");

const inputId = document.getElementById("termId");
const inputTitleMs = document.getElementById("titleMs");
const inputTitleAr = document.getElementById("titleAr");
const inputCategory = document.getElementById("category");
const inputKeywords = document.getElementById("keywords");
const inputDefinition = document.getElementById("definition");

// =========================================================================
// PEMBANGUN CIRI-CIRI UTAMA DINAMIK DENGAN JADUAL DALAMAN
// =========================================================================
function createCiriSectionInput(mainTitleVal = "", subTitleVal = "", contentVal = "", tableDataVal = null) {
    const uniqueId = "ciriContent_" + Date.now() + Math.floor(Math.random() * 1000);
    const tableContainerId = "ciriTableBox_" + Date.now() + Math.floor(Math.random() * 1000);
    const rowsContainerId = "ciriTableRows_" + Date.now() + Math.floor(Math.random() * 1000);

    const sectionDiv = document.createElement("div");
    sectionDiv.className = "ciri-section-item";
    sectionDiv.style = "background: #fff; padding: 16px; border: 1px dashed #cbd5e0; border-radius: 8px; margin-bottom: 12px; position: relative;";
    
    let isTableVisible = tableDataVal ? "block" : "none";
    let btnToggleText = tableDataVal ? "✓ Buang Jadual" : "+ Tambah Jadual Contoh";
    let btnToggleClass = tableDataVal ? "btn-danger" : "btn-primary";

    let tTitle = tableDataVal && tableDataVal.table_title ? tableDataVal.table_title : "";
    let th1_val = tableDataVal && tableDataVal.headers ? (tableDataVal.headers[0] || "") : "";
    let th2_val = tableDataVal && tableDataVal.headers ? (tableDataVal.headers[1] || "") : "";
    let th3_val = tableDataVal && tableDataVal.headers ? (tableDataVal.headers[2] || "") : "";

    sectionDiv.innerHTML = `
        <button type="button" class="btn btn-danger btn-remove-section" style="position: absolute; top: 12px; right: 12px; padding: 4px 10px;" title="Padam Seksyen Ini">X</button>
        
        <div class="form-group" style="margin-top: 4px; margin-right: 40px;">
            <label>Tajuk Besar (Pilihan)</label>
            <input type="text" class="form-control ciri-main-title-input" placeholder="Contoh: Baris akhir berubah" value="${mainTitleVal}">
        </div>

        <div class="form-group" style="margin-top: 4px;">
            <label>Subtajuk (Pilihan)</label>
            <input type="text" class="form-control ciri-sub-title-input" placeholder="Contoh: Rafa' / Nasab / Jar" value="${subTitleVal}">
        </div>
        
        <div class="form-group" style="margin-bottom:12px;">
            <label>Penerangan</label>
            <div class="text-toolbar">
                <button type="button" class="toolbar-btn" onclick="applyFormat('${uniqueId}', 'b')">B</button>
                <button type="button" class="toolbar-btn" onclick="applyFormat('${uniqueId}', 'u')"><u>U</u></button>
                <button type="button" class="toolbar-btn" onclick="applyFormat('${uniqueId}', 'i')"><i>I</i></button>
                <button type="button" class="toolbar-btn" onclick="applyFormat('${uniqueId}', 'bullet')">• Senarai</button>
                <div class="color-picker-wrapper"><input type="color" class="toolbar-color" onchange="applyFormat('${uniqueId}', 'color', this.value)"></div>
            </div>
            <textarea id="${uniqueId}" class="form-control ciri-content-input" rows="3" placeholder="Masukkan penerangan lengkap ciri ini...">${contentVal}</textarea>
        </div>

        <button type="button" class="btn ${btnToggleClass} btn-toggle-table" style="padding: 4px 10px; font-size: 0.8rem; margin-bottom: 4px;">${btnToggleText}</button>

        <div class="ciri-table-builder" id="${tableContainerId}" style="display: ${isTableVisible}; background: #f7fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px;">
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size: 0.85rem; color: var(--accent-color); font-weight: 600;">Tajuk Jadual (Pilihan)</label>
                <input type="text" class="form-control ciri-table-title" placeholder="Contoh: Contoh Tasrif / Struktur" value="${tTitle}">
            </div>
            
            <div class="text-toolbar" style="margin-bottom: 8px; width: 100%;">
                <button type="button" class="toolbar-btn" onclick="applyTableFormat('b')" title="Tebal">B</button>
                <button type="button" class="toolbar-btn" onclick="applyTableFormat('u')" title="Garis Bawah"><u>U</u></button>
                <button type="button" class="toolbar-btn" onclick="applyTableFormat('i')" title="Senget"><i>I</i></button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                <input type="text" class="form-control th-1 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 1" value="${th1_val}">
                <input type="text" class="form-control th-2 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 2" value="${th2_val}">
                <input type="text" class="form-control th-3 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Header 3" value="${th3_val}">
            </div>

            <div class="ciri-rows-area" id="${rowsContainerId}" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;"></div>
            <button type="button" class="btn btn-primary btn-add-row-ciri" style="padding: 4px 8px; font-size: 0.75rem;">+ Tambah Baris Data</button>
        </div>
    `;

    const tableBox = sectionDiv.querySelector(`#${tableContainerId}`);
    const btnToggleTable = sectionDiv.querySelector(".btn-toggle-table");
    const rowsArea = sectionDiv.querySelector(`#${rowsContainerId}`);
    const btnAddRowCiri = sectionDiv.querySelector(".btn-add-row-ciri");

    function addCiriTableRow(v1 = "", v2 = "", v3 = "") {
        const rowDiv = document.createElement("div");
        rowDiv.className = "builder-row-item";
        rowDiv.style = "display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 6px; align-items: center;";
        rowDiv.innerHTML = `
            <input type="text" class="form-control col-1 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 1" value="${v1}">
            <input type="text" class="form-control col-2 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 2" value="${v2}">
            <input type="text" class="form-control col-3 table-input-target" style="padding:6px; font-size:0.85rem;" placeholder="Lajur 3" value="${v3}">
            <button type="button" class="btn btn-danger btn-remove-row" style="padding: 4px 8px; font-size:0.75rem;">X</button>
        `;
        rowDiv.querySelector(".btn-remove-row").addEventListener("click", () => rowDiv.remove());
        rowsArea.appendChild(rowDiv);
    }

    if (tableDataVal && tableDataVal.rows) {
        tableDataVal.rows.forEach(r => addCiriTableRow(r[0], r[1], r[2]));
    }

    btnAddRowCiri.addEventListener("click", () => addCiriTableRow());

    btnToggleTable.addEventListener("click", () => {
        if (tableBox.style.display === "none") {
            tableBox.style.display = "block";
            btnToggleTable.textContent = "✓ Buang Jadual";
            btnToggleTable.classList.remove("btn-primary");
            btnToggleTable.classList.add("btn-danger");
            if (rowsArea.children.length === 0) {
                addCiriTableRow();
                addCiriTableRow();
            }
        } else {
            tableBox.style.display = "none";
            btnToggleTable.textContent = "+ Tambah Jadual Contoh";
            btnToggleTable.classList.remove("btn-danger");
            btnToggleTable.classList.add("btn-primary");
        }
    });

    sectionDiv.querySelector(".btn-remove-section").addEventListener("click", () => sectionDiv.remove());
    ciriSectionsContainer.appendChild(sectionDiv);
}
btnTambahCiri.addEventListener("click", () => createCiriSectionInput());

document.addEventListener('focusin', function(e) {
    if (e.target && e.target.classList.contains('table-input-target')) {
        lastFocusedTableInput = e.target;
    }
});

window.applyTableFormat = function(type, colorValue = null) {
    if (!lastFocusedTableInput) {
        alert("Sila klik di dalam mana-mana petak jadual (Header atau Lajur) terlebih dahulu sebelum menekan butang format.");
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
        case 'b': tagOpen = "<b>"; tagClose = "</b>"; break;
        case 'u': tagOpen = "<u>"; tagClose = "</u>"; break;
        case 'i': tagOpen = "<i>"; tagClose = "</i>"; break;
        case 'color': tagOpen = `<span style="color:${colorValue}">`; tagClose = "</span>"; break;
    }

    const modifiedText = tagOpen + selectedText + tagClose;
    input.value = originalText.substring(0, start) + modifiedText + originalText.substring(end);

    input.focus();
    input.selectionStart = start;
    input.selectionEnd = start + modifiedText.length;
    input.dispatchEvent(new Event('input'));
};

window.applyFormat = function(textareaId, type, colorValue = null) {
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
            modifiedText = tagOpen + selectedText + tagClose;
            break;
        case 'bullet':
            if (selectedText.trim().length > 0) {
                const lines = selectedText.split('\n').map(line => line.trim() ? `<li>${line.trim()}</li>` : '').filter(l => l).join(' ');
                modifiedText = `<ul class="inline-bullet-list">${lines}</ul>`;
            } else {
                modifiedText = `<ul class="inline-bullet-list"><li>Teks Senarai</li></ul>`;
            }
            break;
    }

    textarea.value = originalText.substring(0, start) + modifiedText + originalText.substring(end);
    textarea.value = textarea.value.replace(/<\/ul>([\s\n]*?)<ul>/gi, '$1');

    textarea.focus();
    textarea.selectionStart = start;
    textarea.selectionEnd = start + modifiedText.length;
    textarea.dispatchEvent(new Event('input'));
};

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
            const h1 = tableBox.querySelector(".th-1").value.trim();
            const h2 = tableBox.querySelector(".th-2").value.trim();
            const h3 = tableBox.querySelector(".th-3").value.trim();
            
            const rItems = tableBox.querySelectorAll(".builder-row-item");
            const rowsData = [];
            rItems.forEach(row => {
                const v1 = row.querySelector(".col-1").value;
                const v2 = row.querySelector(".col-2").value;
                const v3 = row.querySelector(".col-3").value;
                if (v1 || v2 || v3) rowsData.push([v1, v2, v3]);
            });
            
            if (h1 || h2 || h3 || rowsData.length > 0) {
                embeddedTableObj = {
                    table_title: tTitle,
                    headers: [h1, h2, h3],
                    rows: rowsData
                };
            }
        }

        if (mTitle || sTitle || content || embeddedTableObj) {
            chrArray.push(JSON.stringify({ 
                mainTitle: mTitle, 
                subTitle: sTitle, 
                content: content,
                table_data: embeddedTableObj
            }));
        }
    });

    const termObject = {
        id: id,
        title_ms: inputTitleMs.value,
        title_ar: inputTitleAr.value,
        category: inputCategory.value,
        definition: inputDefinition.value,
        characteristics: chrArray,
        table_data: null, // Dikosongkan kerana Seksyen Tambahan telah dibuang
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
                    <span class="suggestion-cat">${item.category ? item.category : 'Tiada Kategori'}</span>
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
    
    let formattedCharacteristics = "";
    if (selectedSearchItem.characteristics && selectedSearchItem.characteristics.length > 0) {
        selectedSearchItem.characteristics.forEach(c => {
            try {
                if (c.startsWith('{') && c.endsWith('}')) {
                    const parsed = JSON.parse(c);
                    if (parsed.mainTitle) {
                        formattedCharacteristics += `<div style="margin-top: 24px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 16px;"><span style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">${parsed.mainTitle}</span></div>`;
                    }
                    if (parsed.subTitle) {
                        formattedCharacteristics += `<div style="margin-top: 12px; margin-bottom: 8px; font-size: 1.05rem; font-weight: bold; color: var(--primary-color);">${parsed.subTitle}:</div>`;
                    }
                    if (parsed.content) {
                        formattedCharacteristics += `<div class="definition" style="margin-bottom: 16px; line-height: 1.6;">${parsed.content.replace(/\n/g, "<br>")}</div>`;
                    }
                    
                    if (parsed.table_data && parsed.table_data.headers && parsed.table_data.rows && parsed.table_data.rows.length > 0) {
                        const tTitle = parsed.table_data.table_title || "Contoh Struktur / Tasrif:";
                        formattedCharacteristics += `
                            <div style="margin-top: 20px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 12px;">
                                <span style="font-size: 1.15rem; font-weight: 700; color: var(--primary-color);">${tTitle}</span>
                            </div>
                            <div class="table-container" style="margin-bottom: 24px;">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>${parsed.table_data.headers[0] || ""}</th>
                                            <th style="text-align: center;">${parsed.table_data.headers[1] || ""}</th>
                                            <th style="text-align: center;">${parsed.table_data.headers[2] || ""}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${parsed.table_data.rows.map(row => `
                                            <tr>
                                                <td>${row[0] || ""}</td>
                                                <td style="text-align: center;">${row[1] || ""}</td>
                                                <td style="text-align: center;">${row[2] || ""}</td>
                                            </tr>
                                        `).join("")}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }
                } else {
                    formattedCharacteristics += `<div style="margin-bottom: 8px; line-height: 1.6;">${c.replace(/\n/g, "<br>")}</div>`;
                }
            } catch (e) {
                formattedCharacteristics += `<div style="margin-bottom: 8px; line-height: 1.6;">${c.replace(/\n/g, "<br>")}</div>`;
            }
        });
    }

    let legacyStandaloneTableHtml = "";
    if (selectedSearchItem.table_data && selectedSearchItem.table_data.headers && selectedSearchItem.table_data.rows && selectedSearchItem.table_data.rows.length > 0) {
        const tableTitle = selectedSearchItem.table_data.table_title || "Contoh Struktur / Tasrif:";
        legacyStandaloneTableHtml = `
            <div style="margin-top: 24px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 16px;">
                <span style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">${tableTitle}</span>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>${selectedSearchItem.table_data.headers[0] || ""}</th>
                            <th style="text-align: center;">${selectedSearchItem.table_data.headers[1] || ""}</th>
                            <th style="text-align: center;">${selectedSearchItem.table_data.headers[2] || ""}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${selectedSearchItem.table_data.rows.map(row => `
                            <tr>
                                <td>${row[0] || ""}</td>
                                <td style="text-align: center;">${row[1] || ""}</td>
                                <td style="text-align: center;">${row[2] || ""}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>`;
    }

    let formattedDefinition = selectedSearchItem.definition 
        ? selectedSearchItem.definition.replace(/\n/g, "<br>") 
        : "";

    card.innerHTML = `
        <div class="card-header">
            <div class="card-title-group">
                <div class="title-ms">${selectedSearchItem.title_ms}</div>
                ${selectedSearchItem.category ? `<span class="category-badge">${selectedSearchItem.category}</span>` : ''}
            </div>
            <div class="title-ar">${selectedSearchItem.title_ar}</div>
        </div>
        <div class="card-body">
            <div class="definition">${formattedDefinition}</div>
            
            <div class="definition" style="line-height: 1.6;">${formattedCharacteristics}</div>
            
            ${legacyStandaloneTableHtml}
        </div>`;
    resultsList.appendChild(card);
}

function renderAdminList(filterText = "") {
    adminTableBody.innerHTML = "";
    const lowerFilter = filterText.toLowerCase();

    const filteredData = dataIstilah.filter(item => {
        return item.title_ms.toLowerCase().includes(lowerFilter) || 
               item.title_ar.includes(lowerFilter) ||
               (item.category && item.category.toLowerCase().includes(lowerFilter)) ||
               (item.keywords && item.keywords.some(kw => kw.includes(lowerFilter)));
    });

    if (filteredData.length === 0) {
        adminTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: var(--text-muted);">Tiada istilah yang sepadan dengan carian anda.</td></tr>`;
        return;
    }

    filteredData.forEach(item => {
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

if (adminSearchInput) {
    adminSearchInput.addEventListener("input", (e) => {
        renderAdminList(e.target.value.trim());
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
    
    ciriSectionsContainer.innerHTML = "";

    if (item.characteristics && item.characteristics.length > 0) {
        let hasLegacy = false;
        let legacyText = [];
        
        item.characteristics.forEach(c => {
            try {
                if (c.startsWith('{') && c.endsWith('}')) {
                    const parsed = JSON.parse(c);
                    createCiriSectionInput(parsed.mainTitle || "", parsed.subTitle || "", parsed.content || "", parsed.table_data || null);
                } else {
                    legacyText.push(c);
                    hasLegacy = true;
                }
            } catch(e) {
                legacyText.push(c);
                hasLegacy = true;
            }
        });
        
        if (hasLegacy && legacyText.length > 0) {
            createCiriSectionInput("", "", legacyText.join("\n"), null);
        }
    } else {
        createCiriSectionInput();
    }

    formSection.classList.add("active");
    formSection.scrollIntoView({ behavior: "smooth" });
};

btnBukaBorang.addEventListener("click", () => {
    termForm.reset();
    inputId.value = "";
    ciriSectionsContainer.innerHTML = "";
    
    formTitle.textContent = "Tambah Istilah Baru";
    formSection.classList.add("active");
    
    createCiriSectionInput();
});

btnBatal.addEventListener("click", closeForm);
function closeForm() { 
    formSection.classList.remove("active"); 
    termForm.reset(); 
    inputId.value = ""; 
    ciriSectionsContainer.innerHTML = "";
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
