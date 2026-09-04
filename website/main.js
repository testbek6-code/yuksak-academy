// Admin Panel Navigation Helper
function openAdminPanel(e) {
    if (e) e.preventDefault();
    if (window.location.protocol === 'file:') {
        window.open('http://localhost:5000/admin', '_blank');
    } else {
        window.open(window.location.origin + '/admin', '_blank');
    }
}

// -------------------------------------------------------------
// 1. Language Toggle & Translation Engine
// -------------------------------------------------------------
const langBtn = document.getElementById('lang-toggle');
const languages = ['uz', 'ru', 'en'];
let currentLang = 'uz'; // Default to UZ

const translatableElements = document.querySelectorAll('[data-ru]');

function updateLanguage(lang) {
    currentLang = lang;
    if (langBtn) {
        langBtn.textContent = lang.toUpperCase();
    }
    
    translatableElements.forEach(el => {
        const text = el.getAttribute('data-' + lang);
        if (text) {
            // Check if element is a button or simple text container
            if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
                el.value = text;
            } else {
                el.textContent = text;
            }
        }
    });

    // Refresh interactive terminal text language if applicable
    const activeCmd = document.getElementById('terminal-interactive-cmd');
    if (activeCmd) {
        runTermCmd(activeCmd.textContent, true);
    }
}

if (langBtn) {
    langBtn.addEventListener('click', () => {
        const currentIndex = languages.indexOf(currentLang);
        const nextIndex = (currentIndex + 1) % languages.length;
        updateLanguage(languages[nextIndex]);
        
        // Add click feedback animation
        langBtn.style.transform = 'scale(0.9) rotate(5deg)';
        setTimeout(() => {
            langBtn.style.transform = 'scale(1) rotate(0deg)';
        }, 150);
    });
}

// -------------------------------------------------------------
// 2. Matrix Rain Simulation
// -------------------------------------------------------------
const canvas = document.getElementById('matrix');
if (canvas) {
    const ctx = canvas.getContext('2d');

    // Set full screen width/height
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters (binary + hex + katakana for standard matrix rain)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾖﾙﾚﾛﾝ';
    const charArray = chars.split('');

    const fontSize = 14;
    let columns = canvas.width / fontSize;

    // Drops coordinates y values
    let drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100; // staggered start heights
    }

    const drawMatrix = () => {
        // Semi-transparent background to create trailing effect
        ctx.fillStyle = 'rgba(2, 2, 4, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff66'; // Glowing Matrix Green
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            // Pick a random character
            const text = charArray[Math.floor(Math.random() * charArray.length)];
            
            // Render the character
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            // Randomize brightness
            if (Math.random() > 0.98) {
                ctx.fillStyle = '#ffffff'; // White tip
            } else {
                ctx.fillStyle = 'rgba(0, 255, 102, ' + (Math.random() * 0.5 + 0.5) + ')';
            }

            ctx.fillText(text, x, y);

            // Reset drop to top once it goes past screen height
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }
    };

    // Render at roughly 30 FPS for performance
    setInterval(drawMatrix, 35);
}

// -------------------------------------------------------------
// 3. Interactive Terminal Command Simulator
// -------------------------------------------------------------
const terminalResponses = {
    help: {
        uz: `TIZIM BUYRUQLARI // SYSTEM COMMANDS:\n` +
            `- modules: Akademiyaning barcha o'quv modullarini tekshirish\n` +
            `- secure: Total Security xavfsizlik shifrlarini tahlil qilish\n` +
            `- status: Platformaning onlayn ish holatini ko'rish\n` +
            `- clear: Terminal ekranini tozalash`,
        ru: `СИСТЕМНЫЕ КОМАНДЫ // SYSTEM COMMANDS:\n` +
            `- modules: Показать все учебные модули Академии\n` +
            `- secure: Проанализировать протоколы Total Security\n` +
            `- status: Проверить онлайн статус платформы\n` +
            `- clear: Очистить экран терминала`,
        en: `SYSTEM COMMANDS // SYSTEM COMMANDS:\n` +
            `- modules: Show all educational modules of Academy\n` +
            `- secure: Analyze Total Security shield protocols\n` +
            `- status: Check platform server online health\n` +
            `- clear: Clear terminal screen`
    },
    modules: {
        uz: `YUKSAK ACADEMY KO'CHIRILGAN MODULLAR:\n` +
            `[MOD_01] Python & Telegram Botlar yaratish (IT)\n` +
            `[MOD_02] Dizayn & Sun'iy Intellekt (AI)\n` +
            `[MOD_03] 3D Modellashtirish (SolidWorks)\n` +
            `[MOD_04] Rus va Ingliz tillari akademiyasi\n` +
            `>> Barchasi faol. Telegram bot orqali ishlaydi.`,
        ru: `ЗАГРУЖЕННЫЕ МОДУЛИ YUKSAK ACADEMY:\n` +
            `[MOD_01] Python & Создание Telegram Ботов (IT)\n` +
            `[MOD_02] Дизайн & Искусственный Интеллект (AI)\n` +
            `[MOD_03] 3D Моделирование (SolidWorks)\n` +
            `[MOD_04] Академия Русского и Английского языков\n` +
            `>> Все модули АКТИВНЫ. Обучение проходит в Telegram боте.`,
        en: `LOADED MODULES YUKSAK ACADEMY:\n` +
            `[MOD_01] Python & Telegram Bot Creation (IT)\n` +
            `[MOD_02] Design & Artificial Intelligence (AI)\n` +
            `[MOD_03] 3D Modeling (SolidWorks)\n` +
            `[MOD_04] Russian & English Language Academy\n` +
            `>> All modules online. Learning happens inside Telegram bot.`
    },
    secure: {
        uz: `TOTAL SECURITY SYSTEM SCAN REPORT:\n` +
            `[PROTECT-1] Nusxalashni taqiqlash: FAOL (Video yuklab bo'lmaydi)\n` +
            `[PROTECT-2] Anti-Xaker FireWall: ISHLAMOQDA (Buzg'unchilar auto-bloklanadi)\n` +
            `[PROTECT-3] Shaxsiy ma'lumotlar shifrlandi (AES-256 standard)\n` +
            `>> XAVFSIZLIK DARAJASI: 100% MAKSIMAL`,
        ru: `TOTAL SECURITY SYSTEM SCAN REPORT:\n` +
            `[PROTECT-1] Запрет копирования: АКТИВЕН (Загрузка видео заблокирована)\n` +
            `[PROTECT-2] Анти-Хакер FireWall: ЗАПУЩЕН (Моментальный авто-бан нарушителей)\n` +
            `[PROTECT-3] База данных зашифрована по стандарту AES-256\n` +
            `>> СТАТУС БЕЗОПАСНОСТИ: 100% МАКСИМАЛЬНЫЙ`,
        en: `TOTAL SECURITY SYSTEM SCAN REPORT:\n` +
            `[PROTECT-1] Copy protection: ACTIVE (Video downloads prohibited)\n` +
            `[PROTECT-2] Anti-Hacker FireWall: RUNNING (Instant intruder auto-block)\n` +
            `[PROTECT-3] Databases encrypted using AES-256 standard\n` +
            `>> SECURITY SHIELD: 100% MAXIMUM STRENGTH`
    },
    status: {
        uz: `TIZIM PARAMETRLARI // SYSTEM METRICS:\n` +
            `- Server statusi: ONLAYN (100% Faol)\n` +
            `- Sun'iy intellekt (AI): ALOQA O'RNATILDI (Uptime: 99.9%)\n` +
            `- Telegram Bot API: INTEGRATSIYA QILINGAN\n` +
            `- Asoschi: KAMOLOV.A // Platforma tayyor.`,
        ru: `ПАРАМЕТРЫ СИСТЕМЫ // SYSTEM METRICS:\n` +
            `- Статус сервера: ОНЛАЙН (100% Активен)\n` +
            `- Искусственный Интеллект: ПОДКЛЮЧЕН (Uptime: 99.9%)\n` +
            `- Telegram Bot API: УСПЕШНАЯ ИНТЕГРАЦИЯ\n` +
            `- Основатель: KAMOLOV.A // Платформа готова к работе.`,
        en: `SYSTEM METRICS // SYSTEM METRICS:\n` +
            `- Server status: ONLINE (100% Active)\n` +
            `- Artificial Intelligence: CONNECTED (Uptime: 99.9%)\n` +
            `- Telegram Bot API: INTEGRATED SUCCESSFULLY\n` +
            `- Founder: KAMOLOV.A // Platform ready for deployment.`
    }
};

window.runTermCmd = function(cmd, quiet = false) {
    const cmdSpan = document.getElementById('terminal-interactive-cmd');
    const outputDiv = document.getElementById('terminal-interactive-output');
    
    if (!cmdSpan || !outputDiv) return;

    if (cmd === 'clear') {
        cmdSpan.textContent = 'clear';
        outputDiv.innerHTML = '';
        return;
    }

    cmdSpan.textContent = cmd;

    const responseObj = terminalResponses[cmd];
    if (responseObj) {
        const responseText = responseObj[currentLang] || responseObj['uz'];
        // Format newlines into HTML breaks
        outputDiv.innerHTML = responseText.replace(/\n/g, '<br>');
        
        // Add a sleek glowing flash animation to terminal output
        if (!quiet) {
            outputDiv.style.opacity = '0';
            setTimeout(() => {
                outputDiv.style.opacity = '1';
                outputDiv.style.textShadow = '0 0 8px rgba(0, 255, 102, 0.6)';
                setTimeout(() => outputDiv.style.textShadow = 'none', 300);
            }, 50);
        }
    } else {
        outputDiv.textContent = `yuksak: command not found: ${cmd}`;
    }
};

// -------------------------------------------------------------
// 4. Scroll Reveal IntersectionObserver
// -------------------------------------------------------------
if ('IntersectionObserver' in window) {
    const scrollOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, scrollOptions);

    document.querySelectorAll('[data-aos]').forEach(el => {
        scrollObserver.observe(el);
    });
} else {
    // Fallback for older browsers
    document.querySelectorAll('[data-aos]').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
    });
}

// -------------------------------------------------------------
// 5. Navbar Sticky Dynamics
// -------------------------------------------------------------
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            navbar.style.top = '0.5rem';
            navbar.style.background = 'rgba(2, 2, 4, 0.95)';
            navbar.style.borderColor = 'rgba(0, 255, 102, 0.4)';
            navbar.style.boxShadow = '0 12px 40px rgba(0, 255, 102, 0.12)';
        } else {
            navbar.style.top = '1.5rem';
            navbar.style.background = 'rgba(3, 3, 5, 0.85)';
            navbar.style.borderColor = 'rgba(0, 255, 102, 0.2)';
            navbar.style.boxShadow = '0 8px 32px rgba(0,0,0,0.8)';
        }
    });
}

// -------------------------------------------------------------
// 7. Mini App Modals, Web AI Assistant & Course Platform Engine
// -------------------------------------------------------------
let currentUser = null;
let selectedTariffForPayment = 'standard';
let activeCourseData = null;
let currentLessonIndex = 0;

// Load user session from LocalStorage
function loadUserSession() {
    const saved = localStorage.getItem('yuksak_user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            updateNavUserButton();
            // Refresh user state from server
            fetch('/api/me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id })
            }).then(res => res.json()).then(data => {
                if (data.success && data.user) {
                    currentUser = data.user;
                    localStorage.setItem('yuksak_user', JSON.stringify(currentUser));
                    updateNavUserButton();
                }
            }).catch(e => console.log('Session sync error:', e));
        } catch(e) {}
    }
}

function updateNavUserButton() {
    const navBtn = document.getElementById('nav-user-btn');
    const bottomLabel = document.getElementById('bottom-nav-user-label');
    if (currentUser) {
        const subBadge = (currentUser.sub && currentUser.sub !== 'none') ? `[${currentUser.sub.toUpperCase()}]` : '[BEPUL]';
        if (navBtn) navBtn.textContent = `👤 ${currentUser.name} ${subBadge}`;
        if (bottomLabel) bottomLabel.textContent = currentUser.name.split(' ')[0];
    } else {
        if (navBtn) navBtn.textContent = '🔑 KIRISH / REGISTRATION';
        if (bottomLabel) bottomLabel.textContent = 'Kabinet';
    }
}

// Auth Modal Logic
window.openAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.add('active');
    
    const loginForm = document.getElementById('auth-login-form');
    const regForm = document.getElementById('auth-register-form');
    const profileView = document.getElementById('auth-user-profile');
    
    if (currentUser) {
        if (loginForm) loginForm.style.display = 'none';
        if (regForm) regForm.style.display = 'none';
        if (profileView) profileView.style.display = 'block';
        
        document.getElementById('prof-user-name').textContent = currentUser.name;
        document.getElementById('prof-user-phone').textContent = currentUser.phone || `ID: ${currentUser.id}`;
        
        let subText = "BEPUL (TARIFSIZ)";
        if (currentUser.sub && currentUser.sub !== 'none') {
            subText = `✅ ${currentUser.sub.toUpperCase()} TARIFI FAOL`;
        } else if (currentUser.step === 'awaiting_payment') {
            subText = "⏳ TO'LOV TASDIQLANISHI KUTILMOQDA";
        }
        document.getElementById('prof-user-tariff').textContent = subText;
    } else {
        if (profileView) profileView.style.display = 'none';
        switchAuthTab('login');
    }
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
};

window.switchAuthTab = function(tab) {
    const loginForm = document.getElementById('auth-login-form');
    const regForm = document.getElementById('auth-register-form');
    const loginBtn = document.getElementById('tab-login-btn');
    const regBtn = document.getElementById('tab-register-btn');
    
    if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'block';
        if (regForm) regForm.style.display = 'none';
        if (loginBtn) { loginBtn.className = 'btn-cyber-primary'; loginBtn.style.padding = '0.6rem'; }
        if (regBtn) { regBtn.className = 'btn-cyber-outline'; regBtn.style.padding = '0.6rem'; }
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (regForm) regForm.style.display = 'block';
        if (regBtn) { regBtn.className = 'btn-cyber-primary'; regBtn.style.padding = '0.6rem'; }
        if (loginBtn) { loginBtn.className = 'btn-cyber-outline'; loginBtn.style.padding = '0.6rem'; }
    }
};

window.handleLoginSubmit = async function(e) {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    const msgBox = document.getElementById('auth-msg-box');
    
    msgBox.innerHTML = '<span style="color: var(--secondary);">⏳ Tizimga kirilmoqda...</span>';
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('yuksak_user', JSON.stringify(currentUser));
            updateNavUserButton();
            msgBox.innerHTML = '<span style="color: var(--primary);">✅ Muvaffaqiyatli kirildi!</span>';
            setTimeout(() => { openAuthModal(); }, 600);
        } else {
            msgBox.innerHTML = `<span style="color: var(--accent);">❌ ${data.error || 'Xatolik yuz berdi'}</span>`;
        }
    } catch(err) {
        msgBox.innerHTML = '<span style="color: var(--accent);">❌ Server bilan ulanishda xato.</span>';
    }
};

window.handleRegisterSubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const msgBox = document.getElementById('auth-msg-box');
    
    msgBox.innerHTML = '<span style="color: var(--secondary);">⏳ Ro\'yxatdan o\'tilmoqda...</span>';
    
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, password })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('yuksak_user', JSON.stringify(currentUser));
            updateNavUserButton();
            msgBox.innerHTML = '<span style="color: var(--primary);">✅ Muvaffaqiyatli ro\'yxatdan o\'tildi!</span>';
            setTimeout(() => { openAuthModal(); }, 600);
        } else {
            msgBox.innerHTML = `<span style="color: var(--accent);">❌ ${data.error || 'Xatolik yuz berdi'}</span>`;
        }
    } catch(err) {
        msgBox.innerHTML = '<span style="color: var(--accent);">❌ Server bilan ulanishda xato.</span>';
    }
};

window.handleLogout = function() {
    currentUser = null;
    localStorage.removeItem('yuksak_user');
    updateNavUserButton();
    openAuthModal();
};

window.scrollToPricing = function() {
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
};

// Payment Modal Logic
window.openPaymentModal = function(tariff) {
    if (!currentUser) {
        alert("To'lov qilish uchun avval saytga kiring yoki ro'yxatdan o'ting!");
        openAuthModal();
        return;
    }
    selectedTariffForPayment = tariff;
    const modal = document.getElementById('payment-modal');
    const titleTag = document.getElementById('pay-modal-tariff-title');
    
    const tariffMap = {
        'standard': 'STANDARD (100,000 UZS)',
        'platinum': 'PLATINUM (199,000 UZS)'
    };
    if (titleTag) titleTag.textContent = tariffMap[tariff] || 'TARIF TO\'LOVI';
    if (modal) modal.classList.add('active');
};

window.closePaymentModal = function() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.classList.remove('active');
};

window.handlePaymentSubmit = async function(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    const fileInput = document.getElementById('pay-receipt-file');
    const msgBox = document.getElementById('payment-msg-box');
    
    if (!fileInput.files || !fileInput.files[0]) {
        msgBox.innerHTML = '<span style="color: var(--accent);">Iltimos, to\'lov cheki rasmini tanlang!</span>';
        return;
    }
    
    const formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('tariff', selectedTariffForPayment);
    formData.append('receipt', fileInput.files[0]);
    
    msgBox.innerHTML = '<span style="color: var(--secondary);">⏳ Chek yuborilmoqda...</span>';
    
    try {
        const res = await fetch('/api/submit_payment', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('yuksak_user', JSON.stringify(currentUser));
            updateNavUserButton();
            msgBox.innerHTML = '<span style="color: var(--primary);">✅ Chek muvaffaqiyatli yuborildi! Admin tez orada tekshiradi.</span>';
            setTimeout(() => { closePaymentModal(); }, 2000);
        } else {
            msgBox.innerHTML = `<span style="color: var(--accent);">❌ ${data.error || 'Xatolik'}</span>`;
        }
    } catch(err) {
        msgBox.innerHTML = '<span style="color: var(--accent);">❌ Serverga yuklashda xatolik.</span>';
    }
};

// Course Player Engine Logic
window.openCoursePlayer = async function(courseId) {
    if (!currentUser) {
        alert("Darslarni ko'rish uchun avval saytga kiring!");
        openAuthModal();
        return;
    }
    
    // Check user subscription state
    if (!currentUser.sub || currentUser.sub === 'none') {
        alert("Darslarni ochish uchun faol tarif (Standard, Platinum yoki VIP) talab qilinadi. Tariflar bo'limidan to'lov qiling!");
        scrollToPricing();
        return;
    }
    
    try {
        const res = await fetch('/api/courses');
        const courses = await res.json();
        const found = courses.find(c => c.id === courseId) || courses[0];
        
        activeCourseData = found;
        currentLessonIndex = 0;
        
        document.getElementById('player-course-title').textContent = `📚 ${found.title.toUpperCase()}`;
        renderCourseLessons();
        loadLessonDetails(0);
        
        const modal = document.getElementById('course-player-modal');
        if (modal) modal.classList.add('active');
    } catch(e) {
        alert("Kurs ma'lumotlarini yuklashda xatolik.");
    }
};

window.closeCoursePlayer = function() {
    const modal = document.getElementById('course-player-modal');
    if (modal) modal.classList.remove('active');
    const video = document.getElementById('player-video');
    if (video) video.pause();
};

function renderCourseLessons() {
    const container = document.getElementById('player-lessons-list');
    if (!container || !activeCourseData) return;
    
    container.innerHTML = '';
    activeCourseData.lessons.forEach((l, index) => {
        const btn = document.createElement('button');
        btn.className = (index === currentLessonIndex) ? 'btn-cyber-primary' : 'btn-cyber-outline';
        btn.style.textAlign = 'left';
        btn.style.fontSize = '0.82rem';
        btn.style.padding = '0.6rem 0.8rem';
        btn.innerHTML = `${l.title} <span style="float:right; opacity:0.7;">⏱ ${l.duration}</span>`;
        btn.onclick = () => selectLesson(index);
        container.appendChild(btn);
    });
}

function selectLesson(index) {
    currentLessonIndex = index;
    renderCourseLessons();
    loadLessonDetails(index);
}

function loadLessonDetails(index) {
    if (!activeCourseData || !activeCourseData.lessons[index]) return;
    const lesson = activeCourseData.lessons[index];
    
    document.getElementById('player-lesson-title').textContent = lesson.title;
    document.getElementById('player-lesson-summary').textContent = lesson.summary;
    document.getElementById('player-lesson-task').textContent = lesson.assignment;
    
    const video = document.getElementById('player-video');
    const videoSrc = document.getElementById('player-video-src');
    if (video && videoSrc) {
        videoSrc.src = lesson.video_url;
        video.load();
    }
}

window.sendLessonAiQuery = async function() {
    const input = document.getElementById('lesson-ai-input');
    const chatBox = document.getElementById('lesson-ai-box');
    if (!input || !chatBox) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    chatBox.innerHTML += `<div style="color: var(--secondary); margin-top: 4px;">👤 Siz: ${text}</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
    
    const tempBot = document.createElement('div');
    tempBot.style.color = 'var(--primary)';
    tempBot.textContent = '🤖 Javob tayyorlanmoqda...';
    chatBox.appendChild(tempBot);
    
    try {
        const res = await fetch('/assistant/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text, lang: currentLang || 'uz' })
        });
        const data = await res.json();
        tempBot.textContent = `🤖 ${data.answer || 'Javob berilmadi.'}`;
    } catch(e) {
        tempBot.textContent = '🤖 Ulanishda xato.';
    }
    chatBox.scrollTop = chatBox.scrollHeight;
};

// Initialize User session on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserSession();
});

window.openAiAssistantModal = function() {
    const modal = document.getElementById('ai-assistant-modal');
    if (modal) modal.classList.add('active');
};

window.closeAiAssistantModal = function() {
    const modal = document.getElementById('ai-assistant-modal');
    if (modal) modal.classList.remove('active');
};

window.openFounderModal = function() {
    const modal = document.getElementById('founder-modal-overlay');
    if (modal) modal.classList.add('active');
};

window.closeFounderModal = function() {
    const modal = document.getElementById('founder-modal-overlay');
    if (modal) modal.classList.remove('active');
};

window.sendWebAiQuery = async function() {
    const input = document.getElementById('web-ai-input');
    const chatBox = document.getElementById('web-ai-chat');
    if (!input || !chatBox) return;
    
    const text = input.value.strip ? input.value.strip() : input.value.trim();
    if (!text) return;
    
    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'web-ai-msg user';
    userMsg.textContent = text;
    chatBox.appendChild(userMsg);
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Append Loading Indicator
    const botMsg = document.createElement('div');
    botMsg.className = 'web-ai-msg bot';
    botMsg.textContent = '🤖 Javob tayyorlanmoqda...';
    chatBox.appendChild(botMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    try {
        const response = await fetch('/assistant/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text, lang: currentLang || 'uz' })
        });
        const data = await response.json();
        botMsg.textContent = data.answer || 'Javob olib bo\'lmadi.';
    } catch (e) {
        botMsg.textContent = '🤖 AI bilan ulanishda xato yuz berdi.';
    }
    chatBox.scrollTop = chatBox.scrollHeight;
};

console.log('YUKSAK ACADEMY Cyber-Deck Loaded.');

// -------------------------------------------------------------
// Russian Placement Level Test Interactive Engine
// -------------------------------------------------------------
let currentTestQuestions = [];
let currentTestAnswers = {};
let currentQuestionIndex = 0;

window.startRussianPlacementTest = async function() {
    if (!currentUser) {
        alert("Test topshirish uchun avval tizimga kiring yoki ro'yxatdan o'ting!");
        openAuthModal();
        return;
    }
    
    const modal = document.getElementById('russian-test-modal');
    const body = document.getElementById('russian-test-body');
    if (!modal || !body) return;
    
    modal.classList.add('active');
    body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #c084fc;">⏳ Test savollari yuklanmoqda...</div>';
    
    try {
        const res = await fetch('/api/russian_test');
        const data = await res.json();
        if (data.success && data.questions && data.questions.length > 0) {
            currentTestQuestions = data.questions;
            currentTestAnswers = {};
            currentQuestionIndex = 0;
            renderRussianTestQuestion();
        } else {
            body.innerHTML = '<div style="color: var(--accent); text-align: center;">Hozircha test savollari mavjud emas.</div>';
        }
    } catch(e) {
        body.innerHTML = '<div style="color: var(--accent); text-align: center;">Server bilan ulanishda xatolik.</div>';
    }
};

window.closeRussianTestModal = function() {
    const modal = document.getElementById('russian-test-modal');
    if (modal) modal.classList.remove('active');
};

function renderRussianTestQuestion() {
    const body = document.getElementById('russian-test-body');
    if (!body || currentTestQuestions.length === 0) return;
    
    const q = currentTestQuestions[currentQuestionIndex];
    const total = currentTestQuestions.length;
    const progress = Math.round(((currentQuestionIndex + 1) / total) * 100);
    
    body.innerHTML = `
        <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
            <span>SAVOL ${currentQuestionIndex + 1} / ${total}</span>
            <span style="color: #c084fc; font-weight: bold;">Daraja: ${q.level}</span>
        </div>
        <div style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; margin-bottom: 1.5rem; overflow: hidden;">
            <div style="background: #c084fc; width: ${progress}%; height: 100%; transition: width 0.3s;"></div>
        </div>
        <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 1.5rem; line-height: 1.4;">${q.question}</h3>
        <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem;">
            ${[q.opt_a, q.opt_b, q.opt_c, q.opt_d].map((opt, i) => `
                <button onclick="selectRussianTestOption(${q.id}, ${i})" 
                        class="btn-cyber-outline" 
                        style="text-align: left; padding: 0.8rem 1rem; border-color: ${currentTestAnswers[q.id] === i ? '#c084fc' : 'rgba(255,255,255,0.2)'}; background: ${currentTestAnswers[q.id] === i ? 'rgba(192, 132, 252, 0.15)' : 'transparent'}; color: ${currentTestAnswers[q.id] === i ? '#c084fc' : '#fff'};">
                    <strong>${String.fromCharCode(65 + i)})</strong> ${opt}
                </button>
            `).join('')}
        </div>
        <div style="display: flex; justify-content: space-between;">
            <button onclick="prevRussianQuestion()" class="btn-cyber-outline" style="border-color: var(--text-muted); color: var(--text-muted);" ${currentQuestionIndex === 0 ? 'disabled' : ''}>⬅️ Oldingisi</button>
            ${currentQuestionIndex === total - 1 ? 
                `<button onclick="submitRussianPlacementTest()" class="btn-cyber-primary" style="background: #c084fc; color: #000;">✅ TESTNI YAKUNLASH</button>` : 
                `<button onclick="nextRussianQuestion()" class="btn-cyber-primary" style="background: linear-gradient(135deg, #a855f7, #6b21a8);">Keyingisi ➡️</button>`
            }
        </div>
    `;
}

window.selectRussianTestOption = function(qid, optIndex) {
    currentTestAnswers[qid] = optIndex;
    renderRussianTestQuestion();
};

window.nextRussianQuestion = function() {
    if (currentQuestionIndex < currentTestQuestions.length - 1) {
        currentQuestionIndex++;
        renderRussianTestQuestion();
    }
};

window.prevRussianQuestion = function() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderRussianTestQuestion();
    }
};

window.submitRussianPlacementTest = async function() {
    const body = document.getElementById('russian-test-body');
    if (!body || !currentUser) return;
    
    body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #c084fc;">⏳ Natijangiz hisoblanmoqda...</div>';
    
    try {
        const res = await fetch('/api/submit_russian_test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, answers: currentTestAnswers })
        });
        const data = await res.json();
        
        if (data.success) {
            body.innerHTML = `
                <div style="text-align: center; padding: 1.5rem 0;">
                    <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">🎉</div>
                    <h2 style="color: #c084fc; font-size: 1.5rem; margin-bottom: 0.5rem;">TEST YAKUNLANDI!</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Sizning Rus tili bilish darajangiz:</p>
                    <div style="margin: 1.5rem 0; padding: 1.2rem; background: rgba(192, 132, 252, 0.1); border: 2px solid #c084fc; border-radius: 12px;">
                        <h3 style="color: #fff; font-size: 1.4rem;">${data.level}</h3>
                        <p style="color: var(--primary); font-family: var(--font-mono); margin-top: 0.5rem; font-size: 1.1rem; font-weight: bold;">Natija: ${data.score} / ${data.total} (${data.percentage}%)</p>
                    </div>
                    <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 1.5rem;">Ushbu natija shaxsiy kabinetingizda saqlandi.</p>
                    <button onclick="closeRussianTestModal(); openAuthModal();" class="btn-cyber-primary" style="background: #c084fc; color: #000;">👤 SHAXSIY KABINETGA O'TISH</button>
                </div>
            `;
        } else {
            body.innerHTML = `<div style="color: var(--accent); text-align: center;">Xato: ${data.error || 'Natijani hisoblab bo\'lmadi'}</div>`;
        }
    } catch(e) {
        body.innerHTML = '<div style="color: var(--accent); text-align: center;">Natijani yuborishda server xatosi.</div>';
    }
};
