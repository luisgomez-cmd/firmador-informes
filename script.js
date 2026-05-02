const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
const { PDFDocument } = PDFLib;

let pdfDocActual = null, pdfBytesOriginal = null, pageNum = 1, nombreOriginal = "", areaSeleccionada = "";
const URLS_SCRIPT = {
    'CEM': 'https://script.google.com/macros/s/AKfycbx6ZgoFXuzmQKZeP2sMCjWjGxXuwmT3OB3XMOG7IxRkKY2K5lDtowxP-7S_qWzuZ5Nb/exec',
    'DPS': 'https://script.google.com/macros/s/AKfycbwYallAI9iyq8ODWsoVcPVkI_NnMQIvX7Ij3r6CDX7DBSfzDqZNp0Yw39R3urD5JXeZ/exec'
};

// --- INICIO Y SELECCIÓN DE ÁREA ---
window.seleccionarArea = function(area) {
    areaSeleccionada = area;
    // Carga el logo correspondiente en el sidebar
    document.getElementById('logo-sidebar').src = `logo_${area.toLowerCase()}.png`;
    document.getElementById('pantalla-inicio').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('pantalla-inicio').style.display = 'none';
        document.getElementById('app-main').style.display = 'flex';
    }, 500);
};

// --- LÓGICA DE CARGA DE PDF ---
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    nombreOriginal = file.name;
    pdfBytesOriginal = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(pdfBytesOriginal.slice(0)));
    pdfDocActual = await loadingTask.promise;
    pageNum = pdfDocActual.numPages;
    renderPage(pageNum);
    document.getElementById('canvas-container').style.display = 'block';
    document.getElementById('viewer-nav').style.display = 'flex';
});

async function renderPage(num) {
    const page = await pdfDocActual.getPage(num);
    const canvas = document.getElementById('pdf-render');
    const ctx = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.3 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    document.getElementById('page-info').innerText = `PÁGINA ${num} / ${pdfDocActual.numPages}`;
}

window.cambiarPagina = function(delta) {
    if (!pdfDocActual) return;
    if (pageNum + delta > 0 && pageNum + delta <= pdfDocActual.numPages) {
        pageNum += delta;
        renderPage(pageNum);
    }
};

// --- LÓGICA DE LA FIRMA ---
let firmaImgData = null;
const wrapper = document.getElementById('firma-wrapper');

document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        firmaImgData = event.target.result;
        document.getElementById('firma-img').src = firmaImgData;
        
        // CORRECCIÓN: Posiciona la firma dentro del visor PDF
        // La ponemos en 50px, 50px relativos al inicio del canvas
        xOffset = 50; 
        yOffset = 50;
        wrapper.style.transform = `translate3d(50px, 50px, 0)`;
        wrapper.style.width = "150px"; 
        wrapper.style.top = "0px"; 
        wrapper.style.left = "0px";
        
        wrapper.style.display = 'block';
        wrapper.classList.remove('confirmada');
        document.getElementById('btnEnviar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// --- MOVIMIENTO Y REDIMENSIÓN DE FIRMA ---
let active = false, resizerActive = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

wrapper.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains('resizer-dot')) return;
    initialX = e.clientX - xOffset; initialY = e.clientY - yOffset;
    active = true;
});

document.querySelector('.resizer-dot').addEventListener("mousedown", (e) => {
    resizerActive = true; 
    e.stopPropagation();
});

document.addEventListener("mouseup", () => { 
    active = false; 
    resizerActive = false; 
});

document.addEventListener("mousemove", (e) => {
    if (active) {
        currentX = e.clientX - initialX; 
        currentY = e.clientY - initialY;
        xOffset = currentX; 
        yOffset = currentY;
        wrapper.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    } else if (resizerActive) {
        const rect = wrapper.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        if (newWidth > 40) wrapper.style.width = newWidth + "px";
    }
});

wrapper.addEventListener('dblclick', () => {
    wrapper.classList.toggle('confirmada');
});

// --- PROCESO DE ENVÍO A GOOGLE DRIVE ---
document.getElementById('btnEnviar').addEventListener('click', async () => {
    const n = document.getElementById('nombreProfesor').value;
    if(!n) return alert("Escribe tu nombre.");
    if(!wrapper.classList.contains('confirmada')) return alert("Fija la firma con doble clic (debe quedar sólida).");

    const btn = document.getElementById('btnEnviar');
    const load = document.getElementById('loading-msg');
    btn.disabled = true; 
    load.style.display = 'block';

    try {
        // Cargar el PDF para edición
        const pdfLibDoc = await PDFDocument.load(pdfBytesOriginal);
        const pages = pdfLibDoc.getPages();
        const currentPage = pages[pageNum - 1];
        
        // Embeber la imagen de la firma
        const firmaImg = await pdfLibDoc.embedPng(firmaImgData);
        
        // Cálculos de posición para el estampado final
        const canvas = document.getElementById('pdf-render');
        const rect = canvas.getBoundingClientRect();
        const wrapRect = wrapper.getBoundingClientRect();
        
        const scaleX = currentPage.getWidth() / canvas.width;
        const scaleY = currentPage.getHeight() / canvas.height;

        // Estampado de la firma en las coordenadas del PDF
        currentPage.drawImage(firmaImg, {
            x: (wrapRect.left - rect.left) * scaleX,
            y: (rect.bottom - wrapRect.bottom) * scaleY,
            width: wrapRect.width * scaleX,
            height: wrapRect.height * scaleY,
        });

        // Generar el archivo final en Base64
        const pdfBase64 = await pdfLibDoc.saveAsBase64();
        
        // Formatear nombre del archivo
        const limpio = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_');
        const codigo = nombreOriginal.split('_')[0];
        const nombreFinal = `${limpio}_${codigo}.pdf`;
        
        // Envío a Google Apps Script (Método ciego no-cors)
        fetch(URLS_SCRIPT[areaSeleccionada], {
            method: 'POST',
            body: JSON.stringify({ base64: pdfBase64, filename: nombreFinal }),
            mode: 'no-cors'
        });

        // Feedback al usuario y recarga
        setTimeout(() => {
            alert("✅ Informe enviado con éxito.");
            location.reload();
        }, 3500);

    } catch (e) {
        console.error(e);
        alert("Error al procesar el documento.");
        btn.disabled = false; 
        load.style.display = 'none';
    }
});
