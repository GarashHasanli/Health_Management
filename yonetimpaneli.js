document.addEventListener("DOMContentLoaded", () => {
  // ---------------- FT işlemleri ----------------
  const tbody = document.querySelector("#secretary-table tbody");
  const form = document.getElementById("ft-form");
  const nameInput = document.getElementById("ft-name");
  const surnameInput = document.getElementById("ft-surname");
  const phoneInput = document.getElementById("ft-phone");
  const passwordInput = document.getElementById("ft-password");
  const submitBtn = document.getElementById("ft-ekle-btn");

  let editingId = null;

  if (form) {
    loadSecretaries();

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const payload = {
        first_name: nameInput.value.trim(),
        last_name: surnameInput.value.trim(),
        phone: phoneInput.value.trim(),
        password: passwordInput.value.trim()
      };

      if (!payload.first_name || !payload.last_name || !payload.phone || (!editingId && !payload.password)) {
        return alert("Lütfen tüm zorunlu alanları doldurun!");
      }

        // Şifre sadece ekleme işleminde payload’a eklenecek
      if (!editingId) {
          payload.password = passwordInput.value.trim();
      } else {
        // Güncellemede şifre boşsa hiç göndermiyoruz
      if (passwordInput.value.trim()) {
          payload.password = passwordInput.value.trim();
      } else {
          delete payload.password;
      }
}

      const url = editingId
        ? `http://localhost:3000/secretaries/${editingId}`
        : "http://localhost:3000/secretaries";
      const method = editingId ? "PUT" : "POST";

      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw await res.text();

        alert(editingId ? "FT başarıyla güncellendi" : "FT başarıyla eklendi");
        form.reset();
        editingId = null;
        submitBtn.textContent = "FT Ekle";
        loadSecretaries();
      } catch (err) {
        console.error("İşlem hatası:", err);
        alert("İşlem sırasında hata: " + err);
      }
    });
  }

  async function loadSecretaries() {
    try {
      const res = await fetch("http://localhost:3000/secretaries");
      if (!res.ok) throw await res.text();
      const list = await res.json();

      tbody.innerHTML = "";
      list.forEach(sec => {
        const date = new Date(sec.created_at);
        const formattedDate = isNaN(date)
          ? "-"
          : date.toLocaleDateString("tr-TR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            });

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${sec.id}</td>
          <td>${sec.first_name || "-"}</td>
          <td>${sec.last_name || "-"}</td>
          <td>${sec.phone || "-"}</td>
          <td>${formattedDate}</td>
          <td>
            <button class="edit-btn" data-id="${sec.id}">Düzenle</button>
            <button class="delete-btn" data-id="${sec.id}">Sil</button>
          </td>`;
        tbody.appendChild(tr);
      });

      attachRowListeners();
    } catch (err) {
      console.error("Liste yükleme hatası:", err);
      alert("FT listesi yüklenirken hata oluştu.");
    }
  }

  function attachRowListeners() {
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`http://localhost:3000/secretaries`);
          if (!res.ok) throw await res.text();
          const list = await res.json();
          const sec = list.find(x => x.id == id);
          if (!sec) return alert("FT bulunamadı!");

          nameInput.value = sec.first_name || "";
          surnameInput.value = sec.last_name || "";
          phoneInput.value = sec.phone || "";
          passwordInput.value = "";

          editingId = id;
          submitBtn.textContent = "Güncelle";
          window.scrollTo(0, form.offsetTop);
        } catch (err) {
          console.error("Düzenleme hatası:", err);
          alert("Düzenleme verisi alınamadı.");
        }
      });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Bu FT’yi silmek istediğinize emin misiniz?")) return;
        const id = btn.dataset.id;
        try {
          const res = await fetch(`http://localhost:3000/secretaries/${id}`, {
            method: "DELETE"
          });
          if (!res.ok) throw await res.text();
          alert("FT silindi");
          loadSecretaries();
        } catch (err) {
          console.error("Silme hatası:", err);
          alert("Silme işlemi sırasında hata oluştu.");
        }
      });
    });
  }

  // ================= Hasta Ekleme ve Güncelleme İşlemleri =================
const hastaForm = document.getElementById("hasta-form");
const hastaTableBody = document.querySelector("#hasta-table tbody");
const hastaName = document.getElementById("hasta-ad");
const hastaSurname = document.getElementById("hasta-soyad");
const hastaPhone = document.getElementById("hasta-telefon");
const hastaPassword = document.getElementById("hasta-sifre");
const hastaStart = document.getElementById("tedavi-baslangic");
const hastaEnd = document.getElementById("tedavi-bitis");
const hastaHedef = document.getElementById("haftalik-adim");
const hastaNot = document.getElementById("notlar");
const hastaSubmitBtn = document.getElementById("hasta-ekle-btn");

let hastaEditId = null;

if (hastaForm) {
  loadPatients();

  hastaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      first_name: hastaName.value.trim(),
      last_name: hastaSurname.value.trim(),
      phone: hastaPhone.value.trim(),
      tedavi_baslangic: hastaStart.value.trim(),
      tedavi_bitis: hastaEnd.value.trim(),
      hedef_adim: hastaHedef.value.trim(),
      not: hastaNot.value.trim(),
    };

    if (!hastaEditId) {
      payload.password = hastaPassword.value.trim();

      if (
        !payload.first_name ||
        !payload.last_name ||
        !payload.phone ||
        !payload.password
      ) {
        return alert("Yeni hasta eklemek için tüm zorunlu alanları doldurun.");
      }
    } else {
      // Güncellemede boş bırakılan alanları yollama
      if (!payload.first_name) delete payload.first_name;
      if (!payload.last_name) delete payload.last_name;
      if (!payload.phone) delete payload.phone;
      if (!payload.tedavi_baslangic) delete payload.tedavi_baslangic;
      if (!payload.tedavi_bitis) delete payload.tedavi_bitis;
      if (!payload.hedef_adim) delete payload.hedef_adim;
      if (!payload.not) delete payload.not;
      const pw = hastaPassword.value.trim();
      if (pw) payload.password = pw;
    }

    const url = hastaEditId
      ? `http://localhost:3000/patients/${hastaEditId}`
      : `http://localhost:3000/patients`;
    const method = hastaEditId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw await res.text();

      alert(hastaEditId ? "Hasta güncellendi" : "Hasta eklendi");
      hastaForm.reset();
      hastaEditId = null;
      hastaSubmitBtn.textContent = "Hasta Ekle";
      loadPatients();
    } catch (err) {
      console.error("Hasta işlem hatası:", err);
      alert("Hata oluştu: " + err);
    }
  });
}

async function loadPatients() {
  try {
    const res = await fetch("http://localhost:3000/patients");
    const list = await res.json();

    hastaTableBody.innerHTML = "";
    list.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.first_name}</td>
        <td>${p.last_name}</td>
        <td>${p.phone}</td>
        <td>${p.tedavi_baslangic || "-"}</td>
        <td>${p.tedavi_bitis || "-"}</td>
        <td>
          <button class="hasta-edit" data-id="${p.id}">Düzenle</button>
          <button class="hasta-delete" data-id="${p.id}">Sil</button>
        </td>
      `;
      hastaTableBody.appendChild(tr);
    });

    attachHastaListeners(list);
  } catch (err) {
    console.error("Hasta listesi alınamadı:", err);
  }
}

function attachHastaListeners(list) {
  document.querySelectorAll(".hasta-edit").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const hasta = list.find((x) => x.id == id);
      if (!hasta) return alert("Hasta bulunamadı!");

      hastaName.value = hasta.first_name || "";
      hastaSurname.value = hasta.last_name || "";
      hastaPhone.value = hasta.phone || "";
      hastaPassword.value = "";
      hastaStart.value = hasta.tedavi_baslangic || "";
      hastaEnd.value = hasta.tedavi_bitis || "";
      hastaHedef.value = hasta.hedef_adim || "";
      hastaNot.value = hasta.not || "";

      hastaEditId = id;
      hastaSubmitBtn.textContent = "Güncelle";
      window.scrollTo(0, hastaForm.offsetTop);
    })
  );

  document.querySelectorAll(".hasta-delete").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Hastayı silmek istediğinize emin misiniz?")) return;
      try {
        const res = await fetch(`http://localhost:3000/patients/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw await res.text();
        alert("Hasta silindi");
        loadPatients();
      } catch (err) {
        console.error("Silme hatası:", err);
        alert("Silinemedi.");
      }
    })
  );
}



// ----- Raporlar işlemleri (raporlar.html sayfası) -------
  const raporForm = document.getElementById("rapor-form");
  const userSelect = document.getElementById("user-select");
  const raporTable = document.querySelector("#rapor-table tbody");
  const raporBtn = document.getElementById("rapor-gonder-btn");

  const adimInput = document.getElementById("gunluk-adim");
  const aciInput = document.getElementById("diz-acisi");
  const videoInput = document.getElementById("egzersiz-video");
  const fotoInput = document.getElementById("foto-karsilastirma");
  const notInput = document.getElementById("ozel-not");

  let hastaListesi = [];
  let raporEditId = null;

  if (raporForm) {
    loadPatients();
    loadReports();

    raporForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const userId = userSelect.value;
      const hasta = hastaListesi.find(h => h.id == userId);
      if (!userId || !hasta) {
        return alert("Lütfen hasta seçiniz.");
      }

      if (videoInput.files[0] && videoInput.files[0].size > 50 * 1024 * 1024) {
        return alert("Video dosyası 50MB'den büyük olamaz.");
      }

      const rawAdim = adimInput.value.trim();
      const temizAdim = rawAdim.replace(/\./g, '').replace(',', '.');
      const hedefAdim = parseFloat(temizAdim);
      if (isNaN(hedefAdim)) {
        return alert("Geçerli bir adım sayısı giriniz.");
      }

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("isim", hasta.first_name);
      formData.append("soyisim", hasta.last_name);
      formData.append("adim", hedefAdim);
      formData.append("aci", aciInput.value.trim());
      formData.append("video", videoInput.files[0] || "");
      formData.append("foto", fotoInput.files[0] || "");
      formData.append("ozel_not", notInput.value.trim());

      const url = raporEditId
        ? `http://localhost:3000/raporlar/${raporEditId}`
        : "http://localhost:3000/raporlar";
      const method = raporEditId ? "PUT" : "POST";

      try {
        const res = await fetch(url, {
          method,
          body: formData
        });
        if (!res.ok) throw await res.text();
        alert(raporEditId ? "Rapor güncellendi" : "Rapor gönderildi");

        raporForm.reset();
        raporEditId = null;
        raporBtn.textContent = "Raporu Gönder";
        loadReports();
      } catch (err) {
        console.error("Rapor gönderim hatası:", err);
        alert("Hata oluştu: " + err);
      }
    });
  }

  async function loadPatients() {
    try {
      const res = await fetch("http://localhost:3000/patients");
      const list = await res.json();
      hastaListesi = list;

      userSelect.innerHTML = `<option value="">-- Hasta Seçiniz --</option>`;
      list.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.first_name} ${p.last_name}`;
        userSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Hasta listesi alınamadı:", err);
    }
  }

  async function loadReports() {
    try {
      const res = await fetch("http://localhost:3000/raporlar");
      const list = await res.json();

      raporTable.innerHTML = "";
      list.forEach(r => {
        const date = new Date(r.created_at);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.isim}</td>
          <td>${r.soyisim}</td>
          <td>${r.adim ?? "-"}</td>
          <td>${r.aci ?? "-"}</td>
          <td>${r.video ? `<a href="${r.video}" target="_blank">Video</a>` : "-"}</td>
          <td>${r.foto ? `<a href="${r.foto}" target="_blank">Foto</a>` : "-"}</td>
          <td>${r.ozel_not || "-"}</td>
          <td>${isNaN(date) ? "-" : date.toLocaleDateString("tr-TR")}</td>
          <td>
            <button class="rapor-edit" data-id="${r.id}">Düzenle</button>
            <button class="rapor-delete" data-id="${r.id}">Sil</button>
          </td>
        `;
        raporTable.appendChild(tr);
      });

      attachRaporListeners();
    } catch (err) {
      console.error("Rapor listeleme hatası:", err);
    }
  }

  function attachRaporListeners() {
    document.querySelectorAll(".rapor-edit").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`http://localhost:3000/raporlar/${id}`);
          const r = await res.json();

          const selected = hastaListesi.find(h => h.first_name === r.isim && h.last_name === r.soyisim);
          userSelect.value = selected?.id || "";

          adimInput.value = r.adim || "";
          aciInput.value = r.aci || "";
          notInput.value = r.ozel_not || "";
          videoInput.value = "";
          fotoInput.value = "";

          raporEditId = id;
          raporBtn.textContent = "Güncelle";
          window.scrollTo(0, raporForm.offsetTop);
        } catch (err) {
          alert("Düzenleme hatası: " + err);
        }
      });
    });

    document.querySelectorAll(".rapor-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Raporu silmek istediğinize emin misiniz?")) return;

        try {
          const res = await fetch(`http://localhost:3000/raporlar/${id}`, {
            method: "DELETE"
          });
          if (!res.ok) throw await res.text();
          alert("Rapor silindi");
          loadReports();
        } catch (err) {
          alert("Silme hatası: " + err);
        }
      });
    });
  }
});


// ================= Bildirim İşlemleri =================
const bildirimForm = document.getElementById("bildirim-form");
const bildirimBaslik = document.getElementById("bildirim-baslik");
const bildirimIcerik = document.getElementById("bildirim-icerik");
const bildirimTablo = document.querySelector("#bildirim-tablosu tbody");
const bildirimBtn = document.getElementById("bildirim-ekle-btn");

let bildirimEditId = null;

if (bildirimForm) {
  loadBildiriler();

  bildirimForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      title: bildirimBaslik.value.trim(),
      content: bildirimIcerik.value.trim()
    };

    if (!payload.title || !payload.content) {
      return alert("Lütfen başlık ve içerik alanlarını doldurun.");
    }

    const url = bildirimEditId
      ? `http://localhost:3000/bildirimler/${bildirimEditId}`
      : `http://localhost:3000/bildirimler`;

    const method = bildirimEditId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw await res.text();
      alert(bildirimEditId ? "Bildirim güncellendi" : "Bildirim eklendi");

      bildirimForm.reset();
      bildirimEditId = null;
      bildirimBtn.textContent = "Bildirim Ekle";
      loadBildiriler();
    } catch (err) {
      console.error("Bildirim işlemi hatası:", err);
      alert("Bir hata oluştu: " + err);
    }
  });
}

async function loadBildiriler() {
  try {
    const res = await fetch("http://localhost:3000/bildirimler");
    if (!res.ok) throw await res.text();
    const list = await res.json();

    bildirimTablo.innerHTML = "";
    list.forEach((b) => {
      const date = new Date(b.created_at).toLocaleDateString("tr-TR");
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.title}</td>
        <td>${b.content}</td>
        <td>${date}</td>
        <td>
          <button class="bildirim-edit" data-id="${b.id}">Düzenle</button>
          <button class="bildirim-delete" data-id="${b.id}">Sil</button>
        </td>
      `;
      bildirimTablo.appendChild(tr);
    });

    attachBildirimListeners(list);
  } catch (err) {
    console.error("Bildirim listeleme hatası:", err);
  }
}

function attachBildirimListeners(list) {
  document.querySelectorAll(".bildirim-edit").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const b = list.find((x) => x.id == id);
      if (!b) return alert("Bildirim bulunamadı!");

      bildirimBaslik.value = b.title;
      bildirimIcerik.value = b.content;
      bildirimEditId = id;
      bildirimBtn.textContent = "Güncelle";
      window.scrollTo(0, bildirimForm.offsetTop);
    })
  );

  document.querySelectorAll(".bildirim-delete").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Bu bildirimi silmek istediğinize emin misiniz?")) return;

      try {
        const res = await fetch(`http://localhost:3000/bildirimler/${id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw await res.text();
        alert("Bildirim silindi");
        loadBildiriler();
      } catch (err) {
        console.error("Silme hatası:", err);
        alert("Silinemedi.");
      }
    })
  );
}

