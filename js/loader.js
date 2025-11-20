export async function loadAppData() {
    try {

        // 👉 ใช้ลิงก์ RAW ที่โหลดได้จริง 100%
        const DATA_URL = "https://raw.githubusercontent.com/tanthaitanium21-dot/red/main/data.json";

        console.log("Fetching data from:", DATA_URL);

        const response = await fetch(DATA_URL, {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache"
            }
        });

        if (!response.ok) {
            throw new Error("Cannot load data.json → HTTP " + response.status);
        }

        const data = await response.json();
        console.log("DATA LOADED SUCCESS:", data);

        return data;

    } catch (err) {
        console.error("❌ ERROR loading data.json:", err);
        document.getElementById("app").innerHTML =
            "<h3 style='color:red'>โหลดข้อมูลไม่สำเร็จ กรุณารีเฟรชหน้า</h3>";
        return null;
    }
}
