document.addEventListener("DOMContentLoaded", function() {
    const secretaryTableBody = document.querySelector("#secretary-table tbody");
    const ftForm = document.getElementById("ft-form");
    const ftPhoneInput = document.getElementById("ft-phone");
    const ftPasswordInput = document.getElementById("ft-password");

    // Sayfa yüklendiğinde FT listesini çek
    loadSecretaries();

    // Yeni FT Ekleme İşlemi
    ftForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const phone = ftPhoneInput.value.trim();
        const password = ftPasswordInput.value.trim();

        if (!phone || !password) {
            alert("Lütfen tüm alanları doldurun!");
            return;
        }

        const newSecretary = { phone, password };

        fetch("http://localhost:3000/secretaries", {  
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSecretary)
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message || "İşlem tamam");
            ftForm.reset();
            loadSecretaries();
        })
        .catch(error => console.error("Yeni FT eklenirken hata:", error));
    });

    // FT Listesini Getirme Fonksiyonu
    function loadSecretaries() {
        fetch("http://localhost:3000/secretaries")  
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text) });
                }
                return response.json();
            })
            .then(data => {
                secretaryTableBody.innerHTML = "";
                data.forEach(sec => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${sec.id}</td>
                        <td>${sec.phone}</td>
                        <td>${sec.name}</td>
                        <td>${new Date(sec.created_at).toLocaleString()}</td>
                    `;
                    secretaryTableBody.appendChild(row);
                });
            })
            .catch(err => console.error("FT listesi çekilirken hata:", err));
    }
});
