const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let nombreOriginal = "";
let x = 0, y = 0, initialX, initialY, xOffset = 0, yOffset = 0;
let active = false;

// Cargar PDF
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    nombreOriginal = file.name;

    const fileReader = new FileReader();
    fileReader.onload = async function() {
        const data = new Uint8Array(this.result);
        const loadingTask = pdfjsLib.getDocument(data);
        pdfDoc = await loadingTask.promise;
        
        pageNum = pdfDoc.numPages; // Ir a la última
        renderPage(pageNum);
        
        document.getElementById('canvas-container').style.display = 'block';
        document.getElementById('controls').style.display = 'block';
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

// Cargar Firma
document.getElementById('firmaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.getElementById('firma-flotante');
        img.src = event.target.result;
        img.style.display = 'block';
        document.getElementById('btnGenerar').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// Lógica de Arrastrar (Drag)
const firma = document.getElementById('firma-flotante');

firma.addEventListener("mousedown", (e) => {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    active = true;
});

document.addEventListener("mouseup", () => { active = false; });
document.addEventListener("mousemove", (e) => {
    if (active) {
        e.preventDefault();
        x = e.clientX - initialX;
        y = e.clientY - initialY;
        xOffset = x;
        yOffset = y;
        firma.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
});

// Nombre de archivo final
document.getElementById('btnGenerar').addEventListener('click', () => {
    const n = document.getElementById('nombreProfesor').value;
    if(!n) return alert("Escribe tu nombre");
    const limpio = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, '_');
    const codigo = nombreOriginal.split('_')[0];
    alert(`Se guardará como: ${limpio}_${codigo}.pdf\n\nEste es el paso previo al envío por email.`);
});
