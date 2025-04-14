document.addEventListener("DOMContentLoaded", function() {
    const patientTableBody = document.querySelector("#hasta-table tbody");
    const patientForm = document.getElementById("hasta-form");

    // Hasta form alanları
    const patientNameInput = document.getElementById("hasta-ad");
    const patientPhoneInput = document.getElementById("hasta-telefon");
    const patientStartDateInput = document.getElementById("tedavi-baslangic");
    const patientEndDateInput = document.getElementById("tedavi-bitis");
    const patientStepGoalInput = document.getElementById("haftalik-adim");
    const patientNotesInput = document.getElementById("notlar");

    // Sayfa yüklendiğinde mevcut hastaları çek
    loadPatients();

    // Yeni hasta ekleme
    patientForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const name = patientNameInput.value.trim();
        const phone = patientPhoneInput.value.trim();
        const startDate = patientStartDateInput.value;
        const endDate = patientEndDateInput.value;
        const stepGoal = patientStepGoalInput.value.trim();
        const notes = patientNotesInput.value.trim();

        // Eğer alanlar boşsa uyarı ver
        if (!name || !phone) {
            alert("Lütfen tüm alanları doldurun!");
            return;
        }

        const newPatient = { name, phone, startDate, endDate, stepGoal, notes };

        // Yeni hasta eklemek için POST isteği gönderiyoruz
        fetch("http://localhost:3000/patients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPatient),
        })
            .then((response) => response.json())
            .then((data) => {
                alert(data.message || "Hasta başarıyla eklendi");
                patientForm.reset(); // Formu sıfırla
                loadPatients(); // Hasta listesi yenilensin
            })
            .catch((error) => console.error("Yeni hasta eklenirken hata:", error));
    });

    // Hasta listesini çekme fonksiyonu
    function loadPatients() {
        fetch("http://localhost:3000/patients")
            .then((response) => response.json())
            .then((data) => {
                patientTableBody.innerHTML = "";
                data.forEach((patient) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${patient.id}</td>
                        <td>${patient.first_name}</td>
                        <td>${patient.phone}</td>
                        <td>${new Date(patient.created_at).toLocaleString()}</td>
                    `;
                    patientTableBody.appendChild(row);
                });
            })
            .catch((err) => console.error("Hasta listesi çekilirken hata:", err));
    }
});
