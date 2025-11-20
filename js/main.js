
import { populateProvinces } from './loader.js';

// Defer heavy UI initialization where possible and provide lazy-loading hooks.
// Hook to populate province selector on focus (lazy load)
document.addEventListener('DOMContentLoaded', () => {
  const provSel = document.getElementById('province_selector') || document.querySelector('#province_selector');
  if (provSel) {
    // populate on first focus or click
    let loaded = false;
    const loadOnce = async () => {
      if (loaded) return;
      loaded = true;
      await populateProvinces('#province_selector');
    };
    provSel.addEventListener('focus', loadOnce, { once: true });
    provSel.addEventListener('click', loadOnce, { once: true });
  }
});

// Insert original script content (modified to remove large static arrays)
(function(){

        document.addEventListener('DOMContentLoaded', () => {
            const appData = {
                // V5.1 (User Req): ลบ กทม. ออกจาก list นี้
                provinces: [],
                // V5.1 (User Req): เพิ่มตัวคูณค่าแรงตามโซน กทม. (อ้างอิงเอกสาร Living Wage)
                bkkZoneMultipliers: {
                    'BKK_Zone1_CBD': { labor: 1.25, material: 1.05 }, // สาทร/สีลม (อ้างอิงจาก "ช่องว่างค่าจ้าง")
                    'BKK_Zone2_Transit': { labor: 1.15, material: 1.02 }, // พระโขนง (อ้างอิงจาก "ช่องว่างค่าจ้าง")
                    'BKK_Zone3_Industrial': { labor: 1.05, material: 1.0 }, // ลาดกระบัง (อ้างอิงจาก "ช่องว่างค่าจ้าง")
                    'BKK_Zone4_MidTier': { labor: 1.10, material: 1.0 }, // ลาดพร้าว (ประเมิน)
                    'BKK_Zone5_Suburban': { labor: 1.0, material: 1.0 }, // มีนบุรี (ใช้เป็นฐาน 1.0)
                },
                provinceZones: {
                    // V5.1: กทม. ยังต้องอยู่ใน MEA list เพื่อการเช็คค่า กฟน.
                    'MEA': ['กรุงเทพมหานคร', 'นนทบุรี', 'สมุทรปราการ'],
                    'PEA': [
                        'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท',
                        'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา',
                        'นครศรีธรรมราช', 'นครสวรรค์', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', // (ปทุมธานีมี กฟภ. ด้วย)
                        'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์',
                        'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี',
                        'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรสงคราม', 'สมุทรสาคร',
                        'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู',
                        'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชนี'
                    ]
                },
                // V5.1 (User Req): ลบ กทม. ออกจาก list นี้
                provinceMultipliers: {
                    'นนทบุรี': { labor: 1.05, material: 1.0 }, 'ปทุมธานี': { labor: 1.05, material: 1.0 }, 'สมุทรปราการ': { labor: 1.05, material: 1.0 },
                    'ชลบุรี': { labor: 1.1, material: 1.05 }, 'ระยอง': { labor: 1.1, material: 1.05 },
                    'ภูเก็ต': { labor: 1.2, material: 1.15 }, 'สุราษฎร์ธานี': { labor: 1.1, material: 1.1 }, 'สงขลา': { labor: 1.1, material: 1.1 },
                    'เชียงใหม่': { labor: 1.05, material: 1.05 }, 'เชียงราย': { labor: 1.0, material: 1.08 },
                    'นครราชสีมา': { labor: 1.0, material: 1.02 }, 'ขอนแก่น': { labor: 1.0, material: 1.02 },
                    'default': { labor: 1.0, material: 1.03 }
                },
                // V5.1 (Spec 4.3.3): อัปเดตฐานข้อมูลสายเมนใหม่ตามมาตรฐาน กฟน./กฟภ.
                mainCableSpecs_v5_1: {
                    'MEA': { // กฟน.
                        '5(15)': { 'THW': 10 },
                        '15(45)': { 'THW': 10 },
                        '30(100)': { 'THW': 25 },
                        '50(150)': { 'THW': 35 }
                    },
                    'PEA': { // กฟภ.
                        '5(15)': { 'THW': 10, 'THW-A': 16 },
                        '15(45)': { 'THW': 16, 'THW-A': 25 },
                        '30(100)': { 'THW': 35, 'THW-A': 50 },
                        '50(150)': { 'THW': 35, 'THW-A': 50 } // กฟภ. ไม่มี 50(150)A, ใช้ค่า 30(100)A เทียบเคียง
                    }
                },
                "electrical_installation_data": [
                    { "category_id": "1.0", "category_name": "งานเดินสายไฟฟ้า", "tasks": [
                        { "task_id": "1.1", "task_name": "ร้อยสาย THW 2.5mm² ในท่อ (เต้ารับ)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-11-01"}], "material_components": [{"material_id": "M-WIRE-THW-2.5-BRN", "spec": "สาย THW 2.5mm² สีน้ำตาล"}, {"material_id": "M-WIRE-THW-2.5-BLU", "spec": "สาย THW 2.5mm² สีฟ้า"}, {"material_id": "M-WIRE-THW-2.5-GRN", "spec": "สาย THW 2.5mm² สีเขียว/เหลือง"}] },
                        { "task_id": "1.2", "task_name": "ร้อยสาย THW 1.5mm² ในท่อ (แสงสว่าง)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-12-01"}], "material_components": [{"material_id": "M-WIRE-THW-1.5-BRN", "spec": "สาย THW 1.5mm² สีน้ำตาล"}, {"material_id": "M-WIRE-THW-1.5-BLU", "spec": "สาย THW 1.5mm² สีฟ้า"}, ] },
                        { "task_id": "1.3", "task_name": "เดินสาย VAF 2x2.5mm² ตีกิ๊ป", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-13-01"}], "material_components": [{"material_id": "M-WIRE-VAF-2.5", "spec": "สาย VAF-G 2x2.5mm²"}, {"material_id": "M-CLIP-VAF", "spec": "กิ๊ปจับสาย", "usage_logic": "5 per meter"}] },
                        { "task_id": "1.4", "task_name": "ร้อยสาย THW 4.0mm² ในท่อ (L,N)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-AC-WIRING"}], "material_components": [{"material_id": "M-WIRE-THW-4.0-BRN", "spec":"สาย THW 4.0mm² สีน้ำตาล"}, {"material_id": "M-WIRE-THW-4.0-BLU", "spec":"สาย THW 4.0mm² สีฟ้า"}] },
                        { "task_id": "1.5", "task_name": "ร้อยสายดิน THW 4.0mm² ในท่อ (G)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-GND-WIRING-4.0"}], "material_components": [{"material_id": "M-WIRE-THW-4.0-GRN", "spec":"สาย THW 4.0mm² สีเขียว/เหลือง"}] }
                    ]},
                    { "category_id": "2.0", "category_name": "งานติดตั้งท่อร้อยสาย", "tasks": [
                        { "task_id": "2.1", "task_name": "เดินท่อ PVC ลอย", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-21-01"}], "material_components": [{"material_id": "M-CONDUIT-PVC-1/2", "spec": "ท่อ PVC 1/2\"", "usage_logic": "ceil(m/2.92) pipes"}, {"material_id": "M-SADDLE-PVC-1/2", "spec": "กิ๊ปจับท่อ PVC 1/2\"", "usage_logic": "1 per meter"}, {"material_id": "M-CONN-PVC-COUPLING", "spec": "ข้อต่อตรง PVC", "usage_logic": "ceil(m/2.92)-1 couplings"}] },
                        { "task_id": "2.2", "task_name": "เดินท่อ EMT ลอย", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-22-01"}], "material_components": [{"material_id": "M-CONDUIT-EMT-1/2", "spec": "ท่อ EMT 1/2\"", "usage_logic": "ceil(m/3.05) pipes"}, {"material_id": "M-STRAP-EMT-1/2", "spec": "แคล้มป์จับท่อ EMT 1/2\"", "usage_logic": "1 per 1.5 meter"}, {"material_id": "M-CONN-EMT-COUPLING", "spec": "ข้อต่อตรง EMT", "usage_logic": "ceil(m/3.05)-1 couplings"}] },
                        { "task_id": "2.3", "task_name": "เดินท่อ PVC ฝังผนัง (รวมกรีด/สกัด/ฉาบปูนหยาบ)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-23-01"}], "material_components": [{"material_id": "M-CONDUIT-PVC-1/2", "spec": "ท่อ PVC 1/2\"", "usage_logic": "ceil(m/2.92) pipes"}, {"material_id": "M-CONN-PVC-COUPLING", "spec": "ข้อต่อตรง PVC", "usage_logic": "ceil(m/2.92)-1 couplings"}]}
                    ]},
                    { "category_id": "3.0", "category_name": "งานติดตั้งสวิตช์-เต้ารับ", "tasks": [
                        { "task_id": "3.1", "task_name": "ติดตั้งเต้ารับแบบลอย", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-31-01"}], "material_components": [{"material_id": "M-OUTLET-DPLX-GND", "spec": "เต้ารับกราวด์คู่"}, {"material_id": "M-PLATE-2CH", "spec": "หน้ากาก 2 ช่อง"}, {"material_id": "M-BOX-SURFACE-2X4", "spec": "กล่องลอย 2x4\""}, {"material_id": "M-TAPE-ELEC", "spec": "เทปพันสายไฟ"}] },
                        { "task_id": "3.2", "task_name": "ติดตั้งเต้ารับแบบฝัง", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-32-01"}], "material_components": [{"material_id": "M-OUTLET-DPLX-GND", "spec": "เต้ารับกราวด์คู่"}, {"material_id": "M-PLATE-2CH", "spec": "หน้ากาก 2 ช่อง"}, {"material_id": "M-BOX-HANDY-2X4", "spec": "กล่องฝัง 2x4\""}, {"material_id": "M-TAPE-ELEC", "spec": "เทปพันสายไฟ"}] },
                        { "task_id": "3.3", "task_name": "ติดตั้งสวิตช์แบบลอย", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-33-01"}], "material_components": [{"material_id": "M-SWITCH-1WAY", "spec": "สวิตช์ทางเดียว"}, {"material_id": "M-PLATE-1CH", "spec": "หน้ากาก 1 ช่อง"}, {"material_id": "M-BOX-SURFACE-2X4", "spec": "กล่องลอย 2x4\""}, {"material_id": "M-TAPE-ELEC", "spec": "เทปพันสายไฟ"}] }
                    ]},
                    { "category_id": "4.0", "category_name": "งานติดตั้งอุปกรณ์แสงสว่าง", "tasks": [
                        { "task_id": "4.1", "task_name": "ติดตั้งโคมไฟดาวน์ไลท์ (LED E27)", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-41-01"}], "material_components": [{"material_id": "M-LIGHT-DOWNLIGHT-E27", "spec": "โคมดาวน์ไลท์ E27"}, {"material_id": "M-LIGHT-BULB-LED-9W", "spec": "หลอด LED 9W"}, {"material_id": "M-TAPE-ELEC", "spec": "เทปพันสายไฟ"}] }
                    ]},
                    { "category_id": "5.0", "category_name": "งานติดตั้งเครื่องใช้ไฟฟ้า", "tasks": [
                        { "task_id": "5.1", "task_name": "ติดตั้งเครื่องปรับอากาศ (9-12k BTU)", "unit_of_measure": "เครื่อง", "labor_components": [{"labor_id": "L-AC-INSTALL-12K"}], "material_components": [{"material_id": "M-AC-BRACKET", "spec": "ขาแขวนคอยล์ร้อน"}, {"material_id": "M-AC-PIPE-4M", "spec": "ท่อน้ำยาสำเร็จ 4 เมตร"}, {"material_id": "M-AC-DUCT-2M", "spec": "รางครอบท่อแอร์ 2 เมตร", "usage_logic": "2 per unit"}, {"material_id": "M-AC-DRAINPIPE-4M", "spec": "ท่อน้ำทิ้ง PVC สีเทา 4 เมตร"}, {"material_id": "M-AC-TAPE-VINYL", "spec": "เทปพันท่อแอร์"}, {"material_id": "M-AC-PUTTY", "spec": "ดินน้ำมันสำหรับอุดรูท่อ"}, {"material_id": "M-AC-SCREWS-ANCHORS", "spec": "ชุดพุกและสกรูยึด"}] },
                        { "task_id": "5.2", "task_name": "เดินสายไฟสำหรับเครื่องปรับอากาศ (V6: ซ่อน)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-AC-WIRING"}], "material_components": [{"material_id": "M-WIRE-THW-4.0-BRN"}, {"material_id": "M-WIRE-THW-4.0-BLU"}, {"material_id": "M-WIRE-THW-2.5-GRN"}] },
                        { "task_id": "5.3", "task_name": "ติดตั้งปั๊มน้ำอัตโนมัติ", "unit_of_measure": "เครื่อง", "labor_components": [{"labor_id": "L-PUMP-INSTALL"}], "material_components": [{"material_id": "M-PUMP-BALL-VALVE", "spec": "บอลวาล์ว PVC", "usage_logic": "2 per unit"}, {"material_id": "M-PUMP-CHECK-VALVE", "spec": "เช็ควาล์วสปริง"}, {"material_id": "M-PUMP-UNION", "spec": "ข้อต่อยูเนี่ยน PVC", "usage_logic": "2 per unit"}, {"material_id": "M-TAPE-SEAL", "spec": "เทปพันเกลียว"}] },
                        { "task_id": "5.4", "task_name": "ติดตั้งพัดลมเพดาน/ดูดอากาศ", "unit_of_measure": "เครื่อง", "labor_components": [{"labor_id": "L-FAN-INSTALL"}], "material_components": [{"material_id": "M-FAN-HOOK-ANCHOR", "spec": "พุก/ตะขอสำหรับยึด"}, {"material_id": "M-TAPE-ELEC", "spec": "เทปพันสายไฟ"}] }
                    ]},
                    { "category_id": "6.0", "category_name": "งานติดตั้งระบบสายดิน", "tasks": [
                        { "task_id": "6.1", "task_name": "ตอกหลักดินและติดตั้งสายดิน", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-61-01"}], "material_components": [{"material_id": "M-GROUNDROD-2.4M", "spec": "แท่งกราวด์ 2.4ม."}, {"material_id": "M-GROUNDCLAMP-5/8", "spec": "แคล้มป์หัวใจ 5/8\""}, {"material_id": "M-LUG-10SQMM", "spec": "หางปลา 10mm²"}, {"material_id": "M-GROUND-PIT", "spec": "บ่อพักสายดิน (Ground Pit)"}] }
                    ]},
                    { "category_id": "7.0", "category_name": "งานติดตั้งอุปกรณ์พิเศษ", "tasks": [
                        { "task_id": "7.1", "task_name": "ติดตั้งเครื่องทำน้ำอุ่น (ไม่รวมสาย)", "unit_of_measure": "เครื่อง", "labor_components": [{"labor_id": "L-71-01"}], "material_components": [{"material_id": "M-WH-RCBO-32A", "spec": "เบรกเกอร์กันดูด RCBO 32A"}, {"material_id": "M-WH-HOSE-FLEX", "spec": "สายน้ำดีถัก", "usage_logic": "2 per unit"}, {"material_id": "M-WH-VALVE", "spec": "วาล์วน้ำ"}, {"material_id": "M-TAPE-SEAL", "spec": "เทปพันเกลียว"}, {"material_id": "M-SCREWS-ANCHORS-KIT", "spec": "ชุดพุกและสกรู"}] },
                        { "task_id": "7.2", "task_name": "เดินสายไฟสำหรับเครื่องทำน้ำอุ่น (V6: ซ่อน)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-71-02"}], "material_components": [{"material_id": "M-WIRE-THW-4.0-BRN", "spec": "สาย THW 4.0mm² สีน้ำตาล"}, {"material_id": "M-WIRE-THW-4.0-BLU", "spec": "สาย THW 4.0mm² สีฟ้า"}, {"material_id": "M-WIRE-THW-2.5-GRN", "spec": "สาย THW 2.5mm² สีเขียว/เหลือง"}] }
                    ]},
                    { "category_id": "8.0", "category_name": "งานบริการและตรวจซ่อม", "tasks": [
                        { "task_id": "8.1", "task_name": "ตรวจเช็คระบบไฟฟ้าประจำปี", "unit_of_measure": "ครั้ง", "labor_components": [{"labor_id": "L-81-01"}], "material_components": [] },
                        { "task_id": "8.2", "task_name": "ค้นหาจุดไฟฟ้ารั่ว", "unit_of_measure": "ครั้ง", "labor_components": [{"labor_id": "L-82-01"}], "material_components": [] },
                        { "task_id": "8.3", "task_name": "ตรวจสอบสาเหตุเบรกเกอร์ทริป", "unit_of_measure": "ครั้ง", "labor_components": [{"labor_id": "L-83-01"}], "material_components": [] },
                        { "task_id": "8.4", "task_name": "เปลี่ยนหลอดไฟ", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-84-01"}], "material_components": [] }
                    ]},
                    { "category_id": "9.0", "category_name": "งานเปลี่ยนตู้ควบคุมไฟฟ้า", "tasks": [
                        { "task_id": "9.1", "task_name": "เปลี่ยนตู้ CU 4 ช่อง", "unit_of_measure": "ตู้", "labor_components": [{"labor_id": "L-91-01"}], "material_components": [{"material_id": "M-CU-4CH", "spec": "ตู้ CU 4 ช่อง"}, {"material_id": "M-CU-LABELS", "spec": "สติ๊กเกอร์ระบุวงจร"}] },
                        { "task_id": "9.2", "task_name": "เปลี่ยนตู้ CU 6 ช่อง", "unit_of_measure": "ตู้", "labor_components": [{"labor_id": "L-91-01"}], "material_components": [{"material_id": "M-CU-6CH", "spec": "ตู้ CU 6 ช่อง"}, {"material_id": "M-CU-LABELS", "spec": "สติ๊กเกอร์ระบุวงจร"}] },
                        { "task_id": "9.3", "task_name": "เปลี่ยนตู้ CU 8 ช่อง", "unit_of_measure": "ตู้", "labor_components": [{"labor_id": "L-91-01"}], "material_components": [{"material_id": "M-CU-8CH", "spec": "ตู้ CU 8 ช่อง"}, {"material_id": "M-CU-LABELS", "spec": "สติ๊กเกอร์ระบุวงจร"}] },
                        { "task_id": "9.4", "task_name": "เปลี่ยนตู้ CU 10 ช่อง", "unit_of_measure": "ตู้", "labor_components": [{"labor_id": "L-91-01"}], "material_components": [{"material_id": "M-CU-10CH", "spec": "ตู้ CU 10 ช่อง"}, {"material_id": "M-CU-LABELS", "spec": "สติ๊กเกอร์ระบุวงจร"}] },
                        { "task_id": "9.5", "task_name": "เปลี่ยนตู้ CU 12 ช่อง", "unit_of_measure": "ตู้", "labor_components": [{"labor_id": "L-91-01"}], "material_components": [{"material_id": "M-CU-12CH", "spec": "ตู้ CU 12 ช่อง"}, {"material_id": "M-CU-LABELS", "spec": "สติ๊กเกอร์ระบุวงจร"}] }
                    ]},
                    { "category_id": "10.0", "category_name": "วัสดุเพิ่มเติม", "tasks": [
                        { "task_id": "10.1", "task_name": "เบรกเกอร์ลูกย่อย 16A", "unit_of_measure": "ตัว", "labor_components": [], "material_components": [{"material_id": "M-CB-1P-16A", "spec": "MCB 1P 16A"}] },
                        { "task_id": "10.2", "task_name": "เบรกเกอร์ลูกย่อย 20A", "unit_of_measure": "ตัว", "labor_components": [], "material_components": [{"material_id": "M-CB-1P-20A", "spec": "MCB 1P 20A"}] },
                        { "task_id": "10.3", "task_name": "เบรกเกอร์ลูกย่อย 32A", "unit_of_measure": "ตัว", "labor_components": [], "material_components": [{"material_id": "M-CB-1P-32A", "spec": "MCB 1P 32A"}] }
                    ]},
                    { "category_id": "11.0", "category_name": "งานระบบแรงดันต่ำและสื่อสาร", "tasks": [
                        { "task_id": "11.1", "task_name": "ติดตั้งจุด LAN (Cat6)", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-LAN-POINT"}], "material_components": [{"material_id": "M-LAN-RJ45-OUTLET", "spec": "เต้ารับ LAN RJ45 Cat6"}, {"material_id": "M-PLATE-1CH", "spec": "หน้ากาก 1 ช่อง"}, {"material_id": "M-BOX-SURFACE-2X4", "spec": "กล่องลอย 2x4\""}] },
                        { "task_id": "11.2", "task_name": "เดินสาย LAN (Cat6)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-LAN-WIRING"}], "material_components": [{"material_id": "M-LAN-CABLE-CAT6", "spec": "สาย UTP Cat6"}] },
                        { "task_id": "11.3", "task_name": "ติดตั้งจุด TV (RG6)", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-TV-POINT"}], "material_components": [{"material_id": "M-TV-OUTLET", "spec": "เต้ารับ TV RG6"}, {"material_id": "M-PLATE-1CH", "spec": "หน้ากาก 1 ช่อง"}, {"material_id": "M-BOX-SURFACE-2X4", "spec": "กล่องลอย 2x4\""}] },
                        { "task_id": "11.4", "task_name": "เดินสาย TV (RG6)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-TV-WIRING"}], "material_components": [{"material_id": "M-TV-CABLE-RG6", "spec": "สาย Coaxial RG6"}] },
                        { "task_id": "11.5", "task_name": "ติดตั้งกล้องวงจรปิด (CCTV)", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-CCTV-POINT"}], "material_components": [{"material_id": "M-CCTV-CAMERA", "spec": "กล้อง CCTV มาตรฐาน"}, {"material_id": "M-CCTV-CABLE-10M", "spec": "สายสัญญาณสำเร็จ 10 เมตร"}, {"material_id": "M-CCTV-ADAPTER", "spec": "Adapterแปลงไฟสำหรับกล้อง"}, {"material_id": "M-CCTV-BOX-4X4", "spec": "บ็อกซ์กันน้ำ 4x4\""}] }
                    ]},
                    { "category_id": "12.0", "category_name": "งานติดตั้งเบรกเกอร์ย่อย", "tasks": [
                        { "task_id": "12.1", "task_name": "ติดตั้งเบรกเกอร์ย่อยพร้อมกล่องลอย", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-BREAKER-INSTALL"}], "material_components": [{"material_id": "M-BOX-BREAKER-SURFACE-1P", "spec":"กล่องเบรกเกอร์ลอย 1 ช่อง"}] }
                    ]},
                     { "category_id": "13.0", "category_name": "อุปกรณ์ประกอบท่อ", "tasks": [
                        { "task_id": "13.1", "task_name": "คอนเนคเตอร์ PVC 1/2\"", "unit_of_measure": "ตัว", "labor_components": [], "material_components": [{"material_id": "M-CONN-PVC-CONNECTOR", "spec":"คอนเนคเตอร์ท่อ PVC 1/2\""}] },
                        { "task_id": "13.2", "task_name": "คอนเนคเตอร์ EMT 1/2\"", "unit_of_measure": "ตัว", "labor_components": [], "material_components": [{"material_id": "M-CONN-EMT-CONNECTOR", "spec":"คอนเนคเตอร์ท่อ EMT 1/2\""}] }
                    ]},
                    
                    { "category_id": "14.0", "category_name": "งานราง PVC", "tasks": [
                        { "task_id": "14.1", "task_name": "เดินราง PVC สีขาว", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-PVC-TRUNKING"}], "material_components": [{"material_id": "M-PVC-TRUNKING-20x40", "spec": "ราง PVC 20x40mm (รวมข้องอ/ข้อต่อเฉลี่ย)"}] }
                    ]},
                    { "category_id": "15.0", "category_name": "งานแสงสว่างใหม่", "tasks": [
                        { "task_id": "15.1", "task_name": "ติดตั้งโคมไฟ LED Panel สำเร็จรูป", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-41-01"}], "material_components": [{"material_id": "M-LIGHT-SET-LED-PANEL", "spec": "โคมไฟ LED Panel 9W สำเร็จรูป"}] },
                        { "task_id": "15.2", "task_name": "ติดตั้งชุดโคมไฟฟลูออเรสเซนต์ T8", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-T8-INSTALL"}], "material_components": [{"material_id": "M-LIGHT-SET-T8", "spec": "ชุดโคม T8 (ราง, หลอด, บัลลาสต์, สตาร์ทเตอร์)"}] }
                    ]},
                    { "category_id": "16.0", "category_name": "งานสายเฉพาะทาง", "tasks": [
                        { "task_id": "16.1", "task_name": "เดินสาย VCT 2C 2.5mm² (L,N,G)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-VCT-WIRING"}], "material_components": [{"material_id": "M-CABLE-VCT-2C-2.5"}, {"material_id": "M-WIRE-THW-2.5-GRN"}] },
                        { "task_id": "16.2", "task_name": "เดินสาย NYY 2C 2.5mm² (L,N,G)", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-NYY-WIRING"}], "material_components": [{"material_id": "M-CABLE-NYY-2C-2.5"}, {"material_id": "M-WIRE-THW-2.5-GRN"}, {"material_id": "M-WATERPROOF-BOX", "spec": "กล่องต่อสายกันน้ำ", "usage_logic": "0.1 per meter"}] }
                    ]},
                    { "category_id": "17.0", "category_name": "งานเมนภายนอก", "tasks": [
                        { "task_id": "17.1", "task_name": "ปักเสาไฟฟ้า 6.0ม.", "unit_of_measure": "ต้น", "labor_components": [{"labor_id": "L-POLE-6.0M"}], "material_components": [{"material_id": "M-POLE-6.0M"}] },
                        { "task_id": "17.1-B", "task_name": "ปักเสาไฟฟ้า 7.0ม.", "unit_of_measure": "ต้น", "labor_components": [{"labor_id": "L-POLE-7.0M"}], "material_components": [{"material_id": "M-POLE-7.0M"}] },
                        { "task_id": "17.2", "task_name": "ปักเสาไฟฟ้า 8.0ม.", "unit_of_measure": "ต้น", "labor_components": [{"labor_id": "L-POLE-8.0M"}], "material_components": [{"material_id": "M-POLE-8.0M"}] },
                        { "task_id": "17.3", "task_name": "ปักเสาไฟฟ้า 9.0ม.", "unit_of_measure": "ต้น", "labor_components": [{"labor_id": "L-POLE-9.0M"}], "material_components": [{"material_id": "M-POLE-9.0M"}] },
                        // V6: เพิ่ม Task สำหรับแร็คแบบใหม่
                        { "task_id": "17.4-2", "task_name": "ติดตั้งแร็ค 2 ชุด", "unit_of_measure": "ชุด", "labor_components": [{"labor_id": "L-RACK-INSTALL"}], "material_components": [{"material_id": "M-RACK-2SET"}] },
                        { "task_id": "17.4-4", "task_name": "ติดตั้งแร็ค 4 ชุด", "unit_of_measure": "ชุด", "labor_components": [{"labor_id": "L-RACK-INSTALL"}], "material_components": [{"material_id": "M-RACK-4SET"}] },
                        { "task_id": "17.5", "task_name": "เดินสายเมน THW/THW-A", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-11-01"}], "material_components": [
                            {"material_id": "M-CABLE-THW-10"}, {"material_id": "M-CABLE-THW-16"}, {"material_id": "M-CABLE-THW-25"}, {"material_id": "M-CABLE-THW-35"},
                            {"material_id": "M-CABLE-THW-A-16"}, {"material_id": "M-CABLE-THW-A-25"}, {"material_id": "M-CABLE-THW-A-50"}
                        ]}
                    ]},
                    { "category_id": "18.0", "category_name": "งาน EV Charger", "tasks": [
                        { "task_id": "18.1", "task_name": "ติดตั้ง EV Charger (รวมอุปกรณ์)", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-EV-INSTALL-20M"}], "material_components": [{"material_id": "M-EV-CHARGER-7KW"}, {"material_id": "M-RCD-TYPE-B"}, {"material_id": "M-CABLE-THW-16"}, {"material_id": "M-CONDUIT-EMT-3/4"}] },
                        { "task_id": "18.2", "task_name": "ค่าธรรมเนียมมิเตอร์ TOU", "unit_of_measure": "จุด", "labor_components": [], "material_components": [{"material_id": "FEE-TOU-METER"}] }
                    ]},
                    { "category_id": "19.0", "category_name": "งานรื้อถอน", "tasks": [
                        { "task_id": "19.1", "task_name": "รื้อถอนดวงโคม", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-DEMO-DOWNLIGHT"}], "material_components": [] },
                        { "task_id": "19.2", "task_name": "รื้อถอนเต้ารับ/สวิตช์", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-DEMO-OUTLET-SWITCH"}], "material_components": [] },
                        { "task_id": "19.3", "task_name": "รื้อถอนสาย/ท่อ", "unit_of_measure": "เมตร", "labor_components": [{"labor_id": "L-DEMO-PIPE"}], "material_components": [] },
                        { "task_id": "19.4", "task_name": "รื้อถอนเครื่องปรับอากาศ", "unit_of_measure": "เครื่อง", "labor_components": [{"labor_id": "L-DEMO-AC"}], "material_components": [] },
                        { "task_id": "19.5", "task_name": "ค่าแรงซ่อมผนัง", "unit_of_measure": "จุด", "labor_components": [{"labor_id": "L-REPAIR-WALL-POINT"}], "material_components": [] }
                    ]}
                ],
                "priceList": {
    "L-11-01": 5,
    "L-12-01": 5,
    "L-13-01": 5,
    "L-21-01": 25,
    "L-22-01": 27,
    "L-23-01": 95,
    "L-31-01": 100,
    "L-32-01": 120,
    "L-33-01": 100,
    "L-41-01": 150,
    "L-61-01": 300,
    "L-71-01": 500,
    "L-71-02": 25,
    "L-81-01": 1500,
    "L-82-01": 1800,
    "L-83-01": 1200,
    "L-84-01": 100,
    "L-91-01": 500,
    "L-AC-INSTALL-12K": 1500,
    "L-AC-WIRING": 30,
    "L-GND-WIRING-4.0": 15,
    "L-PUMP-INSTALL": 1500,
    "L-FAN-INSTALL": 500,
    "L-LAN-POINT": 120,
    "L-LAN-WIRING": 15,
    "L-TV-POINT": 120,
    "L-TV-WIRING": 15,
    "L-CCTV-POINT": 450,
    "L-BREAKER-INSTALL": 250,
    "M-WIRE-THW-2.5-BRN": 15,
    "M-WIRE-THW-2.5-BLU": 15,
    "M-WIRE-THW-2.5-GRN": 15,
    "M-WIRE-THW-1.5-BRN": 10,
    "M-WIRE-THW-1.5-BLU": 10,
    "M-WIRE-THW-1.5-GRN": 10,
    "M-WIRE-VAF-2.5": 25,
    "M-CLIP-VAF": 1,
    "M-CONDUIT-PVC-1/2": 58,
    "M-SADDLE-PVC-1/2": 1,
    "M-CONN-PVC-COUPLING": 3,
    "M-CONDUIT-EMT-1/2": 145,
    "M-STRAP-EMT-1/2": 3,
    "M-CONN-EMT-COUPLING": 10,
    "M-CONN-PVC-CONNECTOR": 5,
    "M-CONN-EMT-CONNECTOR": 8,
    "M-OUTLET-DPLX-GND": 150,
    "M-PLATE-2CH": 20,
    "M-BOX-SURFACE-2X4": 15,
    "M-BOX-HANDY-2X4": 25,
    "M-SWITCH-1WAY": 120,
    "M-PLATE-1CH": 14,
    "M-LIGHT-DOWNLIGHT-E27": 350,
    "M-LIGHT-BULB-LED-9W": 65,
    "M-GROUNDROD-2.4M": 600,
    "M-GROUNDCLAMP-5/8": 50,
    "M-WIRE-GND-10SQMM": 60,
    "M-LUG-10SQMM": 15,
    "M-GROUND-PIT": 250,
    "M-WIRE-THW-4.0-BRN": 25,
    "M-WIRE-THW-4.0-BLU": 25,
    "M-WIRE-THW-4.0-GRN": 25,
    "M-CU-4CH": 850,
    "M-CU-6CH": 1000,
    "M-CU-8CH": 1200,
    "M-CU-10CH": 1400,
    "M-CU-12CH": 1600,
    "M-CU-LABELS": 50,
    "M-CB-1P-16A": 120,
    "M-CB-1P-20A": 120,
    "M-CB-1P-32A": 120,
    "M-BOX-BREAKER-SURFACE-1P": 50,
    "M-AC-BRACKET": 450,
    "M-AC-PIPE-4M": 750,
    "M-AC-DUCT-2M": 120,
    "M-AC-DRAINPIPE-4M": 80,
    "M-AC-TAPE-VINYL": 50,
    "M-AC-PUTTY": 30,
    "M-AC-SCREWS-ANCHORS": 100,
    "M-PUMP-BALL-VALVE": 80,
    "M-PUMP-CHECK-VALVE": 150,
    "M-PUMP-UNION": 60,
    "M-TAPE-SEAL": 20,
    "M-FAN-HOOK-ANCHOR": 100,
    "M-WH-RCBO-32A": 750,
    "M-WH-HOSE-FLEX": 120,
    "M-WH-VALVE": 90,
    "M-SCREWS-ANCHORS-KIT": 50,
    "M-LAN-RJ45-OUTLET": 250,
    "M-LAN-CABLE-CAT6": 15,
    "M-TV-OUTLET": 150,
    "M-TV-CABLE-RG6": 9,
    "M-CCTV-CAMERA": 1200,
    "M-CCTV-CABLE-10M": 250,
    "M-CCTV-ADAPTER": 150,
    "M-CCTV-BOX-4X4": 45,
    "M-TAPE-ELEC": 20,
    "L-PVC-TRUNKING": 20,
    "M-PVC-TRUNKING-20x40": 45,
    "M-LIGHT-SET-LED-PANEL": 250,
    "M-LIGHT-SET-T8": 300,
    "L-T8-INSTALL": 200,
    "L-VCT-WIRING": 9,
    "L-NYY-WIRING": 15,
    "M-CABLE-VCT-2C-2.5": 30,
    "M-CABLE-NYY-2C-2.5": 35,
    "M-WATERPROOF-BOX": 45,
    "L-POLE-6.0M": 950,
    "L-POLE-7.0M": 1025,
    "L-POLE-8.0M": 1100,
    "L-POLE-9.0M": 1250,
    "M-POLE-6.0M": 1050,
    "M-POLE-7.0M": 1350,
    "M-POLE-8.0M": 1680,
    "M-POLE-9.0M": 2090,
    "L-RACK-INSTALL": 150,
    "M-RACK-2SET": 300,
    "M-RACK-4SET": 600,
    "M-CABLE-THW-10": 45,
    "M-CABLE-THW-16": 75,
    "M-CABLE-THW-25": 110,
    "M-CABLE-THW-35": 150,
    "M-CABLE-THW-A-16": 20,
    "M-CABLE-THW-A-25": 25,
    "M-CABLE-THW-A-50": 45,
    "L-EV-INSTALL-20M": 10000,
    "M-EV-CHARGER-7KW": 30000,
    "M-RCD-TYPE-B": 4000,
    "M-CONDUIT-EMT-3/4": 120,
    "FEE-TOU-METER": 6500,
    "L-DEMO-DOWNLIGHT": 25,
    "L-DEMO-OUTLET-SWITCH": 25,
    "L-DEMO-PIPE": 200,
    "L-DEMO-AC": 1500,
    "L-REPAIR-WALL-POINT": 65
}
            };
            
            const initialPriceList = JSON.parse(JSON.stringify(appData.priceList));
            const priceList = appData.priceList;
            const electricalData = appData.electrical_installation_data;

            const allTasks = new Map();
            const allItems = new Map();

// (v_job_costing) ตัวแปรสำหรับเก็บรายการที่เพิ่มเอง
let manualBOQItems = [];
let manualPOItems = [];

// === ฟังก์ชันสำหรับ Job Costing ===
function setupJobCostingListeners() {
    const manualJobName = document.getElementById('manual-job-name');
    if (!manualJobName) return;
    const manualJobLaborTotal = document.getElementById('manual-job-labor-total');
    const manualJobMaterialsTableBody = document.querySelector('#manual-job-materials-table tbody');

    document.getElementById('manual-job-add-material-row').addEventListener('click', () => {
        const rowId = `manual_mat_row_${Date.now()}`;
        const row = document.createElement('tr');
        row.id = rowId;
        row.innerHTML = `
            <td><input type="text" class="form-input w-full manual-mat-desc" placeholder="รายการ"></td>
            <td><input type="number" class="form-input w-full manual-mat-qty" placeholder="0" min="0"></td>
            <td><input type="text" class="form-input w-full manual-mat-unit" placeholder="หน่วย"></td>
            <td><input type="number" class="form-input w-full manual-mat-price" placeholder="0.00" min="0"></td>
            <td><button type="button" class="btn-delete-row" onclick="document.getElementById('${rowId}').remove()">&times;</button></td>`;
        manualJobMaterialsTableBody.appendChild(row);
    });

    document.getElementById('manual-job-add-btn').addEventListener('click', () => {
        const jobName = manualJobName.value.trim();
        const jobLabor = parseFloat(manualJobLaborTotal.value) || 0;
        const jobQty = parseFloat(document.getElementById('manual-job-qty').value) || 1;
        const jobUnit = document.getElementById('manual-job-unit').value.trim() || 'งาน';
        const table = manualJobMaterialsTableBody;
        if (!jobName || (jobLabor===0 && table.rows.length===0)) { alert("กรุณากรอกข้อมูล"); return; }

        const jobId = `manual_job_${Date.now()}`;
        let jobMatTotal = 0, i=0;

        table.querySelectorAll('tr').forEach(row=>{
            const desc=row.querySelector('.manual-mat-desc').value.trim();
            const qty=parseFloat(row.querySelector('.manual-mat-qty').value)||0;
            const unit=row.querySelector('.manual-mat-unit').value.trim()||'หน่วย';
            const price=parseFloat(row.querySelector('.manual-mat-price').value)||0;
            if(desc&&qty>0&&price>0){
                manualPOItems.push({id:`manual_po_${Date.now()}_${i++}`,description:desc,spec:`(จากงาน: ${jobName})`,quantity:qty,unit:unit,unit_price:price});
                jobMatTotal += qty * price;
            }
        });

        manualBOQItems.push({
                id: jobId,
                description: jobName,
                quantity: jobQty,
                unit: jobUnit,
                labor_unit_cost: (jobQty>0)? (jobLabor / jobQty) : jobLabor,
                material_unit_cost: (jobQty>0)? (jobMatTotal / jobQty) : jobMatTotal
            });

        manualJobName.value='';
        manualJobLaborTotal.value='0';
        table.innerHTML='';
        displayReport();
        alert("เพิ่มงานพิเศษเรียบร้อยแล้ว");
    });
}
// === จบ ===

            electricalData.forEach(c => {
                c.tasks.forEach(t => {
                    allTasks.set(t.task_id, t);
                    t.labor_components?.forEach(l => allItems.set(l.labor_id, { desc: `ค่าแรง: ${t.task_name}`}));
                    t.material_components?.forEach(m => allItems.set(m.material_id, { desc: m.spec }));
                });
            });

            document.getElementById('socket_circuits').addEventListener('input', (e) => renderCircuitInputs('socket', parseInt(e.target.value) || 0, document.getElementById('socket_circuits_container')));
            document.getElementById('light_circuits').addEventListener('input', (e) => renderCircuitInputs('light', parseInt(e.target.value) || 0, document.getElementById('light_circuits_container')));
            document.getElementById('ac_wiring_units').addEventListener('input', (e) => renderDedicatedCircuitInputs('ac_wiring', parseInt(e.target.value) || 0, document.getElementById('ac_wiring_circuits_container')));
            document.getElementById('heater_wiring_units').addEventListener('input', (e) => renderDedicatedCircuitInputs('heater_wiring', parseInt(e.target.value) || 0, document.getElementById('heater_wiring_circuits_container')));

            function renderCircuitInputs(prefix, count, container) {
                container.innerHTML = '';
                if (count <= 0) {
                    updateRealtimeTotal();
                    return;
                }
                let html = '';
                for (let i = 1; i <= count; i++) {
                    html += `
                        <div class="circuit-container" data-circuit-id="${prefix}-${i}">
                            <p class="font-semibold text-gray-800">วงจรที่ ${i}</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                <label class="text-sm text-slate-600">ระยะทางในวงจรนี้ (เมตร)</label>

${prefix === 'light' 
? `
<div class="grid grid-cols-2 gap-2">
    <div>
        <input type="number" id="${prefix}_circuit_${i}_dist_panel_to_switch" 
            class="form-input mt-1 block w-full sm:text-sm dist-part-input" 
            placeholder="ตู้ไฟ → สวิตช์" min="0">
        <p class="text-xs text-slate-500 mt-1">ตู้ไฟ → สวิตช์</p>
    </div>

    <div>
        <input type="number" id="${prefix}_circuit_${i}_dist_switch_to_light" 
            class="form-input mt-1 block w-full sm:text-sm dist-part-input" 
            placeholder="สวิตช์ → หลอดไฟ" min="0">
        <p class="text-xs text-slate-500 mt-1">สวิตช์ → หลอดไฟ</p>
    </div>
</div>

<input type="hidden" id="${prefix}_circuit_${i}_panel_dist" class="dist-input">
`
: `
<div>
    <label for="${prefix}_circuit_${i}_panel_dist" class="text-sm text-slate-600">
        ระยะตู้ไฟถึงเต้ารับ (เมตร)
    </label>
    <input type="number" id="${prefix}_circuit_${i}_panel_dist" 
        class="form-input mt-1 block w-full sm:text-sm" placeholder="0" min="0">
</div>
`}

                                <div>
                                    <label for="${prefix}_circuit_${i}_points" class="text-sm text-slate-600">จำนวนจุดในวงจรนี้</label>
                                    <input type="number" id="${prefix}_circuit_${i}_points" data-point-control-for="${prefix}-${i}" class="point-count-input form-input mt-1 block w-full sm:text-sm" placeholder="จุด" min="1">
                                </div>
                            </div>
                            <div id="inter_point_container_${prefix}-${i}" class="mt-3"></div>
                        </div>
                    `;
                }
                container.innerHTML = html;
                container.querySelectorAll('input').forEach(input => {
                    input.addEventListener('input', updateRealtimeTotal);
                    if(input.classList.contains('point-count-input')) {
                       input.addEventListener('input', handlePointCountChange);
                    }
                });
                updateRealtimeTotal();
            }

            function handlePointCountChange(e) {
                const prefixId = e.target.dataset.pointControlFor;
                const pointCount = parseInt(e.target.value) || 0;
                const container = document.getElementById(`inter_point_container_${prefixId}`);
                container.innerHTML = '';
                if (pointCount > 1) {
                    let html = '<p class="text-sm text-slate-700 mt-2 font-medium">ระยะห่างระหว่างจุด (ม.)</p><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-1">';
                    for (let i = 1; i < pointCount; i++) {
                        html += `
                            <div class="flex flex-col">
                                <label for="${prefixId}_inter_dist_${i}" class="text-xs text-slate-500 mb-1">จุด ${i} → ${i+1}</label>
                                <input type="number" id="${prefixId}_inter_dist_${i}" class="dist-input form-input block w-full sm:text-sm" placeholder="เมตร" min="0">
                            </div>
                        `;
                    }
                    html += '</div>';
                    container.innerHTML = html;
                    container.querySelectorAll('input').forEach(input => {
                        input.addEventListener('input', updateRealtimeTotal);
                    });
                }
                updateRealtimeTotal();
            }
            
            function renderDedicatedCircuitInputs(prefix, count, container) {
                container.innerHTML = '';
                if (count <= 0) {
                    updateRealtimeTotal();
                    return;
                }
                let html = '';
                const isAc = prefix === 'ac_wiring';
                const unitSelectorLabel = isAc ? 'ขนาด BTU' : 'ขนาด Watt';
                const unitOptions = isAc 
                    ? `<option value="12000">9,000 - 12,000 BTU</option>
                       <option value="18000">12,001 - 18,000 BTU</option>
                       <option value="24000">18,001 - 24,000 BTU</option>
                       <option value="30000">&gt; 24,000 BTU</option>`
                    : `<option value="3500">&lt; 3,500 W</option>
                       <option value="4500">3,501 - 4,500 W</option>
                       <option value="6000">4,501 - 6,000 W</option>
                       <option value="8000">&gt; 6,000 W</option>`;

                for (let i = 1; i <= count; i++) {
                    html += `
                        <div class="circuit-container" data-circuit-id="${prefix}-${i}">
                            <p class="font-semibold text-gray-800">เครื่องที่ ${i}</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                <div>
                                    <label for="${prefix}_${i}_unit_size" class="text-sm text-slate-600">${unitSelectorLabel}</label>
                                    <select id="${prefix}_${i}_unit_size" data-breaker-target="${prefix}_${i}_breaker" class="unit-size-selector form-input mt-1 block w-full sm:text-sm">
                                        ${unitOptions}
                                    </select>
                                </div>
                                <div>
                                    <label class="text-sm text-slate-600">เบรกเกอร์ที่แนะนำ</label>
                                    <p id="${prefix}_${i}_breaker" class="mt-1 p-2 bg-slate-100 rounded-md text-slate-800 font-medium h-[38px] flex items-center"></p>
                                </div>
                                <div>
                                    <label for="${prefix}_${i}_panel_to_breaker_dist" class="text-sm text-slate-600">ระยะ ตู้ไฟ → เบรกเกอร์ (ม.)</label>
                                    <input type="number" id="${prefix}_${i}_panel_to_breaker_dist" class="dist-input form-input mt-1 block w-full sm:text-sm" placeholder="เมตร" min="0">
                                </div>
                                <div>
                                    <label for="${prefix}_${i}_breaker_to_unit_dist" class="text-sm text-slate-600">ระยะ เบรกเกอร์ → เครื่อง (ม.)</label>
                                    <input type="number" id="${prefix}_${i}_breaker_to_unit_dist" class="dist-input form-input mt-1 block w-full sm:text-sm" placeholder="เมตร" min="0">
                                </div>
                                <div class="md:col-span-2">
                                    <label for="${prefix}_${i}_panel_to_unit_dist_ground" class="text-sm text-slate-600">ระยะสายดิน ตู้ไฟ → เครื่อง (ม.)</label>
                                    <input type="number" id="${prefix}_${i}_panel_to_unit_dist_ground" class="dist-input form-input mt-1 block w-full sm:text-sm" placeholder="เมตร" min="0">
                                </div>
                                 <div class="md:col-span-2 hidden">
                                    <label for="${prefix}_${i}_install_type" class="text-sm text-slate-600">รูปแบบติดตั้ง</label>
                                    <select id="${prefix}_${i}_install_type" class="form-input mt-1 block w-full">
                                        <option value="surface_pvc">เดินในท่อ PVC ลอย</option>
                                        <option value="concealed_pvc">เดินในท่อ PVC ฝัง (รวมกรีด/ฉาบ)</option>
                                        <option value="surface_emt">เดินในท่อ EMT ลอย</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    `;
                }
                container.innerHTML = html;
                container.querySelectorAll('input, select').forEach(input => {
                    input.addEventListener('input', updateRealtimeTotal);
                });
                container.querySelectorAll('.unit-size-selector').forEach(select => {
                    select.addEventListener('change', updateRecommendedBreaker);
                    updateRecommendedBreaker({ target: select }); 
                });
                updateRealtimeTotal();
            }

            function updateRecommendedBreaker(e) {
                const selector = e.target;
                const value = parseInt(selector.value);
                const targetId = selector.dataset.breakerTarget;
                const targetEl = document.getElementById(targetId);
                const isAc = selector.id.startsWith('ac_wiring');
                
                let breakerSize = 'N/A';
                let breakerAmps = 0;

                if (isAc) {
                    if (value <= 12000) { breakerSize = '20A'; breakerAmps = 20; }
                    else if (value <= 18000) { breakerSize = '20A'; breakerAmps = 20; }
                    else if (value <= 24000) { breakerSize = '32A'; breakerAmps = 32; }
                    else { breakerSize = '32A'; breakerAmps = 32; }
                } else {
                    if (value <= 3500) { breakerSize = '20A'; breakerAmps = 20; }
                    else if (value <= 4500) { breakerSize = '20A'; breakerAmps = 20; }
                    else if (value <= 6000) { breakerSize = '32A'; breakerAmps = 32; }
                    else { breakerSize = '32A'; breakerAmps = 32; }
                }
                
                if (targetEl) {
                    targetEl.textContent = breakerSize;
                    targetEl.dataset.breakerAmps = breakerAmps;
                }
            }
            
            function getMaterialQuantity(material, taskQuantity) {
                const logic = material.usage_logic;
                if (taskQuantity <= 0) return 0;
                if (!logic) return taskQuantity;

                let qty = 0;
                if (logic.includes('per meter')) {
                    const factor = parseFloat(logic.split(' ')[0]);
                    qty = taskQuantity * factor;
                } else if (logic.includes('per unit')) {
                     const factor = parseFloat(logic.split(' ')[0]);
                    qty = taskQuantity * factor;
                } else if (logic.includes('ceil(m/2.92) pipes')) {
                    qty = Math.ceil(taskQuantity / 2.92);
                } else if (logic.includes('ceil(m/3.05) pipes')) {
                    qty = Math.ceil(taskQuantity / 3.05);
                } else if (logic.includes('ceil(m/2.92)-1 couplings')) {
                    qty = Math.max(0, Math.ceil(taskQuantity / 2.92) - 1);
                } else if (logic.includes('ceil(m/3.05)-1 couplings')) {
                    qty = Math.max(0, Math.ceil(taskQuantity / 3.05) - 1);
                } else {
                    qty = taskQuantity;
                }
                return Math.ceil(qty);
            }

            function isPEA(province) {
                if (province === 'กรุงเทพมหานคร') return false;
                if (appData.provinceZones.MEA.includes(province)) return false;
                return appData.provinceZones.PEA.includes(province) || !appData.provinceZones.MEA.includes(province);
            }

            function updateMainCableSpecDisplay() {
                const province = document.getElementById('province_selector').value;
                const authorityEl = document.getElementById('main_authority_7');
                const cableTypeEl = document.getElementById('main_ext_type_7');
                const meterSize = document.getElementById('meter_size_3').value;
                const displayEl = document.getElementById('main_cable_spec_display');

                const isMEA = appData.provinceZones.MEA.includes(province);
                const authority = isMEA ? 'MEA' : 'PEA';
                authorityEl.value = authority;

                const thwA_Option = cableTypeEl.querySelector('option[value="THW-A"]');
                if (isMEA) {
                    thwA_Option.disabled = true;
                    if (cableTypeEl.value === 'THW-A') {
                        cableTypeEl.value = 'THW';
                    }
                } else {
                    thwA_Option.disabled = false;
                }

                const cableType = cableTypeEl.value;
                let cableSize = "N/A";
                let cableSpecText = "N/A";
                
                try {
                    const spec = appData.mainCableSpecs_v5_1[authority][meterSize];
                    if (spec[cableType]) {
                        cableSize = spec[cableType];
                        cableSpecText = `${cableType} ${cableSize} mm²`;
                    } else if (cableType === 'THW-A') {
                        cableSpecText = "กฟน. ไม่รองรับ THW-A";
                    } else {
                        cableSpecText = "N/A";
                    }
                } catch (e) {
                    console.warn("Could not find cable spec for:", authority, meterSize, cableType);
                    cableSpecText = "N/A";
                }

                displayEl.textContent = cableSpecText;
            }


            function buildTaskQuantitiesFromConfig() {
                const quantities = new Map();
                const addQty = (id, val) => quantities.set(id, (quantities.get(id) || 0) + val);

                ['socket', 'light'].forEach(prefix => {
                    const circuitCount = parseInt(document.getElementById(`${prefix}_circuits`).value) || 0;
                    if (circuitCount === 0) return;
                    const installType = document.getElementById(`${prefix}_type`).value;
                    
                    for (let i = 1; i <= circuitCount; i++) {
                        const panelDist = parseFloat(document.getElementById(`${prefix}_circuit_${i}_panel_dist`)?.value) || 0;
                        const pointsInCircuit = parseInt(document.getElementById(`${prefix}_circuit_${i}_points`)?.value) || 0;

                        if(pointsInCircuit <= 0) continue;
                        let interDist = 0;
                        for (let j = 1; j < pointsInCircuit; j++) {
                            interDist += parseFloat(document.getElementById(`${prefix}-${i}_inter_dist_${j}`)?.value) || 0;
                        }
                        const totalWiringDist = panelDist + interDist;
                        const isSocket = prefix === 'socket';

                        if (installType === 'surface_vaf' && isSocket) {
                            addQty('1.3', totalWiringDist);
                            addQty('3.1', pointsInCircuit);
                        } 
                        else if (installType.includes('_pvc') && installType !== 'surface_pvc_trunking') {
                            addQty(isSocket ? '1.1' : '1.2', totalWiringDist);
                            if (installType.includes('concealed')) {
                                addQty('2.3', totalWiringDist);
                            } else {
                                addQty('2.1', totalWiringDist);
                            }
                            const pointTaskId = isSocket ? (installType.includes('concealed') ? '3.2' : '3.1') : '3.3';
                            addQty(pointTaskId, pointsInCircuit);
                        } else if (installType.includes('_emt')) {
                            addQty(isSocket ? '1.1' : '1.2', totalWiringDist);
                            addQty('2.2', totalWiringDist);
                            const pointTaskId = isSocket ? '3.1' : '3.3';
                            addQty(pointTaskId, pointsInCircuit);
                        }
                        else if (installType === 'surface_pvc_trunking') {
                            addQty(isSocket ? '1.1' : '1.2', totalWiringDist);
                            addQty('14.1', totalWiringDist);
                            const pointTaskId = isSocket ? '3.1' : '3.3';
                            addQty(pointTaskId, pointsInCircuit);
                        }
                        
                        if (!installType.includes('vaf')) {
                            if (installType.includes('_pvc') && installType !== 'surface_pvc_trunking') {
                                addQty('13.1', pointsInCircuit * 2); 
                            } else if (installType.includes('_emt')) {
                                addQty('13.2', pointsInCircuit * 2);
                            }
                        }

                        if (!isSocket) {
                            const fixtureType = document.getElementById('fixture_type_1').value;
                            if (fixtureType === 'LED_E27') {
                                addQty('4.1', pointsInCircuit);
                            } else if (fixtureType === 'LED_PANEL') {
                                addQty('15.1', pointsInCircuit);
                            } else if (fixtureType === 'T8_SET') {
                                addQty('15.2', pointsInCircuit);
                            }
                        }
                    }
                });

                const heaterUnits = parseInt(document.getElementById('heater_units').value) || 0;
                if (heaterUnits > 0) {
                    addQty('7.1', heaterUnits);
                    // V6: ลบการคำนวณสายไฟออกจาก Card 7 (ย้ายไป Card 5)
                    // const heaterDist = parseFloat(document.getElementById('heater_distance').value) || 0;
                    // addQty('7.2', heaterDist * heaterUnits);
                }
                const acUnits = parseInt(document.getElementById('ac_units').value) || 0;
                if(acUnits > 0) {
                    addQty('5.1', acUnits);
                    // V6: ลบการคำนวณสายไฟออกจาก Card 7 (ย้ายไป Card 5)
                    // const acDist = parseFloat(document.getElementById('ac_distance').value) || 0;
                    // addQty('5.2', acDist * acUnits);
                }
                
                const pumpUnits = parseInt(document.getElementById('pump_units').value) || 0;
                if (pumpUnits > 0) {
                    addQty('5.3', pumpUnits);
                    const pumpInstallType = document.getElementById('wp_install_type_6').value;
                    if (pumpInstallType === 'vct_clip') {
                        addQty('16.1', 15 * pumpUnits);
                    } else if (pumpInstallType === 'nyy_burial') {
                        addQty('16.2', 15 * pumpUnits);
                        addQty('2.1', 15 * pumpUnits);
                    }
                }
                addQty('5.4', parseInt(document.getElementById('fan_units').value) || 0);
                
                const lanPoints = parseInt(document.getElementById('lan_points').value) || 0;
                if (lanPoints > 0) {
                    addQty('11.1', lanPoints);
                    addQty('11.2', parseFloat(document.getElementById('lan_distance').value) || 0);
                }
                const tvPoints = parseInt(document.getElementById('tv_points').value) || 0;
                if(tvPoints > 0) {
                    addQty('11.3', tvPoints);
                    addQty('11.4', parseFloat(document.getElementById('tv_distance').value) || 0);
                }
                addQty('11.5', parseInt(document.getElementById('cctv_points').value) || 0);

                ['ac_wiring', 'heater_wiring'].forEach(prefix => {
                    const unitCount = parseInt(document.getElementById(`${prefix}_units`)?.value) || 0;
                    if (unitCount === 0) return;
                    
                    const installType = document.getElementById(prefix === 'ac_wiring' ? 'ac_install_type_4' : 'wh_install_type_5').value;

                    for (let i = 1; i <= unitCount; i++) {
                        const panelToBreakerDist = parseFloat(document.getElementById(`${prefix}_${i}_panel_to_breaker_dist`)?.value) || 0;
                        const breakerToUnitDist = parseFloat(document.getElementById(`${prefix}_${i}_breaker_to_unit_dist`)?.value) || 0;
                        const groundDist = parseFloat(document.getElementById(`${prefix}_${i}_panel_to_unit_dist_ground`)?.value) || 0;
                        const breakerEl = document.getElementById(`${prefix}_${i}_breaker`);
                        const breakerAmps = parseInt(breakerEl?.dataset.breakerAmps) || 0;

                        if (breakerAmps === 0) continue;
                        
                        const totalConduitDist = panelToBreakerDist + breakerToUnitDist;
                        
                        if (installType.includes('_pvc') && installType !== 'surface_pvc_trunking') {
                            if (installType.includes('concealed')) {
                                addQty('2.3', totalConduitDist);
                            } else {
                                addQty('2.1', totalConduitDist);
                            }
                            addQty('13.1', 2); 
                        } else if (installType.includes('_emt')) {
                            addQty('2.2', totalConduitDist);
                             addQty('13.2', 2);
                        }
                        else if (installType === 'surface_pvc_trunking') {
                            addQty('14.1', totalConduitDist);
                        }

                        addQty('1.4', totalConduitDist);
                        addQty('1.5', groundDist);
                        addQty('12.1', 1);

                        if (breakerAmps <= 16) addQty('10.1', 1);
                        else if (breakerAmps <= 20) addQty('10.2', 1);
                        else if (breakerAmps <= 32) addQty('10.3', 1);
                    }
                });

                const cuSize = document.getElementById('cu_replacement').value;
                if (cuSize !== 'none') {
                    const taskId = { '4_slot': '9.1', '6_slot': '9.2', '8_slot': '9.3', '10_slot': '9.4', '12_slot': '9.5' }[cuSize];
                    addQty(taskId, 1);
                }
                if (document.getElementById('install_ground').checked){
                     addQty('6.1', 1);
                }
                addQty('10.1', parseInt(document.getElementById('mcb_16a').value) || 0);
                addQty('10.2', parseInt(document.getElementById('mcb_20a').value) || 0);
                addQty('10.3', parseInt(document.getElementById('mcb_32a').value) || 0);

                if (document.getElementById('service_inspection').checked) addQty('8.1', 1);
                if (document.getElementById('service_leak_find').checked) addQty('8.2', 1);
                if (document.getElementById('service_trip_find').checked) addQty('8.3', 1);
                addQty('8.4', parseInt(document.getElementById('service_lamp_replace').value) || 0);

                // V6: แก้ไขตรรกะ "เมนภายนอก"
                const poleHeight = document.getElementById('pole_height_7').value;
                const totalPoles = parseInt(document.getElementById('pole_count_7').value) || 0;
                
                if (totalPoles > 0 && poleHeight !== '0') {
                    if (poleHeight === '6.0') addQty('17.1', totalPoles);
                    else if (poleHeight === '7.0') addQty('17.1-B', totalPoles);
                    else if (poleHeight === '8.0') addQty('17.2', totalPoles);
                    else if (poleHeight === '9.0') addQty('17.3', totalPoles);
                }
                // V6: เพิ่มตรรกะแร็คแบบใหม่
                addQty('17.4-2', parseInt(document.getElementById('rack_2_sets_7').value) || 0);
                addQty('17.4-4', parseInt(document.getElementById('rack_4_sets_7').value) || 0);

                const mainExtDist = parseFloat(document.getElementById('main_ext_dist_7').value) || 0;
                if (mainExtDist > 0) {
                    const meterSize = document.getElementById('meter_size_3').value;
                    const mainType = document.getElementById('main_ext_type_7').value;
                    const authority = document.getElementById('main_authority_7').value;
                    
                    let cableSize = 0;
                    try {
                        cableSize = appData.mainCableSpecs_v5_1[authority][meterSize][mainType];
                    } catch(e) { /* cableSize remains 0 */ }

                    if (cableSize > 0) {
                        const cableTaskId = `17.5`; 
                        addQty(cableTaskId, mainExtDist); 
                    }
                }

                const evToggle = document.getElementById('toggle_ev_charger_visibility').checked;
                if (evToggle) {
                    const evCableDist = parseFloat(document.getElementById('ev_cable_dist_8').value) || 0;
                    if (evCableDist > 0) {
                        addQty('18.1', 1);
                        const evChargerCost = parseFloat(document.getElementById('ev_charger_cost_8').value) || 0;
                        if (evChargerCost > 0) {
                             priceList['M-EV-CHARGER-7KW'] = evChargerCost;
                        } else {
                             priceList['M-EV-CHARGER-7KW'] = initialPriceList['M-EV-CHARGER-7KW'];
                        }
                        if (document.getElementById('ev_install_type_8').value === 'new_meter_tou') {
                            addQty('18.2', 1);
                        }
                    }
                }

                addQty('19.1', parseInt(document.getElementById('demo_lights_9').value) || 0);
                addQty('19.2', parseInt(document.getElementById('demo_outlets_9').value) || 0);
                addQty('19.3', parseInt(document.getElementById('demo_cables_9').value) || 0);
                addQty('19.4', parseInt(document.getElementById('demo_ac_9').value) || 0);
                if (document.getElementById('demo_include_repair_9').checked) {
                    const totalRepairPoints = (parseInt(document.getElementById('demo_lights_9').value) || 0) + (parseInt(document.getElementById('demo_outlets_9').value) || 0);
                    addQty('19.5', totalRepairPoints);
                }

                return quantities;
            }

            // ***** นี่คือฟังก์ชันที่แก้ไขปัญหา *****
            function calculateCosts() {
                const taskQuantities = buildTaskQuantitiesFromConfig();
                const results = { labor: [], material: [], combined: [], purchaseOrder: {} };
                
                const qualityMultiplier = parseFloat(document.getElementById('material_quality').value) || 1.0;
                const wastageFactor = (parseFloat(document.getElementById('wastage_factor').value) || 0) / 100;
                const overheadFactor = (parseFloat(document.getElementById('overhead_factor').value) || 0) / 100;
                const profitFactor = (parseFloat(document.getElementById('profit_factor').value) || 0) / 100;

                let totalMaterialCost = 0;
                let totalLaborCost = 0;

                for (const [taskId, quantity] of taskQuantities.entries()) {
                    const task = allTasks.get(taskId);
                    if (!task || quantity <= 0) continue;

                    // V6: ซ่อน task ที่ถูกย้าย/รวม
                    const isHiddenTask = taskId.startsWith('13.') || taskId === '5.2' || taskId === '7.2';

                    let taskTotalMaterial = 0;
                    task.material_components?.forEach(mat => {
                        if (mat.material_id === 'M-WH-HOSE-FLEX' && document.getElementById('heater_exclude_hoses').checked) {
                            return; 
                        }
                        
                        // ตรรกะเลือกสายเมน
                        if (taskId === '17.5') {
                            const meterSize = document.getElementById('meter_size_3').value;
                            const mainType = document.getElementById('main_ext_type_7').value;
                            const authority = document.getElementById('main_authority_7').value;
                            
                            let cableSize = 0;
                            try {
                                cableSize = appData.mainCableSpecs_v5_1[authority][meterSize][mainType];
                            } catch (e) { /* cableSize remains 0 */ }

                            if (cableSize > 0) {
                                const cableMatId = `M-CABLE-${mainType}-${cableSize}`;
                                
                                if (mat.material_id === cableMatId) {
                                    const matPrice = (priceList[mat.material_id] || 0) * qualityMultiplier;
                                    const matQty = getMaterialQuantity(mat, quantity);
                                    taskTotalMaterial += (matPrice * matQty * 2); // L, N
                                    
                                    // V6: แก้ไข: ใช้ M-WIRE-GND-10SQMM (รหัสวัสดุที่ถูกต้อง)
                                    const gndMatId = `M-WIRE-GND-10SQMM`;
                                    const gndPrice = (priceList[gndMatId] || 0) * qualityMultiplier;
                                    taskTotalMaterial += (gndPrice * matQty); // G

                                    if (!results.purchaseOrder[mat.material_id]) {
                                        results.purchaseOrder[mat.material_id] = { 
                                            description: `สายเมน ${mainType} ${cableSize}mm²`, 
                                            spec: mat.spec, unit: "เมตร", quantity: 0, unit_price: matPrice 
                                        };
                                    }
                                    if (!results.purchaseOrder[gndMatId]) {
                                        results.purchaseOrder[gndMatId] = { 
                                            description: `สายดิน 10mm² (สำหรับเมน)`, 
                                            spec: "THW 10mm²", unit: "เมตร", quantity: 0, unit_price: gndPrice
                                        };
                                    }
                                    results.purchaseOrder[mat.material_id].quantity += (matQty * 2);
                                    results.purchaseOrder[gndMatId].quantity += matQty;
                                }
                            }
                        } 
                        // ตรรกะวัสดุปกติ
                        else {
                            const matPrice = (priceList[mat.material_id] || 0) * qualityMultiplier;
                            const matQty = getMaterialQuantity(mat, quantity);
                            taskTotalMaterial += matPrice * matQty;
                            
                            if (!results.purchaseOrder[mat.material_id]) {
                                results.purchaseOrder[mat.material_id] = { 
                                    description: allItems.get(mat.material_id)?.desc || mat.material_id, 
                                    spec: mat.spec, unit: "หน่วย", quantity: 0, unit_price: matPrice 
                                };
                            }
                            results.purchaseOrder[mat.material_id].quantity += matQty;
                        }
                    });

                    // ตรรกะค่าแรง
                    let taskTotalLabor = 0;
                    task.labor_components?.forEach(lab => {
                         taskTotalLabor += (priceList[lab.labor_id] || 0) * quantity;
                    });

                    // ตรรกะสายดิน (ที่ตอก)
                    const groundDist = parseFloat(document.getElementById('ground_distance').value) || 0;
                    if (taskId === '6.1' && groundDist > 0) {
                        const wireId = "M-WIRE-GND-10SQMM";
                        const wirePrice = (priceList[wireId] || 0) * qualityMultiplier;
                        const wireCost = wirePrice * groundDist;
                        taskTotalMaterial += wireCost;
                        if(results.purchaseOrder[wireId]) {
                            results.purchaseOrder[wireId].quantity += groundDist;
                        } else {
                             results.purchaseOrder[wireId] = { 
                                description: "สายดิน THW 10mm² (ไปหลักดิน)", 
                                spec: "สายดิน THW 10mm² สีเขียว", unit: "เมตร", quantity: groundDist, unit_price: wirePrice 
                            };
                        }
                    }
                    
                    // รวมยอด
                    totalMaterialCost += taskTotalMaterial;
                    totalLaborCost += taskTotalLabor;

                    // เพิ่มเข้า Report (ถ้าไม่ถูกซ่อน)
                    if (!isHiddenTask) {
                         const combinedItem = {
                            id: task.task_id, description: task.task_name, quantity: quantity,
                            unit: task.unit_of_measure, material_unit_cost: 0, labor_unit_cost: 0,
                        };
                        // ป้องกันการหารด้วย 0
                        combinedItem.material_unit_cost = (quantity > 0) ? (taskTotalMaterial / quantity) : 0;
                        combinedItem.labor_unit_cost = (quantity > 0) ? (taskTotalLabor / quantity) : 0;
                        
                        results.labor.push({ ...combinedItem, unit_price: combinedItem.labor_unit_cost, total_price: taskTotalLabor });
                        results.material.push({ ...combinedItem, unit_price: combinedItem.material_unit_cost, total_price: taskTotalMaterial });
                        results.combined.push(combinedItem);
                    }
                }
                
                // === START: (v_job_costing) เพิ่มรายการ Manual เข้าไปใน BOQ และ PO ===

// 1. เพิ่มลิสต์วัสดุ (จาก Job) ไปที่ PO
manualPOItems.forEach(item => {
    results.purchaseOrder[item.id] = {
        description: item.description,
        spec: item.spec,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price
    };
});

// 2. เพิ่มรายการสรุป (จาก Job) ไปที่ BOQ
manualBOQItems.forEach(item => {
    const taskTotalMaterial = (item.material_unit_cost || 0) * (item.quantity || 0);
    const taskTotalLabor = (item.labor_unit_cost || 0) * (item.quantity || 0);

    totalMaterialCost += taskTotalMaterial;
    totalLaborCost += taskTotalLabor;

    const combinedItem = {
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        material_unit_cost: item.material_unit_cost,
        labor_unit_cost: item.labor_unit_cost,
        material_id_code: '' 
    };

    results.labor.push({ ...combinedItem, unit_price: combinedItem.labor_unit_cost, total_price: taskTotalLabor });
    results.material.push({ ...combinedItem, unit_price: combinedItem.material_unit_cost, total_price: taskTotalMaterial });
    results.combined.push(combinedItem);
});
// === END: เพิ่มรายการ Manual ===

// V6: ลบตรรกะแร็คที่เสียหายออก
                // (ส่วนนี้คือส่วนที่ทำให้ v9 พัง และตอนนี้ถูกลบออกแล้ว)
                // (ตรรกะแร็คแบบใหม่ ถูกเพิ่มเป็น Task 17.4-2 และ 17.4-4 จึงถูกคำนวณใน loop ด้านบนแล้ว)

                // ตรรกะตัวคูณจังหวัด/โซน
                const selectedProvince = document.getElementById('province_selector').value;
                let provinceMult;

                if (selectedProvince === 'กรุงเทพมหานคร') {
                    const bkkZone = document.getElementById('bkk_zone_selector').value;
                    provinceMult = appData.bkkZoneMultipliers[bkkZone] || appData.bkkZoneMultipliers['BKK_Zone5_Suburban'];
                } else {
                    provinceMult = appData.provinceMultipliers[selectedProvince] || appData.provinceMultipliers.default;
                }
                
                totalLaborCost *= provinceMult.labor;
                totalMaterialCost *= provinceMult.material;

                // สรุปยอด
                const matWithWastage = totalMaterialCost * (1 + wastageFactor);
                results.totalMaterialCost = matWithWastage;
                results.totalLaborCost = totalLaborCost;

                const subTotal = results.totalMaterialCost + results.totalLaborCost;
                results.overheadAmount = subTotal * overheadFactor;
                const subTotalWithOverhead = subTotal + results.overheadAmount;
                results.profitAmount = subTotalWithOverhead * profitFactor;
                results.grandTotal = subTotalWithOverhead + results.profitAmount;
                
                const minCharge = parseFloat(document.getElementById('min_charge').value) || 0;
                if(results.grandTotal > 0 && results.grandTotal < minCharge) {
                    results.minChargeAdjustment = minCharge - results.grandTotal;
                    results.grandTotal = minCharge;
                } else {
                    results.minChargeAdjustment = 0;
                }
                
                if (document.getElementById('include_vat').checked) {
                    results.vatAmount = results.grandTotal * 0.07;
                } else {
                    results.vatAmount = 0;
                }
                results.totalWithVat = results.grandTotal + results.vatAmount;

                return results;
            }
            function formatCurrency(num) {
                return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }

            // V5.1 (User Req): อัปเดตฟังก์ชันนี้ให้ผูกกับ BKK Zone ด้วย
            function updateRealtimeTotal() {
                const costs = calculateCosts();
                document.getElementById('total-display').textContent = `฿${formatCurrency(costs.totalWithVat)}`;
                document.getElementById('total-display-label').textContent = document.getElementById('include_vat').checked ? 'ยอดรวมสุทธิ (รวม VAT)' : 'ยอดรวมสุทธิ';
                
                // V5.1: อัปเดตการแสดงผลสายเมน (ย้ายมาเรียกที่นี่เพื่อให้ real-time)
                updateMainCableSpecDisplay();
            }
            
            function createSummaryTable(summaryItems) {
                let rows = summaryItems.map(item => `
                    <tr>
                        <td class="px-6 py-2 text-right font-semibold text-slate-700 ${item.isTotal ? 'text-base' : ''}">${item.label}</td>
                        <td class="px-6 py-2 text-right font-bold w-1/3 ${item.isTotal ? 'text-lg text-red-600' : ''}">${formatCurrency(item.value)}</td>
                    </tr>
                `).join('');
                return `<div class="mt-8 flex justify-end"><table class="w-full md:w-2/3 lg:w-1/2 text-sm">${rows}</table></div>`;
            }

            function getProjectInfoHeader() {
                const projectName = document.getElementById('project_name').value || 'ไม่ได้ระบุ';
                const customerName = document.getElementById('customer_name').value || 'ไม่ได้ระบุ';
                const reportDate = new Date(document.getElementById('report_date').value || new Date()).toLocaleDateString('th-TH', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                const citationText = document.getElementById('citation-text').textContent;

                return `
                    <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <!-- V6: อัปเดต Title รายงาน -->
                                <h2 style="font-size: 1.75rem; font-weight: 700; color: #1d4ed8; margin:0;">ใบเสนอราคา</h2>
                                <p style="font-size: 1rem; color: #475569; margin-top: 4px;">'ราคากลาง'งานไฟฟ้าภายในบ้าน1 V6.0</p>
                                 <p style="font-size: 0.65rem; color: #64748b; margin-top: 8px;">(${citationText})</p>
                            </div>
                            <div style="text-align: right; font-size: 0.9rem;">
                                <p><strong style="color: #334155;">โครงการ:</strong> ${projectName}</p>
                                <p><strong style="color: #334155;">ลูกค้า:</strong> ${customerName}</p>
                                <p><strong style="color: #334155;">วันที่:</strong> ${reportDate}</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            function generateReport(costs, type) {
                 const reportGenerators = {
                    'boq-labor': generateLaborBoq,
                    'boq-material': generateMaterialBoq,
                    'boq-combined': generateCombinedBoq,
                    'purchase-order': generatePurchaseOrder
                };
                return reportGenerators[type](costs);
            }
            
            function generateLaborBoq(costs) {
                let tableRows = costs.labor.filter(item => item.total_price > 0).map((item, index) => `
                    <tr class="border-b"><td class="px-2 py-2">${index + 1}</td><td class="px-2 py-2">${item.description}</td><td class="px-2 py-2 text-center">${item.quantity.toFixed(0)}</td><td class="px-2 py-2 text-center">${item.unit}</td><td class="px-2 py-2 text-right">${formatCurrency(item.unit_price)}</td><td class="px-2 py-2 text-right">${formatCurrency(item.total_price)}</td></tr>`
                ).join('');
                const summary = createSummaryTable([ { label: 'รวมค่าแรง (ปรับปรุงแล้ว)', value: costs.totalLaborCost } ]);
                const html = `<h3 class="text-xl font-bold mb-4">BOQ - ค่าแรง</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-center">หน่วย</th><th class="px-2 py-2 text-right">ค่าแรง/หน่วย</th><th class="px-2 py-2 text-right">รวมค่าแรง</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
                return { html, title: 'BOQ - ค่าแรง' };
            }

            function generateMaterialBoq(costs) {
                 let tableRows = costs.material.filter(item => item.total_price > 0).map((item, index) => `
                    <tr class="border-b"><td class="px-2 py-2">${index + 1}</td><td class="px-2 py-2">${item.description}</td><td class="px-2 py-2 text-center">${item.quantity.toFixed(0)}</td><td class="px-2 py-2 text-center">${item.unit}</td><td class="px-2 py-2 text-right">${formatCurrency(item.unit_price)}</td><td class="px-2 py-2 text-right">${formatCurrency(item.total_price)}</td></tr>`
                ).join('');
                const summary = createSummaryTable([ { label: 'รวมค่าวัสดุ (ปรับปรุงแล้ว)', value: costs.totalMaterialCost } ]);
                const html = `<h3 class="text-xl font-bold mb-4">BOQ - ค่าวัสดุ</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-center">หน่วย</th><th class="px-2 py-2 text-right">ค่าวัสดุ/หน่วย</th><th class="px-2 py-2 text-right">รวมค่าวัสดุ</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
                return { html, title: 'BOQ - ค่าวัสดุ' };
            }
            
            function generateCombinedBoq(costs) {
    let tableRows = costs.combined.map((item, index) => {
        const totalUnitPrice = item.material_unit_cost + item.labor_unit_cost;
        const totalRowPrice = totalUnitPrice * item.quantity;
        const materialIdHtml = item.material_id_code
            ? `<br><small class="text-gray-500">(${item.material_id_code})</small>`
            : '';

        return `<tr class="border-b">
                    <td class="px-2 py-2">${index + 1}</td>
                    <td class="px-2 py-2">${item.description}${materialIdHtml}</td>
                    <td class="px-2 py-2 text-center">${(item.quantity).toFixed(0)}</td>
                    <td class="px-2 py-2 text-center">${item.unit}</td>
                    <td class="px-2 py-2 text-right">${formatCurrency(item.material_unit_cost)}</td>
                    <td class="px-2 py-2 text-right">${formatCurrency(item.labor_unit_cost)}</td>
                    <td class="px-2 py-2 text-right font-semibold">${formatCurrency(totalUnitPrice)}</td>
                    <td class="px-2 py-2 text-right font-semibold">${formatCurrency(totalRowPrice)}</td>
                </tr>`;
    }).join('');

    let summaryItems = [
        { label: 'รวมค่าวัสดุ (ปรับปรุงแล้ว)', value: costs.totalMaterialCost },
        { label: 'รวมค่าแรง (ปรับปรุงแล้ว)', value: costs.totalLaborCost },
        { label: `ค่าดำเนินการ (${document.getElementById('overhead_factor').value}%)`, value: costs.overheadAmount },
        { label: `กำไร (${document.getElementById('profit_factor').value}%)`, value: costs.profitAmount },
    ];

    if (costs.minChargeAdjustment > 0) {
        summaryItems.push({ label: 'ค่าบริการขั้นต่ำ (ปรับเพิ่ม)', value: costs.minChargeAdjustment });
    }

    summaryItems.push({ label: 'รวมทั้งสิ้น (ก่อน VAT)', value: costs.grandTotal });
    if (costs.vatAmount > 0) {
        summaryItems.push({ label: 'ภาษีมูลค่าเพิ่ม 7%', value: costs.vatAmount });
    }
    summaryItems.push({ label: 'รวมสุทธิทั้งโครงการ', value: costs.totalWithVat, isTotal: true });

    const summary = createSummaryTable(summaryItems);
    const html = `<h3 class="text-xl font-bold mb-4">BOQ - รวมค่าแรงและวัสดุ</h3>
    <div class="overflow-x-auto"><table class="min-w-full bg-white text-sm">
    <thead><tr class="bg-slate-100">
    <th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รายการ</th>
    <th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-center">หน่วย</th>
    <th class="px-2 py-2 text-right">วัสดุ/หน่วย</th><th class="px-2 py-2 text-right">ค่าแรง/หน่วย</th>
    <th class="px-2 py-2 text-right">รวม/หน่วย</th><th class="px-2 py-2 text-right">ราคารวม</th>
    </tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
    return { html, title: 'BOQ - รวมค่าแรงและวัสดุ' };
}

            function generatePurchaseOrder(costs) {
    let tableRows = Object.keys(costs.purchaseOrder).sort().map((key, index) => {
        const item = costs.purchaseOrder[key];
        if (item.quantity <= 0) return '';
        const itemTotal = item.quantity * item.unit_price;
        return `<tr class="border-b">
                    <td class="px-2 py-2">${index + 1}</td>
                    <td class="px-2 py-2">${key}</td>
                    <td class="px-2 py-2">${item.description}<br><small class="text-gray-500">${item.spec}</small></td>
                    <td class="px-2 py-2 text-center">${Math.ceil(item.quantity)}</td>
                    <td class="px-2 py-2 text-center">${item.unit}</td>
                    <td class="px-2 py-2 text-right">${formatCurrency(item.unit_price)}</td>
                    <td class="px-2 py-2 text-right">${formatCurrency(itemTotal)}</td>
                </tr>`;
    }).join('');
    const totalPO = Object.values(costs.purchaseOrder).reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const summary = createSummaryTable([{ label: 'รวมราคาสินค้า', value: totalPO }]);
    const html = `<h3 class="text-xl font-bold mb-4">ใบสั่งซื้อวัสดุ</h3>
    <div class="overflow-x-auto"><table class="min-w-full bg-white text-sm">
    <thead><tr class="bg-slate-100">
    <th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รหัส</th>
    <th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th>
    <th class="px-2 py-2 text-center">หน่วย</th><th class="px-2 py-2 text-right">ราคา/หน่วย</th>
    <th class="px-2 py-2 text-right">ราคารวม</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
    return { html, title: 'ใบสั่งซื้อวัสดุ' };
}

            function setupReportsAndPrinting() {
                const calculateBtn = document.getElementById('calculate-btn');
                const outputSection = document.getElementById('output-section');
                const reportContent = document.getElementById('report-content');
                const tabButtons = document.querySelectorAll('.tab-btn');
                const printBtn = document.getElementById('print-btn');
                const saveImageBtn = document.getElementById('save-image-btn');
                const savePdfBtn = document.getElementById('save-pdf-btn');
                let activeTab = 'boq-combined';

                function displayReport() {
                    const costs = calculateCosts();
                    const { html, title } = generateReport(costs, activeTab);
                    reportContent.innerHTML = html;
                }

                calculateBtn.addEventListener('click', () => {
                    displayReport();
                    outputSection.classList.remove('hidden');
                    outputSection.scrollIntoView({ behavior: 'smooth' });
                
setupJobCostingListeners();
});

                tabButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        tabButtons.forEach(btn => btn.classList.remove('tab-active'));
                        e.currentTarget.classList.add('tab-active');
                        activeTab = e.currentTarget.dataset.tab;
                        displayReport();
                    });
                });

                function showReportError() {
                    const statusEl = document.getElementById('print-status');
                    statusEl.textContent = 'กรุณากด "คำนวณและสร้างเอกสาร" ก่อน';
                    statusEl.classList.add('text-red-500');
                    setTimeout(() => {
                        statusEl.textContent = '';
                        statusEl.classList.remove('text-red-500');
                    }, 3000);
                }

                printBtn.addEventListener('click', () => {
                    if (outputSection.classList.contains('hidden')) {
                        showReportError();
                        return;
                    }

                    const costs = calculateCosts();
                    const reportTypes = ['boq-combined', 'boq-labor', 'boq-material', 'purchase-order'];
                    let allReportsHTML = '';

                    reportTypes.forEach((type, index) => {
                        const report = generateReport(costs, type);
                        allReportsHTML += report.html;
                        if (index < reportTypes.length - 1) {
                            allReportsHTML += '<div style="page-break-after: always;"></div>';
                        }
                    });

                    const printArea = document.getElementById('print-area');
                    const projectHeader = getProjectInfoHeader();
                    const footer = `<p style="text-align: center; font-size: 10px; margin-top: 2rem; color: #555;">${document.getElementById('citation-text').textContent}</p>`;

                    printArea.innerHTML = projectHeader + allReportsHTML + footer;

                    setTimeout(() => {
                        window.print();
                    }, 100);
                });

                savePdfBtn.addEventListener('click', async () => {
                    if (outputSection.classList.contains('hidden')) {
                        showReportError();
                        return;
                    }
                    
                    const { jsPDF } = window.jspdf;
                    const button = savePdfBtn;
                    const originalContent = button.innerHTML;
                    
                    button.disabled = true;
                    button.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>กำลังสร้าง...`;

                    try {
                        const costs = calculateCosts();
                        const doc = new jsPDF('p', 'mm', 'a4');
                        const reportTypes = ['boq-combined', 'boq-labor', 'boq-material', 'purchase-order'];
                        const imgWidth = 210; // A4 width
                        const pageHeight = 295; // A4 height

                        for (let i = 0; i < reportTypes.length; i++) {
                            const type = reportTypes[i];
                            
                            const renderContainer = document.createElement('div');
                            renderContainer.style.position = 'absolute';
                            renderContainer.style.left = '-9999px';
                            renderContainer.style.width = '1024px';
                            renderContainer.style.padding = '2rem';
                            renderContainer.style.backgroundColor = 'white';

                            const projectHeader = getProjectInfoHeader();
                            const report = generateReport(costs, type);
                            
                            renderContainer.innerHTML = projectHeader + report.html;
                            document.body.appendChild(renderContainer);

                            const canvas = await html2canvas(renderContainer, {
                                scale: 2,
                                useCORS: true,
                                windowWidth: renderContainer.scrollWidth,
                                windowHeight: renderContainer.scrollHeight
                            });

                            document.body.removeChild(renderContainer);

                            if (i > 0) {
                                doc.addPage();
                            }
                            
                            const imgData = canvas.toDataURL('image/png');
                            const imgHeight = canvas.height * imgWidth / canvas.width;
                            let heightLeft = imgHeight;
                            let position = 0;

                            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;

                            while (heightLeft > 0) {
                                position -= pageHeight;
                                doc.addPage();
                                doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                                heightLeft -= pageHeight;
                            }
                        }
                        
                        const projectName = document.getElementById('project_name').value || 'report';
                        const safeFileName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        doc.save(`ใบเสนอราคา-${safeFileName}.pdf`);

                    } catch (error) {
                        console.error("PDF generation failed:", error);
                        // V6: เปลี่ยน alert เป็น #print-status
                        const statusEl = document.getElementById('print-status');
                        statusEl.textContent = 'ขออภัย, เกิดข้อผิดพลาดในการสร้าง PDF';
                        statusEl.classList.add('text-red-500');
                        setTimeout(() => {
                            statusEl.textContent = '';
                            statusEl.classList.remove('text-red-500');
                        }, 3000);
                    } finally {
                        button.disabled = false;
                        button.innerHTML = originalContent;
                    }
                });
                
                saveImageBtn.addEventListener('click', () => {
                     if (outputSection.classList.contains('hidden')) {
                        showReportError();
                        return;
                    }
                    
                    const reportElement = document.getElementById('report-content');
                    const tempContainer = document.createElement('div');
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.left = '-9999px';
                    tempContainer.style.backgroundColor = 'white';
                    tempContainer.style.padding = '2rem';
                    tempContainer.style.width = (reportElement.offsetWidth + 20) + 'px';

                    const projectHeader = getProjectInfoHeader();
                    const clonedReport = reportElement.cloneNode(true);
                    const citation = `<p style="margin-top: 2rem; font-size: 10px; color: #888; text-align: center;">${document.getElementById('citation-text').textContent}</p>`;

                    tempContainer.innerHTML = projectHeader;
                    tempContainer.appendChild(clonedReport);
                    tempContainer.innerHTML += citation;

                    document.body.appendChild(tempContainer);

                    html2canvas(tempContainer, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    }).then(canvas => {
                        const link = document.createElement('a');
                        const { title } = generateReport(calculateCosts(), activeTab);
                        const safeTitle = title.replace(/ /g, '-').replace(/[^\w-]/g, '');
                        link.download = `ราคากลาง-${safeTitle}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                        document.body.removeChild(tempContainer);
                    });
                });
            }

            function resetForm() {
                document.querySelectorAll('input[type="number"], input[type="text"]').forEach(input => {
                    // V6: อัปเดต ID ของแร็ค
                    if (input.id.includes('_distance') || input.id.includes('units') || input.id.includes('points') || input.id.includes('circuits') || input.id === 'pole_count_7' || input.id === 'rack_2_sets_7' || input.id === 'rack_4_sets_7') {
                       input.value = '';
                    }
                });

                document.getElementById('project_name').value = '';
                document.getElementById('customer_name').value = '';

                document.getElementById('min_charge').value = '1000';
                document.getElementById('wastage_factor').value = '0';
                document.getElementById('overhead_factor').value = '0';
                document.getElementById('profit_factor').value = '0';
                // V6: ลบค่า default ของ ac/heater distance (เพราะย้าย Card)
                // document.getElementById('heater_distance').value = '15';
                // document.getElementById('ac_distance').value = '15';
                document.getElementById('report_date').valueAsDate = new Date();

                document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
                
                document.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
                
                document.getElementById('province_selector').value = 'นนทบุรี'; 
                document.getElementById('bkk_zone_container').classList.add('hidden');
                document.getElementById('bkk_zone_selector').selectedIndex = 4;

                document.getElementById('socket_circuits_container').innerHTML = '';
                document.getElementById('light_circuits_container').innerHTML = '';
                document.getElementById('ac_wiring_circuits_container').innerHTML = '';
                document.getElementById('heater_wiring_circuits_container').innerHTML = '';
                
                document.getElementById('output-section').classList.add('hidden');

                document.getElementById('meter_size_3').value = '15(45)';
                document.getElementById('pole_height_7').value = '0';
                document.getElementById('main_ext_dist_7').value = '';
                document.getElementById('main_ext_type_7').value = 'THW';

                document.getElementById('toggle_ev_charger_visibility').checked = false;
                document.getElementById('ev_charger_content_wrapper').classList.add('hidden');
                document.getElementById('ev_cable_dist_8').value = '20';
                document.getElementById('ev_charger_cost_8').value = '35000';

                document.getElementById('demo_lights_9').value = '0';
                document.getElementById('demo_outlets_9').value = '0';
                document.getElementById('demo_cables_9').value = '0';
                document.getElementById('demo_ac_9').value = '0';

                Object.assign(priceList, JSON.parse(JSON.stringify(initialPriceList)));
                populatePriceEditor();

                
// (v_job_costing) reset manual
manualBOQItems = [];
manualPOItems = [];
const mj = document.getElementById('manual-job-name');
if (mj) {
    mj.value = '';
    document.getElementById('manual-job-labor-total').value = '0';
    document.querySelector('#manual-job-materials-table tbody').innerHTML = '';
}
try{document.getElementById('manual-job-qty').value = '1';
document.getElementById('manual-job-unit').value = 'งาน';}catch(e){}
document.getElementById('manual-job-qty').value = '1';
document.getElementById('manual-job-unit').value = 'งาน';
updateRealtimeTotal();
            }

            function populatePriceEditor() {
                const priceEditorBody = document.getElementById('price-editor-body');
                let html = '';
                // V6: ซ่อน task แร็คใหม่ (เพราะราคามาจากวัสดุ) และ task ที่ย้ายไป Card อื่น
                const hiddenTasks = ['17.4-2', '17.4-4', '5.2', '7.2'];
                for (const [id, data] of allItems) {
                   const isHidden = hiddenTasks.some(ht => id === ht);
                   if (!isHidden) {
                       html += `<tr class="border-b"><td class="p-2"><div class="font-medium text-slate-800">${id}</div><div class="text-xs text-slate-500">${data.desc}</div></td><td class="p-2"><input type="number" data-price-id="${id}" value="${priceList[id] || 0}" class="form-input w-24 p-1"></td></tr>`;
                   }
                }
                priceEditorBody.innerHTML = html;
                priceEditorBody.addEventListener('change', (e) => {
                    if (e.target.dataset.priceId) {
                        priceList[e.target.dataset.priceId] = parseFloat(e.target.value) || 0;
                        updateRealtimeTotal();
                    }
                });
            }

            function handleProvinceChange() {
                const province = document.getElementById('province_selector').value;
                const bkkZoneContainer = document.getElementById('bkk_zone_container');
                if (province === 'กรุงเทพมหานคร') {
                    bkkZoneContainer.classList.remove('hidden');
                } else {
                    bkkZoneContainer.classList.add('hidden');
                }
                updateRealtimeTotal(); 
            }

            function handleEVToggle() {
                const isChecked = document.getElementById('toggle_ev_charger_visibility').checked;
                const contentWrapper = document.getElementById('ev_charger_content_wrapper');
                
                if (isChecked) {
                    contentWrapper.classList.remove('hidden');
                } else {
                    contentWrapper.classList.add('hidden');
                    document.getElementById('ev_cable_dist_8').value = '0';
                    document.getElementById('ev_charger_cost_8').value = '0';
                    updateRealtimeTotal();
                }
            }

            // V6 (Bug Fix): สร้าง Custom Modal สำหรับ Reset
            function createResetModal() {
                const modalHTML = `
                    <div id="reset-modal" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 hidden">
                        <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                            <h3 class="text-lg font-bold text-gray-900">ยืนยันการรีเซ็ต</h3>
                            <p class="text-sm text-gray-600 mt-2">คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดในฟอร์มและรีเซ็ตราคา?</p>
                            <div class="mt-6 flex justify-end space-x-3">
                                <button id="cancel-reset" class="btn bg-gray-200 text-gray-800 hover:bg-gray-300">ยกเลิก</button>
                                <button id="confirm-reset" class="btn bg-red-600 text-white hover:bg-red-700">ยืนยันการรีเซ็ต</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);

                const modal = document.getElementById('reset-modal');
                const cancelBtn = document.getElementById('cancel-reset');
                const confirmBtn = document.getElementById('confirm-reset');

                document.getElementById('reset-btn').addEventListener('click', () => {
                    modal.classList.remove('hidden');
                });
                cancelBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
                confirmBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                    resetForm(); // เรียกฟังก์ชันรีเซ็ตจริง
                });
            }

            function initApp() {
                const provinceSelector = document.getElementById('province_selector');
                
                provinceSelector.add(new Option('กรุงเทพมหานคร', 'กรุงเทพมหานคร')); 
                
                appData.provinces.forEach(p => {
                    const option = new Option(p, p);
                    provinceSelector.add(option);
                });
                
                document.getElementById('report_date').valueAsDate = new Date();

                document.querySelectorAll('input, select').forEach(input => {
                    if (input.id.includes('_circuit_') || input.id.includes('_inter_dist_') || input.id.includes('_unit_size') || input.id.includes('_panel_to_')) return;
                    
                    if (input.id === 'province_selector') {
                        input.addEventListener('change', handleProvinceChange);
                    } else if (input.id === 'bkk_zone_selector' || input.id === 'meter_size_3' || input.id === 'main_ext_type_7') {
                         input.addEventListener('change', updateRealtimeTotal);
                    } else if (input.id === 'toggle_ev_charger_visibility') {
                        input.addEventListener('change', handleEVToggle);
                    } else if (input.type === 'checkbox' || input.tagName === 'SELECT') {
                         input.addEventListener('change', updateRealtimeTotal);
                    } else {
                         input.addEventListener('input', updateRealtimeTotal);
                    }
                });
                
                populatePriceEditor();
                
// (v_job_costing) reset manual
manualBOQItems = [];
manualPOItems = [];
const mj = document.getElementById('manual-job-name');
if (mj) {
    mj.value = '';
    document.getElementById('manual-job-labor-total').value = '0';
    document.querySelector('#manual-job-materials-table tbody').innerHTML = '';
}
setupReportsAndPrinting();
                
                // V6 (Bug Fix): เรียกใช้ Modal แทนการผูก click โดยตรง
                createResetModal(); 
                
                resetForm(); 
            }

            initApp();
        });
    
document.addEventListener('input', (e) => {
    if (!e.target.classList.contains('dist-part-input')) return;

    document.querySelectorAll('.circuit-container').forEach(container => {
        const panelToSwitch = parseFloat(container.querySelector('[id*="dist_panel_to_switch"]')?.value) || 0;
        const switchToLight = parseFloat(container.querySelector('[id*="dist_switch_to_light"]')?.value) || 0;

        const total = panelToSwitch + switchToLight;

        const hiddenDistField = container.querySelector('.dist-input');
        if (hiddenDistField) hiddenDistField.value = total;
    });

    updateRealtimeTotal();
});


})();
