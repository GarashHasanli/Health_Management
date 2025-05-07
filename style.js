document.addEventListener('DOMContentLoaded', function () {
    // --- "Hemen Başla" butonları yönlendirmesi ---
    document.querySelectorAll('[data-action="start"]').forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = './login.html';
        });
    });

    // --- Menü Link Yönlendirme ---
    const redirectLinks = {
        'login.html': 'login.html',
        'sekreter-login.html': 'sekreter-login.html'
    };

    Object.entries(redirectLinks).forEach(([href, url]) => {
        const link = document.querySelector(`.dropdown-content a[href="${href}"]`);
        if (link) {
            link.addEventListener('click', e => {
                e.preventDefault();
                window.location.href = url;
            });
        }
    });

    // --- Rol Belirleme ---
    let role = null;
    const pageTitle = document.title.toLowerCase();
    if (pageTitle.includes('kayıt') || pageTitle.includes('register')) role = 'patient';
    else if (pageTitle.includes('sekreter')) role = 'secretary';
    else if (pageTitle.includes('admin')) role = 'admin';
    else if (pageTitle.includes('giriş') || pageTitle.includes('login')) role = 'patient';

    // --- Login ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const phoneInput = document.getElementById('phone');
        const passwordInput = document.getElementById('password') || document.getElementById('otp');
        const loginButton = document.getElementById('login-button');
        const registerButton = document.getElementById('register-button');
        const phoneError = document.getElementById('phone-error');
        const passwordError = document.getElementById('password-error');

        loginForm.addEventListener('submit', e => e.preventDefault());

        loginButton.addEventListener('click', () => {
            let valid = true;

            if (!phoneInput.value.trim()) {
                phoneInput.classList.add('error');
                phoneError.style.display = 'block';
                valid = false;
            } else {
                phoneInput.classList.remove('error');
                phoneError.style.display = 'none';
            }

            if (!passwordInput.value.trim()) {
                passwordInput.classList.add('error');
                passwordError.style.display = 'block';
                valid = false;
            } else {
                passwordInput.classList.remove('error');
                passwordError.style.display = 'none';
            }

            if (!role) {
                alert('Sayfa rolü belirlenemedi!');
                return;
            }

            if (!valid) return;

            fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phoneInput.value.trim(),
                    password: passwordInput.value.trim(),
                    role
                })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || res.statusText); });
                }
                return res.json();
            })
            .then(data => {
                const userRole = data.user.role;
                const userId = data.user.id;

                // Giriş başarılı → kullanıcı ID'sini localStorage'a kaydet
                localStorage.setItem('userId', userId);

                if (userRole === 'secretary') {
                    window.location.href = 'hasta-listesi.html';
                } else if (userRole === 'patient') {
                    window.location.href = 'hasta-bilgilendirme.html';
                } else if (userRole === 'admin') {
                    window.location.href = 'yonetimpaneli.html';
                } else {
                    alert('Bilinmeyen rol!');
                }
            })
            .catch(err => {
                console.error('Login Error:', err);
                alert(err.message || 'Giriş sırasında hata oluştu.');
            });
        });

        if (registerButton) {
            registerButton.addEventListener('click', () => {
                window.location.href = 'register.html';
            });
        }
    }

    // --- Register ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const firstName = document.getElementById('first-name');
        const lastName = document.getElementById('last-name');
        const phone = document.getElementById('phone');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm-password');
        const registerButton = document.getElementById('register-button');

        const errors = {
            firstName: document.getElementById('first-name-error'),
            lastName: document.getElementById('last-name-error'),
            phone: document.getElementById('phone-error'),
            password: document.getElementById('password-error'),
            confirmPassword: document.getElementById('confirm-password-error')
        };

        registerForm.addEventListener('submit', e => e.preventDefault());

        registerButton.addEventListener('click', () => {
            let valid = true;

            if (!firstName.value.trim()) {
                firstName.classList.add('error');
                errors.firstName.style.display = 'block';
                valid = false;
            } else {
                firstName.classList.remove('error');
                errors.firstName.style.display = 'none';
            }

            if (!lastName.value.trim()) {
                lastName.classList.add('error');
                errors.lastName.style.display = 'block';
                valid = false;
            } else {
                lastName.classList.remove('error');
                errors.lastName.style.display = 'none';
            }

            if (!phone.value.trim()) {
                phone.classList.add('error');
                errors.phone.style.display = 'block';
                valid = false;
            } else {
                phone.classList.remove('error');
                errors.phone.style.display = 'none';
            }

            if (!password.value) {
                password.classList.add('error');
                errors.password.style.display = 'block';
                valid = false;
            } else {
                password.classList.remove('error');
                errors.password.style.display = 'none';
            }

            if (password.value !== confirmPassword.value) {
                confirmPassword.classList.add('error');
                errors.confirmPassword.style.display = 'block';
                valid = false;
            } else {
                confirmPassword.classList.remove('error');
                errors.confirmPassword.style.display = 'none';
            }

            if (!valid) return;

            fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName.value.trim(),
                    last_name: lastName.value.trim(),
                    phone: phone.value.trim(),
                    password: password.value,
                    role: 'patient'
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'Kayıt başarılı') {
                    alert('Kayıt başarılı! Giriş ekranına yönlendiriliyorsunuz.');
                    window.location.href = 'login.html';
                } else {
                    alert(data.error || 'Kayıt başarısız!');
                }
            })
            .catch(err => {
                console.error('Register Error:', err);
                alert('Kayıt sırasında hata oluştu.');
            });
        });
    }

    // --- Bilgilendirme Sayfası: hasta tedavi geçmişi ---
    if (document.title.toLowerCase().includes('tedavi planlarım')) {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        fetch(`http://localhost:3000/patients/${userId}`)
            .then(res => res.json())
            .then(p => {
                const tbody = document.querySelector('#tedavi-planlari tbody');
                tbody.innerHTML = '';

                const baslangic = p.treatment_start ? new Date(p.treatment_start).toLocaleDateString('tr-TR') : '-';
                const bitis     = p.treatment_end   ? new Date(p.treatment_end).toLocaleDateString('tr-TR') : '-';

                tbody.innerHTML += `
                    <tr>
                        <td>${baslangic}</td>
                        <td>Fizik Tedavi</td>
                        <td>${bitis !== '-' ? 'Tamamlandı' : 'Devam Ediyor'}</td>
                    </tr>
                `;
            })
            .catch(err => {
                console.error('Tedavi geçmişi hatası:', err);
                const tbody = document.querySelector('#tedavi-planlari tbody');
                tbody.innerHTML = `<tr><td colspan="3">Tedavi planı bilgisi alınamadı.</td></tr>`;
            });
    }

    // --- Bilgilendirme Yönlendirme ---
    const planVarBtn = document.getElementById('plan-var');
    const planYokBtn = document.getElementById('plan-yok');

    if (planVarBtn) {
        planVarBtn.addEventListener('click', () => {
            window.location.href = 'tedavi-plan-akisi.html';
        });
    }

    if (planYokBtn) {
        planYokBtn.addEventListener('click', () => {
            window.location.href = 'plan-yok.html';
        });
    }
});
