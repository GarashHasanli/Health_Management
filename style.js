document.addEventListener('DOMContentLoaded', function () {
    // --- Genel Giriş Sayfası Yönlendirmeleri ---
    document.querySelectorAll('[data-action="start"]').forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = './login.html';
        });
    });

    const redirectLinks = {
        'hasta-login.html': 'hasta-login.html',
        'sekreter-login.html': 'sekreter-login.html',
        'admin-login.html': 'admin-login.html'
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
    if (pageTitle.includes('hasta')) role = 'patient';
    else if (pageTitle.includes('sekreter')) role = 'secretary';
    else if (pageTitle.includes('admin')) role = 'admin';

    // --- Login İşlemleri ---
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
            .then(res => res.json())
            .then(data => {
                if (!data.user) {
                    alert(data.error || 'Geçersiz giriş!');
                    return;
                }

                const userRole = data.user.role;
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
                alert('Giriş sırasında hata oluştu.');
            });
        });

        registerButton.addEventListener('click', () => {
            if (role === 'patient') window.location.href = 'register.html';
            else if (role === 'secretary') window.location.href = 'sekreter-register.html';
            else window.location.href = 'register.html';
        });
    }

    // --- Register İşlemleri ---
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
                    firstName: firstName.value.trim(),
                    lastName: lastName.value.trim(),
                    phone: phone.value.trim(),
                    password: password.value,
                    role: 'patient'
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'Kayıt başarılı') {
                    alert('Kayıt başarılı! Giriş ekranına yönlendiriliyorsunuz.');
                    window.location.href = 'hasta-login.html';
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

    // --- Bilgilendirme Seçimi ---
    const planVarBtn = document.getElementById('plan-var');
    const planYokBtn = document.getElementById('plan-yok');

    if (planVarBtn) planVarBtn.addEventListener('click', () => {
        window.location.href = 'plan-var.html';
    });

    if (planYokBtn) planYokBtn.addEventListener('click', () => {
        window.location.href = 'plan-yok.html';
    });
});
