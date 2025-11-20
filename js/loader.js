export async function loadDataJSON() {
  try {
    const res = await fetch('./data.json', {cache: 'no-store'});
    if (!res.ok) throw new Error('data.json not found');
    return await res.json();
  } catch (e) {
    console.error('loadDataJSON error', e);
    return null;
  }
}

// Populate a select element with provinces lazily
export async function populateProvinces(selectSelector) {
  try {
    const data = await loadDataJSON();
    if (!data || !data.provinces) return;
    const sel = document.querySelector(selectSelector);
    if (!sel) return;
    // clear existing
    sel.innerHTML = '';
    const frag = document.createDocumentFragment();
    data.provinces.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      frag.appendChild(opt);
    });
    sel.appendChild(frag);
  } catch (e) {
    console.error('populateProvinces', e);
  }
}