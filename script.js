// Carga de librerías externas
const scriptPdfLib = document.createElement('script');
scriptPdfLib.src = 'https://unpkg.com/pdf-lib/dist/pdf-lib.min.js';
document.head.appendChild(scriptPdfLib);

const scriptPdfJS = document.createElement('script');
scriptPdfJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
document.head.appendChild(scriptPdfJS);

let pdfDocBytes = null;
let nombreOriginalArchivo = "";
let firmaImgData = null;

// Coordenadas para el PDF real
let pdfX = 0;
let pdfY = 0;

// Función para limpiar nombres
function limpiarTexto(texto) {
    return texto.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim()
        .replace(/\s+/g, '_');
}

// 1. Manejo del PDF
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    nombreOriginalArchivo = file.name;
    const arrayBuffer = await file.arrayBuffer();
    pdfDocBytes = arrayBuffer;

    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    const canvas = document.getElementById('pdf-render');
    const context = canvas.getContext('2d');
    
    // Ajustar escala para que se vea bien en el panel derecho
    const viewport = page.getViewport({scale: 1.5});
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({canvasContext: context, viewport: viewport}).promise;
    
    // Ocultar el texto de ayuda y mostrar el visor
    document.getElementById('placeholder-text').style.display = 'none';
    document.getElementById('canvas-container').style.display = 'block';
});

// 2. Manejo de la Firma
document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.getElementById('firma-flotante');
        img.src = event.target.result;
        img.style.display = 'block';
        img.style.transform = 'translate3d(0,0,0)'; // Reset posición
        firmaImgData = event.target.result;
        document.getElementById('btnFirmar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. Lógica de Arrastrar (Drag & Drop) mejorada
const firma = document.getElementById('firma-flotante');
let active = false;
let currentX = 0, currentY = 0, initialX, initialY;
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

// Confirmación visual
firma.addEventListener('dblclick', () => {
    firma.style.border = "2px solid #28a745";
    firma.style.background = "rgba(40, 167, 69, 0.2)";
    alert("✅ Firma posicionada correctamente.");
});

// 4. Botón Final
document.getElementById('btnFirmar').addEventListener('click', async () => {
    const nombreUser = document.getElementById('nombreProfesor').value;
    if(!nombreUser) return alert("⚠️ Por favor, escribe tu nombre.");
    
    const nombreLimpio = limpiarTexto(nombreUser);
    const codigoTaller = nombreOriginalArchivo.split('_')[0];
    const nombreFinal = `${nombreLimpio}_${codigoTaller}.pdf`;
    
    alert("Archivo listo para enviar: " + nombreFinal);
    // Aquí conectaremos con EmailJS en el siguiente paso
});
