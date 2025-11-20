export async function loadAppData() {
    try {
        const DATA_URL = "https://raw.githubusercontent.com/tanthaitanium21-dot/red/main/data.json";
        console.log("Fetching data from:", DATA_URL);
        const response = await fetch(DATA_URL, {cache: "no-store"});
        if (!response.ok) throw new Error("Failed to fetch data.json: " + response.status);
        const data = await response.json();
        console.log("DATA LOADED:", data);
        return data;
    } catch (err) {
        console.error("LOAD ERROR:", err);
        document.getElementById("app").innerHTML =
            "<h3 style='color:red'>โหลดข้อมูลไม่สำเร็จ</h3>";
        return null;
    }
}
