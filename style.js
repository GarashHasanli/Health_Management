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
const userId = localStorage.getItem("userId");
  if (!userId) return alert("Hasta bilgisi bulunamadı.");

  fetch(`http://localhost:3000/patients/${userId}`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#tedavi-tablosu tbody");

      const start = data.tedavi_baslangic ? new Date(data.tedavi_baslangic).toLocaleDateString("tr-TR") : "-";
      const end   = data.tedavi_bitis     ? new Date(data.tedavi_bitis).toLocaleDateString("tr-TR") : "-";

      let durum = "-";
      if (data.tedavi_baslangic && data.tedavi_bitis) {
        const baslangic = new Date(data.tedavi_baslangic);
        const bitis     = new Date(data.tedavi_bitis);
        const bugun     = new Date();

        if (bugun < baslangic) {
          durum = "Bekliyor";
        } else if (bugun >= baslangic && bugun <= bitis) {
          durum = "Devam Ediyor";
        } else {
          durum = "Tamamlandı";
        }
      }

      const row = `
        <tr>
          <td data-label="Başlangıç">${start}</td>
          <td data-label="Bitiş">${end}</td>
          <td data-label="Durum">${durum}</td>
        </tr>
      `;
      tbody.innerHTML = row;
    })
    .catch(err => {
      console.error("Tedavi planı alınamadı:", err);
      alert("Tedavi planı verisi alınırken bir hata oluştu.");
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

// Günlük Adım Takibi (Tedavi Planı Sayfası)
if (document.title.toLowerCase().includes('tedavi planı')) {
    const userId = localStorage.getItem('userId');
    const adimInput = document.getElementById("adim-sayisi");
    const sonucP = document.getElementById("adim-sonuc");
    const tabloBody = document.querySelector("#adim-tablosu tbody");

    if (!userId || !adimInput || !sonucP || !tabloBody) return;

    async function loadAdimTablosu() {
        try {
            const res = await fetch(`http://localhost:3000/adimlar/kullanici/${userId}`);
            if (!res.ok) throw await res.text();
            const data = await res.json();

            tabloBody.innerHTML = "";
            data.forEach(row => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${new Date(row.tarih).toLocaleDateString('tr-TR')}</td>
                    <td>${row.hedef_adim !== null ? row.hedef_adim.toLocaleString('tr-TR') : '-'}</td>
                    <td>${row.hasta_adim !== null ? row.hasta_adim.toLocaleString('tr-TR') : '-'}</td>
                `;
                tabloBody.appendChild(tr);
            });
        } catch (err) {
            console.error("Adım tablosu yüklenemedi:", err);
        }
    }

    window.adimKaydet = async function () {
        const adimDegeri = adimInput.value.trim().replace(/\./g, '').replace(",", ".");
        const parsedAdim = parseFloat(adimDegeri);
        const bugun = new Date().toISOString().split('T')[0];

        if (!userId || isNaN(parsedAdim)) {
            sonucP.textContent = "Lütfen geçerli bir adım sayısı girin.";
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/adimlar/kullanici/${userId}`);
            const list = await res.json();
            const kayit = list.find(x => x.tarih.slice(0, 10) === bugun);


            if (kayit) {
                // Kayıt varsa güncelle
                await fetch(`http://localhost:3000/adimlar/${kayit.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ hasta_adim: parsedAdim })
                });
                sonucP.textContent = "Bugünkü adımınız güncellendi.";
            } else {
                // Hasta bilgilerini çek
                const hastaRes = await fetch(`http://localhost:3000/patients/${userId}`);
                const hasta = await hastaRes.json();

                await fetch(`http://localhost:3000/adimlar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        isim: hasta.first_name || "Hasta",
                        soyisim: hasta.last_name || "Bilgisi",
                        tarih: bugun,
                        hasta_adim: parsedAdim,
                        hedef_adim: null
                    })
                });
                sonucP.textContent = "Bugünkü adımınız kaydedildi.";
            }

            adimInput.value = "";
            loadAdimTablosu();
        } catch (err) {
            console.error("Adım kaydetme hatası:", err);
            sonucP.textContent = "Hata oluştu.";
        }
    };

    loadAdimTablosu();
}



// --- Raporlar (Diz Açısı, Fotoğraf, Video, Not) ---
if (document.title.toLowerCase().includes('tedavi planı')) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.warn("userId bulunamadı, kullanıcı giriş yapmamış olabilir.");
    }
  
    fetch(`http://localhost:3000/raporlar/kullanici/${userId}`)
      .then(res => res.json())
      .then(rapor => {
        // Diz Açısı
        const diz = document.querySelector("#diz-acisi .content-placeholder");
        if (diz) diz.textContent = rapor.aci ?? "Veri yok";
  
        // Fotoğraf
        const foto = document.querySelector("#fotograf .content-placeholder");
        if (foto) {
          foto.innerHTML = rapor.foto
            ? `<img src="${rapor.foto}" alt="Fotoğraf" style="max-width:100%; height:auto;">`
            : "Veri yok";
        }
  
        // Video
        const video = document.querySelector("#egzersiz .content-placeholder");
        if (video) {
          video.innerHTML = rapor.video
            ? `<video src="${rapor.video}" controls style="max-width:100%; height:auto;"></video>`
            : "Veri yok";
        }
  
        // Özel Not
        const not = document.querySelector("#ozel-notlar .content-placeholder");
        if (not) not.textContent = rapor.ozel_not ?? "Veri yok";
      })
      .catch(err => {
        console.error("Rapor verisi alınamadı:", err);
      });
  }
});
