// ═══════════════════════════════════════
// 💬 EDITOR DE RESPUESTAS - JAVASCRIPT
// ═══════════════════════════════════════

const API_URL = '/api';

let respuestasData = {};
let respuestaEditando = null;
let tabActual = 'saludos';

// ═══════════════════════════════════════
// 🚀 INICIALIZACIÓN
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando editor de respuestas...');
    cargarRespuestas();
});

// ═══════════════════════════════════════
// 📥 CARGAR RESPUESTAS
// ═══════════════════════════════════════

async function cargarRespuestas() {
    try {
        console.log('📥 Cargando respuestas del bot...');
        
        const res = await fetch(`${API_URL}/respuestas`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('💬 Respuestas recibidas:', data);
        
        if (!data || typeof data !== 'object') {
            console.error('❌ Formato de datos inválido:', data);
            mostrarError('Formato de datos inválido');
            respuestasData = {};
            return;
        }
        
        respuestasData = data;
        
        console.log('✅ Respuestas cargadas correctamente');
        
        // Renderizar la tab actual
        cambiarTab(tabActual);
        
    } catch (error) {
        console.error('❌ Error al cargar respuestas:', error);
        mostrarError('Error al cargar respuestas: ' + error.message);
        respuestasData = {};
    }
}

// ═══════════════════════════════════════
// 🔄 CAMBIAR TAB
// ═══════════════════════════════════════

function cambiarTab(tab) {
    tabActual = tab;
    console.log(`🔄 Cambiando a tab: ${tab}`);
    
    // Actualizar botones activos
    const botones = document.querySelectorAll('.tab-btn');
    botones.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activar el botón correspondiente
    const botonActivo = Array.from(botones).find(btn => 
        btn.getAttribute('onclick')?.includes(`'${tab}'`)
    );
    if (botonActivo) {
        botonActivo.classList.add('active');
    }
    
    // Renderizar contenido del tab
    renderizarTab(tab);
}

// ═══════════════════════════════════════
// 🎨 RENDERIZAR TAB
// ═══════════════════════════════════════

function renderizarTab(tab) {
    const contenedor = document.getElementById('respuestas-container');
    
    if (!contenedor) {
        console.error('❌ No se encontró el contenedor respuestas-container');
        return;
    }
    
    // Definir las respuestas para cada tab
    const tabsConfig = {
        'saludos': {
            titulo: '👋 Saludos',
            items: [
                { key: 'bienvenida', label: 'Mensaje de Bienvenida', descripcion: 'Primer mensaje que recibe el cliente' },
                { key: 'despedida', label: 'Mensaje de Despedida', descripcion: 'Mensaje al finalizar la conversación' }
            ]
        },
        'consultas': {
            titulo: '❓ Consultas',
            items: [
                { key: 'catalogo_enviado', label: 'Catálogo Enviado', descripcion: 'Mensaje al enviar el catálogo' }
            ]
        },
        'pedidos': {
            titulo: '🛒 Pedidos',
            items: [
                { key: 'producto_no_disponible', label: 'Producto No Disponible', descripcion: 'Cuando un producto no tiene stock' },
                { key: 'confirmacion_pedido', label: 'Confirmación de Pedido', descripcion: 'Resumen antes de confirmar' },
                { key: 'pedido_confirmado', label: 'Pedido Confirmado', descripcion: 'Mensaje de confirmación exitosa' }
            ]
        },
        'errores': {
            titulo: '❌ Errores',
            items: [
                // Si tienes respuestas de errores, agrégalas aquí
            ]
        },
        'comandos_dueño': {
            titulo: '👑 Comandos Dueño',
            items: [
                { key: 'fuera_horario', label: 'Fuera de Horario / Bot Pausado', descripcion: 'Mensaje cuando el bot está pausado' }
            ]
        }
    };
    
    const config = tabsConfig[tab];
    
    if (!config) {
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p>⚠️ Tab no configurado: ${tab}</p>
            </div>
        `;
        return;
    }
    
    let html = `<div class="respuestas-section">`;
    
    if (config.items.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>Sin respuestas configuradas</h3>
                <p>Esta sección aún no tiene respuestas disponibles</p>
            </div>
        `;
    } else {
        config.items.forEach(item => {
            const valor = respuestasData[item.key] || '';
            const tieneValor = valor && valor.trim() !== '';
            
            html += `
                <div class="respuesta-item ${!tieneValor ? 'empty' : ''}">
                    <div class="respuesta-header">
                        <div class="respuesta-info">
                            <h3>${item.label}</h3>
                            <p class="respuesta-descripcion">${item.descripcion}</p>
                        </div>
                        <button class="btn-editar-inline" onclick="editarRespuesta('${item.key}', '${escapeQuotes(item.label)}')">
                            ✏️ Editar
                        </button>
                    </div>
                    <div class="respuesta-contenido">
                        ${tieneValor ? 
                            `<pre class="respuesta-texto">${escapeHtml(valor)}</pre>` : 
                            `<div class="respuesta-vacia">
                                <span>📝 Sin contenido - Click en Editar para agregar</span>
                            </div>`
                        }
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div>`;
    
    contenedor.innerHTML = html;
    
    console.log(`✅ Tab "${tab}" renderizado`);
}

// ═══════════════════════════════════════
// ✏️ EDITAR RESPUESTA
// ═══════════════════════════════════════

function editarRespuesta(key, label) {
    respuestaEditando = key;
    
    console.log(`✏️ Editando respuesta: ${key} (${label})`);
    
    const valor = respuestasData[key] || '';
    
    // Crear modal dinámicamente si no existe
    let modal = document.getElementById('modalEditarRespuesta');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalEditarRespuesta';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="tituloModalEditar">✏️ Editar Respuesta</h2>
                    <button onclick="cerrarModalEditar()" class="btn-close">✕</button>
                </div>
                <form onsubmit="guardarRespuesta(event)">
                    <input type="hidden" id="respuestaKey">
                    <div class="form-group">
                        <label>Texto de la respuesta:</label>
                        <textarea id="textoRespuesta" rows="12" required style="font-family: monospace;"></textarea>
                        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                            <span id="contadorCaracteres" style="font-size: 12px; color: #666;">0 caracteres</span>
                            <span style="font-size: 12px; color: #999;">Tip: Usa las variables mostradas arriba</span>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" onclick="cerrarModalEditar()" class="btn-secondary">
                            ❌ Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            💾 Guardar
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Event listener para contador
        const textarea = modal.querySelector('#textoRespuesta');
        textarea.addEventListener('input', actualizarContador);
    }
    
    // Actualizar contenido del modal
    document.getElementById('tituloModalEditar').textContent = `✏️ Editar: ${label}`;
    document.getElementById('respuestaKey').value = key;
    document.getElementById('textoRespuesta').value = valor;
    
    actualizarContador();
    
    modal.classList.add('active');
}

function cerrarModalEditar() {
    const modal = document.getElementById('modalEditarRespuesta');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ═══════════════════════════════════════
// 💾 GUARDAR RESPUESTA
// ═══════════════════════════════════════

async function guardarRespuesta(event) {
    event.preventDefault();
    
    const key = document.getElementById('respuestaKey').value;
    const texto = document.getElementById('textoRespuesta').value;
    
    if (!texto || texto.trim() === '') {
        mostrarNotificacion('❌ El texto no puede estar vacío', 'error');
        return;
    }
    
    console.log(`💾 Guardando respuesta: ${key}`);
    
    try {
        // Crear objeto con TODAS las respuestas actualizadas
        const respuestasActualizadas = {
            ...respuestasData,
            [key]: texto.trim()
        };
        
        console.log('📤 Enviando respuestas actualizadas');
        
        const response = await fetch(`${API_URL}/respuestas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(respuestasActualizadas)
        });
        
        const result = await response.json();
        console.log('📥 Respuesta del servidor:', result);
        
        if (response.ok) {
            mostrarNotificacion('✅ Respuesta actualizada exitosamente', 'success');
            cerrarModalEditar();
            await cargarRespuestas();
        } else {
            mostrarNotificacion('❌ ' + (result.error || 'Error al guardar'), 'error');
            console.error('Error del servidor:', result);
        }
    } catch (error) {
        console.error('❌ Error al guardar respuesta:', error);
        mostrarNotificacion('❌ Error al guardar respuesta', 'error');
    }
}

// ═══════════════════════════════════════
// 💾 GUARDAR TODAS LAS RESPUESTAS (Botón principal)
// ═══════════════════════════════════════

async function guardarRespuestas() {
    mostrarNotificacion('ℹ️ Las respuestas se guardan automáticamente al editar', 'info');
}

// ═══════════════════════════════════════
// 🔄 RESTAURAR POR DEFECTO
// ═══════════════════════════════════════

function confirmarRestaurar() {
    const modal = document.getElementById('modalConfirmar');
    const mensaje = document.getElementById('mensajeConfirmar');
    const btnConfirmar = document.getElementById('btnConfirmarAccion');
    
    if (!modal || !mensaje || !btnConfirmar) {
        if (confirm('¿Estás seguro de restaurar todas las respuestas a sus valores por defecto? Esta acción no se puede deshacer.')) {
            restaurarRespuestas();
        }
        return;
    }
    
    mensaje.textContent = '¿Estás seguro de restaurar todas las respuestas a sus valores por defecto? Esta acción no se puede deshacer.';
    btnConfirmar.onclick = () => {
        cerrarModal('modalConfirmar');
        restaurarRespuestas();
    };
    
    modal.classList.add('active');
}

async function restaurarRespuestas() {
    console.log('🔄 Restaurando respuestas por defecto...');
    
    try {
        const response = await fetch(`${API_URL}/respuestas/restaurar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        console.log('📥 Respuesta del servidor:', result);
        
        if (response.ok) {
            mostrarNotificacion('✅ Respuestas restauradas exitosamente', 'success');
            await cargarRespuestas();
        } else {
            mostrarNotificacion('❌ ' + (result.error || 'Error al restaurar'), 'error');
            console.error('Error del servidor:', result);
        }
    } catch (error) {
        console.error('❌ Error al restaurar respuestas:', error);
        mostrarNotificacion('❌ Error al restaurar respuestas', 'error');
    }
}

// ═══════════════════════════════════════
// 👁️ VISTA PREVIA
// ═══════════════════════════════════════

function previsualizarRespuesta() {
    const modal = document.getElementById('modalPreview');
    const container = document.getElementById('previewMessages');
    
    if (!modal || !container) {
        mostrarNotificacion('ℹ️ Vista previa no disponible', 'info');
        return;
    }
    
    // Mostrar respuestas del tab actual
    const tabsConfig = {
        'saludos': ['bienvenida', 'despedida'],
        'consultas': ['catalogo_enviado'],
        'pedidos': ['producto_no_disponible', 'confirmacion_pedido', 'pedido_confirmado'],
        'comandos_dueño': ['fuera_horario']
    };
    
    const keys = tabsConfig[tabActual] || [];
    
    let html = '';
    keys.forEach(key => {
        const valor = respuestasData[key] || 'Sin contenido';
        html += `
            <div class="whatsapp-message bot">
                <div class="message-bubble">
                    ${escapeHtml(valor).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<p style="text-align: center; color: #999;">No hay mensajes para previsualizar</p>';
    
    modal.classList.add('active');
}

// ═══════════════════════════════════════
// 📝 CONTADOR DE CARACTERES
// ═══════════════════════════════════════

function actualizarContador() {
    const textarea = document.getElementById('textoRespuesta');
    const contador = document.getElementById('contadorCaracteres');
    
    if (textarea && contador) {
        const longitud = textarea.value.length;
        contador.textContent = `${longitud} caracteres`;
        
        if (longitud > 1000) {
            contador.style.color = '#f44336';
        } else if (longitud > 500) {
            contador.style.color = '#ff9800';
        } else {
            contador.style.color = '#666';
        }
    }
}

// ═══════════════════════════════════════
// 🛡️ UTILIDADES
// ═══════════════════════════════════════

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function escapeQuotes(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ═══════════════════════════════════════
// 🎨 MODALES Y NOTIFICACIONES
// ═══════════════════════════════════════

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
    }
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const notif = document.getElementById('notificacion');
    if (!notif) {
        console.warn('⚠️ No se encontró el elemento de notificación');
        alert(mensaje);
        return;
    }
    
    notif.textContent = mensaje;
    notif.className = `notificacion ${tipo} active`;
    
    setTimeout(() => {
        notif.classList.remove('active');
    }, 3000);
}

function mostrarError(mensaje) {
    const contenedor = document.getElementById('respuestas-container');
    
    if (contenedor) {
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                <p style="color: #f44336; font-size: 16px;">${mensaje}</p>
                <button onclick="cargarRespuestas()" class="btn-primary" style="margin-top: 15px;">
                    🔄 Reintentar
                </button>
            </div>
        `;
    }
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};