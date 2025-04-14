document.addEventListener('DOMContentLoaded', function() {
    // --- Genel Yönlendirme İşlemleri ---
    // Hemen Başla Butonu Yönlendirme
    const actionButtons = document.querySelectorAll('[data-action]');
    if (actionButtons) {
        actionButtons.forEach((button) => {
            if (button.getAttribute('data-action') === 'start') {
                button.addEventListener('click', () => {
                    window.location.href = './login.html';
                });
            }
        });
    }

    // Hasta Girişi yönlendirme
    const hastaGirisLink = document.querySelector('.dropdown-content a[href="hasta-login.html"]');
    if (hastaGirisLink) {
        hastaGirisLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = "login.html"; // Hasta Girişi sayfasına yönlendir
        });
    }

    // Sekreter Girişi yönlendirme
    const sekreterGirisLink = document.querySelector('.dropdown-content a[href="sekreter-login.html"]');
    if (sekreterGirisLink) {
        sekreterGirisLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = "sekreter-login.html"; // Sekreter Girişi sayfasına yönlendir
        });
    }

    // Admin Girişi yönlendirme
    const adminGirisLink = document.querySelector('.dropdown-content a[href="admin-login.html"]');
    if (adminGirisLink) {
        adminGirisLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = "admin-login.html"; // Admin Girişi sayfasına yönlendir
        });
    }

    // --- Giriş (Login) İşlemleri ---
    // Giriş sayfasına özgü elementler kontrol ediliyor
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const loginButton = document.getElementById('login-button');
        const registerButtonLogin = document.getElementById('register-button'); // Login sayfasında "Kayıt Ol" butonu
        const phoneInputLogin = document.getElementById('phone');
        const passwordInputLogin = document.getElementById('password');
        const phoneErrorLogin = document.getElementById('phone-error');
        const passwordErrorLogin = document.getElementById('password-error');

        // Form submit işlemine müdahale
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
        });

        // Giriş butonunun validasyonu
        if (loginButton) {
            loginButton.addEventListener('click', function() {
                let valid = true;
                if (!phoneInputLogin.value) {
                    phoneInputLogin.classList.add('error');
                    phoneErrorLogin.style.display = 'block';
                    valid = false;
                } else {
                    phoneInputLogin.classList.remove('error');
                    phoneErrorLogin.style.display = 'none';
                }
                if (!passwordInputLogin.value) {
                    passwordInputLogin.classList.add('error');
                    passwordErrorLogin.style.display = 'block';
                    valid = false;
                } else {
                    passwordInputLogin.classList.remove('error');
                    passwordErrorLogin.style.display = 'none';
                }
                if (valid) {
                    const phone = phoneInputLogin.value;
                    const password = passwordInputLogin.value;
                    fetch('http://localhost:3000/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, password })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.role === 'secretary') {
                            window.location.href = 'hasta-listesi.html'; 
                        } else if (data.role === 'patient') {
                            window.location.href = 'hasta-bilgilendirme.html'; 
                        } else if (data.role === 'admin') {
                            window.location.href = 'yonetimpaneli.html'; // Admin için yönlendirme
                        } else {
                            alert('Geçersiz giriş!');
                        }
                    })
                    .catch(error => console.log('Hata:', error));
                }
            });
        }

        // Login sayfasındaki kayıt ol butonu yönlendirme
        if (registerButtonLogin) {
            registerButtonLogin.addEventListener('click', function() {
                window.location.href = 'register.html';
            });
        }
    }

    // --- Kayıt (Register) İşlemleri ---
    // Kayıt sayfasına özgü elementleri kontrol ediyoruz
    const firstNameInput = document.getElementById('first-name');
    if (firstNameInput) { // Eğer first-name varsa, kayıt sayfasındayız demektir.
        const registerButtonRegister = document.getElementById('register-button'); // Kayıt sayfasında formu gönder butonu
        const lastNameInput = document.getElementById('last-name');
        const phoneInputRegister = document.getElementById('phone');
        const passwordInputRegister = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');

        const firstNameError = document.getElementById('first-name-error');
        const lastNameError = document.getElementById('last-name-error');
        const phoneErrorRegister = document.getElementById('phone-error');
        const passwordErrorRegister = document.getElementById('password-error');
        const confirmPasswordError = document.getElementById('confirm-password-error');

        if (registerButtonRegister) {
            registerButtonRegister.addEventListener('click', function() {
                let valid = true;

                if (!firstNameInput.value) {
                    firstNameInput.classList.add('error');
                    firstNameError.style.display = 'block';
                    valid = false;
                } else {
                    firstNameInput.classList.remove('error');
                    firstNameError.style.display = 'none';
                }

                if (!lastNameInput.value) {
                    lastNameInput.classList.add('error');
                    lastNameError.style.display = 'block';
                    valid = false;
                } else {
                    lastNameInput.classList.remove('error');
                    lastNameError.style.display = 'none';
                }

                if (!phoneInputRegister.value) {
                    phoneInputRegister.classList.add('error');
                    phoneErrorRegister.style.display = 'block';
                    valid = false;
                } else {
                    phoneInputRegister.classList.remove('error');
                    phoneErrorRegister.style.display = 'none';
                }

                if (!passwordInputRegister.value) {
                    passwordInputRegister.classList.add('error');
                    passwordErrorRegister.style.display = 'block';
                    valid = false;
                } else {
                    passwordInputRegister.classList.remove('error');
                    passwordErrorRegister.style.display = 'none';
                }

                if (passwordInputRegister.value !== confirmPasswordInput.value) {
                    confirmPasswordInput.classList.add('error');
                    confirmPasswordError.style.display = 'block';
                    valid = false;
                } else {
                    confirmPasswordInput.classList.remove('error');
                    confirmPasswordError.style.display = 'none';
                }

                if (valid) {
                    const userData = {
                        phone: phoneInputRegister.value,
                        password: passwordInputRegister.value,
                        role: "patient"  
                    };

                    fetch('http://localhost:3000/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message === 'Kayıt başarılı') {
                            alert('Kayıt başarılı! Giriş ekranına yönlendiriliyorsunuz.');
                            window.location.href = 'login.html'; 
                        } else {
                            alert('Kayıt başarısız! Tekrar deneyin.');
                        }
                    })
                    .catch(error => console.log('Hata:', error));
                }
            });
        }
    }
});



// Bilgilendirme Kısmı

document.addEventListener('DOMContentLoaded', function() {
    const planVarButton = document.getElementById('plan-var');
    const planYokButton = document.getElementById('plan-yok');

    if (planVarButton) {
        planVarButton.addEventListener('click', function() {
            window.location.href = 'plan-var.html'; // "Var" seçilirse bu sayfaya gider
        });
    }

    if (planYokButton) {
        planYokButton.addEventListener('click', function() {
            window.location.href = 'plan-yok.html'; // "Yok" seçilirse bu sayfaya gider
        });
    }
});
