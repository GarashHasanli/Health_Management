document.addEventListener("DOMContentLoaded", () => {
  const tbody         = document.querySelector("#secretary-table tbody");
  const form          = document.getElementById("ft-form");
  const nameInput     = document.getElementById("ft-name");
  const surnameInput  = document.getElementById("ft-surname");
  const phoneInput    = document.getElementById("ft-phone");
  const passwordInput = document.getElementById("ft-password");
  const submitBtn     = document.getElementById("ft-ekle-btn");

  let editingId = null;  // Düzenleniyorsa burada saklanacak

  loadSecretaries();

  // Form submit: ekle veya güncelle
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

  // Listeyi yükle ve tabloya bas
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

  // Satır butonlarına olay ekle
  function attachRowListeners() {
    // Düzenle
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          // İlgili kaydı çek
          const res = await fetch(`http://localhost:3000/secretaries`);
          if (!res.ok) throw await res.text();
          const list = await res.json();
          const sec  = list.find(x => x.id == id);
          if (!sec) return alert("FT bulunamadı!");

          // Formu doldur
          nameInput.value     = sec.first_name || "";
          surnameInput.value  = sec.last_name  || "";
          phoneInput.value    = sec.phone      || "";
          passwordInput.value = ""; // Şifreyi isteğe bağlı güncelletebilir
          
          editingId = id;
          submitBtn.textContent = "Güncelle";
          window.scrollTo(0, form.offsetTop);
        } catch (err) {
          console.error("Düzenleme hatası:", err);
          alert("Düzenleme verisi alınamadı.");
        }
      });
    });

    // Sil
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
});
