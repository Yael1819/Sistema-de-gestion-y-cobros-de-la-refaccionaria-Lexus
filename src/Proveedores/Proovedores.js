// ============================
// Variables globales
// ============================
let proveedoresData = [];
let proveedorEditandoId = null;
let proveedorDetalleId = null;

// Variables para paginación - 5 proveedores por página
let currentPage = 1;
const itemsPerPage = 5;
let filteredProveedores = [];

// ============================
// Funciones de sesión (igual que el home)
// ============================
function cargarUsuario() {
  const isLoggedIn  = sessionStorage.getItem('is_logged_in');
  const timestamp   = sessionStorage.getItem('login_timestamp');

  // Verificar si la sesión sigue vigente (8 horas)
  if (isLoggedIn !== 'true' || !timestamp) {
    // Intentar con localStorage (Login.html inline guarda 'usuarioActual')
    const rawLocal = localStorage.getItem('usuarioActual');
    if (rawLocal) {
      try {
        const u = JSON.parse(rawLocal);
        const nombreElement = document.getElementById('navUsuarioNombre');
        const rolElement = document.getElementById('navUsuarioRol');
        if (nombreElement) nombreElement.textContent = u.nombre || 'Usuario';
        if (rolElement) rolElement.textContent = u.rol || '';
        return;
      } catch(e) {}
    }
    window.location.href = '/src/Login/Login.html';
    return;
  }

  const ocho_horas = 8 * 60 * 60 * 1000;
  if (Date.now() - parseInt(timestamp) > ocho_horas) {
    sessionStorage.clear();
    window.location.href = '/src/Login/Login.html';
    return;
  }

  // Leer datos del sessionStorage (claves de Login.js)
  const nombre = sessionStorage.getItem('user_name')  || 'Usuario';
  const rol    = sessionStorage.getItem('user_role')  || '';

  const nombreElement = document.getElementById('navUsuarioNombre');
  const rolElement = document.getElementById('navUsuarioRol');
  if (nombreElement) nombreElement.textContent = nombre;
  if (rolElement) rolElement.textContent = rol;
}

function cerrarSesion() {
  sessionStorage.clear();
  localStorage.removeItem('usuarioActual');
  window.location.href = '/src/Login/Login.html';
}

// ============================
// Funciones auxiliares
// ============================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${tipo} border-0 position-fixed bottom-0 end-0 m-3`;
    toast.style.zIndex = '1055';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${mensaje}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function mostrarError(mensaje) {
    console.error('Mostrando error:', mensaje);
    
    const tbody = document.getElementById('tblProveedores');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${mensaje}
                </td>
            </tr>
        `;
    }
    
    const contador = document.getElementById('contadorProveedores');
    if (contador) {
        contador.textContent = 'Error al cargar';
    }
}

// ============================
// Renderizar controles de paginación centrados
// ============================
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHtml = '';
    
    // Botón Anterior
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i> Anterior
            </a>
        </li>
    `;
    
    // Calcular qué páginas mostrar (máximo 5)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Primera página si no está visible
    if (startPage > 1) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1); return false;">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Última página si no está visible
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `;
    }
    
    // Botón Siguiente
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                Siguiente <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHtml;
}

// ============================
// Cambiar de página
// ============================
function changePage(page) {
    const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    currentPage = page;
    mostrarProveedores(filteredProveedores, false);
}

// ============================
// Mostrar proveedores en la tabla (con paginación)
// ============================
function mostrarProveedores(proveedores, resetPage = true) {
    const tbody = document.getElementById('tblProveedores');
    const contador = document.getElementById('contadorProveedores');
    
    if (!tbody || !contador) return;
    
    // Guardar proveedores filtrados
    filteredProveedores = proveedores;
    
    // Resetear a primera página si es necesario
    if (resetPage) {
        currentPage = 1;
    }
    
    console.log('Mostrando proveedores - Total:', filteredProveedores.length, 'Página:', currentPage);
    
    if (filteredProveedores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-truck fa-2x mb-2"></i><br>
                    No hay proveedores registrados
                </td>
            </tr>
        `;
        contador.textContent = '0 proveedores';
        renderPagination();
        return;
    }
    
    // Calcular índices para la página actual (5 proveedores por página)
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const proveedoresPagina = filteredProveedores.slice(startIndex, endIndex);
    
    // Actualizar contador
    const totalMostrados = Math.min(endIndex, filteredProveedores.length);
    contador.textContent = `${filteredProveedores.length} proveedores (Mostrando ${startIndex + 1}-${totalMostrados})`;
    
    tbody.innerHTML = proveedoresPagina.map(p => {
        return `
            <tr>
                <td><span class="badge bg-secondary">${p.id_proveedor}</span></td>
                <td>
                    <div class="fw-bold">${escapeHtml(p.nombre) || 'Sin nombre'}</div>
                    <small class="text-muted">${escapeHtml(p.contacto) || 'Sin contacto'}</small>
                </div>
                <td>${escapeHtml(p.contacto) || '—'}</div>
                <td>
                    ${p.telefono ? `<a href="tel:${p.telefono}" class="text-decoration-none">
                        <i class="fas fa-phone me-1"></i>${escapeHtml(p.telefono)}
                    </a>` : '—'}
                </div>
                <td>
                    ${p.email ? `<a href="mailto:${p.email}" class="text-decoration-none">
                        <i class="fas fa-envelope me-1"></i>${escapeHtml(p.email)}
                    </a>` : '—'}
                </div>
                <td>${escapeHtml(p.direccion) || '—'}</div>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info btn-action" onclick="verDetalles(${p.id_proveedor})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-action" onclick="editarProveedor(${p.id_proveedor})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-action" onclick="eliminarProveedor(${p.id_proveedor})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </tr>
        `;
    }).join('');
    
    // Renderizar controles de paginación
    renderPagination();
}

// ============================
// Cargar datos iniciales
// ============================
async function cargarDatosIniciales() {
    try {
        console.log('Cargando proveedores desde la BD...');
        
        // Cargar proveedores
        const proveedoresResponse = await fetch('/api/proveedores');
        if (!proveedoresResponse.ok) {
            throw new Error(`Error al cargar proveedores: ${proveedoresResponse.status}`);
        }
        
        proveedoresData = await proveedoresResponse.json();
        console.log('Proveedores cargados:', proveedoresData.length);
        
        // Cargar estadísticas de productos
        await cargarEstadisticasProductos();
        
        // Mostrar proveedores
        mostrarProveedores(proveedoresData);
        
        // Calcular estadísticas
        calcularEstadisticas();
        
    } catch (error) {
        console.error('Error en cargarDatosIniciales:', error);
        mostrarError('Error al cargar proveedores: ' + error.message);
    }
}

// ============================
// Cargar estadísticas de productos
// ============================
async function cargarEstadisticasProductos() {
    try {
        const response = await fetch('/api/productos');
        if (!response.ok) return;
        
        const productos = await response.json();
        
        // Contar productos por proveedor
        proveedoresData.forEach(proveedor => {
            const productosProveedor = productos.filter(p => p.id_proveedor === proveedor.id_proveedor);
            proveedor.productos_count = productosProveedor.length;
        });
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// ============================
// Calcular estadísticas
// ============================
function calcularEstadisticas() {
    const total = proveedoresData.length;
    const totalProductos = proveedoresData.reduce((sum, p) => sum + (p.productos_count || 0), 0);
    
    const countProveedores = document.getElementById('countProveedores');
    const countProductos = document.getElementById('countProductos');
    
    if (countProveedores) countProveedores.textContent = total;
    if (countProductos) countProductos.textContent = totalProductos;
}

// ============================
// Ver detalles de proveedor
// ============================
async function verDetalles(id) {
    try {
        const proveedor = proveedoresData.find(p => p.id_proveedor === id);
        if (!proveedor) {
            const response = await fetch(`/api/proveedores/${id}`);
            if (!response.ok) throw new Error('Proveedor no encontrado');
            const proveedorDetalle = await response.json();
            proveedorDetalleId = id;
            mostrarDetallesModal(proveedorDetalle);
            return;
        }
        
        proveedorDetalleId = id;
        mostrarDetallesModal(proveedor);
        
    } catch (error) {
        console.error('Error en verDetalles:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

function mostrarDetallesModal(proveedor) {
    const detallesContenido = document.getElementById('detallesContenido');
    if (!detallesContenido) return;
    
    detallesContenido.innerHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <div class="text-center mb-3">
                    <i class="fas fa-truck fa-3x text-primary"></i>
                </div>
                <h5 class="text-center">${escapeHtml(proveedor.nombre) || 'Sin nombre'}</h5>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">Información de Contacto</h6>
                        <div class="mb-2">
                            <strong>Contacto:</strong>
                            <span class="float-end">${escapeHtml(proveedor.contacto) || '—'}</span>
                        </div>
                        <div class="mb-2">
                            <strong>Teléfono:</strong>
                            <span class="float-end">
                                ${proveedor.telefono ? `<a href="tel:${proveedor.telefono}" class="text-decoration-none">
                                    ${escapeHtml(proveedor.telefono)}
                                </a>` : '—'}
                            </span>
                        </div>
                        <div class="mb-2">
                            <strong>Email:</strong>
                            <span class="float-end">
                                ${proveedor.email ? `<a href="mailto:${proveedor.email}" class="text-decoration-none">${escapeHtml(proveedor.email)}</a>` : '—'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">Ubicación</h6>
                        <div class="mb-3">
                            <strong>Dirección:</strong>
                            <p class="mt-1">${escapeHtml(proveedor.direccion) || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">Estadísticas</h6>
                        <div class="mb-2">
                            <strong>ID del proveedor:</strong>
                            <span class="badge bg-secondary float-end">${proveedor.id_proveedor}</span>
                        </div>
                        <div class="mb-2">
                            <strong>Productos suministrados:</strong>
                            <span class="badge bg-primary float-end">${proveedor.productos_count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">Acciones</h6>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary" onclick="verProductosProveedor(${proveedor.id_proveedor})">
                                <i class="fas fa-boxes me-1"></i> Ver productos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    modal.show();
}

function editarProveedorDesdeDetalles() {
    if (proveedorDetalleId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalles'));
        if (modal) modal.hide();
        editarProveedor(proveedorDetalleId);
    }
}

// ============================
// Ver productos del proveedor
// ============================
async function verProductosProveedor(id) {
    try {
        const proveedor = proveedoresData.find(p => p.id_proveedor === id);
        if (!proveedor) {
            mostrarNotificacion('Proveedor no encontrado', 'danger');
            return;
        }
        
        // Obtener productos del proveedor
        const response = await fetch('/api/productos');
        if (!response.ok) throw new Error('Error al cargar productos');
        
        const productos = await response.json();
        const productosProveedor = productos.filter(p => p.id_proveedor === id);
        
        mostrarModalProductosProveedor(proveedor, productosProveedor);
        
    } catch (error) {
        console.error('Error en verProductosProveedor:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

function mostrarModalProductosProveedor(proveedor, productos) {
    const contenido = document.getElementById('productosProveedorContenido');
    if (!contenido) return;
    
    contenido.innerHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <h6>Proveedor: ${escapeHtml(proveedor.nombre) || 'Sin nombre'}</h6>
                <p class="text-muted">Lista de productos suministrados por este proveedor</p>
            </div>
            <div class="col-12">
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>N° Parte</th>
                                <th>Precio Venta</th>
                                <th>Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productos.length > 0 
                                ? productos.map(producto => {
                                    const stock = producto.stock_actual || 0;
                                    const stockMinimo = producto.stock_minimo || 5;
                                    let stockClass = 'bg-success';
                                    if (stock === 0) stockClass = 'bg-danger';
                                    else if (stock < stockMinimo) stockClass = 'bg-warning';
                                    
                                    return `
                                        <tr>
                                            <td>${escapeHtml(producto.nombre) || '—'}</div>
                                            <td><span class="badge bg-light text-dark">${escapeHtml(producto.categoria_nombre) || 'Sin categoría'}</span></div>
                                            <td><code>${escapeHtml(producto.numero_parte) || '—'}</code></div>
                                            <td>$${parseFloat(producto.precio_venta || 0).toFixed(2)}</div>
                                            <td><span class="badge ${stockClass}">${stock}</span></div>
                                        </tr>
                                    `;
                                }).join('')
                                : `
                                    <tr>
                                        <td colspan="5" class="text-center text-muted py-3">
                                            <i class="fas fa-box-open fa-2x mb-2"></i><br>
                                            No hay productos registrados para este proveedor
                                        </div>
                                    </tr>
                                `
                            }
                        </tbody>
                    </table>
                </div>
                <div class="mt-3">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Este proveedor suministra <strong>${productos.length}</strong> productos
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('modalProductosProveedor'));
    modal.show();
}

// ============================
// Editar proveedor
// ============================
async function editarProveedor(id) {
    try {
        const proveedor = proveedoresData.find(p => p.id_proveedor === id);
        if (!proveedor) {
            const response = await fetch(`/api/proveedores/${id}`);
            if (!response.ok) throw new Error('Proveedor no encontrado');
            const proveedorDetalle = await response.json();
            llenarFormularioEdicion(proveedorDetalle, id);
            return;
        }
        
        llenarFormularioEdicion(proveedor, id);
        
    } catch (error) {
        console.error('Error en editarProveedor:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

function llenarFormularioEdicion(proveedor, id) {
    const form = document.getElementById('formAgregarProveedor');
    if (!form) {
        console.error('No se encontró el formulario');
        return;
    }
    
    proveedorEditandoId = id;
    
    form.querySelector('input[name="nombre"]').value = proveedor.nombre || '';
    form.querySelector('input[name="contacto"]').value = proveedor.contacto || '';
    form.querySelector('input[name="telefono"]').value = proveedor.telefono || '';
    form.querySelector('input[name="email"]').value = proveedor.email || '';
    form.querySelector('textarea[name="direccion"]').value = proveedor.direccion || '';
    
    const modalTitle = document.querySelector('#modalAgregarProveedor .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Proveedor';
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar proveedor';
        submitBtn.className = 'btn btn-warning';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalAgregarProveedor'));
    modal.show();
}

// ============================
// Eliminar proveedor
// ============================
async function eliminarProveedor(id) {
    const proveedor = proveedoresData.find(p => p.id_proveedor === id);
    if (!proveedor) {
        mostrarNotificacion('Proveedor no encontrado', 'danger');
        return;
    }
    
    if (proveedor.productos_count > 0) {
        if (!confirm(`El proveedor "${proveedor.nombre}" suministra ${proveedor.productos_count} productos.\n¿Está seguro de eliminar? Los productos quedarán sin proveedor.`)) {
            return;
        }
    } else {
        if (!confirm(`¿Está seguro de eliminar el proveedor "${proveedor.nombre}"?\nEsta acción no se puede deshacer.`)) {
            return;
        }
    }
    
    try {
        const response = await fetch(`/api/proveedores/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar');
        }
        
        const result = await response.json();
        mostrarNotificacion('✅ ' + (result.message || 'Proveedor eliminado correctamente'), 'success');
        
        refreshProveedores();
        
    } catch (error) {
        console.error('Error en eliminarProveedor:', error);
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
}

// ============================
// Buscar proveedores
// ============================
function buscarProveedores() {
    const busqueda = document.getElementById('globalSearchInput').value.toLowerCase().trim();
    
    if (!busqueda) {
        mostrarProveedores(proveedoresData);
        return;
    }
    
    const resultados = proveedoresData.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(busqueda)) ||
        (p.contacto && p.contacto.toLowerCase().includes(busqueda)) ||
        (p.email && p.email.toLowerCase().includes(busqueda)) ||
        (p.telefono && p.telefono.includes(busqueda)) ||
        (p.direccion && p.direccion.toLowerCase().includes(busqueda))
    );
    
    mostrarProveedores(resultados);
}

// ============================
// Refrescar datos
// ============================
async function refreshProveedores() {
    try {
        const tbody = document.getElementById('tblProveedores');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                        Cargando proveedores...
                    </div>
                </tr>
            `;
        }
        
        await cargarDatosIniciales();
        
    } catch (error) {
        console.error('Error en refreshProveedores:', error);
        mostrarError('Error al cargar proveedores: ' + error.message);
    }
}

// ============================
// Handler para agregar/editar proveedor
// ============================
document.getElementById('formAgregarProveedor').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('Enviando formulario de proveedor...');
    
    const formData = {
        nombre: this.nombre.value,
        contacto: this.contacto.value,
        telefono: this.telefono.value,
        email: this.email.value || null,
        direccion: this.direccion.value
    };
    
    if (!formData.nombre || !formData.contacto || !formData.telefono || !formData.direccion) {
        mostrarNotificacion('❌ Nombre, contacto, teléfono y dirección son obligatorios', 'danger');
        return;
    }
    
    try {
        let url = '/api/proveedores';
        let method = 'POST';
        
        if (proveedorEditandoId) {
            url = `/api/proveedores/${proveedorEditandoId}`;
            method = 'PUT';
            formData.id_proveedor = proveedorEditandoId;
        }
        
        console.log(`Enviando ${method} a ${url}`);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al guardar');
        }
        
        const result = await response.json();
        mostrarNotificacion('✅ ' + (result.message || 'Proveedor guardado correctamente'), 'success');
        
        this.reset();
        proveedorEditandoId = null;
        
        const modalTitle = document.querySelector('#modalAgregarProveedor .modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-truck me-2"></i>Agregar Proveedor';
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar proveedor';
            submitBtn.className = 'btn btn-primary';
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarProveedor'));
        if (modal) {
            modal.hide();
        }
        
        refreshProveedores();
        
    } catch (error) {
        console.error('Error en submit formulario:', error);
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
});

// ============================
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando Proovedores.js');
    
    // Cargar información del usuario
    cargarUsuario();
    
    // Búsqueda global
    const btnSearch = document.getElementById('btnSearch');
    if (btnSearch) {
        btnSearch.addEventListener('click', buscarProveedores);
    }
    
    // Permitir búsqueda con Enter
    const globalSearch = document.getElementById('globalSearchInput');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarProveedores();
            }
        });
    }
    
    // Restaurar formulario cuando se cierre el modal
    const modalAgregar = document.getElementById('modalAgregarProveedor');
    if (modalAgregar) {
        modalAgregar.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('formAgregarProveedor');
            if (form) {
                form.reset();
            }
            proveedorEditandoId = null;
            
            const modalTitle = document.querySelector('#modalAgregarProveedor .modal-title');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-truck me-2"></i>Agregar Proveedor';
            }
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar proveedor';
                submitBtn.className = 'btn btn-primary';
            }
        });
    }
    
    // Cargar datos iniciales
    cargarDatosIniciales();
    
    console.log('Proovedores.js inicializado correctamente');
});