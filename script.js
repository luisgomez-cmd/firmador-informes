const scriptPdfJS = document.createElement('script');
scriptPdfJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
document.head.appendChild(scriptPdfJS);

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let pdfJsDoc = null;
let nombreOriginalArchivo = "";
let paginaActual = 1;
let xOffset = 0, yOffset = 0;

// 1. Cargar PDF y generar miniaturas
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    nombreOriginalArchivo = file.name;
    const arrayBuffer = await file.arrayBuffer();
    pdfJsDoc = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
    
    const nav = document.getElementById('page-nav');
    nav.innerHTML = '';
    nav.style.display = 'flex';
    
    // Generar miniaturas reales
    for (let i = 1; i <= pdfJsDoc.numPages; i++) {
        const thumb = document.createElement('div');
        thumb.className = 'page-thumb';
        thumb.id = 'thumb-' + i;
        thumb.innerHTML = `<span>Pág ${i}</span><canvas id="canvas-thumb-${i}"></canvas>`;
        thumb.onclick = () => cambiarPagina(i);
        nav.appendChild(thumb);
        renderizarMiniatura(i);
    }

    document.getElementById('canvas-container').style.display = 'block';
    cambiarPagina(pdfJsDoc.numPages); // Ir a la última
});

async function renderizarMiniatura(num) {
    const page = await pdfJsDoc.getPage(num);
    const canvas = document.getElementById('canvas-thumb-' + num);
    const context = canvas.getContext('2d');
    const viewport = page.getViewport({scale: 0.2});
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({canvasContext: context, viewport: viewport}).promise;
}

async function cambiarPagina(num) {
    paginaActual = num;
    document.querySelectorAll('.page-thumb').forEach(t => t.classList.remove('active'));
    document.getElementById('thumb-' + num).classList.add('active');

    const page = await pdfJsDoc.getPage(num);
    const canvas = document.getElementById('pdf-render');
    const context = canvas.getContext('2d');
    const viewport = page.getViewport({scale: 1.3});
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
        img.classList.add('moving');
        xOffset = 0; yOffset = 0;
        document.getElementById('btnFirmar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. Arrastrar Firma
const firma = document.getElementById('firma-flotante');
let active = false, currentX = 0, currentY = 0, initialX, initialY;

firma.addEventListener("mousedown", dragStart);
document.addEventListener("mouseup", dragEnd);
document.addEventListener("mousemove", drag);

function dragStart(e) {
    if (e.target === firma) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        active = true;
        firma.classList.add('moving');
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

// Doble clic para Fijar (Quita el cuadro)
firma.addEventListener('dblclick', () => {
    firma.classList.remove('moving');
    alert("Firma fijada.");
});

// 4. Nombre Final
document.getElementById('btnFirmar').addEventListener('click', () => {
    const nombre = document.getElementById('nombreProfesor').value;
    if(!nombre) return alert("Ingresa tu nombre");
    const nombreLimpio = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_');
    const codigo = nombreOriginalArchivo.split('_')[0];
    alert(`Archivo final: ${nombreLimpio}_${codigo}.pdf`);
});
