export async function loadAppData() {
    try {
        const response = await fetch('https://tanthaitanium21-dot.github.io/red/data.json');
        if (!response.ok) throw new Error("Cannot load data.json");

        const data = await response.json();
        console.log("DATA LOADED:", data);

        return data;

    } catch (err) {
        console.error("ERROR loading data.json:", err);
        document.getElementById("app").innerHTML =
            "<h3 style='color:red'>โหลดข้อมูลไม่สำเร็จ</h3>";
        return null;
    }
}
