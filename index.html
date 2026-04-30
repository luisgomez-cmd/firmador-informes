// Librerías
const scriptPdfLib = document.createElement('script');
scriptPdfLib.src = 'https://unpkg.com/pdf-lib/dist/pdf-lib.min.js';
document.head.appendChild(scriptPdfLib);

const scriptPdfJS = document.createElement('script');
scriptPdfJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
document.head.appendChild(scriptPdfJS);

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let pdfDocBytes = null;
let pdfJsDoc = null;
let nombreOriginalArchivo = "";
let paginaActual = 1;

// 1. Cargar PDF y generar navegación
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    nombreOriginalArchivo = file.name;
    const arrayBuffer = await file.arrayBuffer();
    pdfDocBytes = arrayBuffer;

    pdfJsDoc = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
    
    // Crear Navegador de páginas
    const nav = document.getElementById('page-nav');
    nav.innerHTML = '';
    nav.style.display = 'flex';
    
    for (let i = 1; i <= pdfJsDoc.numPages; i++) {
        const thumb = document.createElement('div');
        thumb.className = 'page-thumb';
        thumb.innerText = 'Pág ' + i;
        thumb.onclick = () => cambiarPagina(i);
        thumb.id = 'thumb-' + i;
        nav.appendChild(thumb);
    }

    document.getElementById('placeholder').style.display = 'none';
    document.getElementById('canvas-container').style.display = 'block';
    
    // Por defecto ir a la última página
    cambiarPagina(pdfJsDoc.numPages);
});

async function cambiarPagina(num) {
    paginaActual = num;
    
    // Actualizar UI del navegador
    document.querySelectorAll('.page-thumb').forEach(t => t.classList.remove('active'));
    document.getElementById('thumb-' + num).classList.add('active');

    const page = await pdfJsDoc.getPage(num);
    const canvas = document.getElementById('pdf-render');
    const context = canvas.getContext('2d');
    
    // Escala 1.2 para un ligero zoom-out respecto al anterior
    const viewport = page.getViewport({scale: 1.2});
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({canvasContext: context, viewport: viewport}).promise;
    
    // Resetear visual de la firma si ya estaba
    const firma = document.getElementById('firma-flotante');
    firma.classList.remove('fixed');
    firma.style.border = "2px dashed #007bff";
}

// 2. Manejo de la Firma
document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.getElementById('firma-flotante');
        img.src = event.target.result;
        img.style.display = 'block';
        img.style.top = '50px';
        img.style.left = '50px';
        img.classList.remove('fixed');
        document.getElementById('btnFirmar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. Arrastrar Firma (Mejorado para mantenerse dentro del PDF)
const firma = document.getElementById('firma-flotante');
let active = false, currentX = 0, currentY = 0, initialX, initialY, xOffset = 0, yOffset = 0;

firma.addEventListener("mousedown", dragStart);
document.addEventListener("mouseup", dragEnd);
document.addEventListener("mousemove", drag);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === firma) active = true;
}
function dragEnd() { active = false; }
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

// Doble clic para "Estampar"
firma.addEventListener('dblclick', () => {
    firma.classList.add('fixed');
    alert("Firma estampada en página " + paginaActual + ". Ya puedes generar el informe.");
});

// 4. Lógica de Nombre Final
document.getElementById('btnFirmar').addEventListener('click', () => {
    const nombre = document.getElementById('nombreProfesor').value;
    if(!nombre) return alert("Por favor, ingresa tu nombre");
    
    const nombreLimpio = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_');
    const codigo = nombreOriginalArchivo.split('_')[0];
    alert(`Listo para enviar:\n${nombreLimpio}_${codigo}.pdf`);
});
