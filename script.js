const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let nombreOriginal = "";

let active = false;
let resizerActive = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

const wrapper = document.getElementById('firma-wrapper');
const resizer = document.querySelector('.resizer');

// 1. Cargar PDF
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    nombreOriginal = file.name;
    const fileReader = new FileReader();
    fileReader.onload = async function() {
        const data = new Uint8Array(this.result);
        pdfDoc = await pdfjsLib.getDocument(data).promise;
        pageNum = pdfDoc.numPages;
        renderPage(pageNum);
        document.getElementById('canvas-container').style.display = 'block';
        document.getElementById('controls').style.display = 'flex';
    };
    fileReader.readAsArrayBuffer(file);
});

async function renderPage(num) {
    const page = await pdfDoc.getPage(num);
    const canvas = document.getElementById('pdf-render');
    const ctx = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.3 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    document.getElementById('page-info').innerText = `Página: ${num} / ${pdfDoc.numPages}`;
}

function cambiarPagina(delta) {
    if (!pdfDoc) return;
    if (pageNum + delta > 0 && pageNum + delta <= pdfDoc.numPages) {
        pageNum += delta;
        renderPage(pageNum);
    }
}

// 2. Cargar Firma
document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.getElementById('firma-flotante');
        img.src = event.target.result;
        wrapper.style.display = 'block';
        wrapper.classList.remove('confirmada');
        wrapper.style.opacity = "0.4";
        document.getElementById('btnGenerar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. Movimiento (Drag) - Bloqueo de selección nativa
wrapper.addEventListener("mousedown", (e) => {
    if (e.target === resizer) return;
    e.preventDefault(); // Bloquea selección azul
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    active = true;
});

resizer.addEventListener("mousedown", (e) => {
    resizerActive = true;
    e.stopPropagation();
    e.preventDefault();
});

document.addEventListener("mouseup", () => {
    active = false;
    resizerActive = false;
});

document.addEventListener("mousemove", (e) => {
    if (active) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        wrapper.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    } else if (resizerActive) {
        const rect = wrapper.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        if (newWidth > 40) {
            wrapper.style.width = newWidth + "px";
        }
    }
});

// 4. Doble clic para Confirmar
wrapper.addEventListener('dblclick', (e) => {
    e.preventDefault();
    wrapper.classList.toggle('confirmada');
    if (wrapper.classList.contains('confirmada')) {
        wrapper.style.opacity = "1";
    } else {
        wrapper.style.opacity = "0.4";
    }
});

// 5. Nombre Final
document.getElementById('btnGenerar').addEventListener('click', () => {
    const n = document.getElementById('nombreProfesor').value;
    if(!n) return alert("Escribe tu nombre");
    const limpio = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_');
    const codigo = nombreOriginal.split('_')[0];
    alert(`Generando: ${limpio}_${codigo}.pdf`);
});
