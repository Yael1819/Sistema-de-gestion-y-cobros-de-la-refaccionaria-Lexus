// ============================
// Variables globales
// ============================
let vehiculosData = [];
let marcasList = [];
let vehiculoEditandoId = null;
let vehiculoDetalleId = null;

// Variables para paginación - 5 vehículos por página
let currentPage = 1;
const itemsPerPage = 5;
let filteredVehiculos = [];

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
    const tbody = document.getElementById('tblVehiculos');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger py-5">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
                    ${mensaje}
                </tr>
            </tr>
        `;
    }
    const contador = document.getElementById('contadorVehiculos');
    if (contador) contador.textContent = 'Error al cargar';
}

// ============================
// Colores para las marcas
// ============================
const coloresMarcas = {
    'Toyota': '#EB001B', 'Honda': '#002F6C', 'Ford': '#003478',
    'Nissan': '#C3002F', 'Chevrolet': '#FFB500', 'Hyundai': '#002C5F',
    'Mazda': '#8B0000', 'Lexus': '#1A1A1A', 'BMW': '#0066B1',
    'Mercedes-Benz': '#000000', 'Volkswagen': '#003478', 'Audi': '#CC0000',
    'Kia': '#002C5F', 'Subaru': '#003478', 'Jeep': '#000000'
};

function getColorForMarca(marca) {
    return coloresMarcas[marca] || '#6c757d';
}

// ============================
// Renderizar controles de paginación centrados
// ============================
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredVehiculos.length / itemsPerPage);
    
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
    const totalPages = Math.ceil(filteredVehiculos.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    mostrarVehiculos(filteredVehiculos, false);
}

// ============================
// Mostrar vehículos en la tabla con paginación
// ============================
function mostrarVehiculos(vehiculos, resetPage = true) {
    const tbody = document.getElementById('tblVehiculos');
    const contador = document.getElementById('contadorVehiculos');
    
    if (!tbody || !contador) return;
    
    filteredVehiculos = vehiculos;
    
    if (resetPage) currentPage = 1;
    
    if (filteredVehiculos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="fas fa-car fa-2x mb-2"></i><br>
                    No hay vehículos registrados
                </td>
            </tr>
        `;
        contador.textContent = '0 vehículos';
        renderPagination();
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const vehiculosPagina = filteredVehiculos.slice(startIndex, endIndex);
    const totalMostrados = Math.min(endIndex, filteredVehiculos.length);
    
    contador.textContent = `${filteredVehiculos.length} vehículos (Mostrando ${startIndex + 1}-${totalMostrados})`;
    
    tbody.innerHTML = vehiculosPagina.map(v => {
        const colorMarca = getColorForMarca(v.marca);
        const productosCompatible = v.productos_compatibles || 0;
        
        return `
            <tr>
                <td><span class="badge bg-secondary">${v.id_vehiculo}</span></td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="vehicle-badge me-2" style="background-color: ${colorMarca}; color: white;">●</span>
                        <span class="fw-bold">${escapeHtml(v.marca) || 'Sin marca'}</span>
                    </div>
                </td>
                <td><div class="fw-bold">${escapeHtml(v.modelo) || 'Sin modelo'}</div></td>
                <td><span class="badge bg-light text-dark">${v.año || '—'}</span></div>
                <td>${escapeHtml(v.motor) || '—'}</div>
                <td>
                    <span class="badge ${v.transmision === 'Automática' ? 'bg-info' : v.transmision === 'Manual' ? 'bg-warning' : v.transmision === 'CVT' ? 'bg-success' : 'bg-secondary'}">
                        ${v.transmision || '—'}
                    </span>
                </div>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="badge bg-primary me-2">${productosCompatible}</span>
                        <button class="btn btn-sm btn-outline-success" onclick="verCompatibilidades(${v.id_vehiculo})" title="Ver productos compatibles">
                            <i class="fas fa-link"></i>
                        </button>
                    </div>
                </div>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info btn-action" onclick="verDetalles(${v.id_vehiculo})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-action" onclick="editarVehiculo(${v.id_vehiculo})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-action" onclick="eliminarVehiculo(${v.id_vehiculo})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </tr>
        `;
    }).join('');
    
    cargarVistaTarjetas(vehiculosPagina);
    renderPagination();
}

function cargarVistaTarjetas(vehiculos) {
    const container = document.getElementById('vistaTarjetas');
    if (!container) return;
    container.innerHTML = '';
    
    if (vehiculos.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted py-5">No hay vehículos para mostrar</div>`;
        return;
    }
    
    vehiculos.forEach(v => {
        const colorMarca = getColorForMarca(v.marca);
        const productosCompatible = v.productos_compatibles || 0;
        
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3';
        col.innerHTML = `
            <div class="card vehicle-card h-100">
                <div class="card-header" style="background-color: ${colorMarca}; color: white;">
                    <div class="d-flex justify-content-between align-items-center">
                        <div><strong>${escapeHtml(v.marca) || 'Sin marca'}</strong><div class="small">${escapeHtml(v.modelo) || 'Sin modelo'}</div></div>
                        <span class="badge bg-white text-dark">${v.año || '—'}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-2"><small class="text-muted">Motor:</small><div class="fw-bold">${escapeHtml(v.motor) || 'No especificado'}</div></div>
                    <div class="mb-2"><small class="text-muted">Transmisión:</small><div><span class="badge ${v.transmision === 'Automática' ? 'bg-info' : v.transmision === 'Manual' ? 'bg-warning' : 'bg-success'}">${v.transmision || '—'}</span></div></div>
                    <div class="mb-3"><small class="text-muted">Compatibilidades:</small><div class="d-flex align-items-center"><span class="badge bg-primary me-2">${productosCompatible} productos</span><button class="btn btn-sm btn-outline-success" onclick="verCompatibilidades(${v.id_vehiculo})"><i class="fas fa-link"></i></button></div></div>
                    <p class="small text-muted mb-0">ID: ${v.id_vehiculo}</p>
                </div>
                <div class="card-footer bg-white text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="verDetalles(${v.id_vehiculo})"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-outline-warning" onclick="editarVehiculo(${v.id_vehiculo})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-outline-danger" onclick="eliminarVehiculo(${v.id_vehiculo})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// ============================
// Cargar datos iniciales
// ============================
async function cargarDatosIniciales() {
    try {
        const vehiculosResponse = await fetch('/api/vehiculos');
        if (!vehiculosResponse.ok) throw new Error(`Error al cargar vehículos: ${vehiculosResponse.status}`);
        
        vehiculosData = await vehiculosResponse.json();
        await cargarCompatibilidades();
        cargarFiltros();
        mostrarVehiculos(vehiculosData);
        calcularEstadisticas();
        cargarDistribucionMarcas();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar vehículos: ' + error.message);
    }
}

async function cargarCompatibilidades() {
    try {
        const response = await fetch('/api/compatibilidades');
        if (!response.ok) return;
        const compatibilidades = await response.json();
        vehiculosData.forEach(vehiculo => {
            vehiculo.productos_compatibles = compatibilidades.filter(c => c.id_vehiculo === vehiculo.id_vehiculo).length;
        });
    } catch (error) {
        console.error('Error cargando compatibilidades:', error);
    }
}

function cargarFiltros() {
    const selectMarca = document.getElementById('filterMarca');
    const datalistMarcas = document.getElementById('marcasList');
    const datalistAños = document.getElementById('añosSugeridos');
    
    if (!selectMarca) return;
    
    selectMarca.innerHTML = '<option value="">Todas las marcas</option>';
    if (datalistMarcas) datalistMarcas.innerHTML = '';
    if (datalistAños) datalistAños.innerHTML = '';
    
    marcasList = [...new Set(vehiculosData.map(v => v.marca))].sort();
    const añosList = [...new Set(vehiculosData.map(v => v.año))].sort((a, b) => b - a);
    
    marcasList.forEach(marca => {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca;
        selectMarca.appendChild(option);
        
        if (datalistMarcas) {
            const datalistOption = document.createElement('option');
            datalistOption.value = marca;
            datalistMarcas.appendChild(datalistOption);
        }
    });
    
    if (datalistAños) {
        añosList.forEach(año => {
            const datalistOption = document.createElement('option');
            datalistOption.value = año;
            datalistAños.appendChild(datalistOption);
        });
    }
}

function calcularEstadisticas() {
    const total = vehiculosData.length;
    const marcas = [...new Set(vehiculosData.map(v => v.marca))].length;
    const modelos = [...new Set(vehiculosData.map(v => v.modelo))].length;
    const totalCompatibilidades = vehiculosData.reduce((sum, v) => sum + (v.productos_compatibles || 0), 0);
    
    document.getElementById('countVehiculos').textContent = total;
    document.getElementById('countMarcas').textContent = marcas;
    document.getElementById('countModelos').textContent = modelos;
    document.getElementById('countCompatibilidades').textContent = totalCompatibilidades;
}

function cargarDistribucionMarcas() {
    const container = document.getElementById('marcasDistribucion');
    const listaMarcas = document.getElementById('listaMarcas');
    
    if (vehiculosData.length === 0) {
        if (container) container.innerHTML = '<p class="text-muted">No hay datos para mostrar</p>';
        if (listaMarcas) listaMarcas.innerHTML = '<p class="text-muted">No hay marcas registradas</p>';
        return;
    }
    
    const conteoMarcas = {};
    vehiculosData.forEach(v => {
        const marca = v.marca || 'Sin marca';
        conteoMarcas[marca] = (conteoMarcas[marca] || 0) + 1;
    });
    
    const marcasOrdenadas = Object.entries(conteoMarcas).sort((a, b) => b[1] - a[1]);
    
    if (container) {
        container.innerHTML = `
            <h6 class="card-title mb-3">Vehículos por Marca</h6>
            <div class="mb-3">
                ${marcasOrdenadas.map(([marca, cantidad]) => {
                    const porcentaje = (cantidad / vehiculosData.length * 100).toFixed(1);
                    const color = getColorForMarca(marca);
                    return `
                        <div class="mb-2">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="small">${escapeHtml(marca)}</span>
                                <span class="small fw-bold">${cantidad} (${porcentaje}%)</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar" role="progressbar" style="width: ${porcentaje}%; background-color: ${color}"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    if (listaMarcas) {
        listaMarcas.innerHTML = marcasOrdenadas.map(([marca, cantidad]) => `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <div class="d-flex align-items-center">
                    <span class="marca-badge me-2" style="background-color: ${getColorForMarca(marca)}; color: white;">●</span>
                    <span>${escapeHtml(marca)}</span>
                </div>
                <span class="badge bg-light text-dark">${cantidad}</span>
            </div>
        `).join('');
    }
}



// ============================
// Ver compatibilidades
// ============================
async function verCompatibilidades(id) {
    try {
        const response = await fetch(`/api/compatibilidades/vehiculo/${id}`);
        if (!response.ok) throw new Error('Error al cargar compatibilidades');
        
        const compatibilidades = await response.json();
        const vehiculo = vehiculosData.find(v => v.id_vehiculo === id) || {};
        
        const contenido = document.getElementById('compatibilidadesContenido');
        if (!contenido) return;
        
        contenido.innerHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <h6><i class="fas fa-car me-2 text-primary"></i>${escapeHtml(vehiculo.marca) || 'Vehículo'} ${escapeHtml(vehiculo.modelo) || ''}</h6>
                    <div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Este vehículo es compatible con <strong>${compatibilidades.length}</strong> productos</div>
                </div>
                <div class="col-12">
                    ${compatibilidades.length > 0 ? `
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead><tr><th>Producto</th><th>Categoría</th><th>N° Parte</th><th>Notas</th></tr></thead>
                                <tbody>${compatibilidades.map(compat => `
                                    <tr>
                                        <td><div class="fw-bold">${escapeHtml(compat.producto_nombre) || '—'}</div><small class="text-muted">${escapeHtml(compat.producto_marca) || ''}</small></div>
                                        <td><span class="badge bg-light text-dark">${escapeHtml(compat.categoria_nombre) || 'Sin categoría'}</span></div>
                                        <td><code>${escapeHtml(compat.numero_parte) || '—'}</code></div>
                                        <td><small class="text-muted">${escapeHtml(compat.notas) || '—'}</small></div>
                                    </tr>
                                `).join('')}</tbody>
                            </table>
                        </div>
                    ` : `<div class="text-center text-muted py-5"><i class="fas fa-link fa-3x mb-3"></i><br><h5>No hay productos compatibles</h5><p>Este vehículo no tiene productos compatibles registrados.</p></div>`}
                </div>
            </div>
        `;
        
        new bootstrap.Modal(document.getElementById('modalCompatibilidades')).show();
    } catch (error) {
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

// ============================
// Editar vehículo
// ============================
async function editarVehiculo(id) {
    try {
        let vehiculo = vehiculosData.find(v => v.id_vehiculo === id);
        if (!vehiculo) {
            const response = await fetch(`/api/vehiculos/${id}`);
            if (!response.ok) throw new Error('Vehículo no encontrado');
            vehiculo = await response.json();
        }
        llenarFormularioEdicion(vehiculo, id);
    } catch (error) {
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

function llenarFormularioEdicion(vehiculo, id) {
    const form = document.getElementById('formAgregarVehiculo');
    if (!form) return;
    
    vehiculoEditandoId = id;
    form.querySelector('input[name="marca"]').value = vehiculo.marca || '';
    form.querySelector('input[name="modelo"]').value = vehiculo.modelo || '';
    form.querySelector('input[name="año"]').value = vehiculo.año || '';
    form.querySelector('input[name="motor"]').value = vehiculo.motor || '';
    form.querySelector('textarea[name="notas"]').value = vehiculo.notas || '';
    
    const transmisiones = form.querySelectorAll('input[name="transmision"]');
    transmisiones.forEach(radio => { if (radio.value === vehiculo.transmision) radio.checked = true; });
    
    document.querySelector('#modalAgregarVehiculo .modal-title').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Vehículo';
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar vehículo';
        submitBtn.className = 'btn btn-warning';
    }
    
    new bootstrap.Modal(document.getElementById('modalAgregarVehiculo')).show();
}

function editarVehiculoDesdeDetalles() {
    if (vehiculoDetalleId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalles'));
        if (modal) modal.hide();
        editarVehiculo(vehiculoDetalleId);
    }
}

// ============================
// Eliminar vehículo
// ============================
async function eliminarVehiculo(id) {
    const vehiculo = vehiculosData.find(v => v.id_vehiculo === id);
    if (!vehiculo) return;
    
    const productosCompatibles = vehiculo.productos_compatibles || 0;
    const msg = productosCompatibles > 0 
        ? `El vehículo "${vehiculo.marca} ${vehiculo.modelo}" tiene ${productosCompatibles} productos compatibles.\n\n¿Está seguro de eliminar?`
        : `¿Está seguro de eliminar el vehículo "${vehiculo.marca} ${vehiculo.modelo}"?`;
    
    if (!confirm(msg)) return;
    
    try {
        const response = await fetch(`/api/vehiculos/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar');
        }
        
        mostrarNotificacion('✅ Vehículo eliminado correctamente', 'success');
        await refreshVehiculos();
    } catch (error) {
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
}

// ============================
// Aplicar filtros y búsqueda
// ============================
function aplicarFiltros() {
    const filtroMarca = document.getElementById('filterMarca').value;
    const filtroAño = document.getElementById('filterAño').value;
    const orden = document.getElementById('ordenarPor').value;
    
    let vehiculosFiltrados = [...vehiculosData];
    
    if (filtroMarca) vehiculosFiltrados = vehiculosFiltrados.filter(v => v.marca === filtroMarca);
    if (filtroAño) vehiculosFiltrados = vehiculosFiltrados.filter(v => v.año == filtroAño);
    
    vehiculosFiltrados.sort((a, b) => {
        switch(orden) {
            case 'modelo': return (a.modelo || '').localeCompare(b.modelo || '');
            case 'año_desc': return (b.año || 0) - (a.año || 0);
            case 'año_asc': return (a.año || 0) - (b.año || 0);
            default: return (a.marca || '').localeCompare(b.marca || '');
        }
    });
    
    mostrarVehiculos(vehiculosFiltrados);
}

async function buscarVehiculos() {
    const busqueda = document.getElementById('globalSearch').value.trim();
    
    if (!busqueda) {
        mostrarVehiculos(vehiculosData);
        return;
    }
    
    try {
        const response = await fetch(`/api/vehiculos/buscar/${encodeURIComponent(busqueda)}`);
        if (!response.ok) throw new Error('Error en la búsqueda');
        const resultados = await response.json();
        mostrarVehiculos(resultados);
    } catch (error) {
        const resultados = vehiculosData.filter(v => 
            (v.marca && v.marca.toLowerCase().includes(busqueda.toLowerCase())) ||
            (v.modelo && v.modelo.toLowerCase().includes(busqueda.toLowerCase())) ||
            (v.motor && v.motor.toLowerCase().includes(busqueda.toLowerCase())) ||
            (v.año && v.año.toString().includes(busqueda))
        );
        mostrarVehiculos(resultados);
    }
}

async function refreshVehiculos() {
    const tbody = document.getElementById('tblVehiculos');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5"><div class="spinner-border text-primary me-2"></div>Cargando vehículos...</td></tr>`;
    }
    await cargarDatosIniciales();
    mostrarNotificacion('✅ Datos actualizados correctamente', 'success');
}

// ============================
// Formulario submit
// ============================
document.getElementById('formAgregarVehiculo').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        marca: this.marca.value.trim(),
        modelo: this.modelo.value.trim(),
        año: this.año.value ? parseInt(this.año.value) : null,
        motor: this.motor.value.trim() || null,
        transmision: this.querySelector('input[name="transmision"]:checked')?.value || null
    };
    
    if (!formData.marca || !formData.modelo || !formData.año) {
        mostrarNotificacion('❌ Marca, modelo y año son obligatorios', 'danger');
        return;
    }
    
    if (formData.año < 1900 || formData.año > 2026) {
        mostrarNotificacion('❌ Ingrese un año válido (1900-2026)', 'danger');
        return;
    }
    
    try {
        let url = '/api/vehiculos';
        let method = 'POST';
        
        if (vehiculoEditandoId) {
            url = `/api/vehiculos/${vehiculoEditandoId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al guardar');
        }
        
        mostrarNotificacion('✅ Vehículo guardado correctamente', 'success');
        
        this.reset();
        vehiculoEditandoId = null;
        
        document.querySelector('#modalAgregarVehiculo .modal-title').innerHTML = '<i class="fas fa-car me-2"></i>Agregar Vehículo';
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar vehículo';
            submitBtn.className = 'btn btn-primary';
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarVehiculo'));
        if (modal) modal.hide();
        
        await refreshVehiculos();
    } catch (error) {
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
});

// ============================
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', function() {
    cargarUsuario();
    
    const btnSearch = document.getElementById('btnSearch');
    const globalSearch = document.getElementById('globalSearch');
    
    if (btnSearch) btnSearch.addEventListener('click', buscarVehiculos);
    if (globalSearch) globalSearch.addEventListener('keypress', e => { if (e.key === 'Enter') buscarVehiculos(); });
    
    const btnVistaTabla = document.getElementById('btnVistaTabla');
    const btnVistaTarjetas = document.getElementById('btnVistaTarjetas');
    const vistaTarjetas = document.getElementById('vistaTarjetas');
    const vehiculosSection = document.getElementById('vehiculos');
    
    if (btnVistaTabla && btnVistaTarjetas) {
        btnVistaTabla.addEventListener('click', () => {
            btnVistaTabla.classList.add('active');
            btnVistaTarjetas.classList.remove('active');
            if (vistaTarjetas) vistaTarjetas.classList.add('d-none');
            if (vehiculosSection) vehiculosSection.classList.remove('d-none');
        });
        btnVistaTarjetas.addEventListener('click', () => {
            btnVistaTarjetas.classList.add('active');
            btnVistaTabla.classList.remove('active');
            if (vistaTarjetas) vistaTarjetas.classList.remove('d-none');
            if (vehiculosSection) vehiculosSection.classList.add('d-none');
        });
    }
    
    document.getElementById('ordenarPor')?.addEventListener('change', aplicarFiltros);
    
    const modalAgregar = document.getElementById('modalAgregarVehiculo');
    if (modalAgregar) {
        modalAgregar.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('formAgregarVehiculo');
            if (form) form.reset();
            vehiculoEditandoId = null;
            document.querySelector('#modalAgregarVehiculo .modal-title').innerHTML = '<i class="fas fa-car me-2"></i>Agregar Vehículo';
            const submitBtn = form?.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar vehículo';
                submitBtn.className = 'btn btn-primary';
            }
        });
    }
    
    cargarDatosIniciales();
});