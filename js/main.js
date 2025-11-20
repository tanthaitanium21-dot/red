






const provinceRates = {
  "STANDARD": { labor: 1.0, material: 1.0 }
};

function renderProvinceOptions() {
  const sel = document.getElementById("provinceSelect");
  if (!sel) return;
  sel.innerHTML = '<option value="STANDARD">มาตรฐาน (ไม่เพิ่ม/ลดราคา)</option>';
}

// Ensure it's called after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  renderProvinceOptions();
});



document.querySelectorAll('.accordion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const content = btn.nextElementSibling;
    content.classList.toggle('hidden');
    btn.querySelector('.arrow').classList.toggle('rotate-180');
  });
});



    // === START: โค้ด JavaScript (อัปเดตตรรกะค่าแรง) ===
    document.addEventListener('DOMContentLoaded', () => {
        // === START: ข้อมูลหลังบ้าน ===
        
        // === END: ข้อมูลหลังบ้าน ===


        const initialPriceList = JSON.parse(JSON.stringify(appData.priceList));
        const priceList = appData.priceList;
        const electricalData = appData.electrical_installation_data;

        // สร้าง Map ของ Task และ Item ทั้งหมด
        const allTasks = new Map();
        const allItems = new Map();
        electricalData.forEach(c => {
            c.tasks.forEach(t => {
                allTasks.set(t.task_id, t);
                t.labor_components?.forEach(l => {
                    allItems.set(l.labor_id, { desc: `ค่าแรง: ${t.task_name}` });
                });
                t.material_components?.forEach(m => {
                    // อัปเดต: แยก Spec สำหรับสายไฟ
                    if (m.material_id.startsWith('M-CABLE-')) {
                        allItems.set(m.material_id, { desc: `วัสดุ: สายเมน ${m.material_id.replace('M-CABLE-', '').replace('-', ' ')}` });
                    } else {
                        allItems.set(m.material_id, { desc: `วัสดุ: ${t.task_name}` });
                    }
                });
            });
        });

        // อัปเดต: เพิ่มคำอธิบายสำหรับค่าแรงเดินสายเมน
        allItems.forEach((value, id) => {
            if (id.startsWith('L-MAIN-')) {
                const parts = id.replace('L-MAIN-', '').split('-');
                const type = parts[0];
                const size = parts[1];
                allItems.set(id, { desc: `ค่าแรง: เดินสาย ${type} ${size}mm²` });
            }
        });


        // === START: ส่วนคำนวณ (อัปเดตตรรกะค่าแรง) ===

        // === FIX: เพิ่มฟังก์ชัน getMaterialQuantity ที่ขาดหายไป ===
        // (ฟังก์ชันนี้จำเป็นสำหรับคำนวณ เสา และ แร็ค)
        function getMaterialQuantity(material, taskQuantity) {
            const logic = material.usage_logic;
            if (taskQuantity <= 0) return 0;
            
            // ในเวอร์ชันนี้, เสาและแร็คไม่มี usage_logic
            // จึงคืนค่า quantity (จำนวนต้น/ชุด) กลับไป
            if (!logic) {
                return taskQuantity;
            }
            
            // (ใส่ไว้เผื่ออนาคต ถ้ามี logic ซับซ้อน)
            // ปัจจุบัน, logic นี้จะไม่ถูกเรียก
            let qty = taskQuantity; 
            return Math.ceil(qty);
        }

        function buildTaskQuantitiesFromConfig() {
            const quantities = new Map();
            const addQty = (id, val) => quantities.set(id, (quantities.get(id) || 0) + val);

            // --- START: Main External Wiring ---
            const poleHeight = document.getElementById('pole_height_7').value;
            const totalPoles = parseInt(document.getElementById('pole_count_7').value) || 0;
            if (totalPoles > 0 && poleHeight !== '0') {
                if (poleHeight === '6.0') addQty('17.1', totalPoles);
                else if (poleHeight === '7.0') addQty('17.1-B', totalPoles);
                else if (poleHeight === '8.0') addQty('17.2', totalPoles);
                else if (poleHeight === '9.0') addQty('17.3', totalPoles);
            }
            
            // อัปเดต: ใช้ ID ของแร็ค 1 ชุด
            addQty('17.4-2', parseInt(document.getElementById('rack_2_sets_7').value) || 0);
            addQty('17.4-1', parseInt(document.getElementById('rack_1_set_7').value) || 0);

            const mainExtDist = parseFloat(document.getElementById('main_ext_dist_7').value) || 0;
            if (mainExtDist > 0) {
                // แค่เพิ่ม Task 17.5 (ระยะทาง)
                // การเลือกสายไฟจะถูกจัดการใน calculateCosts
                
                // === อัปเดต: ส่ง (ระยะทาง x 2) เข้าไปคำนวณเลย ===
                addQty('17.5', mainExtDist * 2); 
            }
            // --- END: Main External Wiring ---
            
            // (ลบ Task อื่นๆ ออก)

            return quantities;
        }

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

                // : ซ่อน task ที่ถูกย้าย/รวม (ถ้ามี)
                const isHiddenTask = false; // (ตอนนี้ไม่มี)

                let taskTotalMaterial = 0;
                let taskTotalLabor = 0;

                // ตรรกะพิเศษสำหรับ Task 17.5 (สายเมน)
                if (taskId === '17.5') {
                    const mainType = document.getElementById('main_ext_type_7').value;
                    const cableSize = document.getElementById('main_ext_size_7').value;
                    
                    if (mainType && cableSize) {
                        const cableMatId = `M-CABLE-${mainType}-${cableSize}`; 
                        const matPrice = (priceList[cableMatId] || 0) * qualityMultiplier;
                        
                        // === อัปเดต: quantity ตอนนี้คือ (ระยะทาง x 2) แล้ว ===
                        const matQty = quantity; // quantity ตอนนี้คือ (เช่น 20)

                        // === อัปเดต: ลบการคูณ 2 ที่ซ้ำซ้อนออก ===
                        taskTotalMaterial = (matPrice * matQty); // (เช่น 45 * 20)
                        
                        // === อัปเดต: ส่งรหัสวัสดุไปที่ BOQ ===
                        task.calculated_material_id = cableMatId;

                        if (!results.purchaseOrder[cableMatId]) {
                            const spec = allItems.get(cableMatId)?.desc || `สาย ${mainType} ${cableSize}mm²`;
                            results.purchaseOrder[cableMatId] = {
                                description: `สายเมน ${mainType} ${cableSize}mm²`,
                                spec: spec,
                                unit: "เมตร",
                                quantity: 0,
                                unit_price: matPrice
                            };
                        }
                        // === อัปเดต: ลบการคูณ 2 ที่ซ้ำซ้อนออก ===
                        results.purchaseOrder[cableMatId].quantity += matQty; // (เพิ่ม 20)
                    }
                } else {
                    // === ตรรกะเดิมสำหรับ Task อื่น (เสา, แร็ค) ===
                    task.material_components?.forEach(mat => {
                        const matPrice = (priceList[mat.material_id] || 0) * qualityMultiplier;
                        const matQty = getMaterialQuantity(mat, quantity);
                        taskTotalMaterial += matPrice * matQty;

                        if (!results.purchaseOrder[mat.material_id]) {
                            results.purchaseOrder[mat.material_id] = {
                                description: allItems.get(mat.material_id)?.desc || mat.material_id,
                                spec: mat.spec, unit: task.unit_of_measure, quantity: 0, unit_price: matPrice
                            };
                        }
                        results.purchaseOrder[mat.material_id].quantity += matQty;
                    });
                }

                // --- ตรรกะค่าแรง ---
                if (taskId === '17.5') {
                    // (ตรรกะใหม่: ดึงค่าแรงที่แยกตามขนาดสาย)
                    const mainType = document.getElementById('main_ext_type_7').value;
                    const cableSize = document.getElementById('main_ext_size_7').value;
                    const laborCodeId = `L-MAIN-${mainType}-${cableSize}`;
                    
                    const laborPricePerMeter = priceList[laborCodeId] || 0;
                    
                    // === อัปเดต: quantity ตอนนี้คือ (ระยะทาง x 2) แล้ว ===
                    const laborQty = quantity; // quantity is distance (e.g. 20)
                    
                    // === อัปเดต: ลบการคูณ 2 ที่ซ้ำซ้อนออก ===
                    taskTotalLabor = laborPricePerMeter * laborQty; // (เช่น 15 * 20)
                    
                    // อัปเดตชื่อ Task ใน BOQ แบบ Dynamic
                    if (laborPricePerMeter > 0) {
                         // === อัปเดต: ปรับชื่อ Task ให้กระชับขึ้น ===
                         task.task_name = `เดินสายเมน ${mainType} ${cableSize}mm² (L, N)`;
                    } else {
                        task.task_name = `เดินสายเมน ${mainType} ${cableSize}mm² (L, N) (ไม่คิดค่าแรง)`;
                    }

                } else {
                    // ตรรกะค่าแรงเดิมสำหรับ (เสา, แร็ค)
                    task.labor_components?.forEach(lab => {
                        taskTotalLabor += (priceList[lab.labor_id] || 0) * quantity;
                    });
                }
                
                // --- สรุปยอด ---
                totalMaterialCost += taskTotalMaterial;
                totalLaborCost += taskTotalLabor;

                // เพิ่มเข้า Report
                if (!isHiddenTask) {
                    const combinedItem = {
                        id: task.task_id, description: task.task_name, quantity: quantity,
                        unit: task.unit_of_measure, material_unit_cost: 0, labor_unit_cost: 0,
                        // === อัปเดต: เพิ่ม material_id ใน item ที่จะส่งไป BOQ ===
                        material_id: task.calculated_material_id || null
                    };
                    // รีเซ็ต calculated_material_id เพื่อไม่ให้กระทบแถวอื่น
                    task.calculated_material_id = null; 
                    
                    combinedItem.material_unit_cost = (quantity > 0) ? (taskTotalMaterial / quantity) : 0;
                    combinedItem.labor_unit_cost = (quantity > 0) ? (taskTotalLabor / quantity) : 0;
                    
                    results.labor.push({ ...combinedItem, unit_price: combinedItem.labor_unit_cost, total_price: taskTotalLabor });
                    results.material.push({ ...combinedItem, unit_price: combinedItem.material_unit_cost, total_price: taskTotalMaterial });
                    results.combined.push(combinedItem);
                }
            }

            // ตรรกะตัวคูณ (ตอนนี้ไม่มีจังหวัด เลยใช้ 1.0)
            const provinceMult = { labor: 1.0, material: 1.0 };
            
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
            if (results.grandTotal > 0 && results.grandTotal < minCharge) {
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
        // === END: ส่วนคำนวณ ===


        function formatCurrency(num) {
            return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function updateRealtimeTotal() {
            const costs = calculateCosts();
            document.getElementById('total-display').textContent = `฿${formatCurrency(costs.totalWithVat)}`;
            document.getElementById('total-display-label').textContent = document.getElementById('include_vat').checked ? 'ยอดรวมสุทธิ (รวม VAT)' : 'ยอดรวมสุทธิ';
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
                            <h2 style="font-size: 1.75rem; font-weight: 700; color: #1d4ed8; margin:0;">ใบเสนอราคา</h2>
                            <p style="font-size: 1rem; color: #475569; margin-top: 4px;">'ราคากลาง'งานไฟฟ้าภายนอก</p>
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
                <tr class="border-b"><td class="px-2 py-2">${index + 1}</td><td class="px-2 py-2">${item.description}</td><td class="px-2 py-2 text-center">${(item.quantity).toFixed(0)}</td><td class="px-2 py-2 text-center">${item.unit}</td><td class="px-2 py-2 text-right">${formatCurrency(item.unit_price)}</td><td class="px-2 py-2 text-right">${formatCurrency(item.total_price)}</td></tr>`
            ).join('');
            const summary = createSummaryTable([ { label: 'รวมค่าแรง (ปรับปรุงแล้ว)', value: costs.totalLaborCost } ]);
            const html = `<h3 class="text-xl font-bold mb-4">BOQ - ค่าแรง</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-center">หน่วย</th><th class="px-2 py-2 text-right">ค่าแรง/หน่วย</th><th class="px-2 py-2 text-right">รวมค่าแรง</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
            return { html, title: 'BOQ - ค่าแรง' };
        }

        function generateMaterialBoq(costs) {
            let tableRows = costs.material.filter(item => item.total_price > 0).map((item, index) => `
                <tr class="border-b"><td class="px-2 py-2">${index + 1}</td><td class="px-2 py-2">${item.description}</td><td class="px-2 py-2 text-center">${(item.quantity).toFixed(0)}</td><td class="px-2 py-2 text-center">${item.unit}</td><td class="px-2 py-2 text-right">${formatCurrency(item.unit_price)}</td><td class="px-2 py-2 text-right">${formatCurrency(item.total_price)}</td></tr>`
            ).join('');
            const summary = createSummaryTable([ { label: 'รวมค่าวัสดุ (ปรับปรุงแล้ว)', value: costs.totalMaterialCost } ]);
            const html = `<h3 class="text-xl font-bold mb-4">BOQ - ค่าวัสดุ</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-center">หน่วย</th><th class="px-2 py-2 text-right">ค่าวัสดุ/หน่วย</th><th class="px-2 py-2 text-right">รวมค่าวัสดุ</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
            return { html, title: 'BOQ - ค่าวัสดุ' };
        }

        function generateCombinedBoq(costs) {
            let tableRows = costs.combined.map((item, index) => {
                const totalUnitPrice = item.material_unit_cost + item.labor_unit_cost;
                const totalRowPrice = totalUnitPrice * item.quantity;
                
                // === อัปเดต: สร้าง Tag รหัสวัสดุสำหรับ BOQ ===
                const materialIdTag = item.material_id 
                    ? `<span class="block text-xs text-slate-500 font-mono">${item.material_id}</span>` 
                    : '';
                
                return `<tr class="border-b">
                            <td class="px-2 py-2">${index + 1}</td>
                            <!-- อัปเดต: เพิ่ม materialIdTag ในคอลัมน์รายการ -->
                            <td class="px-2 py-2">${item.description}${materialIdTag}</td>
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
            const html = `<h3 class="text-xl font-bold mb-4">BOQ - รวมค่าแรงและวัสดุ</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-center">หน่วย</th><th class="px-2 py-2 text-right">วัสดุ/หน่วย</th><th class="px-2 py-2 text-right">ค่าแรง/หน่วย</th><th class="px-2 py-2 text-right">รวม/หน่วย</th><th class="px-2 py-2 text-right">ราคารวม</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
            return { html, title: 'BOQ - รวมค่าแรงและวัสดุ' };
        }

        function generatePurchaseOrder(costs) {
            let tableRows = Object.keys(costs.purchaseOrder).sort().map((key, index) => {
                const item = costs.purchaseOrder[key];
                if (item.quantity <= 0) return '';
                const itemTotal = item.quantity * item.unit_price;
                return `<tr class="border-b"><td class="px-2 py-2">${index + 1}</td><td class="px-2 py-2">${key}</td><td class="px-2 py-2">${item.description}<br><small class="text-gray-500">${item.spec}</small></td><td class="px-2 py-2 text-center">${Math.ceil(item.quantity)}</td><td class="px-2 py-2 text-right">${formatCurrency(item.unit_price)}</td><td class="px-2 py-2 text-right">${formatCurrency(itemTotal)}</td></tr>`;
            }).join('');
            const totalPO = Object.values(costs.purchaseOrder).reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            const summary = createSummaryTable([{ label: 'รวมราคาสินค้า', value: totalPO }]);
            const html = `<h3 class="text-xl font-bold mb-4">ใบสั่งซื้อวัสดุ</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รหัส</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-right">ราคา/หน่วย</th><th class="px-2 py-2 text-right">ราคารวม</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
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
                // (ลบ ID ที่ไม่ได้ใช้ออก)
                if (input.id.includes('_dist') || input.id === 'pole_count_7' || input.id === 'rack_2_sets_7' || input.id === 'rack_1_set_7') {
                    input.value = '';
                }
            });

            document.getElementById('project_name').value = '';
            document.getElementById('customer_name').value = '';

            document.getElementById('min_charge').value = '1000';
            document.getElementById('wastage_factor').value = '0';
            document.getElementById('overhead_factor').value = '0';
            document.getElementById('profit_factor').value = '0';
            document.getElementById('report_date').valueAsDate = new Date();

            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
            
            document.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
            
            document.getElementById('output-section').classList.add('hidden');

            document.getElementById('pole_height_7').value = '0';
            document.getElementById('main_ext_dist_7').value = '';
            document.getElementById('main_ext_type_7').value = 'THW';
            document.getElementById('main_ext_size_7').value = '10';

            Object.assign(priceList, JSON.parse(JSON.stringify(initialPriceList)));
            populatePriceEditor();

            updateRealtimeTotal();
        }

        // อัปเดต: ให้ดึงจาก priceList โดยตรง
        function populatePriceEditor() {
            const priceEditorBody = document.getElementById('price-editor-body');
            let html = '';
            
            const sortedKeys = Object.keys(priceList).sort((a, b) => {
                // จัดกลุ่ม L- (ค่าแรง) มาก่อน M- (วัสดุ)
                if (a.startsWith('L-') && b.startsWith('M-')) return -1;
                if (a.startsWith('M-') && b.startsWith('L-')) return 1;
                return a.localeCompare(b); // เรียงตามตัวอักษรภายในกลุ่ม
            });

            for (const id of sortedKeys) {
                const data = allItems.get(id);
                const desc = data ? data.desc : `(ไม่พบ ${id} ใน allItems)`; // ป้องกัน Error
                
                html += `<tr class="border-b">
                            <td class="p-2">
                                <div class="font-medium text-slate-800">${id}</div>
                                <div class="text-xs text-slate-500">${desc}</div>
                            </td>
                            <td class="p-2">
                                <input type="number" data-price-id="${id}" value="${priceList[id] || 0}" class="form-input w-24 p-1">
                            </td>
                         </tr>`;
            }

            priceEditorBody.innerHTML = html;
            priceEditorBody.addEventListener('change', (e) => {
                if (e.target.dataset.priceId) {
                    priceList[e.target.dataset.priceId] = parseFloat(e.target.value) || 0;
                    updateRealtimeTotal();
                }
            });
        }

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
            document.getElementById('report_date').valueAsDate = new Date();

            // ผูก Event Listener กับ Input ทั้งหมด
            document.querySelectorAll('input, select').forEach(input => {
                if (input.type === 'checkbox' || input.tagName === 'SELECT') {
                    input.addEventListener('change', updateRealtimeTotal);
                } else {
                    input.addEventListener('input', updateRealtimeTotal);
                }
            });

            populatePriceEditor();
            setupReportsAndPrinting();
            createResetModal();
            resetForm();
        }

        // เริ่มแอป
        initApp();
    });
    // === END: โค้ด JavaScript ===



        document.addEventListener('DOMContentLoaded', () => {
            
            
            const initialPriceList = JSON.parse(JSON.stringify(appData.priceList));
            const priceList = appData.priceList;
            const electricalData = appData.electrical_installation_data;

            const allTasks = new Map();
            const allItems = new Map();
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
                    // : ลบการคำนวณสายไฟออกจาก Card 7 (ย้ายไป Card 5)
                    // const heaterDist = parseFloat(document.getElementById('heater_distance').value) || 0;
                    // addQty('7.2', heaterDist * heaterUnits);
                }
                const acUnits = parseInt(document.getElementById('ac_units').value) || 0;
                if(acUnits > 0) {
                    addQty('5.1', acUnits);
                    // : ลบการคำนวณสายไฟออกจาก Card 7 (ย้ายไป Card 5)
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

                // : แก้ไขตรรกะ "เมนภายนอก"
                const poleHeight = document.getElementById('pole_height_7').value;
                const totalPoles = parseInt(document.getElementById('pole_count_7').value) || 0;
                
                if (totalPoles > 0 && poleHeight !== '0') {
                    if (poleHeight === '6.0') addQty('17.1', totalPoles);
                    else if (poleHeight === '7.0') addQty('17.1-B', totalPoles);
                    else if (poleHeight === '8.0') addQty('17.2', totalPoles);
                    else if (poleHeight === '9.0') addQty('17.3', totalPoles);
                }
                // : เพิ่มตรรกะแร็คแบบใหม่
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

                    // : ซ่อน task ที่ถูกย้าย/รวม
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
                                    
                                    // : แก้ไข: ใช้ M-WIRE-GND-10SQMM (รหัสวัสดุที่ถูกต้อง)
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
                        
                        
// duplicate L/N for Task 17.5 cable items
if (combinedItem.task_id === '17.5' && String(combinedItem.material_id).startsWith('M-CABLE')) {
    // Labor - duplicate L and N rows
    const laborL = { ...combinedItem, description: (combinedItem.description || '') + ' (L)', unit_price: combinedItem.labor_unit_cost, total_price: combinedItem.labor_unit_cost * combinedItem.quantity };
    const laborN = { ...combinedItem, description: (combinedItem.description || '') + ' (N)', unit_price: combinedItem.labor_unit_cost, total_price: combinedItem.labor_unit_cost * combinedItem.quantity };
    results.labor.push(laborL);
    results.labor.push(laborN);

    // Material - duplicate L and N rows
    const matL = { ...combinedItem, description: (combinedItem.description || '') + ' (L)', unit_price: combinedItem.material_unit_cost, total_price: combinedItem.material_unit_cost * combinedItem.quantity };
    const matN = { ...combinedItem, description: (combinedItem.description || '') + ' (N)', unit_price: combinedItem.material_unit_cost, total_price: combinedItem.material_unit_cost * combinedItem.quantity };
    results.material.push(matL);
    results.material.push(matN);

    // push combined item as-is for backward compatibility (if needed)
    results.combined.push(combinedItem);
} else {
    results.labor.push({ ...combinedItem, unit_price: combinedItem.labor_unit_cost, total_price: taskTotalLabor });
    results.material.push({ ...combinedItem, unit_price: combinedItem.material_unit_cost, total_price: taskTotalMaterial });
    results.combined.push(combinedItem);
}

                    }
                }
                
                // : ลบตรรกะแร็คที่เสียหายออก
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
                                <!-- : อัปเดต Title รายงาน -->
                                <h2 style="font-size: 1.75rem; font-weight: 700; color: #1d4ed8; margin:0;">ใบเสนอราคา</h2>
                                <p style="font-size: 1rem; color: #475569; margin-top: 4px;">'ราคากลาง'งานไฟฟ้าภายในบ้าน1 </p>
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
                    <tr class="border-b"><td class="px-2 py-2">${index + 1}</td><td class="px-2 py-2">${item.description}</td><td class="px-2 py-2 text-center">${(item.quantity*2).toFixed(0)}</td><td class="px-2 py-2 text-center">${item.unit}</td><td class="px-2 py-2 text-right">${formatCurrency(item.unit_price)}</td><td class="px-2 py-2 text-right">${formatCurrency(item.total_price)}</td></tr>`
                ).join('');
                const summary = createSummaryTable([ { label: 'รวมค่าแรง (ปรับปรุงแล้ว)', value: costs.totalLaborCost } ]);
                const html = `<h3 class="text-xl font-bold mb-4">BOQ - ค่าแรง</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-center">หน่วย</th><th class="px-2 py-2 text-right">ค่าแรง/หน่วย</th><th class="px-2 py-2 text-right">รวมค่าแรง</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
                return { html, title: 'BOQ - ค่าแรง' };
            }

            function generateMaterialBoq(costs) {
                 let tableRows = costs.material.filter(item => item.total_price > 0).map((item, index) => `
                    <tr class="border-b"><td class="px-2 py-2">${index + 1}</td><td class="px-2 py-2">${item.description}</td><td class="px-2 py-2 text-center">${(item.quantity*2).toFixed(0)}</td><td class="px-2 py-2 text-center">${item.unit}</td><td class="px-2 py-2 text-right">${formatCurrency(item.unit_price)}</td><td class="px-2 py-2 text-right">${formatCurrency(item.total_price)}</td></tr>`
                ).join('');
                const summary = createSummaryTable([ { label: 'รวมค่าวัสดุ (ปรับปรุงแล้ว)', value: costs.totalMaterialCost } ]);
                const html = `<h3 class="text-xl font-bold mb-4">BOQ - ค่าวัสดุ</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-center">หน่วย</th><th class="px-2 py-2 text-right">ค่าวัสดุ/หน่วย</th><th class="px-2 py-2 text-right">รวมค่าวัสดุ</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
                return { html, title: 'BOQ - ค่าวัสดุ' };
            }
            
            function generateCombinedBoq(costs) {
                let tableRows = costs.combined.map((item, index) => {
                    const totalUnitPrice = item.material_unit_cost + item.labor_unit_cost;
                    const totalRowPrice = totalUnitPrice * item.quantity;
                    return `<tr class="border-b"><td class="px-2 py-2">${index + 1}</td><td class="px-2 py-2">${item.description}</td><td class="px-2 py-2 text-center">${(item.quantity*2).toFixed(0)}</td><td class="px-2 py-2 text-center">${item.unit}</td><td class="px-2 py-2 text-right">${formatCurrency(item.material_unit_cost)}</td><td class="px-2 py-2 text-right">${formatCurrency(item.labor_unit_cost)}</td><td class="px-2 py-2 text-right font-semibold">${formatCurrency(totalUnitPrice)}</td><td class="px-2 py-2 text-right font-semibold">${formatCurrency(totalRowPrice)}</td></tr>`;
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
                const html = `<h3 class="text-xl font-bold mb-4">BOQ - รวมค่าแรงและวัสดุ</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-center">หน่วย</th><th class="px-2 py-2 text-right">วัสดุ/หน่วย</th><th class="px-2 py-2 text-right">ค่าแรง/หน่วย</th><th class="px-2 py-2 text-right">รวม/หน่วย</th><th class="px-2 py-2 text-right">ราคารวม</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
                return { html, title: 'BOQ - รวมค่าแรงและวัสดุ' };
            }

            function generatePurchaseOrder(costs) {
                 let tableRows = Object.keys(costs.purchaseOrder).sort().filter(key => key !== 'M-WIRE-GND-10SQMM').map((key, index) => {
                    const item = costs.purchaseOrder[key];
                    if (item.quantity <= 0) return '';
                    const itemTotal = item.quantity * item.unit_price;
                    return `<tr class="border-b"><td class="px-2 py-2">${index + 1}</td><td class="px-2 py-2">${key}</td><td class="px-2 py-2">${item.description}<br><small class="text-gray-500">${item.spec}</small></td><td class="px-2 py-2 text-center">${Math.ceil(item.quantity)}</td><td class="px-2 py-2 text-right">${formatCurrency(item.unit_price)}</td><td class="px-2 py-2 text-right">${formatCurrency(itemTotal)}</td></tr>`;
                }).join('');
                const totalPO = Object.values(costs.purchaseOrder).reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
                const summary = createSummaryTable([{ label: 'รวมราคาสินค้า', value: totalPO }]);
                 const html = `<h3 class="text-xl font-bold mb-4">ใบสั่งซื้อวัสดุ</h3><div class="overflow-x-auto"><table class="min-w-full bg-white text-sm"><thead><tr class="bg-slate-100"><th class="px-2 py-2 text-left">ลำดับ</th><th class="px-2 py-2 text-left">รหัส</th><th class="px-2 py-2 text-left">รายการ</th><th class="px-2 py-2 text-center">จำนวน</th><th class="px-2 py-2 text-right">ราคา/หน่วย</th><th class="px-2 py-2 text-right">ราคารวม</th></tr></thead><tbody>${tableRows}</tbody></table></div>${summary}`;
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
                        // : เปลี่ยน alert เป็น #print-status
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
                    // : อัปเดต ID ของแร็ค
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
                // : ลบค่า default ของ ac/heater distance (เพราะย้าย Card)
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

                updateRealtimeTotal();
            }

            function populatePriceEditor() {
                const priceEditorBody = document.getElementById('price-editor-body');
                let html = '';
                // : ซ่อน task แร็คใหม่ (เพราะราคามาจากวัสดุ) และ task ที่ย้ายไป Card อื่น
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

            //  (Bug Fix): สร้าง Custom Modal สำหรับ Reset
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
                setupReportsAndPrinting();
                
                //  (Bug Fix): เรียกใช้ Modal แทนการผูก click โดยตรง
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
window.initApp = initApp;

