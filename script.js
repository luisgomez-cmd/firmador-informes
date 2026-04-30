// Carga dinámica de librerías para asegurar compatibilidad
const scriptPdfLib = document.createElement('script');
scriptPdfLib.src = 'https://unpkg.com/pdf-lib/dist/pdf-lib.min.js';
document.head.appendChild(scriptPdfLib);

const scriptPdfJS = document.createElement('script');
scriptPdfJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
document.head.appendChild(scriptPdfJS);

let pdfDocBytes = null;
let pdfJsDoc = null;
let nombreOriginalArchivo = "";
let totalPaginas = 0;

// Configuración de PDF.js
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// 1. Manejo del PDF
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    nombreOriginalArchivo = file.name;
    const arrayBuffer = await file.arrayBuffer();
    pdfDocBytes = arrayBuffer;

    // Cargar y procesar PDF
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    pdfJsDoc = await loadingTask.promise;
    totalPaginas = pdfJsDoc.numPages;
    
    // Ir directamente a la última página
    await renderizarPagina(totalPaginas);
    
    document.getElementById('num-pag').textContent = totalPaginas;
    document.getElementById('page-label').style.display = 'block';
    document.getElementById('placeholder-text').style.display = 'none';
    document.getElementById('canvas-container').style.display = 'block';
});

async function renderizarPagina(num) {
    const page = await pdfJsDoc.getPage(num);
    const canvas = document.getElementById('pdf-render');
    const context = canvas.getContext('2d');
    
    // Escala optimizada para visualización
    const viewport = page.getViewport({scale: 1.5});
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    await page.render(renderContext).promise;
}

// 2. Manejo de la Firma
document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.getElementById('firma-flotante');
        img.src = event.target.result;
        img.style.display = 'block';
        img.style.transform = 'translate3d(0,0,0)'; // Reset
        
        // Reset de posición de arrastre
        xOffset = 0; yOffset = 0;
        
        document.getElementById('btnFirmar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. Lógica de Arrastrar (Drag & Drop)
const firma = document.getElementById('firma-flotante');
let active = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

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

function dragEnd() {
    active = false;
}

function drag(e) {
    if (active) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        firma.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
}

// Confirmación con doble clic
firma.addEventListener('dblclick', () => {
    firma.style.border = "2px solid #28a745";
    firma.style.background = "rgba(40, 167, 69, 0.2)";
    alert("📍 Ubicación fijada en la última página.");
});

// 4. Procesamiento de Nombre y Botón
document.getElementById('btnFirmar').addEventListener('click', () => {
    const nombreUser = document.getElementById('nombreProfesor').value;
    if(!nombreUser) {
        alert("⚠️ Por favor, escribe tu nombre antes de continuar.");
        return;
    }
    
    // Limpieza de nombre: Mayúsculas, sin tildes, con guiones bajos
    const nombreLimpio = nombreUser.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim()
        .replace(/\s+/g, '_');
        
    const codigoTaller = nombreOriginalArchivo.split('_')[0];
    const nombreFinal = `${nombreLimpio}_${codigoTaller}.pdf`;
    
    alert(`¡Perfecto! Se generará el archivo:\n${nombreFinal}\n\n(Próximo paso: activar el envío automático)`);
});
