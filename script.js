const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let nombreOriginal = "";
let areaSeleccionada = ""; // CEM o DPS

// Variables de movimiento
let active = false, resizerActive = false;
let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
const wrapper = document.getElementById('firma-wrapper');
const resizer = document.querySelector('.resizer');

// Función de Inicio
function seleccionarArea(area) {
    areaSeleccionada = area;
    const label = document.getElementById('area-label');
    label.innerText = "ÁREA: " + area;
    label.style.background = (area === 'CEM') ? '#c62828' : '#0277bd';
    
    // Ocultar pantalla inicio con efecto
    document.getElementById('pantalla-inicio').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('pantalla-inicio').style.display = 'none';
    }, 500);
}

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
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('firma-flotante').src = event.target.result;
        wrapper.style.display = 'block';
        wrapper.classList.remove('confirmada');
        wrapper.style.opacity = "0.4";
        document.getElementById('btnEnviar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. Movimiento y Redimensión (Mantenemos tu lógica que funciona)
wrapper.addEventListener("mousedown", (e) => {
    if (e.target === resizer) return;
    e.preventDefault();
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    active = true;
});
resizer.addEventListener("mousedown", (e) => {
    resizerActive = true;
    e.stopPropagation(); e.preventDefault();
});
document.addEventListener("mouseup", () => { active = false; resizerActive = false; });
document.addEventListener("mousemove", (e) => {
    if (active) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX; yOffset = currentY;
        wrapper.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    } else if (resizerActive) {
        const rect = wrapper.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        if (newWidth > 40) wrapper.style.width = newWidth + "px";
    }
});
wrapper.addEventListener('dblclick', (e) => {
    e.preventDefault();
    wrapper.classList.toggle('confirmada');
    wrapper.style.opacity = wrapper.classList.contains('confirmada') ? "1" : "0.4";
});

// 4. Botón de Envío (A configurar con Google Drive)
document.getElementById('btnEnviar').addEventListener('click', () => {
    const n = document.getElementById('nombreProfesor').value;
    if(!n) return alert("Escribe tu nombre");
    const limpio = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_');
    const codigo = nombreOriginal.split('_')[0];
    const nombreFinal = `${limpio}_${codigo}.pdf`;
    
    alert(`Enviando informe de ${areaSeleccionada}...\nNombre: ${nombreFinal}`);
});
