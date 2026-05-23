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

// Pautan Elemen Dinamik UI Baru & Lama
const ciriSectionsContainer = document.getElementById("ciriSectionsContainer");
const btnTambahCiri = document.getElementById("btnTambahCiri");
const builderRowsContainer = document.getElementById("builderRowsContainer");
const btnTambahBarisJadual = document.getElementById("btnTambahBarisJadual");
const customSectionsContainer = document.getElementById("customSectionsContainer");
const btnTambahSeksyenKhas = document.getElementById("btnTambahSeksyenKhas");

const inputId = document.getElementById("termId");
const inputTitleMs = document.getElementById("titleMs");
const inputTitleAr = document.getElementById("titleAr");
const inputCategory = document.getElementById("category");
const inputKeywords = document.getElementById("keywords");
const inputDefinition = document.getElementById("definition");
const th1 = document.getElementById("th1");
const th2 = document.getElementById("th2");
const th3 = document.getElementById("th3");
const inputCustomMainTitle = document.getElementById("customMainTitle");

// =========================================================================
// SUNTIKAN BARU: PENJANA KOTAK DINAMIK CIRI-CIRI UTAMA
// =========================================================================
function createCiriSectionInput(mainTitleVal = "", subTitleVal = "", contentVal = "") {
    const uniqueId = "ciriContent_" + Date.now() + Math.floor(Math.random() * 1000);

    const sectionDiv = document.createElement("div");
    sectionDiv.className = "ciri-section-item";
    sectionDiv.style = "background: #fff; padding: 16px; border: 1px dashed #cbd5e0; border-radius: 8px; margin-bottom: 12px; position: relative;";
    
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
        
        <div class="form-group" style="margin-bottom:0;">
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
    `;

    sectionDiv.querySelector(".btn-remove-section").addEventListener("click", () => sectionDiv.remove());
    ciriSectionsContainer.appendChild(sectionDiv);
}
btnTambahCiri.addEventListener("click", () => createCiriSectionInput());

// =========================================================================
// PENJANA KOTAK DINAMIK SEKSYEN TAMBAHAN (KEKAL SAMA)
// =========================================================================
function createCustomSectionInput(titleVal = "", contentVal = "") {
    const uniqueId = "customContent_" + Date.now() + Math.floor(Math.random() * 1000);

    const sectionDiv = document.createElement("div");
    sectionDiv.className = "custom-section-item";
    sectionDiv.style = "background: #fff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; position: relative;";
    
    sectionDiv.innerHTML = `
        <button type="button" class="btn btn-danger btn-remove-section" style="position: absolute; top: 12px; right: 12px; padding: 4px 10px;" title="Padam Seksyen Ini">X</button>
        
        <div class="form-group" style="margin-top: 4px; margin-right: 40px;">
            <label>Subtajuk Khas (Pilihan)</label>
            <input type="text" class="form-control custom-title-input" placeholder="Contoh: Kaedah Penggunaan / Nota Penting" value="${titleVal}">
        </div>
        
        <div class="form-group" style="margin-bottom:0;">
            <label>Penerangan Khas</label>
            <div class="text-toolbar">
                <button type="button" class="toolbar-btn" onclick="applyFormat('${uniqueId}', 'b')">B</button>
                <button type="button" class="toolbar-btn" onclick="applyFormat('${uniqueId}', 'u')"><u>U</u></button>
                <button type="button" class="toolbar-btn" onclick="applyFormat('${uniqueId}', 'i')"><i>I</i></button>
                <button type="button" class="toolbar-btn" onclick="applyFormat('${uniqueId}', 'bullet')">• Senarai</button>
                <div class="color-picker-wrapper"><input type="color" class="toolbar-color" onchange="applyFormat('${uniqueId}', 'color', this.value)"></div>
            </div>
            <textarea id="${uniqueId}" class="form-control custom-content-input" rows="3" placeholder="Masukkan penerangan lengkap seksyen khas ini...">${contentVal}</textarea>
        </div>
    `;

    sectionDiv.querySelector(".btn-remove-section").addEventListener("click", () => sectionDiv.remove());
    customSectionsContainer.appendChild(sectionDiv);
}
btnTambahSeksyenKhas.addEventListener("click", () => createCustomSectionInput());


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

    // KEMASKINI PENYIMPANAN: Menangkap data Ciri-Ciri Utama Dinamik dan menyimpannya sebagai JSON String
    const ciriElements = ciriSectionsContainer.querySelectorAll(".ciri-section-item");
    const chrArray = [];
    ciriElements.forEach(item => {
        const mTitle = item.querySelector(".ciri-main-title-input").value.trim();
        const sTitle = item.querySelector(".ciri-sub-title-input").value.trim();
        const content = item.querySelector(".ciri-content-input").value.trim();
        if (mTitle || sTitle || content) {
            chrArray.push(JSON.stringify({ mainTitle: mTitle, subTitle: sTitle, content: content }));
        }
    });

    const rowItems = builderRowsContainer.querySelectorAll(".builder-row-item");
    const rowsData = [];
    rowItems.forEach(row => {
        const v1 = row.querySelector(".col-1").value;
        const v2 = row.querySelector(".col-2").value;
        const v3 = row.querySelector(".col-3").value;
        if (v1 || v2 || v3) rowsData.push([v1, v2, v3]);
    });

    const customSectionElements = customSectionsContainer.querySelectorAll(".custom-section-item");
    const customSectionsData = [];
    customSectionElements.forEach(item => {
        const titleVal = item.querySelector(".custom-title-input").value.trim();
        const contentVal = item.querySelector(".custom-content-input").value.trim();
        if (titleVal || contentVal) customSectionsData.push({ title: titleVal, content: contentVal });
    });

    const tableDataObject = {
        headers: [th1.value, th2.value, th3.value],
        rows: rowsData,
        main_custom_title: inputCustomMainTitle.value.trim(),
        custom_sections: customSectionsData
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

function createTableRowInput(val1 = "", val2 = "", val3 = "") {
    const rowDiv = document.createElement("div");
    rowDiv.className = "builder-row-item";
    rowDiv.innerHTML = `
        <input type="text" class="form-control col-1 table-input-target" style="padding:8px;" placeholder="Lajur 1" value="${val1}">
        <input type="text" class="form-control col-2 table-input-target" style="padding:8px;" placeholder="Lajur 2" value="${val2}">
        <input type="text" class="form-control col-3 table-input-target" style="padding:8px;" placeholder="Lajur 3" value="${val3}">
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
    
    // KEMASKINI PAPARAN: Menyokong format JSON baharu dan teks Legacy lama untuk Ciri-Ciri Utama
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
                } else {
                    // Teks Legacy lama
                    formattedCharacteristics += `<div style="margin-bottom: 8px; line-height: 1.6;">${c.replace(/\n/g, "<br>")}</div>`;
                }
            } catch (e) {
                formattedCharacteristics += `<div style="margin-bottom: 8px; line-height: 1.6;">${c.replace(/\n/g, "<br>")}</div>`;
            }
        });
    }

    let generatedCustomSectionHtml = "";
    if (selectedSearchItem.table_data) {
        if (selectedSearchItem.table_data.main_custom_title) {
            generatedCustomSectionHtml += `
                <div style="margin-top: 24px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 16px;">
                    <span style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">${selectedSearchItem.table_data.main_custom_title}</span>
                </div>
            `;
        }

        if (selectedSearchItem.table_data.custom_title || selectedSearchItem.table_data.custom_content) {
            let formattedContent = selectedSearchItem.table_data.custom_content ? selectedSearchItem.table_data.custom_content.replace(/\n/g, "<br>") : "";
            let oldTitle = selectedSearchItem.table_data.custom_title || 'Penerangan Tambahan';
            generatedCustomSectionHtml += `
                <div style="margin-top: 18px; margin-bottom: 8px; font-size: 1.15rem; font-weight: bold; color: var(--primary-color);">${oldTitle}:</div>
                <div class="definition" style="margin-bottom: 18px; line-height: 1.6;">${formattedContent}</div>
            `;
        }

        if (selectedSearchItem.table_data.custom_sections && selectedSearchItem.table_data.custom_sections.length > 0) {
            selectedSearchItem.table_data.custom_sections.forEach(sec => {
                let formattedContent = sec.content ? sec.content.replace(/\n/g, "<br>") : "";
                let titleHtml = sec.title ? `<div style="margin-top: 18px; margin-bottom: 8px; font-size: 1.15rem; font-weight: bold; color: var(--primary-color);">${sec.title}:</div>` : '';
                generatedCustomSectionHtml += `
                    ${titleHtml}
                    <div class="definition" style="margin-bottom: 18px; line-height: 1.6;">${formattedContent}</div>
                `;
            });
        }
    }

    let generatedTableHtml = "";
    const tData = selectedSearchItem.table_data;
    if (tData && tData.headers && tData.headers.some(h => h !== "") && tData.rows && tData.rows.length > 0) {
        generatedTableHtml = `
            <div style="margin-top: 24px; padding-bottom: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 16px;">
                <span style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">Contoh Struktur / Tasrif:</span>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>${tData.headers[0] || ""}</th>
                            <th style="text-align: center;">${tData.headers[1] || ""}</th>
                            <th style="text-align: center;">${tData.headers[2] || ""}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tData.rows.map(row => `
                            <tr>
                                <td>${row[0] || ""}</td>
                                <td>${row[1] || ""}</td>
                                <td>${row[2] || ""}</td>
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
    
    // Reset Data Builders
    builderRowsContainer.innerHTML = "";
    customSectionsContainer.innerHTML = ""; 
    ciriSectionsContainer.innerHTML = "";

    // KEMASKINI BORANG EDIT: Memuatkan Semula Data Ciri-Ciri Utama
    if (item.characteristics && item.characteristics.length > 0) {
        let hasLegacy = false;
        let legacyText = [];
        
        item.characteristics.forEach(c => {
            try {
                if (c.startsWith('{') && c.endsWith('}')) {
                    const parsed = JSON.parse(c);
                    createCiriSectionInput(parsed.mainTitle || "", parsed.subTitle || "", parsed.content || "");
                } else {
                    legacyText.push(c);
                    hasLegacy = true;
                }
            } catch(e) {
                legacyText.push(c);
                hasLegacy = true;
            }
        });
        
        // Membina satu kotak jika terdapat data lama untuk disunting
        if (hasLegacy && legacyText.length > 0) {
            createCiriSectionInput("", "", legacyText.join("\n"));
        }
    } else {
        createCiriSectionInput();
    }

    if (item.table_data) {
        th1.value = item.table_data.headers ? (item.table_data.headers[0] || "") : "";
        th2.value = item.table_data.headers ? (item.table_data.headers[1] || "") : "";
        th3.value = item.table_data.headers ? (item.table_data.headers[2] || "") : "";
        
        inputCustomMainTitle.value = item.table_data.main_custom_title || "";

        if (item.table_data.custom_title || item.table_data.custom_content) {
            createCustomSectionInput(item.table_data.custom_title || "", item.table_data.custom_content || "");
        }
        
        if (item.table_data.custom_sections && item.table_data.custom_sections.length > 0) {
            item.table_data.custom_sections.forEach(sec => createCustomSectionInput(sec.title, sec.content));
        }

        if (item.table_data.rows) {
            item.table_data.rows.forEach(row => createTableRowInput(row[0], row[1], row[2]));
        }
    } else {
        th1.value = ""; th2.value = ""; th3.value = "";
        inputCustomMainTitle.value = ""; 
    }

    formSection.classList.add("active");
    formSection.scrollIntoView({ behavior: "smooth" });
};

btnBukaBorang.addEventListener("click", () => {
    termForm.reset();
    inputId.value = "";
    builderRowsContainer.innerHTML = "";
    customSectionsContainer.innerHTML = "";
    ciriSectionsContainer.innerHTML = "";
    inputCustomMainTitle.value = ""; 
    
    formTitle.textContent = "Tambah Istilah Baru";
    formSection.classList.add("active");
    
    createCiriSectionInput();
    createCustomSectionInput(); 
    createTableRowInput();
    createTableRowInput();
});

btnBatal.addEventListener("click", closeForm);
function closeForm() { 
    formSection.classList.remove("active"); 
    termForm.reset(); 
    inputId.value = ""; 
    builderRowsContainer.innerHTML = "";
    customSectionsContainer.innerHTML = "";
    ciriSectionsContainer.innerHTML = "";
    inputCustomMainTitle.value = ""; 
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
