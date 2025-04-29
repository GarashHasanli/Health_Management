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

        if (!name || !phone) {
            alert("Lütfen hasta adı ve telefon bilgilerini girin!");
            return;
        }

        const newPatient = { 
            name, 
            phone, 
            startDate, 
            endDate, 
            stepGoal, 
            notes 
        };

        fetch("http://localhost:3000/patients", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newPatient),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert("Hasta başarıyla eklendi!");
            patientForm.reset();
            loadPatients();
        })
        .catch(error => {
            console.error("Hata:", error);
            alert("Hasta eklenirken bir hata oluştu: " + error.message);
        });
    });

    // Hasta listesini yükleme fonksiyonu
    function loadPatients() {
        fetch("http://localhost:3000/patients")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            patientTableBody.innerHTML = "";
            data.forEach(patient => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${patient.id}</td>
                    <td>${patient.first_name || patient.name}</td>
                    <td>${patient.phone}</td>
                    <td>${patient.tedavi_baslangic || patient.startDate || 'Belirtilmedi'}</td>
                    <td>
                        <button class="edit-btn" data-id="${patient.id}">Düzenle</button>
                        <button class="delete-btn" data-id="${patient.id}">Sil</button>
                    </td>
                `;
                patientTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Hasta listesi yüklenirken hata:", error);
            alert("Hasta listesi yüklenirken bir hata oluştu. Lütfen konsolu kontrol edin.");
        });
    }
});