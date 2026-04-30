// Librerías
const scriptPdfLib = document.createElement('script');
scriptPdfLib.src = 'https://unpkg.com/pdf-lib/dist/pdf-lib.min.js';
document.head.appendChild(scriptPdfLib);

const scriptPdfJS = document.createElement('script');
scriptPdfJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
document.head.appendChild(scriptPdfJS);

let pdfDocBytes = null;
let pdfJsDoc = null;
let nombreOriginalArchivo = "";
let paginaActual = 1;

// 1. Manejo del PDF y Navegación
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    nombreOriginalArchivo = file.name;
    const arrayBuffer = await file.arrayBuffer();
    pdfDocBytes = arrayBuffer;

    pdfJsDoc = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
    paginaActual = pdfJsDoc.numPages; // IR DIRECTO A LA ÚLTIMA PÁGINA
    
    renderizarPagina(paginaActual);
    
    document.getElementById('placeholder-text').style.display = 'none';
    document.getElementById('canvas-container').style.display = 'block';
    // Mostramos controles de página si quieres (opcional, por ahora directo a la última)
});

async function renderizarPagina(num) {
    const page = await pdfJsDoc.getPage(num);
    const canvas = document.getElementById('pdf-render');
    const context = canvas.getContext('2d');
    const viewport = page.getViewport({scale: 1.5});
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({canvasContext: context, viewport: viewport}).promise;
}

// 2. Manejo de la Firma
document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.getElementById('firma-flotante');
        img.src = event.target.result;
        img.style.display = 'block';
        img.style.transform = 'translate3d(0,0,0)';
        document.getElementById('btnFirmar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. Arrastrar Firma
const firma = document.getElementById('firma-flotante');
let active = false, currentX = 0, currentY = 0, initialX, initialY, xOffset = 0, yOffset = 0;

document.addEventListener("mousedown", dragStart);
document.addEventListener("mouseup", dragEnd);
document.addEventListener("mousemove", drag);

function dragStart(e) {
    if (e.target === firma) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        active = true;
    }
}
function dragEnd() { active = false; }
function drag(e) {
    if (active) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX; yOffset = currentY;
        firma.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
}

// Confirmación
firma.addEventListener('dblclick', () => {
    firma.style.border = "2px solid #28a745";
    alert("✅ Firma fijada en página " + paginaActual);
});

// 4. Lógica de nombre (botón Firmar)
document.getElementById('btnFirmar').addEventListener('click', () => {
    const nombre = document.getElementById('nombreProfesor').value;
    if(!nombre) return alert("Escribe tu nombre");
    
    const nombreLimpio = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_');
    const codigo = nombreOriginalArchivo.split('_')[0];
    alert(`Se generará: ${nombreLimpio}_${codigo}.pdf`);
});
