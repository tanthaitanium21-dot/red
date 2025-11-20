
export async function loadAppData() {
    try {
        const res = await fetch("https://raw.githubusercontent.com/tanthaitanium21-dot/red/refs/heads/main/data.json");
        if (!res.ok) throw new Error("Failed to fetch JSON");
        return await res.json();
    } catch(e){
        console.error(e);
        alert("โหลดข้อมูลไม่ได้");
        return null;
    }
}
