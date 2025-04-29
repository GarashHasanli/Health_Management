document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.querySelector("#secretary-table tbody");
    const form = document.getElementById("ft-form");
    const nameInput = document.getElementById("ft-name");
    const phoneInput = document.getElementById("ft-phone");
  
    loadSecretaries();
  
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      if (!name || !phone) return alert("Lütfen tüm alanları doldurun!");
  
      try {
        const res = await fetch("http://localhost:3000/secretaries", {
          method: "POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ name, phone })
        });
        if (!res.ok) throw await res.text();
        alert("FT başarıyla eklendi");
        form.reset();
        loadSecretaries();
      } catch(err) {
        console.error(err);
        alert("Eklerken hata: " + err);
      }
    });
  
    async function loadSecretaries() {
      try {
        const res = await fetch("http://localhost:3000/secretaries");
        if (!res.ok) throw await res.text();
        const list = await res.json();
        tbody.innerHTML = "";
        list.forEach(sec => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${sec.id}</td>
            <td>${sec.first_name}</td>
            <td>${sec.phone}</td>
            <td>${new Date(sec.created_at).toLocaleDateString()}</td>
            <td>
              <button class="edit-btn" data-id="${sec.id}">Düzenle</button>
              <button class="delete-btn" data-id="${sec.id}">Sil</button>
            </td>`;
          tbody.appendChild(tr);
        });
        attachRowListeners();
      } catch(err) {
        console.error("Liste yükleme hatası:", err);
      }
    }
  
    function attachRowListeners() {
      document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const newName = prompt("Yeni İsim Soyisim:");
          const newPhone = prompt("Yeni Telefon:");
          if (!newName || !newPhone) return;
          try {
            const res = await fetch(`http://localhost:3000/secretaries/${id}`, {
              method: "PUT",
              headers:{ "Content-Type":"application/json" },
              body: JSON.stringify({ name: newName, phone: newPhone })
            });
            if (!res.ok) throw await res.text();
            alert("Güncellendi");
            loadSecretaries();
          } catch(err) {
            console.error(err);
            alert("Güncellerken hata: " + err);
          }
        });
      });
  
      document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("Silmek istediğine emin misin?")) return;
          const id = btn.dataset.id;
          try {
            const res = await fetch(`http://localhost:3000/secretaries/${id}`, {
              method: "DELETE"
            });
            if (!res.ok) throw await res.text();
            alert("Silindi");
            loadSecretaries();
          } catch(err) {
            console.error(err);
            alert("Silme hatası: " + err);
          }
        });
      });
    }
  });
  