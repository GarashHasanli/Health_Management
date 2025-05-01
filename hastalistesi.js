document.addEventListener("DOMContentLoaded", function() {
    const patientTableBody = document.querySelector("#hasta-table tbody");
    const patientForm       = document.getElementById("hasta-form");
    const submitBtn         = document.getElementById("hasta-ekle-btn");

    // Form alanları
    const patientNameInput      = document.getElementById("hasta-ad");
    const patientSurnameInput   = document.getElementById("hasta-soyad");
    const patientPhoneInput     = document.getElementById("hasta-telefon");
    const patientPasswordInput  = document.getElementById("hasta-sifre");
    const patientStartDateInput = document.getElementById("tedavi-baslangic");
    const patientEndDateInput   = document.getElementById("tedavi-bitis");
    const patientStepGoalInput  = document.getElementById("haftalik-adim");
    const patientNotesInput     = document.getElementById("notlar");

    let editingId = null; // Düzenleme modundaysa ID burada saklanacak

    loadPatients();

    // Form submit: ekle veya güncelle
    patientForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const payload = {
            first_name:       patientNameInput.value.trim(),
            last_name:        patientSurnameInput.value.trim(),
            phone:            patientPhoneInput.value.trim(),
            password:         patientPasswordInput.value, // boşsa backend ignore edebilir
            treatment_start:  patientStartDateInput.value,
            treatment_end:    patientEndDateInput.value,
            weekly_step_goal: patientStepGoalInput.value.trim(),
            notes:            patientNotesInput.value.trim()
        };

        // Zorunlu alanlar
        if (!payload.first_name || !payload.last_name || !payload.phone || (!editingId && !payload.password)) {
            alert("Ad, soyad, telefon ve şifre (yeni eklemede) zorunludur!");
            return;
        }

        const url    = editingId ? `http://localhost:3000/patients/${editingId}` : "http://localhost:3000/patients";
        const method = editingId ? "PUT" : "POST";

        fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) throw new Error(res.statusText);
            return res.json();
        })
        .then(() => {
            alert(editingId ? "Hasta güncellendi!" : "Hasta eklendi!");
            patientForm.reset();
            editingId = null;
            submitBtn.textContent = "Hasta Ekle";
            loadPatients();
        })
        .catch(err => {
            console.error(err);
            alert("İşlem sırasında hata: " + err.message);
        });
    });

    function loadPatients() {
        fetch("http://localhost:3000/patients")
        .then(res => {
            if (!res.ok) throw new Error(res.statusText);
            return res.json();
        })
        .then(data => {
            patientTableBody.innerHTML = "";
            data.forEach(patient => {
                // Tarihleri gün.ay.yıl formatına çevir
                const fmt = dateStr => {
                    if (!dateStr) return "";
                    const d = new Date(dateStr);
                    return d.toLocaleDateString("tr-TR", {
                        day:   "2-digit",
                        month: "2-digit",
                        year:  "numeric"
                    });
                };
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${patient.id}</td>
                    <td>${patient.first_name}</td>
                    <td>${patient.last_name || ""}</td>
                    <td>${patient.phone}</td>
                    <td>${fmt(patient.treatment_start)}</td>
                    <td>${fmt(patient.treatment_end)}</td>
                    <td>
                        <button class="edit-btn"   data-id="${patient.id}">Düzenle</button>
                        <button class="delete-btn" data-id="${patient.id}">Sil</button>
                    </td>
                `;
                patientTableBody.appendChild(row);
            });
            attachRowEventListeners();
        })
        .catch(err => {
            console.error("Liste yükleme hatası:", err);
            alert("Hasta listesi alınırken hata oluştu.");
        });
    }

    function attachRowEventListeners() {
        // Düzenle
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                fetch(`http://localhost:3000/patients`)
                  .then(res => res.json())
                  .then(list => {
                    const p = list.find(x => x.id == id);
                    if (!p) return alert("Hasta bulunamadı");
                    // Formu doldur
                    patientNameInput.value      = p.first_name;
                    patientSurnameInput.value   = p.last_name || "";
                    patientPhoneInput.value     = p.phone;
                    patientPasswordInput.value  = ""; // isteğe bağlı
                    patientStartDateInput.value = p.treatment_start.split('T')[0];
                    patientEndDateInput.value   = p.treatment_end.split('T')[0];
                    patientStepGoalInput.value  = p.weekly_step_goal || "";
                    patientNotesInput.value     = p.notes || "";

                    editingId = id;
                    submitBtn.textContent = "Güncelle";
                    window.scrollTo(0, patientForm.offsetTop);
                  });
            };
        });

        // Sil
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = () => {
                if (!confirm("Bu hastayı silmek istediğinize emin misiniz?")) return;
                fetch(`http://localhost:3000/patients/${btn.dataset.id}`, { method: "DELETE" })
                  .then(res => {
                    if (!res.ok) throw new Error(res.statusText);
                    loadPatients();
                  })
                  .catch(err => {
                    console.error("Silme hatası:", err);
                    alert("Silme işlemi sırasında hata oluştu.");
                  });
            };
        });
    }
});
