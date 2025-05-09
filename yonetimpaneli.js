document.addEventListener("DOMContentLoaded", () => {
  // ---------------- FT işlemleri ----------------
  const tbody         = document.querySelector("#secretary-table tbody");
  const form          = document.getElementById("ft-form");
  const nameInput     = document.getElementById("ft-name");
  const surnameInput  = document.getElementById("ft-surname");
  const phoneInput    = document.getElementById("ft-phone");
  const passwordInput = document.getElementById("ft-password");
  const submitBtn     = document.getElementById("ft-ekle-btn");

  let editingId = null;

  if (form) {
    loadSecretaries();

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const payload = {
        first_name: nameInput.value.trim(),
        last_name:  surnameInput.value.trim(),
        phone:      phoneInput.value.trim(),
        password:   passwordInput.value.trim()
      };

      if (!payload.first_name || !payload.last_name || !payload.phone || (!editingId && !payload.password)) {
        return alert("Lütfen tüm zorunlu alanları doldurun!");
      }

      const url    = editingId
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
              day:   "2-digit",
              month: "2-digit",
              year:  "numeric"
            });

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${sec.id}</td>
          <td>${sec.first_name || "-"}</td>
          <td>${sec.last_name  || "-"}</td>
          <td>${sec.phone      || "-"}</td>
          <td>${formattedDate}</td>
          <td>
            <button class="edit-btn"   data-id="${sec.id}">Düzenle</button>
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
          const sec  = list.find(x => x.id == id);
          if (!sec) return alert("FT bulunamadı!");

          nameInput.value     = sec.first_name || "";
          surnameInput.value  = sec.last_name  || "";
          phoneInput.value    = sec.phone      || "";
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

  // ---------------- Rapor işlemleri ----------------
  const raporForm = document.getElementById("rapor-form");
  const raporTable = document.querySelector("#rapor-table tbody");
  const raporBtn = document.getElementById("rapor-gonder-btn");

  const rName = document.getElementById("hasta-isim");
  const rSurname = document.getElementById("hasta-soyisim");
  const rAdim = document.getElementById("gunluk-adim");
  const rAci = document.getElementById("diz-acisi");
  const rVideo = document.getElementById("egzersiz-video");
  const rFoto = document.getElementById("foto-karsilastirma");
  const rNot = document.getElementById("ozel-not");

  let raporEditId = null;

  if (raporForm) {
    loadReports();

    raporForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (rVideo.files[0] && rVideo.files[0].size > 50 * 1024 * 1024) {
        return alert("Video dosyası 50MB'den büyük olamaz.");
      }

      const formData = new FormData();
      formData.append("isim", rName.value.trim());
      formData.append("soyisim", rSurname.value.trim());
      formData.append("adim", rAdim.value.trim());
      formData.append("aci", rAci.value.trim());
      formData.append("video", rVideo.files[0] || "");
      formData.append("foto", rFoto.files[0] || "");
      formData.append("ozel_not", rNot.value.trim());

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

  async function loadReports() {
    try {
      const res = await fetch("http://localhost:3000/raporlar");
      if (!res.ok) throw await res.text();
      const list = await res.json();

      raporTable.innerHTML = "";
      list.forEach(r => {
        const date = new Date(r.created_at);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.isim}</td>
          <td>${r.soyisim}</td>
          <td>${r.adim}</td>
          <td>${r.aci}</td>
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
          if (!res.ok) throw await res.text();
          const r = await res.json();

          rName.value = r.isim || "";
          rSurname.value = r.soyisim || "";
          rAdim.value = r.adim || "";
          rAci.value = r.aci || "";
          rNot.value = r.not || "";
          rVideo.value = "";
          rFoto.value = "";

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
