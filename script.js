// #region 1. KONFIGURASI SUPABASE, UID ADMIN & STATE GLOBAL
const SUPABASE_URL = 'https://twbmjojqyhmjsoywiqrs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Ym1qb2pxeWhtanNveXdpcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzUyODUsImV4cCI6MjA4MDUxMTI4NX0._Q3peI3s04DuBHyHE3qUl-OzcagrbpWdP2-QIid3agY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ISU A DISELESAIKAN: Senarai putih UID Admin sebenar
const ADMIN_UIDS = ['bf2faada-2d44-4a16-a981-05649949ee60'];

let isAdmin = false;
let dynamicFixedTarget = 4750;
const DEADLINE = new Date('2027-06-05');

let members = [];
let expenses = [];
let tentativeList = [];
let checklistList = [];
let showTentativeWarning = true;
let showChecklistWarning = true;

async function loadDataFromSupabase() {
    console.log("Sedang menarik data dari Supabase secara serentak...");
    try {
        const [
            { data: membersData, error: errorMembers },
            { data: expensesData, error: errorExpenses },
            { data: tentativeData, error: errorTentative },
            { data: checklistData, error: errorChecklist },
            { data: settingsData, error: errorSettings }
        ] = await Promise.all([
            supabaseClient.from('members').select('*').order('id', { ascending: true }),
            supabaseClient.from('expenses').select('*'),
            supabaseClient.from('tentative').select('*').order('sort_order', { ascending: true }),
            supabaseClient.from('checklist').select('*').order('sort_order', { ascending: true }),
            supabaseClient.from('app_settings').select('*')
        ]);

        if (errorMembers || errorExpenses || errorTentative || errorChecklist || errorSettings) {
            throw (errorMembers || errorExpenses || errorTentative || errorChecklist || errorSettings);
        }

        if (settingsData) {
            const warningSetting = settingsData.find(s => s.setting_key === 'show_tentative_warning');
            if (warningSetting) showTentativeWarning = warningSetting.setting_value === 'true';

            const chkWarningSetting = settingsData.find(s => s.setting_key === 'show_checklist_warning');
            if (chkWarningSetting) showChecklistWarning = chkWarningSetting.setting_value === 'true';

            const totalTargetSetting = settingsData.find(s => s.setting_key === 'total_target');
            if (totalTargetSetting) dynamicFixedTarget = parseFloat(totalTargetSetting.setting_value);
        }

        if (membersData) members = membersData;
        if (expensesData) expenses = expensesData;
        if (tentativeData) tentativeList = tentativeData;
        if (checklistData) checklistList = checklistData;

        renderTable();
        renderExpenses();
        renderTentative();
        renderTentativeWarning();
        renderChecklist();
        renderChecklistWarning();

        console.log("Data berjaya dikemaskini!");
    } catch (error) {
        console.error("Gagal tarik data:", error.message);
        showDatabaseErrorModal();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    switchMainTab('tabung', false);
    await loadDataFromSupabase();

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        // Semak sama ada session wujud DAN user.id sepadan dengan UID Admin
        const isAuthorizedAdmin = !!(session && session.user && ADMIN_UIDS.includes(session.user.id));
        isAdmin = isAuthorizedAdmin;
        updateAdminUI();

        if (isAdmin) {
            startAutoLogoutTimer();
        } else {
            stopAutoLogoutTimer();
            // Jika ada akaun bukan admin yang cuba log masuk, tamatkan sesi serta-merta
            if (session) {
                await supabaseClient.auth.signOut();
                showErrorModal('Akses Ditolak', 'Akaun ini tidak mempunyai kebenaran Pentadbir Sistem.');
            }
        }
    });

    setupImageZoom();

    setTimeout(() => {
        const toast = document.getElementById('paymentToast');
        if (toast) {
            toast.classList.remove('-translate-x-full', 'opacity-0', 'pointer-events-none');
            window.toastTimer = setTimeout(() => closeToast(), 6000);
        }
    }, 4000);
});
// #endregion

// #region 2. UTILITI KESELAMATAN (ALLOWLIST) & PEMBANTU MODAL UNIVERSAL
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ISU D DISELESAIKAN: Allowlist ketat untuk warna tema & kelas ikon FontAwesome
const ALLOWED_COLORS = ['blue', 'emerald', 'amber', 'rose', 'orange', 'purple', 'red', 'indigo', 'teal'];
const ALLOWED_ICON_REGEX = /^fa-[a-z0-9-]+$/;

function getSafeColor(color, fallback = 'blue') {
    return (typeof color === 'string' && ALLOWED_COLORS.includes(color.trim())) ? color.trim() : fallback;
}

function getSafeIcon(icon, fallback = 'fa-clock') {
    return (typeof icon === 'string' && ALLOWED_ICON_REGEX.test(icon.trim())) ? icon.trim() : fallback;
}

function parseMYDate(dateStr) {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function formatCurrency(num) {
    const val = parseFloat(num);
    const isWhole = Number.isInteger(val);
    return val.toLocaleString('ms-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: isWhole ? 0 : 2,
        maximumFractionDigits: isWhole ? 0 : 2
    });
}

function lockScroll() { document.body.classList.add('overflow-hidden'); }
function unlockScroll() { document.body.classList.remove('overflow-hidden'); }

function jumpTen(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const currentVal = parseFloat(event.target.value) || 0;
        const newVal = Math.max(0, currentVal + (event.key === 'ArrowUp' ? 10 : -10));
        event.target.value = newVal.toFixed(2);
    }
}

function triggerSquidSwim() {
    if (document.querySelectorAll('.swimming-squid').length >= 5) return;
    const squid = document.createElement('div');
    squid.innerText = '🦑';
    squid.classList.add('swimming-squid');
    squid.style.top = (Math.floor(Math.random() * 70) + 10) + '%';
    document.body.appendChild(squid);
    setTimeout(() => squid.remove(), 4000);
}

function closeToast() {
    const toast = document.getElementById('paymentToast');
    if (toast) {
        toast.classList.add('-translate-x-full', 'opacity-0', 'pointer-events-none');
        if (window.toastTimer) clearTimeout(window.toastTimer);
    }
}

function toggleContactModal() {
    document.getElementById('adminContactModal').classList.toggle('hidden');
}

function animateModal(modalId, show = true, shouldLockScroll = false) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const content = modal.querySelector('div');

    if (show) {
        if (shouldLockScroll) lockScroll();
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            if (content) {
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }
        }, 10);
    } else {
        if (shouldLockScroll) unlockScroll();
        modal.classList.add('opacity-0');
        if (content) {
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
        }
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

let alertAutoCloseTimer = null;
function showSystemAlert(type, title, message, autoCloseMs = 0) {
    const iconWrap = document.getElementById('sysAlertIconWrap');
    const icon = document.getElementById('sysAlertIcon');
    const titleEl = document.getElementById('sysAlertTitle');
    const descEl = document.getElementById('sysAlertDesc');
    const btnEl = document.getElementById('sysAlertBtn');

    const themes = {
        success: { wrap: 'bg-green-100 text-green-600 animate-bounce', icon: 'fa-solid fa-check text-2xl', btn: 'bg-slate-800 hover:bg-slate-900', btnText: 'Terima Kasih' },
        error:   { wrap: 'bg-red-100 text-red-500 animate-pulse', icon: 'fa-solid fa-xmark text-2xl', btn: 'bg-slate-800 hover:bg-slate-900', btnText: 'Tutup' },
        dbError: { wrap: 'bg-red-50 text-red-500 animate-pulse', icon: 'fa-solid fa-wifi-slash text-2xl', btn: 'bg-slate-800 hover:bg-slate-900', btnText: 'Cuba Lagi' },
        afk:     { wrap: 'bg-amber-100 text-amber-500 animate-bounce', icon: 'fa-solid fa-hourglass-end text-2xl', btn: 'bg-slate-800 hover:bg-slate-900', btnText: 'Saya Faham' },
        info:    { wrap: 'bg-gray-100 text-gray-500 animate-pulse', icon: 'fa-solid fa-screwdriver-wrench text-2xl', btn: 'bg-slate-800 hover:bg-slate-900', btnText: 'Saya Faham' }
    };

    const cfg = themes[type] || themes.info;
    iconWrap.className = `w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${cfg.wrap}`;
    icon.className = cfg.icon;
    titleEl.innerText = title;
    descEl.innerText = message;
    btnEl.className = `w-full py-3 ${cfg.btn} text-white rounded-xl text-sm font-bold transition shadow-lg`;
    btnEl.innerText = cfg.btnText;

    if (alertAutoCloseTimer) clearTimeout(alertAutoCloseTimer);
    animateModal('systemAlertModal', true, true);

    if (autoCloseMs > 0) {
        alertAutoCloseTimer = setTimeout(() => closeSystemAlert(), autoCloseMs);
    }
}

function closeSystemAlert() {
    if (alertAutoCloseTimer) clearTimeout(alertAutoCloseTimer);
    animateModal('systemAlertModal', false, true);
}

function showSuccessModal(title, message) { showSystemAlert('success', title, message, 2200); }
function showErrorModal(title, message) { showSystemAlert('error', title, message); }
function showDatabaseErrorModal() { showSystemAlert('dbError', 'Ralat Sambungan Sistem!', 'Maaf, terdapat masalah sambungan ke database. Sila semak internet anda.'); }
function openAfkLogoutModal() { showSystemAlert('afk', 'Sesi Tamat', 'Anda telah dilog keluar secara automatik kerana tidak aktif.'); }
function showNoReceiptModal() { showSystemAlert('info', 'Dalam Proses...', 'Bukti pembayaran bagi transaksi ini akan dikemaskini oleh Admin.'); }

let pendingAction = null;
function showConfirmationModal(message, actionCallback) {
    document.getElementById('confirmMessage').innerText = message;
    pendingAction = actionCallback;
    animateModal('confirmationModal', true, true);
}
function closeConfirmationModal() {
    animateModal('confirmationModal', false, true);
    setTimeout(() => { pendingAction = null; }, 300);
}
async function executeConfirmAction() {
    if (pendingAction) await pendingAction();
    closeConfirmationModal();
}
// #endregion

// #region 3. KAWALAN TAB UTAMA & NAVIGASI BAWAH
function switchMainTab(tabName, shouldScroll = false) {
    const tabMap = {
        tabung:    { sectionId: 'memberSection',    btnId: 'tabBtn-tabung',    bottomId: 'bottomNav-tabung',   activeColor: 'text-yellow-400' },
        belanja:   { sectionId: 'expensesSection',  btnId: 'tabBtn-belanja',   bottomId: 'bottomNav-belanja',  activeColor: 'text-red-400' },
        tentatif:  { sectionId: 'tentativeSection', btnId: 'tabBtn-tentatif',  bottomId: 'bottomNav-tentatif', activeColor: 'text-emerald-400' },
        checklist: { sectionId: 'checklistSection', btnId: 'tabBtn-checklist' },
        bantuan:   { sectionId: 'helpSection',      btnId: 'tabBtn-bantuan' }
    };

    const selected = tabMap[tabName];
    if (!selected) return;

    Object.values(tabMap).forEach(item => {
        const sec = document.getElementById(item.sectionId);
        const btn = document.getElementById(item.btnId);
        const bottomBtn = item.bottomId ? document.getElementById(item.bottomId) : null;

        if (sec) { sec.classList.add('hidden'); sec.style.display = 'none'; }
        if (btn) { btn.classList.remove('active-tab'); btn.classList.add('inactive-tab'); }
        if (bottomBtn && item.activeColor) bottomBtn.classList.remove(item.activeColor);
    });

    const activeSection = document.getElementById(selected.sectionId);
    const activeBtn = document.getElementById(selected.btnId);
    const activeBottomBtn = selected.bottomId ? document.getElementById(selected.bottomId) : null;

    if (activeSection) { activeSection.classList.remove('hidden'); activeSection.style.display = 'block'; }
    if (activeBtn) { activeBtn.classList.remove('inactive-tab'); activeBtn.classList.add('active-tab'); }
    if (activeBottomBtn && selected.activeColor) activeBottomBtn.classList.add(selected.activeColor);

    if (shouldScroll && activeSection) {
        setTimeout(() => {
            const anchor = document.getElementById('mainTabsAnchor') || activeSection;
            const yOffset = -76;
            const targetY = Math.max(0, anchor.getBoundingClientRect().top + window.scrollY + yOffset);
            
            window.scrollTo({ top: targetY, behavior: 'smooth' });

            activeSection.classList.remove('tab-focus-ring');
            void activeSection.offsetWidth;
            activeSection.classList.add('tab-focus-ring');
        }, 20);
    }
}

function scrollToTopHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.switchMainTab = switchMainTab;
window.scrollToTopHome = scrollToTopHome;
// #endregion

// #region 4. PENGESAHAN ADMIN (AUTH) & AUTO-LOGOUT AFK
function checkAuthAndToggle() {
    if (isAdmin) document.getElementById('logoutModal').classList.remove('hidden');
    else openLoginModal();
}

function openLoginModal() { animateModal('loginModal', true, true); }
function closeLoginModal() { animateModal('loginModal', false, true); }
function closeLogoutModal() { document.getElementById('logoutModal').classList.add('hidden'); }

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const btn = document.getElementById('btnLoginSubmit');
    const errorMsg = document.getElementById('loginErrorMsg');

    const MAX_ATTEMPTS = 3;
    const BLOCK_DURATION = 60 * 1000;
    const blockUntil = localStorage.getItem('loginBlockUntil');

    if (blockUntil) {
        const timeLeft = parseInt(blockUntil) - Date.now();
        if (timeLeft > 0) {
            errorMsg.innerHTML = `<i class="fa-solid fa-hand"></i> Sila tunggu ${Math.ceil(timeLeft / 1000)} saat lagi.`;
            errorMsg.classList.remove('hidden');
            return;
        } else {
            localStorage.removeItem('loginBlockUntil');
            localStorage.removeItem('loginAttempts');
        }
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;
    errorMsg.classList.add('hidden');

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0') + 1;
        localStorage.setItem('loginAttempts', attempts);
        if (attempts >= MAX_ATTEMPTS) {
            localStorage.setItem('loginBlockUntil', Date.now() + BLOCK_DURATION);
            errorMsg.innerHTML = `Terlalu banyak percubaan! <br>Sila tunggu 1 minit.`;
        } else {
            errorMsg.innerHTML = `Salah. Tinggal <b>${MAX_ATTEMPTS - attempts}</b> kali percubaan lagi.`;
        }
        errorMsg.classList.remove('hidden');
    } else if (data && data.user && !ADMIN_UIDS.includes(data.user.id)) {
        await supabaseClient.auth.signOut();
        errorMsg.innerHTML = `Akaun ini bukan pentadbir yang sah.`;
        errorMsg.classList.remove('hidden');
    } else {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginBlockUntil');
        closeLoginModal();
        showSuccessModal('Berjaya Log Masuk!', 'Selamat Datang Pentadbir Sistem');
        document.getElementById('adminEmail').value = '';
        document.getElementById('adminPassword').value = '';
    }

    btn.innerHTML = 'Log Masuk <i class="fa-solid fa-arrow-right"></i>';
    btn.disabled = false;
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    closeLogoutModal();
    showSuccessModal('Berjaya Log Keluar!', 'Sesi anda telah ditamatkan');
}

function updateAdminUI() {
    const dot = document.getElementById('loginStatusDot');
    const fab = document.getElementById('adminFab');
    const btnWarning = document.getElementById('btnToggleWarning');
    const btnChkWarning = document.getElementById('btnToggleChecklistWarning');
    const btnEditTarget = document.getElementById('btnEditTarget');
    const btnEditBudget = document.getElementById('btnEditBudget');

    if (isAdmin) {
        if (dot) dot.classList.remove('hidden');
        if (fab) { fab.classList.remove('hidden'); fab.classList.add('flex'); }
        if (btnWarning) btnWarning.classList.remove('hidden');
        if (btnChkWarning) btnChkWarning.classList.remove('hidden');
        if (btnEditTarget) btnEditTarget.classList.remove('hidden');
        if (btnEditBudget) { btnEditBudget.classList.remove('hidden'); btnEditBudget.classList.add('flex'); }
    } else {
        if (dot) dot.classList.add('hidden');
        if (fab) { fab.classList.add('hidden'); fab.classList.remove('flex'); }
        if (btnWarning) btnWarning.classList.add('hidden');
        if (btnChkWarning) btnChkWarning.classList.add('hidden');
        if (btnEditTarget) btnEditTarget.classList.add('hidden');
        if (btnEditBudget) { btnEditBudget.classList.add('hidden'); btnEditBudget.classList.remove('flex'); }
    }

    renderTable();
    renderExpenses();
    renderTentative();
    renderTentativeWarning();
    renderChecklist();
    renderChecklistWarning();
}

let afkTimer;
const AFK_LIMIT = 3 * 60 * 1000;
let lastActivityTime = 0;

function startAutoLogoutTimer() {
    ['click', 'keypress', 'touchstart', 'scroll'].forEach(evt => document.addEventListener(evt, resetAfkTimer, { passive: true }));
    resetAfkTimer();
}
function stopAutoLogoutTimer() {
    clearTimeout(afkTimer);
    ['click', 'keypress', 'touchstart', 'scroll'].forEach(evt => document.removeEventListener(evt, resetAfkTimer));
}
function resetAfkTimer() {
    if (!isAdmin) return;
    const now = Date.now();
    if (now - lastActivityTime < 1000) return;
    lastActivityTime = now;
    clearTimeout(afkTimer);
    afkTimer = setTimeout(async () => {
        await supabaseClient.auth.signOut();
        openAfkLogoutModal();
    }, AFK_LIMIT);
}
// #endregion

// #region 5. PENGURUSAN TABUNG, AHLI & BAJET
function renderTable() {
    const tbody = document.getElementById('memberTableBody');
    const targetDisplay = document.getElementById('totalTargetDisplay');
    if (targetDisplay) targetDisplay.innerText = formatCurrency(dynamicFixedTarget);

    const sortedMembers = [...members].sort((a, b) => b.paid - a.paid);
    let totalCollected = 0;
    let htmlContent = '';

    sortedMembers.forEach(m => {
        totalCollected += parseFloat(m.paid);
        let asasTotal = 0;
        let lainLainTotals = {};

        if (m.history && m.history.length > 0) {
            m.history.forEach(h => {
                const amt = parseFloat(h.amount);
                const type = h.type || 'Bayaran Tabung';
                if (type === 'Bayaran Tabung' || type === 'Bayaran Tabung (Target)' || type === 'Bayaran Asas' || type === 'Bayaran Asas (Target)') {
                    asasTotal += amt;
                } else {
                    if (!lainLainTotals[type]) lainLainTotals[type] = 0;
                    lainLainTotals[type] += amt;
                }
            });
        } else {
            asasTotal = parseFloat(m.paid);
        }

        let memberTarget = m.target !== undefined && m.target !== null ? parseFloat(m.target) : 500;
        if (memberTarget <= 0) memberTarget = 1;

        const barPct = Math.min(100, (asasTotal / memberTarget) * 100);
        const textPeratus = Math.round((asasTotal / memberTarget) * 100) + '%';
        let lencanaTambahan = '';
        const colors = ['blue', 'purple', 'rose', 'amber'];
        let colorIndex = 0;

        for (const [customType, customAmt] of Object.entries(lainLainTotals)) {
            const theme = getSafeColor(colors[colorIndex % colors.length], 'blue');
            lencanaTambahan += `<div class="text-[9px] font-bold text-${theme}-600 bg-${theme}-100 px-1.5 py-0.5 rounded mt-1 border border-${theme}-200 inline-block mr-1 mb-1">+${formatCurrency(customAmt)} ${escapeHtml(customType)}</div>`;
            colorIndex++;
        }

        const safeName = escapeHtml(m.name);
        const adminBtn = isAdmin ? `<i onclick="editMemberConfig(${m.id})" class="fa-solid fa-pen-to-square text-[10px] ml-2 text-gray-300 hover:text-blue-500 cursor-pointer" title="Urus Ahli"></i>` : '';

        htmlContent += `
            <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="p-3 font-bold text-gray-700 flex items-center">${safeName} ${adminBtn}</td>
                <td class="p-3 text-center">
                    <div class="w-16 mx-auto bg-gray-200 rounded-full h-1"><div class="bg-emerald-500 h-1 rounded-full" style="width:${barPct}%"></div></div>
                    <div class="text-[10px] text-gray-400 mt-0.5">${textPeratus}</div>
                    <div class="text-left mt-1">${lencanaTambahan}</div>
                </td>
                <td class="p-3 text-center font-mono text-emerald-600 font-bold">${formatCurrency(m.paid)}</td>
                <td class="p-3 text-center">
                    <button onclick="openDetails(${m.id})" class="mt-1 inline-flex items-center gap-1 cursor-pointer text-blue-500 hover:text-blue-700 transition group">
                        <i class="fa-solid fa-receipt text-lg group-hover:scale-110 transition-transform"></i><span class="text-[9px] font-medium underline decoration-dotted">Lihat</span>
                    </button>
                </td>
            </tr>`;
    });

    tbody.innerHTML = htmlContent;
    document.getElementById('tableSummaryCollected').innerText = formatCurrency(totalCollected);
    const globalPct = Math.min(100, (totalCollected / dynamicFixedTarget) * 100);
    const progressBar = document.getElementById('tableSummaryProgress');
    if (progressBar) progressBar.style.width = globalPct + '%';
    const pctText = document.getElementById('summaryPercentage');
    if (pctText) pctText.innerText = Math.round(globalPct) + '%';

    updateExpensesSummary(totalCollected);
}

function openDetails(id) {
    const m = members.find(x => x.id === id);
    document.getElementById('detailMemberName').innerText = m.name;
    lockScroll();

    const tbody = document.getElementById('detailsTableBody');
    tbody.innerHTML = '';

    const sortedHistory = [...(m.history || [])].sort((a, b) => parseMYDate(b.date) - parseMYDate(a.date));
    sortedHistory.forEach(h => {
        const displayType = h.type ? `<span class="text-[9px] block text-gray-400 mt-0.5">${escapeHtml(h.type)}</span>` : '';
        tbody.innerHTML += `<tr class="border-b border-dashed border-gray-100"><td class="py-2">${escapeHtml(h.date)}${displayType}</td><td class="text-right py-2">${formatCurrency(h.amount)}</td></tr>`;
    });
    document.getElementById('detailTotal').innerText = formatCurrency(m.paid);
    document.getElementById('detailsModal').classList.remove('hidden');
}

function closeDetailsModal() {
    unlockScroll();
    document.getElementById('detailsModal').classList.add('hidden');
}

function toggleOtherPayType() {
    const select = document.getElementById('initPayType');
    const container = document.getElementById('otherPayTypeContainer');
    const input = document.getElementById('initPayOther');
    if (select && container && input) {
        if (select.value === 'Lain-lain') { container.classList.remove('hidden'); input.focus(); }
        else { container.classList.add('hidden'); input.value = ''; }
    }
}

function toggleMemberConfigModal(show) {
    if (show) {
        document.getElementById('memberModalTitle').innerHTML = "Tambah Ahli Baru";
        document.getElementById('btnSaveProfile').innerHTML = 'Simpan Ahli';
        document.getElementById('configMemberId').value = '';
        document.getElementById('configMemberName').value = '';
        document.getElementById('configMemberTarget').value = '500';
        document.getElementById('paymentSectionWrapper').classList.add('hidden');
        document.getElementById('btnDeleteMember').classList.add('hidden');
        cancelHistoryEdit();
    }
    animateModal('memberConfigModal', show, true);
}

function editMemberConfig(id) {
    const m = members.find(x => x.id === id);
    if (!m) return;
    toggleMemberConfigModal(true);
    document.getElementById('memberModalTitle').innerHTML = "Urus Ahli";
    document.getElementById('btnSaveProfile').innerHTML = 'Kemaskini Profil';
    document.getElementById('configMemberId').value = m.id;
    document.getElementById('configMemberName').value = m.name;
    document.getElementById('configMemberTarget').value = m.target !== undefined && m.target !== null ? m.target : 500;
    document.getElementById('paymentSectionWrapper').classList.remove('hidden');
    document.getElementById('btnDeleteMember').classList.remove('hidden');
    renderMemberHistoryInModal(m);
}

function renderMemberHistoryInModal(member) {
    const historySection = document.getElementById('memberHistorySection');
    const container = document.getElementById('memberHistoryListContainer');
    if (member.history && member.history.length > 0) {
        historySection.classList.remove('hidden');
        container.innerHTML = '';
        member.history.forEach((h, index) => {
            const displayType = h.type ? `<span class="block text-[9px] text-gray-400 mt-0.5">${escapeHtml(h.type)}</span>` : '';
            container.innerHTML += `
                <div class="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 hover:bg-blue-50 transition">
                    <div><span class="text-gray-600 font-mono">${escapeHtml(h.date)}</span>${displayType}</div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-emerald-600">RM${escapeHtml(String(h.amount))}</span>
                        <button type="button" onclick="prepareEditHistoryItem(${member.id}, ${index})" class="text-blue-400 hover:text-blue-600 ml-2 bg-white p-1 rounded border border-blue-100 shadow-sm"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button type="button" onclick="deletePaymentHistoryItem(${member.id}, ${index})" class="text-red-400 hover:text-red-600 bg-white p-1 rounded border border-red-100 shadow-sm"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`;
        });
    } else {
        historySection.classList.add('hidden');
    }
}

function prepareEditHistoryItem(memberId, index) {
    const m = members.find(x => x.id === memberId);
    const item = m.history[index];
    document.getElementById('paymentBoxContainer').classList.replace('bg-emerald-50', 'bg-amber-50');
    document.getElementById('paymentBoxContainer').classList.replace('border-emerald-100', 'border-amber-100');
    document.getElementById('paymentBoxTitle').innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-600"></i> <span class="text-amber-700">Kemaskini Rekod Ini</span>`;
    document.getElementById('btnCancelHistoryEdit').classList.remove('hidden');
    document.getElementById('editHistoryIndex').value = index;
    document.getElementById('initPayAmount').value = item.amount;

    const currentType = item.type || 'Bayaran Tabung';
    const payTypeEl = document.getElementById('initPayType');
    const otherPayContainer = document.getElementById('otherPayTypeContainer');
    const otherPayInput = document.getElementById('initPayOther');

    if (payTypeEl) {
        if (currentType === 'Bayaran Tabung' || currentType === 'Bayaran Tabung (Target)' || currentType === 'Bayaran Asas' || currentType === 'Bayaran Asas (Target)') {
            payTypeEl.value = 'Bayaran Tabung';
            if (otherPayContainer) otherPayContainer.classList.add('hidden');
            if (otherPayInput) otherPayInput.value = '';
        } else {
            payTypeEl.value = 'Lain-lain';
            if (otherPayContainer) otherPayContainer.classList.remove('hidden');
            if (otherPayInput) otherPayInput.value = currentType;
        }
    }

    const [d, M, y] = item.date.split('-');
    document.getElementById('initPayDate').value = `${y}-${M.padStart(2, '0')}-${d.padStart(2, '0')}`;
    document.getElementById('initPayAmount').focus();
}

function cancelHistoryEdit() {
    const box = document.getElementById('paymentBoxContainer');
    if (box) { box.classList.replace('bg-amber-50', 'bg-emerald-50'); box.classList.replace('border-amber-100', 'border-emerald-100'); }
    const title = document.getElementById('paymentBoxTitle');
    if (title) title.innerHTML = `<i class="fa-solid fa-plus-circle"></i> Tambah Bayaran`;
    const btnCancel = document.getElementById('btnCancelHistoryEdit');
    if (btnCancel) btnCancel.classList.add('hidden');
    document.getElementById('editHistoryIndex').value = '';
    document.getElementById('initPayAmount').value = '';
    const date = document.getElementById('initPayDate');
    if (date) date.valueAsDate = new Date();
    document.getElementById('initPayType').value = 'Bayaran Tabung';
    document.getElementById('otherPayTypeContainer').classList.add('hidden');
    document.getElementById('initPayOther').value = '';
}

async function saveMemberProfile() {
    const id = document.getElementById('configMemberId').value;
    const name = document.getElementById('configMemberName').value.trim();
    const targetVal = parseFloat(document.getElementById('configMemberTarget').value) || 500;
    if (!name) return showErrorModal("Ralat", "Sila masukkan nama ahli terlebih dahulu.");

    const { error } = id
        ? await supabaseClient.from('members').update({ name, target: targetVal }).eq('id', id)
        : await supabaseClient.from('members').insert([{ name, paid: 0, history: [], target: targetVal }]);

    if (!error) {
        showSuccessModal(id ? "Disimpan!" : "Ditambah!", "Profil ahli berjaya disimpan.");
        toggleMemberConfigModal(false);
        switchMainTab('tabung', false);
        loadDataFromSupabase();
    } else showErrorModal("Ralat Sistem", error.message);
}

async function savePaymentRecord() {
    const id = document.getElementById('configMemberId').value;
    if (!id) return;
    const amountVal = parseFloat(document.getElementById('initPayAmount').value) || 0;
    if (amountVal <= 0) return showErrorModal("Ralat", "Sila masukkan jumlah bayaran yang sah (Melebihi RM0).");

    const dateInput = document.getElementById('initPayDate').value;
    const editIndex = document.getElementById('editHistoryIndex').value;
    let payType = document.getElementById('initPayType').value;
    if (payType === 'Lain-lain') {
        const otherVal = document.getElementById('initPayOther').value.trim();
        payType = otherVal !== '' ? otherVal : 'Lain-lain';
    }

    let dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    if (dateInput) {
        const [year, month, day] = dateInput.split('-');
        dateStr = `${day}-${month}-${year}`;
    }

    const member = members.find(m => m.id == id);
    const currentHistory = [...(member.history || [])];
    if (editIndex !== "") currentHistory[parseInt(editIndex)] = { date: dateStr, amount: amountVal, type: payType };
    else currentHistory.push({ date: dateStr, amount: amountVal, type: payType });

    const newTotalPaid = currentHistory.reduce((sum, h) => sum + parseFloat(h.amount), 0);
    const { error } = await supabaseClient.from('members').update({ paid: newTotalPaid, history: currentHistory }).eq('id', id);

    if (!error) {
        showSuccessModal("Direkod!", "Maklumat bayaran berjaya disimpan.");
        toggleMemberConfigModal(false);
        switchMainTab('tabung', false);
        loadDataFromSupabase();
    } else showErrorModal("Ralat Pangkalan Data", error.message);
}

function deleteMember() {
    const id = document.getElementById('configMemberId').value;
    if (!id) return;
    showConfirmationModal("Adakah anda pasti mahu memadam ahli ini?", async () => {
        const { error } = await supabaseClient.from('members').delete().eq('id', id);
        if (!error) {
            toggleMemberConfigModal(false);
            showSuccessModal("Berjaya", "Ahli telah dipadam");
            loadDataFromSupabase();
        } else showErrorModal("Ralat Sistem", error.message);
    });
}

function deletePaymentHistoryItem(memberId, index) {
    showConfirmationModal("Adakah anda pasti mahu memadam rekod bayaran ini?", async () => {
        const m = members.find(x => x.id === memberId);
        if (!m) return;
        const currentHistory = [...m.history];
        const amountToRemove = parseFloat(currentHistory[index].amount);
        currentHistory.splice(index, 1);
        const newPaid = parseFloat(m.paid) - amountToRemove;
        const { error } = await supabaseClient.from('members').update({ paid: newPaid, history: currentHistory }).eq('id', memberId);
        if (!error) {
            showSuccessModal("Selesai", "Rekod bayaran dipadam.");
            toggleMemberConfigModal(false);
            await loadDataFromSupabase();
        } else showErrorModal("Gagal", error.message);
    });
}

function editTotalTarget() {
    document.getElementById('newTargetInput').value = dynamicFixedTarget;
    animateModal('targetPromptModal', true, true);
}
function closeTargetPromptModal() { animateModal('targetPromptModal', false, true); }

async function submitNewTarget() {
    const newTarget = parseFloat(document.getElementById('newTargetInput').value);
    if (isNaN(newTarget) || newTarget <= 0) {
        closeTargetPromptModal();
        return setTimeout(() => showErrorModal("Ralat!", "Sila masukkan nilai nombor yang sah."), 300);
    }
    closeTargetPromptModal();
    dynamicFixedTarget = newTarget;
    renderTable();
    const { error } = await supabaseClient.from('app_settings').upsert({ setting_key: 'total_target', setting_value: dynamicFixedTarget.toString() });
    setTimeout(() => {
        if (error) showErrorModal("Ralat Pangkalan Data", "Gagal mengemaskini target: " + error.message);
        else showSuccessModal("Berjaya!", "Target keseluruhan telah dikemaskini.");
    }, 300);
}

function openBudgetModal() { animateModal('budgetModal', true, true); }
function closeBudgetModal() { animateModal('budgetModal', false, true); }
function openEditBudgetModal() { closeBudgetModal(); setTimeout(() => animateModal('editBudgetModal', true, true), 300); }
function closeEditBudgetModal() { animateModal('editBudgetModal', false, true); }
// #endregion

// #region 6. PENGURUSAN REKOD PERBELANJAAN
function renderExpenses() {
    const tbody = document.getElementById('expensesTableBody');
    document.getElementById('noExpensesMsg').className = expenses.length === 0 ? "p-6 text-center text-gray-400 text-sm" : "hidden";
    const sortedExpenses = [...expenses].sort((a, b) => parseMYDate(b.date) - parseMYDate(a.date));
    let htmlContent = '';

    sortedExpenses.forEach(e => {
        const adminAction = isAdmin ? `<button onclick="editExpense(${e.id})" class="ml-2 text-gray-300 hover:text-blue-500"><i class="fa-solid fa-pen-to-square"></i></button>` : '';
        const receiptIcon = (e.receipt_url && e.receipt_url.trim() !== "")
            ? `<div data-receipt-url="${escapeHtml(e.receipt_url)}" onclick="viewReceipt(this.dataset.receiptUrl)" class="mt-1 inline-flex items-center gap-1 cursor-pointer text-blue-500 hover:text-blue-700 transition group"><i class="fa-solid fa-receipt text-lg group-hover:scale-110 transition-transform"></i><span class="text-[9px] font-medium underline decoration-dotted">Lihat</span></div>`
            : `<div onclick="showNoReceiptModal()" class="mt-1 inline-flex items-center gap-1 cursor-pointer text-blue-500 hover:text-blue-700 transition group"><i class="fa-solid fa-receipt text-lg group-hover:scale-110 transition-transform"></i><span class="text-[9px] font-medium underline decoration-dotted">Lihat</span></div>`;

        htmlContent += `
            <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="p-3 align-top text-gray-500 whitespace-nowrap">${escapeHtml(e.date)}</td>
                <td class="p-3"><div class="font-bold text-gray-700 flex items-center">${escapeHtml(e.category)} ${adminAction}</div><div class="text-[10px] text-gray-400">&bull; ${escapeHtml(e.detail)}</div></td>
                <td class="p-3 text-right align-top"><div class="font-bold text-red-500">-${formatCurrency(e.amount)}</div>${receiptIcon}</td>
            </tr>`;
    });

    tbody.innerHTML = htmlContent;
    updateExpensesSummary(members.reduce((sum, m) => sum + m.paid, 0));
}

function updateExpensesSummary(totalCollected) {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalCollected - totalExpenses;

    const collectedEl = document.getElementById('summaryCollected');
    if (collectedEl) collectedEl.innerText = formatCurrency(totalCollected);
    const expEl = document.getElementById('summaryExpenses');
    if (expEl) expEl.innerText = formatCurrency(totalExpenses);
    const netEl = document.getElementById('summaryNetBalance');
    if (netEl) {
        netEl.innerText = formatCurrency(netBalance);
        netEl.className = netBalance < 0 ? "font-bold text-red-600 text-sm" : "font-bold text-blue-600 text-sm";
    }
}

function toggleExpenseModal(show) {
    if (show) {
        document.getElementById('expenseModalTitle').innerText = "Tambah Perbelanjaan";
        document.getElementById('btnExpSubmit').innerHTML = '<i class="fa-solid fa-cart-plus"></i> Tambah';
        document.getElementById('btnDeleteExp').classList.add('hidden');
        document.getElementById('expId').value = '';
        document.getElementById('expDate').valueAsDate = new Date();
        document.getElementById('expDetail').value = '';
        document.getElementById('expAmount').value = '';
        document.getElementById('expReceiptUrl').value = '';
        document.getElementById('expCategory').selectedIndex = 0;
    }
    animateModal('expenseModal', show, true);
}

function editExpense(id) {
    const e = expenses.find(x => x.id === id);
    if (!e) return;
    animateModal('expenseModal', true, true);
    document.getElementById('expenseModalTitle').innerText = "Kemaskini Perbelanjaan";
    document.getElementById('btnExpSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kemaskini';
    document.getElementById('expId').value = e.id;

    const [day, month, year] = e.date.split('-');
    document.getElementById('expDate').value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    document.getElementById('expCategory').value = e.category;
    document.getElementById('expDetail').value = e.detail;
    document.getElementById('expAmount').value = e.amount;
    document.getElementById('expReceiptUrl').value = e.receipt_url || '';
    document.getElementById('btnDeleteExp').classList.remove('hidden');
}

async function submitExpense(e) {
    e.preventDefault();
    const id = document.getElementById('expId').value;
    const [year, month, day] = document.getElementById('expDate').value.split('-');
    const payload = {
        date: `${day}-${month}-${year}`,
        category: document.getElementById('expCategory').value,
        detail: document.getElementById('expDetail').value,
        amount: parseFloat(document.getElementById('expAmount').value),
        receipt_url: document.getElementById('expReceiptUrl').value
    };

    const { error } = id
        ? await supabaseClient.from('expenses').update(payload).eq('id', id)
        : await supabaseClient.from('expenses').insert([payload]);

    if (!error) {
        showSuccessModal("Berjaya!", "Perbelanjaan berjaya disimpan");
        toggleExpenseModal(false);
        switchMainTab('belanja', false);
        loadDataFromSupabase();
    } else showErrorModal("Gagal Simpan", error.message);
}

function deleteExpense() {
    const id = document.getElementById('expId').value;
    if (!id) return;
    showConfirmationModal("Adakah anda pasti mahu memadam rekod perbelanjaan ini?", async () => {
        const { error } = await supabaseClient.from('expenses').delete().eq('id', id);
        if (!error) {
            showSuccessModal("Berjaya!", "Rekod telah dipadam");
            toggleExpenseModal(false);
            loadDataFromSupabase();
        } else showErrorModal("Gagal Memadam", error.message);
    });
}
// #endregion

// #region 7. PENGURUSAN TENTATIF & CHECKLIST (DENGAN PENAPIS ALLOWLIST)
function toggleTentative(element) {
    const content = element.nextElementSibling || element.parentElement.querySelector('.tentative-body');
    const icon = element.querySelector('.fa-chevron-down');
    content.classList.toggle('hidden');
    if (icon) icon.classList.toggle('rotate-180');
}

function renderTentative() {
    const container = document.getElementById('tentativeContainer');
    if (!container) return;
    if (tentativeList.length === 0) {
        container.innerHTML = '<div class="text-center text-xs text-gray-400 py-4">Tiada rekod tentatif lagi.</div>';
        return;
    }

    let htmlContent = '';
    tentativeList.forEach(item => {
        let detailsHtml = '';
        (item.details ? item.details.split('\n') : []).forEach(d => {
            if (d.trim() !== '') detailsHtml += `<p class="text-xs text-gray-500">${escapeHtml(d)}</p>`;
        });

        const adminBtn = isAdmin ? `<button onclick="editTentative(${item.id})" class="ml-2 text-gray-300 hover:text-indigo-500 transition"><i class="fa-solid fa-pen-to-square"></i></button>` : '';
        const safeColor = getSafeColor(item.color_theme, 'blue');
        const safeIcon = getSafeIcon(item.icon, 'fa-clock');

        htmlContent += `
        <div class="flex gap-4 items-start relative mb-6">
            <div class="bg-${safeColor}-100 text-${safeColor}-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm"><i class="fa-solid ${safeIcon} text-xs"></i></div>
            <div class="flex-1">
                <div class="cursor-pointer group select-none">
                    <span class="text-[10px] font-bold text-gray-400 block mb-0.5 uppercase tracking-wide">${escapeHtml(item.time_label)} ${adminBtn}</span>
                    <div class="flex justify-between items-center" onclick="toggleTentative(this)">
                        <h4 class="font-bold text-sm text-gray-800 group-hover:text-${safeColor}-600 transition">${escapeHtml(item.title)}</h4>
                        <i class="fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-300"></i>
                    </div>
                    <div class="tentative-body hidden mt-2 space-y-1">${detailsHtml}</div>
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = htmlContent;
}

function renderTentativeWarning() {
    const warningEl = document.getElementById('tentativeWarningText');
    const btnIcon = document.querySelector('#btnToggleWarning i');
    if (warningEl) {
        warningEl.classList.toggle('hidden', !showTentativeWarning);
        if (btnIcon) btnIcon.className = showTentativeWarning ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash text-red-400';
    }
}

async function toggleTentativeWarning() {
    showTentativeWarning = !showTentativeWarning;
    renderTentativeWarning();
    const { error } = await supabaseClient.from('app_settings').upsert({ setting_key: 'show_tentative_warning', setting_value: showTentativeWarning.toString() });
    if (error) {
        showErrorModal("Ralat", "Gagal mengemaskini tetapan: " + error.message);
        showTentativeWarning = !showTentativeWarning;
        renderTentativeWarning();
    }
}

function toggleTentativeModal(show) {
    if (show) {
        document.getElementById('tentativeModalTitle').innerText = "Tambah Tentatif";
        document.getElementById('btnTentSubmit').innerHTML = 'Simpan';
        document.getElementById('btnDeleteTent').classList.add('hidden');
        document.getElementById('tentId').value = '';
        document.getElementById('tentTime').value = '';
        document.getElementById('tentTitle').value = '';
        document.getElementById('tentDetails').value = '';
        document.getElementById('tentSort').value = tentativeList.length + 1;
        document.getElementById('tentColor').value = 'blue';
        document.getElementById('tentIcon').value = 'fa-clock';
    }
    animateModal('tentativeModal', show, true);
}

function editTentative(id) {
    const t = tentativeList.find(x => x.id === id);
    if (!t) return;
    toggleTentativeModal(true);
    document.getElementById('tentativeModalTitle').innerText = "Kemaskini Tentatif";
    document.getElementById('tentId').value = t.id;
    document.getElementById('tentTime').value = t.time_label;
    document.getElementById('tentTitle').value = t.title;
    document.getElementById('tentDetails').value = t.details || '';
    document.getElementById('tentSort').value = t.sort_order;
    document.getElementById('tentColor').value = getSafeColor(t.color_theme, 'blue');
    document.getElementById('tentIcon').value = getSafeIcon(t.icon, 'fa-clock');
    document.getElementById('btnDeleteTent').classList.remove('hidden');
}

async function submitTentative(e) {
    e.preventDefault();
    const id = document.getElementById('tentId').value;
    const payload = {
        time_label: document.getElementById('tentTime').value,
        title: document.getElementById('tentTitle').value,
        details: document.getElementById('tentDetails').value,
        sort_order: parseInt(document.getElementById('tentSort').value) || 0,
        color_theme: getSafeColor(document.getElementById('tentColor').value, 'blue'),
        icon: getSafeIcon(document.getElementById('tentIcon').value, 'fa-clock')
    };
    const { error } = id
        ? await supabaseClient.from('tentative').update(payload).eq('id', id)
        : await supabaseClient.from('tentative').insert([payload]);

    if (!error) {
        showSuccessModal(id ? "Dikemaskini!" : "Ditambah!", "Tentatif berjaya disimpan");
        toggleTentativeModal(false);
        switchMainTab('tentatif', false);
        loadDataFromSupabase();
    } else showErrorModal("Ralat", error.message);
}

function deleteTentative() {
    const id = document.getElementById('tentId').value;
    if (!id) return;
    showConfirmationModal("Anda pasti mahu memadam aktiviti tentatif ini?", async () => {
        const { error } = await supabaseClient.from('tentative').delete().eq('id', id);
        if (!error) {
            showSuccessModal("Berjaya!", "Rekod telah dipadam");
            toggleTentativeModal(false);
            loadDataFromSupabase();
        } else showErrorModal("Gagal Memadam", error.message);
    });
}

function renderChecklist() {
    const container = document.getElementById('checklistContainer');
    if (!container) return;
    if (checklistList.length === 0) {
        container.innerHTML = '<div class="text-center text-xs text-gray-400 py-4">Tiada rekod checklist.</div>';
        return;
    }

    let htmlContent = '';
    checklistList.forEach(cat => {
        const safeColor = getSafeColor(cat.color_theme, 'emerald');
        const safeIcon = getSafeIcon(cat.icon, 'fa-list');
        const adminBtn = isAdmin ? `<button onclick="editChecklist(${cat.id}); event.stopPropagation();" class="ml-2 text-gray-300 hover:text-${safeColor}-500 transition"><i class="fa-solid fa-pen-to-square"></i></button>` : '';
        let itemsHtml = '';
        if (cat.items) {
            cat.items.split('\n').forEach(line => {
                if (line.trim() === '') return;
                const [itemName = '', rawType = ''] = line.split('|');
                const itemType = rawType.trim().toLowerCase();
                let badge = '';
                if (itemType === 'wajib') badge = `<span class="ml-2 text-[10px] font-medium text-white bg-red-500 rounded px-1">(wajib)</span>`;
                else if (itemType === 'pilihan') badge = `<span class="ml-2 text-[10px] font-medium text-emerald-700 rounded px-1 bg-emerald-50">(pilihan)</span>`;
                itemsHtml += `<div class="flex gap-2 items-center"><i class="fa-solid fa-angle-right text-gray-300 text-xs"></i><span class="text-xs">${escapeHtml(itemName)} ${badge}</span></div>`;
            });
        }

        htmlContent += `
        <section>
            <header class="flex justify-between cursor-pointer font-bold text-sm text-gray-700" onclick="toggleChecklistCategory(this)">
                <div><i class="fa-solid ${safeIcon} text-${safeColor}-500 mr-2"></i> ${escapeHtml(cat.category)} ${adminBtn}</div>
                <i class="fa-solid fa-chevron-down text-gray-400 transition-transform duration-300"></i>
            </header>
            <div class="category-body mt-2 pl-6 space-y-2 hidden">${itemsHtml}</div>
        </section>`;
    });
    container.innerHTML = htmlContent;
}

function toggleChecklistCategory(el) {
    const body = el.nextElementSibling;
    const icon = el.querySelector('.fa-chevron-down');
    body.classList.toggle('hidden');
    if (icon) icon.classList.toggle('rotate-180');
}

function renderChecklistWarning() {
    const warningEl = document.getElementById('checklistWarningText');
    const btnIcon = document.querySelector('#btnToggleChecklistWarning i');
    if (warningEl) {
        warningEl.classList.toggle('hidden', !showChecklistWarning);
        if (btnIcon) btnIcon.className = showChecklistWarning ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash text-red-400';
    }
}

async function toggleChecklistWarning() {
    showChecklistWarning = !showChecklistWarning;
    renderChecklistWarning();
    const { error } = await supabaseClient.from('app_settings').upsert({ setting_key: 'show_checklist_warning', setting_value: showChecklistWarning.toString() });
    if (error) {
        showErrorModal("Ralat", "Gagal mengemaskini tetapan: " + error.message);
        showChecklistWarning = !showChecklistWarning;
        renderChecklistWarning();
    }
}

function toggleChecklistModal(show) {
    if (show) {
        document.getElementById('checklistModalTitle').innerText = "Tambah Checklist";
        document.getElementById('btnChkSubmit').innerHTML = 'Simpan';
        document.getElementById('btnDeleteChk').classList.add('hidden');
        document.getElementById('chkId').value = '';
        document.getElementById('chkCategory').value = '';
        document.getElementById('chkItems').value = '';
        document.getElementById('chkSort').value = checklistList.length + 1;
        document.getElementById('chkColor').value = 'emerald';
        document.getElementById('chkIcon').value = 'fa-list';
    }
    animateModal('checklistModal', show, true);
}

function editChecklist(id) {
    const c = checklistList.find(x => x.id === id);
    if (!c) return;
    toggleChecklistModal(true);
    document.getElementById('checklistModalTitle').innerText = "Kemaskini Checklist";
    document.getElementById('chkId').value = c.id;
    document.getElementById('chkCategory').value = c.category;
    document.getElementById('chkItems').value = c.items || '';
    document.getElementById('chkSort').value = c.sort_order;
    document.getElementById('chkColor').value = getSafeColor(c.color_theme, 'emerald');
    document.getElementById('chkIcon').value = getSafeIcon(c.icon, 'fa-list');
    document.getElementById('btnDeleteChk').classList.remove('hidden');
}

async function submitChecklist(e) {
    e.preventDefault();
    const id = document.getElementById('chkId').value;
    const payload = {
        category: document.getElementById('chkCategory').value,
        items: document.getElementById('chkItems').value,
        sort_order: parseInt(document.getElementById('chkSort').value) || 0,
        color_theme: getSafeColor(document.getElementById('chkColor').value, 'emerald'),
        icon: getSafeIcon(document.getElementById('chkIcon').value, 'fa-list')
    };
    const { error } = id
        ? await supabaseClient.from('checklist').update(payload).eq('id', id)
        : await supabaseClient.from('checklist').insert([payload]);

    if (!error) {
        showSuccessModal(id ? "Dikemaskini!" : "Ditambah!", "Checklist berjaya disimpan");
        toggleChecklistModal(false);
        switchMainTab('checklist', false);
        loadDataFromSupabase();
    } else showErrorModal("Ralat", error.message);
}

function deleteChecklist() {
    const id = document.getElementById('chkId').value;
    if (!id) return;
    showConfirmationModal("Anda pasti mahu memadam kategori checklist ini?", async () => {
        const { error } = await supabaseClient.from('checklist').delete().eq('id', id);
        if (!error) {
            showSuccessModal("Berjaya!", "Rekod telah dipadam");
            toggleChecklistModal(false);
            loadDataFromSupabase();
        } else showErrorModal("Gagal Memadam", error.message);
    });
}
// #endregion

// #region 8. KALENDAR & GALERI GAMBAR (ZOOM)
let currentCalDate = new Date();

function getRemainingTime() {
    const diff = DEADLINE - new Date();
    return { expired: diff <= 0, totalDays: Math.ceil(diff / (1000 * 60 * 60 * 24)) };
}

function openCalendarModal() {
    currentCalDate = new Date();
    renderCalendar();
    const timeData = getRemainingTime();
    const countEl = document.getElementById('modalCountdown');
    if (timeData.expired) {
        countEl.innerText = "Misi Sedang Berlangsung!";
        countEl.className = "font-bold text-emerald-600 text-sm animate-pulse";
    } else {
        countEl.innerText = `${timeData.totalDays} Hari Lagi`;
        countEl.className = "font-bold text-blue-600 text-sm";
    }
    animateModal('calendarModal', true, false);
}

function closeCalendarModal() { animateModal('calendarModal', false, false); }
function changeMonth(direction) { currentCalDate.setMonth(currentCalDate.getMonth() + direction); renderCalendar(); }
function jumpToToday() { currentCalDate = new Date(); renderCalendar(); }
function jumpToTripDate() { currentCalDate = new Date(2027, 5, 5); renderCalendar(); }

function renderCalendar() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
    document.getElementById('calTitle').innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = document.getElementById('calGrid');
    grid.innerHTML = "";

    for (let i = 0; i < firstDay; i++) grid.innerHTML += `<span></span>`;

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        let cellClass = "w-7 h-7 flex items-center justify-center rounded-full mx-auto transition cursor-default";
        const isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
        const isTripDay = (year === 2027 && month === 5 && (day === 5 || day === 6 || day === 7));

        if (isTripDay) {
            cellClass += " bg-emerald-500 text-white shadow-lg shadow-emerald-200 font-bold scale-110";
            if (day === 6) cellClass += " animate-bounce";
        } else if (isToday) {
            cellClass += " bg-blue-500 text-white font-bold";
        } else {
            cellClass += " hover:bg-gray-100 text-slate-700";
        }
        grid.innerHTML += `<span class="flex items-center justify-center"><div class="${cellClass}">${day}</div></span>`;
    }
}

function isValidReceiptUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return false;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('Images/') || cleanUrl.startsWith('gambar/')) return true;
    try {
        const parsed = new URL(cleanUrl);
        return parsed.protocol === 'https:' && parsed.origin === 'https://twbmjojqyhmjsoywiqrs.supabase.co' && parsed.pathname.startsWith('/storage/v1/object/public/');
    } catch { return false; }
}

let currentGalleryImages = [];
let currentGalleryIndex = 0;
let currentZoom = 1, translateX = 0, translateY = 0, initialPinchDistance = null, lastZoom = 1;

function resetZoom() {
    currentZoom = 1; translateX = 0; translateY = 0;
    const img = document.getElementById('galleryMainImage');
    if (img) { img.style.transform = `translate(0px, 0px) scale(1)`; img.classList.add('transition-transform'); }
}

function setupImageZoom() {
    const img = document.getElementById('galleryMainImage');
    if (!img) return;
    let isDragging = false, startPos = { x: 0, y: 0 }, lastTap = 0;

    img.addEventListener('touchstart', (e) => {
        img.classList.remove('transition-transform');
        if (e.touches.length === 2) {
            isDragging = false;
            initialPinchDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            lastZoom = currentZoom;
        } else if (e.touches.length === 1) {
            isDragging = true;
            startPos = { x: e.touches[0].clientX - translateX, y: e.touches[0].clientY - translateY };
        }
    }, { passive: false });

    img.addEventListener('touchmove', (e) => {
        if (currentZoom > 1 || e.touches.length === 2) e.preventDefault();
        if (e.touches.length === 2 && initialPinchDistance) {
            const currentDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            currentZoom = Math.min(Math.max(1, lastZoom * (currentDistance / initialPinchDistance)), 4);
            img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
        } else if (e.touches.length === 1 && isDragging && currentZoom > 1) {
            translateX = e.touches[0].clientX - startPos.x;
            translateY = e.touches[0].clientY - startPos.y;
            img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
        }
    }, { passive: false });

    img.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) initialPinchDistance = null;
        if (e.touches.length === 0) isDragging = false;
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            if (currentZoom > 1) resetZoom();
            else { currentZoom = 2.5; img.style.transform = `translate(0px, 0px) scale(${currentZoom})`; img.classList.add('transition-transform'); }
        }
        lastTap = currentTime;
    });
}

function viewReceipt(urls) {
    const modal = document.getElementById('receiptImageModal');
    if (!modal) return;
    const receiptUrls = urls.split(',').map(u => u.trim()).filter(u => isValidReceiptUrl(u));
    if (receiptUrls.length === 0) return showErrorModal('Pautan Tidak Sah', 'Gambar tidak dapat dibuka kerana pautan tidak sah.');

    currentGalleryImages = receiptUrls;
    currentGalleryIndex = 0;
    updateGalleryView();
    lockScroll();
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function updateGalleryView() {
    const img = document.getElementById('galleryMainImage');
    const btnPrev = document.getElementById('btnPrevImage');
    const btnNext = document.getElementById('btnNextImage');
    const counter = document.getElementById('galleryCounter');
    resetZoom();
    img.classList.add('opacity-40');
    setTimeout(() => { img.src = currentGalleryImages[currentGalleryIndex]; img.classList.remove('opacity-40'); }, 150);

    const hasMultiple = currentGalleryImages.length > 1;
    btnPrev.classList.toggle('hidden', !hasMultiple);
    btnNext.classList.toggle('hidden', !hasMultiple);
    counter.classList.toggle('hidden', !hasMultiple);
    if (hasMultiple) counter.innerText = `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;
}

function nextImage() { currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length; updateGalleryView(); }
function prevImage() { currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length; updateGalleryView(); }

function closeReceiptModal() {
    const modal = document.getElementById('receiptImageModal');
    const img = document.getElementById('galleryMainImage');
    if (modal) {
        unlockScroll();
        resetZoom();
        modal.classList.add('opacity-0');
        setTimeout(() => { modal.classList.add('hidden'); if (img) img.src = ''; currentGalleryImages = []; }, 300);
    }
}
// #endregion
