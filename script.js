// Importamos las herramientas necesarias (Librerías externas)
const scriptPdfLib = document.createElement('script');
scriptPdfLib.src = 'https://unpkg.com/pdf-lib/dist/pdf-lib.min.js';
document.head.appendChild(scriptPdfLib);

const scriptPdfJS = document.createElement('script');
scriptPdfJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
document.head.appendChild(scriptPdfJS);

// Variables globales
let pdfDocActual = null;
let firmaImgData = null;
let nombreOriginalArchivo = "";

// 1. Función para limpiar y formatear el nombre del archivo
function formatearNombreFinal(nombreUsuario, nombreOriginal) {
    let nombreLimpio = nombreUsuario.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim()
        .replace(/\s+/g, '_');

    let codigoTaller = nombreOriginal.split('_')[0];
    return `${nombreLimpio}_${codigoTaller}.pdf`;
}

// 2. Mostrar el PDF en el visor
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    nombreOriginalArchivo = file.name;
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1); // Mostramos la página 1 por defecto
    
    const viewport = page.getViewport({scale: 1.5});
    const canvas = document.getElementById('pdf-render');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({canvasContext: context, viewport: viewport}).promise;
    document.getElementById('canvas-container').style.display = 'block';
});

// 3. Cargar la firma y hacerla "arrastrable"
document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.getElementById('firma-flotante');
        img.src = event.target.result;
        img.style.display = 'block';
        firmaImgData = event.target.result;
        document.getElementById('btnFirmar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// Lógica para mover la firma (muy simple)
const firma = document.getElementById('firma-flotante');
let isDragging = false;

firma.addEventListener('mousedown', () => isDragging = true);
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const rect = document.getElementById('canvas-container').getBoundingClientRect();
        firma.style.left = (e.clientX - rect.left - 75) + 'px';
        firma.style.top = (e.clientY - rect.top - 25) + 'px';
    }
});

// Doble clic para "fijar" (cambia el color del borde para avisar)
firma.addEventListener('dblclick', () => {
    firma.style.borderColor = "green";
    firma.style.borderStyle = "solid";
    alert("Ubicación confirmada");
});

// 4. El botón final (Por ahora solo descarga el resultado, luego pondremos el envío)
document.getElementById('btnFirmar').addEventListener('click', async () => {
    const nombreUsuario = document.getElementById('nombreProfesor').value;
    if(!nombreUsuario) return alert("Por favor, ingresa tu nombre");

    const nombreFinal = formatearNombreFinal(nombreUsuario, nombreOriginalArchivo);
    alert("Generando archivo: " + nombreFinal);
    
    // Aquí irá la lógica de PDF-Lib para estampar y luego enviar.
});
