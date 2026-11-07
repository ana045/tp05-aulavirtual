// --- CLAVE DE PERSISTENCIA EN LOCALSTORAGE ---
const CLAVE_STORAGE = "aula-datos";

// Estructura de datos inicial si está vacío
let datosApp = JSON.parse(localStorage.getItem(CLAVE_STORAGE)) || {
    cursos: [],
    publicaciones: [],
    entregas: []
};

// Guardar datos en localStorage
function guardarDatos() {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datosApp));
}

// --- GESTIÓN DE VISTAS Y ROL ---
let rolActual = "docente"; // "docente" o "alumno"
let cursoActivoId = null;
let tareaActivaId = null;

document.addEventListener("DOMContentLoaded", () => {
    inicializarPWA();
    inicializarInterfaz();
    renderizarCursos();
});

function inicializarInterfaz() {
    actualizarVisibilidadRol();
}

// Selector de rol (Docente / Alumno)
document.getElementById("selector-rol").addEventListener("change", (e) => {
    rolActual = e.target.value;
    actualizarVisibilidadRol();
});

function actualizarVisibilidadRol() {
    const elementosDocente = document.querySelectorAll(".solo-docente");
    elementosDocente.forEach(el => {
        el.style.display = (rolActual === "docente") ? "block" : "none";
    });
}

// --- NAVEGACIÓN ENTRE VISTAS ---
function cambiarVista(idVista) {
    document.querySelectorAll("main > section").forEach(sec => {
        sec.style.display = "none";
    });
    document.getElementById(idVista).style.display = "block";
}

// --- MÓDULO 1: CURSOS ---
document.getElementById("formulario-curso").addEventListener("submit", (e) => {
    e.preventDefault();
    const codigo = document.getElementById("codigo-curso").value.trim();
    const nombre = document.getElementById("nombre-curso").value.trim();
    const docente = document.getElementById("docente-curso").value.trim();
    const color = document.getElementById("color-curso").value;
    const errorDiv = document.getElementById("error-curso");

    if (datosApp.cursos.some(c => c.codigo === codigo)) {
        errorDiv.textContent = "Ya existe un curso con ese código.";
        return;
    }
    errorDiv.textContent = "";

    const nuevoCurso = { id: Date.now().toString(), codigo, nombre, docente, color };
    datosApp.cursos.push(nuevoCurso);
    guardarDatos();
    document.getElementById("formulario-curso").reset();
    renderizarCursos();
});

function renderizarCursos() {
    const contenedor = document.getElementById("contenedor-cursos");
    contenedor.innerHTML = "";

    if (datosApp.cursos.length === 0) {
        contenedor.innerHTML = "<p>No hay cursos creados todavía.</p>";
        return;
    }

    datosApp.cursos.forEach(curso => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-curso";
        tarjeta.style.borderTopColor = curso.color;
        tarjeta.innerHTML = `
            <h3>[${curso.codigo}] ${curso.nombre}</h3>
            <p><strong>Docente:</strong> ${curso.docente}</p>
            <button onclick="ingresarCurso('${curso.id}')">Ingresar al Muro</button>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function ingresarCurso(idCurso) {
    cursoActivoId = idCurso;
    cambiarVista("vista-curso");
    renderizarMuro();
}

document.getElementById("btn-volver-cursos").addEventListener("click", () => {
    cursoActivoId = null;
    cambiarVista("vista-mis-cursos");
    renderizarCursos();
});

// --- MÓDULO 2: MURO Y PUBLICACIONES ---
document.getElementById("tipo-publicacion").addEventListener("change", (e) => {
    const contenedorFecha = document.getElementById("contenedor-fecha-limite");
    contenedorFecha.style.display = (e.target.value === "tarea") ? "block" : "none";
});

document.getElementById("formulario-publicacion").addEventListener("submit", (e) => {
    e.preventDefault();
    const titulo = document.getElementById("titulo-publicacion").value.trim();
    const consigna = document.getElementById("consigna-publicacion").value.trim();
    const tipo = document.getElementById("tipo-publicacion").value;
    const fechaLimite = document.getElementById("fecha-limite").value;
    const puntajeMaximo = document.getElementById("puntaje-maximo").value;

    const nuevaPub = {
        id: Date.now().toString(),
        cursoId: cursoActivoId,
        titulo,
        consigna,
        tipo,
        fechaLimite: tipo === "tarea" ? fechaLimite : null,
        puntajeMaximo: tipo === "tarea" ? puntajeMaximo : null,
        fechaCreacion: new Date().toLocaleDateString()
    };

    datosApp.publicaciones.unshift(nuevaPub);
    guardarDatos();
    document.getElementById("formulario-publicacion").reset();
    document.getElementById("contenedor-fecha-limite").style.display = "block";
    renderizarMuro();
});

function renderizarMuro() {
    const listaMuro = document.getElementById("lista-muro");
    listaMuro.innerHTML = "";

    const pubsCurso = datosApp.publicaciones.filter(p => p.cursoId === cursoActivoId);

    if (pubsCurso.length === 0) {
        listaMuro.innerHTML = "<p>No hay publicaciones en este muro.</p>";
        return;
    }

    pubsCurso.forEach(pub => {
        const div = document.createElement("div");
        div.style.cssText = "background:white; padding:1rem; border-radius:8px; margin-bottom:1rem; box-shadow:0 2px 4px rgba(0,0,0,0.05);";
        
        let botonExtra = "";
        if (pub.tipo === "tarea") {
            botonExtra = `<button onclick="abrirDetalleTarea('${pub.id}')" style="margin-top:10px; background-color:#2980B9;">Ver Tarea y Entregas</button>`;
        }

        div.innerHTML = `
            <span style="font-size:0.8rem; background:#eee; padding:2px 6px; border-radius:4px;">${pub.tipo.toUpperCase()}</span>
            <h4>${pub.titulo}</h4>
            <p>${pub.consigna}</p>
            <small>Publicado: ${pub.fechaCreacion}</small>
            ${botonExtra}
        `;
        listaMuro.appendChild(div);
    });
}

// --- MÓDULO 3: TAREAS Y ENTREGAS (Soporte cámara y canvas del Práctico 5) ---
function abrirDetalleTarea(idTarea) {
    tareaActivaId = idTarea;
    cambiarVista("vista-tarea");

    const tarea = datosApp.publicaciones.find(p => p.id === idTarea);
    const detallesDiv = document.getElementById("detalles-tarea");
    detallesDiv.innerHTML = `
        <h2>📌 ${tarea.titulo}</h2>
        <p>${tarea.consigna}</p>
        <p><strong>Fecha límite:</strong> ${tarea.fechaLimite ? new Date(tarea.fechaLimite).toLocaleString() : "Sin límite"}</p>
        <p><strong>Puntaje máximo:</strong> ${tarea.puntajeMaximo}</p>
    `;

    actualizarFormularioEntrega();
    renderizarEntregas();
}

document.getElementById("btn-volver-muro").addEventListener("click", () => {
    tareaActivaId = null;
    cambiarVista("vista-curso");
    renderizarMuro();
});

document.getElementById("tipo-entrega").addEventListener("change", () => {
    actualizarFormularioEntrega();
});

function actualizarFormularioEntrega() {
    const tipo = document.getElementById("tipo-entrega").value;
    const contenedor = document.getElementById("contenedor-input-entrega");

    if (tipo === "texto") {
        contenedor.innerHTML = `<textarea id="contenido-entrega-texto" placeholder="Escribe tu respuesta aquí..." required style="width:100%; height:100px; padding:0.75rem; border:1px solid #ccc; border-radius:8px; font-family:inherit; box-sizing:border-box;"></textarea>`;
    } else if (tipo === "enlace") {
        contenedor.innerHTML = `<input type="url" id="contenido-entrega-enlace" placeholder="https://..." required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:8px; box-sizing:border-box;">`;
    } else if (tipo === "archivo") {
        contenedor.innerHTML = `
            <label style="display:block; font-size:0.85rem; margin-bottom:5px;">Sacar foto con la cámara o seleccionar imagen:</label>
            <input type="file" id="input-foto-entrega" accept="image/*" capture="environment" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:8px;">
            <div id="aviso-peso-foto" style="color:#e67e22; font-size:0.85rem; margin-top:5px;"></div>
        `;
        
        document.getElementById("input-foto-entrega").addEventListener("change", (evento) => {
            const archivo = evento.target.files[0];
            if (!archivo) return;

            const lector = new FileReader();
            lector.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement("canvas");
                    const anchoMaximo = 800;
                    let ancho = img.width;
                    let alto = img.height;

                    if (ancho > anchoMaximo) {
                        alto = Math.round((alto * anchoMaximo) / ancho);
                        ancho = anchoMaximo;
                    }

                    canvas.width = ancho;
                    canvas.height = alto;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, ancho, alto);

                    const dataUrlComprimida = canvas.toDataURL("image/jpeg", 0.6);
                    const tamanoKB = Math.round((dataUrlComprimida.length * 3) / 4 / 1024);
                    const aviso = document.getElementById("aviso-peso-foto");
                    
                    if (tamanoKB > 200) {
                        aviso.textContent = `⚠️ Atención: La foto pesa ${tamanoKB} KB (supera los 200 KB recomendados).`;
                    } else {
                        aviso.textContent = `✓ Foto procesada correctamente (${tamanoKB} KB).`;
                    }

                    window.imagenComprimidaTemporal = dataUrlComprimida;
                };
                img.src = e.target.result;
            };
            lector.readAsDataURL(archivo);
        });
    }
}

document.getElementById("formulario-entrega").addEventListener("submit", (e) => {
    e.preventDefault();
    const nombreAlumno = document.getElementById("nombre-alumno-entrega").value.trim();
    const tipo = document.getElementById("tipo-entrega").value;
    
    let contenido = "";
    if (tipo === "texto") {
        contenido = document.getElementById("contenido-entrega-texto").value;
    } else if (tipo === "enlace") {
        contenido = document.getElementById("contenido-entrega-enlace").value;
    } else if (tipo === "archivo") {
        contenido = window.imagenComprimidaTemporal || "Archivo adjunto";
    }

    const nuevaEntrega = {
        id: Date.now().toString(),
        tareaId: tareaActivaId,
        alumno: nombreAlumno,
        tipo,
        contenido,
        calificacion: null,
        devolucion: null,
        fecha: new Date().toLocaleString()
    };

    datosApp.entregas.push(nuevaEntrega);
    guardarDatos();
    document.getElementById("formulario-entrega").reset();
    actualizarFormularioEntrega();
    renderizarEntregas();
});

function renderizarEntregas() {
    const lista = document.getElementById("lista-entregas");
    lista.innerHTML = "<h3>Entregas realizadas</h3>";

    const entregasTarea = datosApp.entregas.filter(e => e.tareaId === tareaActivaId);

    if (entregasTarea.length === 0) {
        lista.innerHTML += "<p>Aún no hay entregas para esta tarea.</p>";
        return;
    }

    entregasTarea.forEach(ent => {
        let detalleContenido = "";
        if (ent.tipo === "archivo") {
            detalleContenido = `<br><img src="${ent.contenido}" style="max-width:200px; border-radius:4px; margin-top:5px;">`;
        } else if (ent.tipo === "enlace") {
            detalleContenido = `<br><a href="${ent.contenido}" target="_blank">${ent.contenido}</a>`;
        } else {
            detalleContenido = `<br><p style="background:#f9f9f9; padding:5px; border-radius:4px;">${ent.contenido}</p>`;
        }

        const div = document.createElement("div");
        div.style.cssText = "background:white; padding:1rem; border-radius:8px; margin-bottom:1rem; box-shadow:0 2px 4px rgba(0,0,0,0.05);";
        div.innerHTML = `
            <strong>Alumno:</strong> ${ent.alumno} <br>
            <strong>Fecha:</strong> ${ent.fecha}
            ${detalleContenido}
            <p><strong>Nota:</strong> ${ent.calificacion !== null ? ent.calificacion : "Sin calificar"}</p>
        `;
        lista.appendChild(div);
    });
}

// --- MÓDULO 4: EXPORTAR E IMPORTAR JSON ---
document.getElementById("boton-exportar").addEventListener("click", () => {
    const datosStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datosApp, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", datosStr);
    downloadAnchor.setAttribute("download", `respaldo-aula-virtual-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

document.getElementById("boton-importar").addEventListener("click", () => {
    document.getElementById("input-importar").click();
});

document.getElementById("input-importar").addEventListener("change", (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(evento) {
        try {
            const datosImportados = JSON.parse(evento.target.result);
            if (datosImportados.cursos && datosImportados.publicaciones) {
                datosApp = datosImportados;
                guardarDatos();
                alert("Datos importados con éxito.");
                location.reload();
            } else {
                alert("El archivo JSON no tiene el formato correcto.");
            }
        } catch (err) {
            alert("Error al leer el archivo JSON.");
        }
    };
    lector.readAsText(archivo);
});

// --- FUNCIONES PWA (Service Worker, Aviso Offline y Notificación de Actualización) ---
function inicializarPWA() {
    // 1. Registro del Service Worker y detección de nueva versión
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('Service Worker registrado con éxito:', reg.scope);
                    
                    // Detectar si hay un nuevo service worker instalándose/esperando
                    reg.addEventListener('updatefound', () => {
                        const nuevoWorker = reg.installing;
                        nuevoWorker.addEventListener('statechange', () => {
                            if (nuevoWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                mostrarAvisoActualizacion();
                            }
                        });
                    });
                })
                .catch(err => console.error('Error al registrar el Service Worker:', err));
        });
    }

    // 2. Banner discreto de estado de conexión (Online / Offline)
    const bannerOffline = document.createElement('div');
    bannerOffline.id = 'banner-offline';
    bannerOffline.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; background:#e74c3c; color:white; text-align:center; padding:8px; font-weight:bold; z-index:9999; font-size:0.9rem;';
    bannerOffline.textContent = 'Sin conexión: tus datos se siguen guardando en este celular';
    document.body.prepend(bannerOffline);

    function actualizarEstadoConexion() {
        if (!navigator.onLine) {
            bannerOffline.style.display = 'block';
        } else {
            bannerOffline.style.display = 'none';
        }
    }

    window.addEventListener('online', actualizarEstadoConexion);
    window.addEventListener('offline', actualizarEstadoConexion);
    actualizarEstadoConexion();
}

// 3. Función para mostrar el mensaje flotante de actualización
function mostrarAvisoActualizacion() {
    const bannerActualizacion = document.createElement('div');
    bannerActualizacion.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#27ae60; color:white; padding:12px 20px; border-radius:8px; font-weight:bold; z-index:10000; box-shadow:0 4px 6px rgba(0,0,0,0.2); font-family:sans-serif; text-align:center;';
    bannerActualizacion.textContent = 'Hay una versión nueva: cerrá y volvé a abrir la app';
    document.body.appendChild(bannerActualizacion);
}
```[cite: 15, 16]