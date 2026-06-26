// ============================
// Variables globales
// ============================
let compatibilidadesData = [];
let productosData = [];
let vehiculosData = [];
let compatibilidadEditandoId = null;
let compatibilidadDetalleId = null;

// Variables para paginación - 5 compatibilidades por página
let currentPage = 1;
const itemsPerPage = 5;
let filteredCompatibilidades = [];

// ============================
// Funciones de sesión (igual que el home)
// ============================
function cargarUsuario() {
  const isLoggedIn  = sessionStorage.getItem('is_logged_in');
  const timestamp   = sessionStorage.getItem('login_timestamp');

  if (isLoggedIn !== 'true' || !timestamp) {
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
    toast.className = `custom-toast toast align-items-center text-bg-${tipo} border-0 position-fixed`;
    toast.style.zIndex = '1060';
    toast.style.top = '20px';
    toast.style.right = '20px';
    
    const icon = tipo === 'success' ? 'check-circle' : 
                tipo === 'danger' ? 'exclamation-triangle' : 
                tipo === 'warning' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="toast-body d-flex align-items-center">
                <i class="fas fa-${icon} me-2 fs-5"></i>
                <span>${mensaje}</span>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: 3000, autohide: true });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

function mostrarError(mensaje) {
    console.error('Mostrando error:', mensaje);
    const tbody = document.getElementById('tblCompatibilidades');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${mensaje}
                </td>
            </tr>
        `;
    }
}

// ============================
// Renderizar controles de paginación centrados
// ============================
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredCompatibilidades.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHtml = '';
    
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i> Anterior
            </a>
        </li>
    `;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1); return false;">1</a></li>`;
        if (startPage > 2) paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a></li>`;
    }
    
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                Siguiente <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHtml;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredCompatibilidades.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    mostrarCompatibilidades(filteredCompatibilidades, false);
}

// ============================
// Cargar datos iniciales
// ============================
async function cargarDatosIniciales() {
    try {
        const compatResponse = await fetch('/api/compatibilidades');
        if (!compatResponse.ok) throw new Error('Error al cargar compatibilidades');
        compatibilidadesData = await compatResponse.json();
        
        const productosResponse = await fetch('/api/productos');
        if (!productosResponse.ok) throw new Error('Error al cargar productos');
        const productosTemp = await productosResponse.json();
        productosData = productosTemp.map(p => ({
            id_producto: p.id_producto,
            nombre: p.nombre,
            marca: p.marca,
            numero_parte: p.numero_parte,
            categoria_nombre: p.categoria_nombre
        }));
        
        const vehiculosResponse = await fetch('/api/vehiculos');
        if (!vehiculosResponse.ok) throw new Error('Error al cargar vehículos');
        const vehiculosTemp = await vehiculosResponse.json();
        vehiculosData = vehiculosTemp.map(v => ({
            id_vehiculo: v.id_vehiculo,
            marca: v.marca,
            modelo: v.modelo,
            año: v.año,
            motor: v.motor
        }));
        
        cargarFiltros();
        mostrarCompatibilidades(compatibilidadesData);
        calcularEstadisticas();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar datos: ' + error.message);
    }
}

// ============================
// Cargar filtros en los select
// ============================
function cargarFiltros() {
    const selectProducto = document.getElementById('filterProducto');
    const selectVehiculo = document.getElementById('filterVehiculo');
    const selectProductoForm = document.querySelector('select[name="id_producto"]');
    const selectVehiculoForm = document.querySelector('select[name="id_vehiculo"]');
    
    if (!selectProducto || !selectVehiculo) return;
    
    selectProducto.innerHTML = '<option value="">Todos los productos</option>';
    selectVehiculo.innerHTML = '<option value="">Todos los vehículos</option>';
    if (selectProductoForm) selectProductoForm.innerHTML = '<option value="">Seleccionar producto...</option>';
    if (selectVehiculoForm) selectVehiculoForm.innerHTML = '<option value="">Seleccionar vehículo...</option>';
    
    productosData.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.id_producto;
        option.textContent = `${producto.nombre} (${producto.marca})`;
        selectProducto.appendChild(option);
        
        if (selectProductoForm) {
            const optionForm = document.createElement('option');
            optionForm.value = producto.id_producto;
            optionForm.textContent = `${producto.nombre} (${producto.marca}) - ${producto.numero_parte || 'Sin número'}`;
            selectProductoForm.appendChild(optionForm);
        }
    });
    
    vehiculosData.forEach(vehiculo => {
        const option = document.createElement('option');
        option.value = vehiculo.id_vehiculo;
        option.textContent = `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.año})`;
        selectVehiculo.appendChild(option);
        
        if (selectVehiculoForm) {
            const optionForm = document.createElement('option');
            optionForm.value = vehiculo.id_vehiculo;
            optionForm.textContent = `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.año})`;
            selectVehiculoForm.appendChild(optionForm);
        }
    });
}

// ============================
// Mostrar compatibilidades con paginación
// ============================
function mostrarCompatibilidades(compatibilidades, resetPage = true) {
    const tbody = document.getElementById('tblCompatibilidades');
    const contador = document.getElementById('contadorCompatibilidades');
    
    if (!tbody || !contador) return;
    
    filteredCompatibilidades = compatibilidades;
    
    if (resetPage) currentPage = 1;
    
    if (filteredCompatibilidades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-unlink fa-2x mb-2"></i><br>
                    No hay compatibilidades registradas
                </td>
            </tr>
        `;
        contador.textContent = '0 compatibilidades';
        renderPagination();
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const compatibilidadesPagina = filteredCompatibilidades.slice(startIndex, endIndex);
    const totalMostrados = Math.min(endIndex, filteredCompatibilidades.length);
    
    contador.textContent = `${filteredCompatibilidades.length} compatibilidades (Mostrando ${startIndex + 1}-${totalMostrados})`;
    
    tbody.innerHTML = compatibilidadesPagina.map(comp => `
        <tr>
            <td><span class="badge bg-secondary">${comp.id_compatibilidad}</span></td>
            <td class="product-cell">
                <div class="fw-bold">${escapeHtml(comp.producto_nombre) || 'Producto ' + comp.id_producto}</div>
                <div class="small text-muted">
                    <span class="badge bg-light text-dark">${escapeHtml(comp.producto_marca) || 'Sin marca'}</span>
                    <span class="badge bg-info text-white">${escapeHtml(comp.categoria_nombre) || 'Sin categoría'}</span>
                    <code class="ms-1">${escapeHtml(comp.numero_parte) || 'Sin número'}</code>
                </div>
            </div>
            <td class="vehicle-cell">
                <div class="fw-bold">${escapeHtml(comp.vehiculo_marca) || 'Marca'} ${escapeHtml(comp.vehiculo_modelo) || 'Modelo'}</div>
                <div class="small text-muted">
                    <span class="badge bg-light text-dark">${comp.año || comp.vehiculo_año || 'Sin año'}</span>
                    <span class="badge bg-warning text-dark">${escapeHtml(comp.vehiculo_motor) || 'Sin motor'}</span>
                </div>
            </div>
            <td>
                <div class="small">
                    <div><strong>Producto ID:</strong> ${comp.id_producto}</div>
                    <div><strong>Vehículo ID:</strong> ${comp.id_vehiculo}</div>
                </div>
            </div>
            <td>
                <div class="small text-truncate" style="max-width: 150px;" title="${escapeHtml(comp.notas) || 'Sin notas'}">
                    ${escapeHtml(comp.notas) || '—'}
                </div>
            </div>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info btn-action" onclick="verDetalles(${comp.id_compatibilidad})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning btn-action" onclick="editarCompatibilidad(${comp.id_compatibilidad})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-action" onclick="eliminarCompatibilidad(${comp.id_compatibilidad})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </tr>
    `).join('');
    
    // Actualizar vista de tarjetas
    const vistaTarjetas = document.getElementById('vistaTarjetas');
    if (vistaTarjetas && !vistaTarjetas.classList.contains('d-none')) {
        cargarVistaTarjetas(compatibilidadesPagina);
    }
    
    renderPagination();
}

// ============================
// Cargar vista de tarjetas
// ============================
function cargarVistaTarjetas(compatibilidades) {
    const container = document.getElementById('vistaTarjetas');
    if (!container) return;
    
    if (compatibilidades.length === 0) {
        container.innerHTML = `<div class="col-12"><div class="alert alert-info">No hay compatibilidades para mostrar</div></div>`;
        return;
    }
    
    container.innerHTML = compatibilidades.map(comp => `
        <div class="col-md-6 col-lg-4">
            <div class="card compatibility-card h-100">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <div><strong>Compatibilidad</strong><div class="small">ID: ${comp.id_compatibilidad}</div></div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <h6 class="card-subtitle mb-2 text-muted">Producto</h6>
                        <div class="fw-bold">${escapeHtml(comp.producto_nombre) || 'Producto ' + comp.id_producto}</div>
                        <div class="small text-muted">
                            ${escapeHtml(comp.producto_marca) || 'Sin marca'} • ${escapeHtml(comp.categoria_nombre) || 'Sin categoría'}
                            <br><code>${escapeHtml(comp.numero_parte) || 'Sin número'}</code>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6 class="card-subtitle mb-2 text-muted">Vehículo Compatible</h6>
                        <div class="fw-bold">${escapeHtml(comp.vehiculo_marca) || 'Marca'} ${escapeHtml(comp.vehiculo_modelo) || 'Modelo'}</div>
                        <div class="small text-muted">
                            ${comp.año || comp.vehiculo_año || 'Sin año'} • ${escapeHtml(comp.vehiculo_motor) || 'Sin motor'}
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6 class="card-subtitle mb-2 text-muted">Notas</h6>
                        <p class="small mb-0">${escapeHtml(comp.notas) || 'Sin notas adicionales'}</p>
                    </div>
                </div>
                <div class="card-footer bg-white text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="verDetalles(${comp.id_compatibilidad})"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-outline-warning" onclick="editarCompatibilidad(${comp.id_compatibilidad})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-outline-danger" onclick="eliminarCompatibilidad(${comp.id_compatibilidad})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================
// Calcular estadísticas
// ============================
function calcularEstadisticas() {
    const total = compatibilidadesData.length;
    const productosUnicos = [...new Set(compatibilidadesData.map(c => c.id_producto))].length;
    const vehiculosUnicos = [...new Set(compatibilidadesData.map(c => c.id_vehiculo))].length;
    const promedio = total > 0 ? (total / productosUnicos).toFixed(1) : 0;
    
    const countCompatibilidades = document.getElementById('countCompatibilidades');
    const countProductosCompatibles = document.getElementById('countProductosCompatibles');
    const countVehiculosCompatibles = document.getElementById('countVehiculosCompatibles');
    const countPromedioCompat = document.getElementById('countPromedioCompat');
    
    if (countCompatibilidades) countCompatibilidades.textContent = total;
    if (countProductosCompatibles) countProductosCompatibles.textContent = productosUnicos;
    if (countVehiculosCompatibles) countVehiculosCompatibles.textContent = vehiculosUnicos;
    if (countPromedioCompat) countPromedioCompat.textContent = promedio;
}

// ============================
// Ver detalles de compatibilidad
// ============================
async function verDetalles(id) {
    try {
        const comp = compatibilidadesData.find(c => c.id_compatibilidad === id);
        if (!comp) throw new Error('Compatibilidad no encontrada');
        compatibilidadDetalleId = id;
        
        const contenido = document.getElementById('detallesContenido');
        if (!contenido) return;
        
        contenido.innerHTML = `
            <div class="row">
                <div class="col-12 mb-3 text-center">
                    <i class="fas fa-link fa-3x text-primary"></i>
                    <h5 class="mt-2">Compatibilidad Confirmada</h5>
                    <p class="text-muted">ID: ${comp.id_compatibilidad}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card"><div class="card-header bg-light"><h6 class="mb-0"><i class="fas fa-box me-2"></i>Información del Producto</h6></div>
                    <div class="card-body">
                        <div class="mb-2"><strong>Nombre:</strong><span class="float-end">${escapeHtml(comp.producto_nombre) || 'Producto ' + comp.id_producto}</span></div>
                        <div class="mb-2"><strong>Marca:</strong><span class="badge bg-light text-dark float-end">${escapeHtml(comp.producto_marca) || 'Sin marca'}</span></div>
                        <div class="mb-2"><strong>Categoría:</strong><span class="badge bg-info text-white float-end">${escapeHtml(comp.categoria_nombre) || 'Sin categoría'}</span></div>
                        <div class="mb-2"><strong>Número de Parte:</strong><span class="float-end"><code>${escapeHtml(comp.numero_parte) || 'No disponible'}</code></span></div>
                        <div class="mb-2"><strong>ID del Producto:</strong><span class="badge bg-secondary float-end">${comp.id_producto}</span></div>
                    </div></div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card"><div class="card-header bg-light"><h6 class="mb-0"><i class="fas fa-car me-2"></i>Información del Vehículo</h6></div>
                    <div class="card-body">
                        <div class="mb-2"><strong>Marca y Modelo:</strong><span class="float-end">${escapeHtml(comp.vehiculo_marca) || 'Marca'} ${escapeHtml(comp.vehiculo_modelo) || 'Modelo'}</span></div>
                        <div class="mb-2"><strong>Año:</strong><span class="badge bg-light text-dark float-end">${comp.año || comp.vehiculo_año || 'No disponible'}</span></div>
                        <div class="mb-2"><strong>Motor:</strong><span class="badge bg-warning text-dark float-end">${escapeHtml(comp.vehiculo_motor) || 'No disponible'}</span></div>
                        <div class="mb-2"><strong>ID del Vehículo:</strong><span class="badge bg-secondary float-end">${comp.id_vehiculo}</span></div>
                    </div></div>
                </div>
                <div class="col-12 mb-3">
                    <div class="card"><div class="card-header bg-light"><h6 class="mb-0"><i class="fas fa-sticky-note me-2"></i>Información de Compatibilidad</h6></div>
                    <div class="card-body">
                        <div class="mb-2"><strong>ID de Compatibilidad:</strong><span class="badge bg-primary float-end">${comp.id_compatibilidad}</span></div>
                        <div class="mb-3"><strong>Notas:</strong><p class="mt-2 mb-0">${escapeHtml(comp.notas) || 'No hay notas adicionales.'}</p></div>
                    </div></div>
                </div>
                <div class="col-12"><div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>Esta compatibilidad ha sido registrada en el sistema.</div></div>
            </div>
        `;
        
        new bootstrap.Modal(document.getElementById('modalDetalles')).show();
    } catch (error) {
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

function editarCompatibilidadDesdeDetalles() {
    if (compatibilidadDetalleId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalles'));
        if (modal) modal.hide();
        editarCompatibilidad(compatibilidadDetalleId);
    }
}

// ============================
// Editar compatibilidad
// ============================
function editarCompatibilidad(id) {
    const comp = compatibilidadesData.find(c => c.id_compatibilidad === id);
    if (!comp) {
        mostrarNotificacion('Compatibilidad no encontrada', 'danger');
        return;
    }
    
    compatibilidadEditandoId = id;
    const form = document.getElementById('formAgregarCompatibilidad');
    
    const productoSelect = form.querySelector('select[name="id_producto"]');
    const vehiculoSelect = form.querySelector('select[name="id_vehiculo"]');
    
    productoSelect.value = comp.id_producto;
    vehiculoSelect.value = comp.id_vehiculo;
    form.querySelector('textarea[name="notas"]').value = comp.notas || '';
    
    document.querySelector('#modalAgregarCompatibilidad .modal-title').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Compatibilidad';
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar compatibilidad';
        submitBtn.className = 'btn btn-warning';
    }
    
    new bootstrap.Modal(document.getElementById('modalAgregarCompatibilidad')).show();
}

// ============================
// Eliminar compatibilidad
// ============================
async function eliminarCompatibilidad(id) {
    const comp = compatibilidadesData.find(c => c.id_compatibilidad === id);
    if (!comp) return;
    
    const productoNombre = comp.producto_nombre || 'Producto ' + comp.id_producto;
    const vehiculoNombre = comp.vehiculo_marca ? `${comp.vehiculo_marca} ${comp.vehiculo_modelo}` : 'Vehículo ' + comp.id_vehiculo;
    
    if (!confirm(`¿Eliminar la compatibilidad entre "${productoNombre}" y "${vehiculoNombre}"?\nEsta acción no se puede deshacer.`)) return;
    
    try {
        const response = await fetch(`/api/compatibilidades/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar');
        }
        
        mostrarNotificacion('✅ Compatibilidad eliminada correctamente', 'success');
        refreshCompatibilidades();
    } catch (error) {
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
}

// ============================
// Aplicar filtros
// ============================
function aplicarFiltros() {
    const filtroProducto = document.getElementById('filterProducto').value;
    const filtroVehiculo = document.getElementById('filterVehiculo').value;
    const orden = document.getElementById('ordenarPor').value;
    
    let dataFiltrada = [...compatibilidadesData];
    
    if (filtroProducto) dataFiltrada = dataFiltrada.filter(c => c.id_producto == filtroProducto);
    if (filtroVehiculo) dataFiltrada = dataFiltrada.filter(c => c.id_vehiculo == filtroVehiculo);
    
    switch(orden) {
        case 'vehiculo':
            dataFiltrada.sort((a, b) => {
                const vehiculoA = `${a.vehiculo_marca || ''} ${a.vehiculo_modelo || ''}`;
                const vehiculoB = `${b.vehiculo_marca || ''} ${b.vehiculo_modelo || ''}`;
                return vehiculoA.localeCompare(vehiculoB);
            });
            break;
        case 'recientes':
            dataFiltrada.sort((a, b) => b.id_compatibilidad - a.id_compatibilidad);
            break;
        case 'antiguas':
            dataFiltrada.sort((a, b) => a.id_compatibilidad - b.id_compatibilidad);
            break;
        default:
            dataFiltrada.sort((a, b) => (a.producto_nombre || '').localeCompare(b.producto_nombre || ''));
            break;
    }
    
    mostrarCompatibilidades(dataFiltrada);
}

// ============================
// Buscar compatibilidades
// ============================
function buscarCompatibilidades() {
    const busqueda = document.getElementById('globalSearch').value.toLowerCase().trim();
    
    if (!busqueda) {
        mostrarCompatibilidades(compatibilidadesData);
        return;
    }
    
    const resultados = compatibilidadesData.filter(c => {
        return (
            (c.producto_nombre && c.producto_nombre.toLowerCase().includes(busqueda)) ||
            (c.producto_marca && c.producto_marca.toLowerCase().includes(busqueda)) ||
            (c.numero_parte && c.numero_parte.toLowerCase().includes(busqueda)) ||
            (c.vehiculo_marca && c.vehiculo_marca.toLowerCase().includes(busqueda)) ||
            (c.vehiculo_modelo && c.vehiculo_modelo.toLowerCase().includes(busqueda)) ||
            (c.notas && c.notas.toLowerCase().includes(busqueda)) ||
            c.id_compatibilidad.toString().includes(busqueda)
        );
    });
    
    mostrarCompatibilidades(resultados);
}

// ============================
// Refrescar datos
// ============================
async function refreshCompatibilidades() {
    const tbody = document.getElementById('tblCompatibilidades');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Cargando compatibilidades...</div></td></tr>`;
    }
    await cargarDatosIniciales();
    mostrarNotificacion('✅ Datos actualizados correctamente', 'success');
}

// ============================
// Formulario submit
// ============================
document.getElementById('formAgregarCompatibilidad').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        id_producto: this.id_producto.value,
        id_vehiculo: this.id_vehiculo.value,
        notas: this.notas.value || null
    };
    
    if (!formData.id_producto || !formData.id_vehiculo) {
        mostrarNotificacion('❌ Por favor selecciona un producto y un vehículo', 'danger');
        return;
    }
    
    try {
        let url = '/api/compatibilidades';
        let method = 'POST';
        
        if (compatibilidadEditandoId) {
            url = `/api/compatibilidades/${compatibilidadEditandoId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al guardar');
        }
        
        mostrarNotificacion('✅ Compatibilidad guardada correctamente', 'success');
        
        this.reset();
        compatibilidadEditandoId = null;
        
        document.querySelector('#modalAgregarCompatibilidad .modal-title').innerHTML = '<i class="fas fa-link me-2"></i>Agregar Compatibilidad';
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar compatibilidad';
            submitBtn.className = 'btn btn-primary';
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarCompatibilidad'));
        if (modal) modal.hide();
        
        refreshCompatibilidades();
    } catch (error) {
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
});

// ============================
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', function() {
    cargarUsuario();
    
    const btnVistaTabla = document.getElementById('btnVistaTabla');
    const btnVistaTarjetas = document.getElementById('btnVistaTarjetas');
    const vistaTarjetas = document.getElementById('vistaTarjetas');
    const compatibilidadesSection = document.getElementById('compatibilidades');
    
    if (btnVistaTabla && btnVistaTarjetas) {
        btnVistaTabla.addEventListener('click', () => {
            btnVistaTabla.classList.add('active');
            btnVistaTarjetas.classList.remove('active');
            if (vistaTarjetas) vistaTarjetas.classList.add('d-none');
            if (compatibilidadesSection) compatibilidadesSection.classList.remove('d-none');
        });
        btnVistaTarjetas.addEventListener('click', () => {
            btnVistaTarjetas.classList.add('active');
            btnVistaTabla.classList.remove('active');
            if (vistaTarjetas) vistaTarjetas.classList.remove('d-none');
            if (compatibilidadesSection) compatibilidadesSection.classList.add('d-none');
            if (vistaTarjetas && vistaTarjetas.children.length === 0 && compatibilidadesData.length > 0) {
                cargarVistaTarjetas(compatibilidadesData.slice(0, itemsPerPage));
            }
        });
    }
    
    const btnSearch = document.getElementById('btnSearch');
    const globalSearch = document.getElementById('globalSearch');
    if (btnSearch) btnSearch.addEventListener('click', buscarCompatibilidades);
    if (globalSearch) globalSearch.addEventListener('keypress', e => { if (e.key === 'Enter') buscarCompatibilidades(); });
    
    document.getElementById('ordenarPor')?.addEventListener('change', aplicarFiltros);
    
    const modalAgregar = document.getElementById('modalAgregarCompatibilidad');
    if (modalAgregar) {
        modalAgregar.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('formAgregarCompatibilidad');
            if (form) form.reset();
            compatibilidadEditandoId = null;
            document.querySelector('#modalAgregarCompatibilidad .modal-title').innerHTML = '<i class="fas fa-link me-2"></i>Agregar Compatibilidad';
            const submitBtn = form?.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar compatibilidad';
                submitBtn.className = 'btn btn-primary';
            }
        });
    }
    
    cargarDatosIniciales();
});