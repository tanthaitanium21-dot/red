function renderSummary(data) {
    if (!data) return `<p>ไม่มีข้อมูล</p>`;
    const c = data.electrical_installation_data || [];
    const priceCount = Object.keys(data.priceList || {}).length;
    return `
        <div>
            <h2>ข้อมูลโหลดสำเร็จ</h2>
            <p>จำนวนวงจร: ${c.length}</p>
            <p>จำนวนรายการราคา: ${priceCount}</p>
        </div>
    `;
}

function initApp() {
    const root = document.getElementById("app");
    root.innerHTML = "<p>Preparing app...</p>";
    const data = window.appData || null;
    root.innerHTML = renderSummary(data);
    console.log("INIT APP RUNNING, appData:", data);
}

window.initApp = initApp;
