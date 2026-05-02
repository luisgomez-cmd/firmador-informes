// ... (todo el código anterior de pdfjs y movimiento se mantiene igual) ...

// PROCESO DE ENVÍO FINAL BLINDADO
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

        // ENVÍO USANDO FORM DATA (Más compatible con Google Apps Script)
        const payload = JSON.stringify({
            base64: pdfBase64,
            filename: nombreFinal
        });

        // Intentamos el envío
        fetch(URLS_SCRIPT[areaSeleccionada], {
            method: 'POST',
            body: payload,
            mode: 'no-cors' // Evita errores de seguridad del navegador
        });

        // Como usamos no-cors, no esperamos respuesta de éxito de Google (porque el navegador la bloquea aunque el archivo llegue)
        // Le damos 4 segundos de espera visual
        setTimeout(() => {
            alert("✅ Proceso finalizado. El informe se está procesando en Drive.\n\nNombre: " + nombreFinal);
            location.reload();
        }, 4000);

    } catch (error) {
        console.error(error);
        alert("❌ Error técnico: " + error.message);
        btn.disabled = false;
        loadingMsg.style.display = 'none';
    }
});
