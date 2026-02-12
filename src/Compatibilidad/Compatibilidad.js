// ============================
// Variables globales
// ============================
let compatibilidadesData = [];
let productosData = [];
let vehiculosData = [];
let compatibilidadEditandoId = null;

// ============================
// Cargar datos iniciales
// ============================
async function cargarDatosIniciales() {
    try {
        // Cargar compatibilidades
        const compatResponse = await fetch('/api/compatibilidades');
        if (!compatResponse.ok) throw new Error('Error al cargar compatibilidades');
        compatibilidadesData = await compatResponse.json();
        
        // Cargar productos para filtros y formulario
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
        
        // Cargar vehículos para filtros y formulario
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
        
        // Cargar filtros
        cargarFiltros();
        
        // Mostrar compatibilidades
        mostrarCompatibilidades(compatibilidadesData);
        
        // Calcular estadísticas
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
    
    if (!selectProducto || !selectVehiculo || !selectProductoForm || !selectVehiculoForm) return;
    
    // Limpiar opciones existentes
    selectProducto.innerHTML = '<option value="">Todos los productos</option>';
    selectVehiculo.innerHTML = '<option value="">Todos los vehículos</option>';
    selectProductoForm.innerHTML = '<option value="">Seleccionar producto...</option>';
    selectVehiculoForm.innerHTML = '<option value="">Seleccionar vehículo...</option>';
    
    // Cargar productos en filtros
    productosData.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.id_producto;
        option.textContent = `${producto.nombre} (${producto.marca})`;
        selectProducto.appendChild(option);
        
        const optionForm = document.createElement('option');
        optionForm.value = producto.id_producto;
        optionForm.textContent = `${producto.nombre} (${producto.marca}) - ${producto.numero_parte || 'Sin número'}`;
        selectProductoForm.appendChild(optionForm);
    });
    
    // Cargar vehículos en filtros
    vehiculosData.forEach(vehiculo => {
        const option = document.createElement('option');
        option.value = vehiculo.id_vehiculo;
        option.textContent = `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.año})`;
        selectVehiculo.appendChild(option);
        
        const optionForm = document.createElement('option');
        optionForm.value = vehiculo.id_vehiculo;
        optionForm.textContent = `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.año})`;
        selectVehiculoForm.appendChild(optionForm);
    });
}

// ============================
// Mostrar compatibilidades en tabla
// ============================
function mostrarCompatibilidades(compatibilidades) {
    const tbody = document.getElementById('tblCompatibilidades');
    const contador = document.getElementById('contadorCompatibilidades');
    
    if (!tbody || !contador) return;
    
    if (compatibilidades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-unlink fa-2x mb-2"></i><br>
                    No hay compatibilidades registradas
                </td>
            </tr>
        `;
        contador.textContent = '0 compatibilidades';
        return;
    }
    
    contador.textContent = `${compatibilidades.length} compatibilidades`;
    
    tbody.innerHTML = compatibilidades.map(comp => `
        <tr>
            <td><span class="badge bg-secondary">${comp.id_compatibilidad}</span></td>
            <td class="product-cell">
                <div class="fw-bold">${comp.producto_nombre || 'Producto ' + comp.id_producto}</div>
                <div class="small text-muted">
                    <span class="badge bg-light text-dark">${comp.producto_marca || 'Sin marca'}</span>
                    <span class="badge bg-info text-white">${comp.categoria_nombre || 'Sin categoría'}</span>
                    <code class="ms-1">${comp.numero_parte || 'Sin número'}</code>
                </div>
            </td>
            <td class="vehicle-cell">
                <div class="fw-bold">${comp.vehiculo_marca || 'Marca'} ${comp.vehiculo_modelo || 'Modelo'}</div>
                <div class="small text-muted">
                    <span class="badge bg-light text-dark">${comp.año || comp.vehiculo_año || 'Sin año'}</span>
                    <span class="badge bg-warning text-dark">${comp.vehiculo_motor || 'Sin motor'}</span>
                </div>
            </td>
            <td>
                <div class="small">
                    <div><strong>Producto ID:</strong> ${comp.id_producto}</div>
                    <div><strong>Vehículo ID:</strong> ${comp.id_vehiculo}</div>
                </div>
            </td>
            <td>
                <div class="small text-truncate" style="max-width: 150px;" title="${comp.notas || 'Sin notas'}">
                    ${comp.notas || '—'}
                </div>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info btn-action" 
                        onclick="verDetalles(${comp.id_compatibilidad})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning btn-action" 
                        onclick="editarCompatibilidad(${comp.id_compatibilidad})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-action" 
                        onclick="eliminarCompatibilidad(${comp.id_compatibilidad})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================
// Cargar vista de tarjetas (opcional)
// ============================
function cargarVistaTarjetas(compatibilidades) {
    const container = document.getElementById('vistaTarjetas');
    if (!container) return;
    
    if (compatibilidades.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay compatibilidades para mostrar
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = compatibilidades.map(comp => `
        <div class="col-md-6 col-lg-4">
            <div class="card compatibility-card h-100">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Compatibilidad</strong>
                            <div class="small">ID: ${comp.id_compatibilidad}</div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <h6 class="card-subtitle mb-2 text-muted">Producto</h6>
                        <div class="fw-bold">${comp.producto_nombre || 'Producto ' + comp.id_producto}</div>
                        <div class="small text-muted">
                            ${comp.producto_marca || 'Sin marca'} • ${comp.categoria_nombre || 'Sin categoría'}
                            <br><code>${comp.numero_parte || 'Sin número'}</code>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6 class="card-subtitle mb-2 text-muted">Vehículo Compatible</h6>
                        <div class="fw-bold">${comp.vehiculo_marca || 'Marca'} ${comp.vehiculo_modelo || 'Modelo'}</div>
                        <div class="small text-muted">
                            ${comp.año || comp.vehiculo_año || 'Sin año'} • ${comp.vehiculo_motor || 'Sin motor'}
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6 class="card-subtitle mb-2 text-muted">Notas</h6>
                        <p class="small mb-0">${comp.notas || 'Sin notas adicionales'}</p>
                    </div>
                </div>
                <div class="card-footer bg-white text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="verDetalles(${comp.id_compatibilidad})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editarCompatibilidad(${comp.id_compatibilidad})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="eliminarCompatibilidad(${comp.id_compatibilidad})">
                            <i class="fas fa-trash"></i>
                        </button>
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
    
    // Productos únicos con compatibilidades
    const productosUnicos = [...new Set(compatibilidadesData.map(c => c.id_producto))].length;
    
    // Vehículos únicos con compatibilidades
    const vehiculosUnicos = [...new Set(compatibilidadesData.map(c => c.id_vehiculo))].length;
    
    // Promedio de compatibilidades por producto
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
        
        document.getElementById('detallesContenido').innerHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <div class="text-center mb-3">
                        <i class="fas fa-link fa-3x text-primary"></i>
                    </div>
                    <h5 class="text-center">Compatibilidad Confirmada</h5>
                    <p class="text-center text-muted">ID: ${comp.id_compatibilidad}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="fas fa-box me-2"></i>Información del Producto</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <strong>Nombre:</strong>
                                <span class="float-end">${comp.producto_nombre || 'Producto ' + comp.id_producto}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Marca:</strong>
                                <span class="badge bg-light text-dark float-end">${comp.producto_marca || 'Sin marca'}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Categoría:</strong>
                                <span class="badge bg-info text-white float-end">${comp.categoria_nombre || 'Sin categoría'}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Número de Parte:</strong>
                                <span class="float-end"><code>${comp.numero_parte || 'No disponible'}</code></span>
                            </div>
                            <div class="mb-2">
                                <strong>ID del Producto:</strong>
                                <span class="badge bg-secondary float-end">${comp.id_producto}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="fas fa-car me-2"></i>Información del Vehículo</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <strong>Marca y Modelo:</strong>
                                <span class="float-end">${comp.vehiculo_marca || 'Marca'} ${comp.vehiculo_modelo || 'Modelo'}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Año:</strong>
                                <span class="badge bg-light text-dark float-end">${comp.año || comp.vehiculo_año || 'No disponible'}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Motor:</strong>
                                <span class="badge bg-warning text-dark float-end">${comp.vehiculo_motor || 'No disponible'}</span>
                            </div>
                            <div class="mb-2">
                                <strong>ID del Vehículo:</strong>
                                <span class="badge bg-secondary float-end">${comp.id_vehiculo}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 mb-3">
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="fas fa-sticky-note me-2"></i>Información de Compatibilidad</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <strong>ID de Compatibilidad:</strong>
                                <span class="badge bg-primary float-end">${comp.id_compatibilidad}</span>
                            </div>
                            <div class="mb-3">
                                <strong>Notas:</strong>
                                <p class="mt-2 mb-0">${comp.notas || 'No hay notas adicionales.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        Esta compatibilidad ha sido registrada en el sistema.
                    </div>
                </div>
            </div>
        `;
        
        new bootstrap.Modal(document.getElementById('modalDetalles')).show();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// ============================
// Editar compatibilidad desde detalles
// ============================
function editarCompatibilidadDesdeDetalles() {
    const modalDetalles = bootstrap.Modal.getInstance(document.getElementById('modalDetalles'));
    if (modalDetalles) {
        modalDetalles.hide();
    }
    
    setTimeout(() => {
        // Obtener el ID de la compatibilidad desde el modal de detalles
        const detallesContent = document.getElementById('detallesContenido').innerHTML;
        const match = detallesContent.match(/ID de Compatibilidad:.*?badge.*?>(\d+)<\/span>/);
        if (match) {
            editarCompatibilidad(parseInt(match[1]));
        }
    }, 300);
}

// ============================
// Editar compatibilidad
// ============================
function editarCompatibilidad(id) {
    const comp = compatibilidadesData.find(c => c.id_compatibilidad === id);
    if (!comp) {
        alert('Compatibilidad no encontrada');
        return;
    }
    
    compatibilidadEditandoId = id;
    
    const form = document.getElementById('formAgregarCompatibilidad');
    const productoSelect = form.querySelector('select[name="id_producto"]');
    const vehiculoSelect = form.querySelector('select[name="id_vehiculo"]');
    
    // Establecer valores
    productoSelect.value = comp.id_producto;
    vehiculoSelect.value = comp.id_vehiculo;
    form.querySelector('textarea[name="notas"]').value = comp.notas || '';
    
    // Cambiar título del modal
    document.querySelector('#modalAgregarCompatibilidad .modal-title')
        .innerHTML = '<i class="fas fa-edit me-2"></i>Editar Compatibilidad';
    
    // Cambiar el botón de guardar
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar compatibilidad';
    submitBtn.className = 'btn btn-warning';
    
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
    
    if (!confirm(`¿Eliminar la compatibilidad entre "${productoNombre}" y "${vehiculoNombre}"?\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/compatibilidades/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar');
        }
        
        const result = await response.json();
        alert('✅ ' + result.message);
        refreshCompatibilidades();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ ' + error.message);
    }
}

// ============================
// Guardar (Crear/Editar) compatibilidad
// ============================
document.getElementById('formAgregarCompatibilidad').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        id_producto: this.id_producto.value,
        id_vehiculo: this.id_vehiculo.value,
        notas: this.notas.value || null
    };
    
    if (!formData.id_producto || !formData.id_vehiculo) {
        alert('❌ Por favor selecciona un producto y un vehículo');
        return;
    }
    
    try {
        let url = '/api/compatibilidades';
        let method = 'POST';
        
        if (compatibilidadEditandoId) {
            url = `/api/compatibilidades/${compatibilidadEditandoId}`;
            method = 'PUT';
        }
        
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
        alert('✅ ' + result.message);
        
        // Limpiar formulario y cerrar modal
        this.reset();
        compatibilidadEditandoId = null;
        
        // Restaurar botón y título
        document.querySelector('#modalAgregarCompatibilidad .modal-title')
            .innerHTML = '<i class="fas fa-link me-2"></i>Agregar Compatibilidad';
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar compatibilidad';
        submitBtn.className = 'btn btn-primary';
        
        bootstrap.Modal.getInstance(document.getElementById('modalAgregarCompatibilidad')).hide();
        
        // Refrescar datos
        refreshCompatibilidades();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ ' + error.message);
    }
});

// ============================
// Aplicar filtros
// ============================
function aplicarFiltros() {
    const filtroProducto = document.getElementById('filterProducto').value;
    const filtroVehiculo = document.getElementById('filterVehiculo').value;
    const orden = document.getElementById('ordenarPor').value;
    
    let dataFiltrada = [...compatibilidadesData];
    
    // Filtrar por producto
    if (filtroProducto) {
        dataFiltrada = dataFiltrada.filter(c => c.id_producto == filtroProducto);
    }
    
    // Filtrar por vehículo
    if (filtroVehiculo) {
        dataFiltrada = dataFiltrada.filter(c => c.id_vehiculo == filtroVehiculo);
    }
    
    // Ordenar
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
        case 'producto':
        default:
            dataFiltrada.sort((a, b) => (a.producto_nombre || '').localeCompare(b.producto_nombre || ''));
            break;
    }
    
    mostrarCompatibilidades(dataFiltrada);
    
    // Actualizar vista de tarjetas si está visible
    const vistaTarjetas = document.getElementById('vistaTarjetas');
    if (vistaTarjetas && !vistaTarjetas.classList.contains('d-none')) {
        cargarVistaTarjetas(dataFiltrada);
    }
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
    try {
        const tbody = document.getElementById('tblCompatibilidades');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                        Cargando compatibilidades...
                    </td>
                </tr>
            `;
        }
        
        await cargarDatosIniciales();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar compatibilidades: ' + error.message);
    }
}

// ============================
// Mostrar error
// ============================
function mostrarError(mensaje) {
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
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', function() {
    // Configurar botones de vista (tabla/tarjetas)
    const btnVistaTabla = document.getElementById('btnVistaTabla');
    const btnVistaTarjetas = document.getElementById('btnVistaTarjetas');
    
    if (btnVistaTabla && btnVistaTarjetas) {
        btnVistaTabla.addEventListener('click', function() {
            this.classList.add('active');
            btnVistaTarjetas.classList.remove('active');
            document.getElementById('vistaTarjetas').classList.add('d-none');
            document.getElementById('compatibilidades').classList.remove('d-none');
        });
        
        btnVistaTarjetas.addEventListener('click', function() {
            this.classList.add('active');
            btnVistaTabla.classList.remove('active');
            document.getElementById('vistaTarjetas').classList.remove('d-none');
            document.getElementById('compatibilidades').classList.add('d-none');
            
            // Cargar tarjetas si no están cargadas
            const container = document.getElementById('vistaTarjetas');
            if (container.children.length === 0) {
                cargarVistaTarjetas(compatibilidadesData);
            }
        });
    }
    
    // Configurar búsqueda
    const btnSearch = document.getElementById('btnSearch');
    if (btnSearch) {
        btnSearch.addEventListener('click', buscarCompatibilidades);
    }
    
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarCompatibilidades();
            }
        });
    }
    
    // Restaurar formulario cuando se cierre el modal
    const modalAgregar = document.getElementById('modalAgregarCompatibilidad');
    if (modalAgregar) {
        modalAgregar.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('formAgregarCompatibilidad');
            form.reset();
            compatibilidadEditandoId = null;
            
            // Restaurar título y botón
            document.querySelector('#modalAgregarCompatibilidad .modal-title')
                .innerHTML = '<i class="fas fa-link me-2"></i>Agregar Compatibilidad';
            
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar compatibilidad';
            submitBtn.className = 'btn btn-primary';
        });
    }
    
    // Cargar datos iniciales
    cargarDatosIniciales();
});