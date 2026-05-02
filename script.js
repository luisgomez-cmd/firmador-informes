const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const { PDFDocument } = PDFLib;

let pdfDoc = null;
let pdfBytesOriginal = null;
let pageNum = 1;
let nombreOriginal = "";
let areaSeleccionada = "";

const URLS_SCRIPT = {
    'CEM': 'https://script.google.com/macros/s/AKfycbx6ZgoFXuzmQKZeP2sMCjWjGxXuwmT3OB3XMOG7IxRkKY2K5lDtowxP-7S_qWzuZ5Nb/exec',
    'DPS': 'https://script.google.com/macros/s/AKfycbwYallAI9iyq8ODWsoVcPVkI_NnMQIvX7Ij3r6CDX7DBSfzDqZNp0Yw39R3urD5JXeZ/exec'
};

let active = false, resizerActive = false;
let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
const wrapper = document.getElementById('firma-wrapper');
const resizer = document.querySelector('.resizer');

// FUNCIÓN PARA ENTRAR AL SISTEMA (La que estaba fallando)
function seleccionarArea(area) {
    areaSeleccionada = area;
    const label = document.getElementById('area-label');
    label.innerText = "ÁREA: " + area;
    label.style.background = (area === 'CEM') ? '#c62828' : '#0277bd';
    
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
    pdfBytesOriginal = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(pdfBytesOriginal.slice(0)));
    pdfDoc = await loadingTask.promise;
    pageNum = pdfDoc.numPages;
    renderPage(pageNum);
    document.getElementById('canvas-container').style.display = 'block';
    document.getElementById('controls').style.display = 'flex';
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
let firmaImgData = null;
document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        firmaImgData = event.target.result;
        document.getElementById('firma-flotante').src = firmaImgData;
        wrapper.style.display = 'block';
        wrapper.classList.remove('confirmada');
        wrapper.style.opacity = "0.4";
        document.getElementById('btnEnviar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. Movimiento y Redimensión
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

// 4. ENVÍO A GOOGLE DRIVE
document.getElementById('btnEnviar').addEventListener('click', async () => {
    const n = document.getElementById('nombreProfesor').value;
    if(!n) return alert("Escribe tu nombre.");
    if(!wrapper.classList.contains('confirmada')) return alert("Confirma la firma con doble clic.");

    const btn = document.getElementById('btnEnviar');
    const loadingMsg = document.getElementById('loading-msg');
    btn.disabled = true;
    loadingMsg.style.display = 'block';

    try {
        const pdfLibDoc = await PDFDocument.load(pdfBytesOriginal);
        const pages = pdfLibDoc.getPages();
        const currentPage = pages[pageNum - 1];
        
        const firmaImg = await pdfLibDoc.embedPng(firmaImgData);
        const canvas = document.getElementById('pdf-render');
        const rect = canvas.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        const scaleX = currentPage.getWidth() / canvas.width;
        const scaleY = currentPage.getHeight() / canvas.height;

        const posX = (wrapperRect.left - rect.left) * scaleX;
        const posY = (rect.bottom - wrapperRect.bottom) * scaleY; 
        const widthFinal = wrapperRect.width * scaleX;
        const heightFinal = wrapperRect.height * scaleY;

        currentPage.drawImage(firmaImg, {
            x: posX,
            y: posY,
            width: widthFinal,
            height: heightFinal,
        });

        const pdfBase64 = await pdfLibDoc.saveAsBase64();
        const limpio = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_');
        const codigo = nombreOriginal.split('_')[0];
        const nombreFinal = `${limpio}_${codigo}.pdf`;

        // Envío ciego (no-cors)
        fetch(URLS_SCRIPT[areaSeleccionada], {
            method: 'POST',
            body: JSON.stringify({ base64: pdfBase64, filename: nombreFinal }),
            mode: 'no-cors'
        });

        setTimeout(() => {
            alert("✅ ¡Informe enviado! Revisa tu carpeta en Drive en unos segundos.");
            location.reload();
        }, 3500);

    } catch (error) {
        console.error(error);
        alert("❌ Error: " + error.message);
        btn.disabled = false;
        loadingMsg.style.display = 'none';
    }
});
