const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let nombreOriginal = "";
let xOffset = 0, yOffset = 0;

// 1. Cargar el PDF
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    nombreOriginal = file.name;

    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
        
        pageNum = pdfDoc.numPages; // Ir a la última página automáticamente
        renderPage(pageNum);
        
        document.getElementById('mensaje-inicial').style.display = 'none';
        document.getElementById('canvas-container').style.display = 'block';
        document.getElementById('controles').style.display = 'flex';
    };
    reader.readAsArrayBuffer(file);
});

async function renderPage(num) {
    const page = await pdfDoc.getPage(num);
    const canvas = document.getElementById('pdf-render');
    const ctx = canvas.getContext('2d');
    
    const viewport = page.getViewport({ scale: 1.2 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    document.getElementById('page-num-display').innerText = `Página: ${num} / ${pdfDoc.numPages}`;
}

// Botones de navegación
document.getElementById('prev-page').addEventListener('click', () => {
    if (pageNum <= 1) return;
    pageNum--;
    renderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    renderPage(pageNum);
});

// 2. Cargar Firma
document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.getElementById('firma-flotante');
        img.src = event.target.result;
        img.style.display = 'block';
        img.style.transform = 'translate3d(0,0,0)';
        xOffset = 0; yOffset = 0;
        document.getElementById('btnFirmar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. Arrastrar Firma
const firma = document.getElementById('firma-flotante');
let active = false, currentX = 0, currentY = 0, initialX, initialY;

firma.addEventListener("mousedown", (e) => {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === firma) active = true;
});

document.addEventListener("mouseup", () => active = false);
document.addEventListener("mousemove", (e) => {
    if (active) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX; yOffset = currentY;
        firma.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
});

// Doble clic para fijar (quita el borde azul si lo tuviera)
firma.addEventListener('dblclick', () => {
    alert("📍 Firma posicionada.");
});

// 4. Nombre Final
document.getElementById('btnFirmar').addEventListener('click', () => {
    const nombre = document.getElementById('nombreProfesor').value;
    if(!nombre) return alert("Escribe tu nombre");
    const limpio = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_');
    const codigo = nombreOriginal.split('_')[0];
    alert(`Listo para enviar como: ${limpio}_${codigo}.pdf`);
});
