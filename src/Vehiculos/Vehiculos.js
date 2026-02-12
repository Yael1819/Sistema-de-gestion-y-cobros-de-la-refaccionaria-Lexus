// ============================
// Variables globales
// ============================
let vehiculosData = [];
let marcasList = [];
let vehiculoEditandoId = null;

// ============================
// Cargar datos iniciales
// ============================
async function cargarDatosIniciales() {
    try {
        console.log('Cargando vehículos desde la BD...');
        
        // Cargar vehículos
        const vehiculosResponse = await fetch('/api/vehiculos');
        if (!vehiculosResponse.ok) {
            throw new Error(`Error al cargar vehículos: ${vehiculosResponse.status}`);
        }
        
        vehiculosData = await vehiculosResponse.json();
        console.log('Vehículos cargados:', vehiculosData.length);
        
        // Cargar compatibilidades para contar productos compatibles
        await cargarCompatibilidades();
        
        // Cargar filtros
        cargarFiltros();
        
        // Mostrar vehículos
        mostrarVehiculos(vehiculosData);
        
        // Calcular estadísticas
        calcularEstadisticas();
        
        // Cargar distribución por marca
        cargarDistribucionMarcas();
        
    } catch (error) {
        console.error('Error en cargarDatosIniciales:', error);
        mostrarError('Error al cargar vehículos: ' + error.message);
    }
}

// ============================
// Cargar compatibilidades
// ============================
async function cargarCompatibilidades() {
    try {
        const response = await fetch('/api/compatibilidades');
        if (!response.ok) return;
        
        const compatibilidades = await response.json();
        
        // Contar compatibilidades por vehículo
        vehiculosData.forEach(vehiculo => {
            const compatibilidadesVehiculo = compatibilidades.filter(c => c.id_vehiculo === vehiculo.id_vehiculo);
            vehiculo.productos_compatibles = compatibilidadesVehiculo.length;
        });
        
    } catch (error) {
        console.error('Error cargando compatibilidades:', error);
    }
}

// ============================
// Cargar filtros
// ============================
function cargarFiltros() {
    const selectMarca = document.getElementById('filterMarca');
    const inputAño = document.getElementById('filterAño');
    const datalistMarcas = document.getElementById('marcasList');
    const datalistAños = document.getElementById('añosSugeridos');
    
    // Limpiar opciones existentes
    selectMarca.innerHTML = '<option value="">Todas las marcas</option>';
    if (datalistAños) {
        datalistAños.innerHTML = '';
    }
    datalistMarcas.innerHTML = '';
    
    // Obtener marcas y años únicos
    marcasList = [...new Set(vehiculosData.map(v => v.marca))].sort();
    const añosList = [...new Set(vehiculosData.map(v => v.año))].sort((a, b) => b - a);
    
    // Cargar marcas
    marcasList.forEach(marca => {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca;
        selectMarca.appendChild(option);
        
        // También para el datalist
        const datalistOption = document.createElement('option');
        datalistOption.value = marca;
        datalistMarcas.appendChild(datalistOption);
    });
    
    // Cargar años en datalist (solo sugerencias)
    if (datalistAños) {
        añosList.forEach(año => {
            const datalistOption = document.createElement('option');
            datalistOption.value = año;
            datalistAños.appendChild(datalistOption);
        });
    }
}

// ============================
// Colores para las marcas
// ============================
const coloresMarcas = {
    'Toyota': '#EB001B',
    'Honda': '#002F6C',
    'Ford': '#003478',
    'Nissan': '#C3002F',
    'Chevrolet': '#FFB500',
    'Hyundai': '#002C5F',
    'Mazda': '#8B0000',
    'Lexus': '#1A1A1A',
    'BMW': '#0066B1',
    'Mercedes-Benz': '#000000',
    'Volkswagen': '#003478',
    'Audi': '#CC0000',
    'Kia': '#002C5F',
    'Subaru': '#003478',
    'Jeep': '#000000',
    'Ram': '#FFB500',
    'GMC': '#FFB500',
    'Dodge': '#C3002F',
    'Chrysler': '#003478',
    'Buick': '#002F6C',
    'Cadillac': '#000000',
    'Acura': '#002F6C',
    'Infiniti': '#C3002F',
    'Volvo': '#0066B1',
    'Porsche': '#CC0000',
    'Land Rover': '#003478',
    'Jaguar': '#000000',
    'Mitsubishi': '#EB001B',
    'Suzuki': '#FFB500',
    'Fiat': '#003478',
    'Mini': '#0066B1'
};

function getColorForMarca(marca) {
    return coloresMarcas[marca] || '#6c757d';
}

// ============================
// Calcular estadísticas
// ============================
function calcularEstadisticas() {
    const total = vehiculosData.length;
    const marcas = [...new Set(vehiculosData.map(v => v.marca))].length;
    const modelos = [...new Set(vehiculosData.map(v => v.modelo))].length;
    const totalCompatibilidades = vehiculosData.reduce((sum, v) => sum + (v.productos_compatibles || 0), 0);
    
    document.getElementById('countVehiculos').textContent = total;
    document.getElementById('countMarcas').textContent = marcas;
    document.getElementById('countModelos').textContent = modelos;
    document.getElementById('countCompatibilidades').textContent = totalCompatibilidades;
    document.getElementById('contadorVehiculos').textContent = `${total} vehículos`;
}

// ============================
// Mostrar vehículos en la tabla
// ============================
function mostrarVehiculos(vehiculos) {
    const tbody = document.getElementById('tblVehiculos');
    const contador = document.getElementById('contadorVehiculos');
    
    if (!tbody || !contador) return;
    
    console.log('Mostrando vehículos:', vehiculos.length);
    
    if (vehiculos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="fas fa-car fa-2x mb-2"></i><br>
                    No hay vehículos registrados
                </td>
            </tr>
        `;
        contador.textContent = '0 vehículos';
        return;
    }
    
    contador.textContent = `${vehiculos.length} vehículos`;
    
    tbody.innerHTML = vehiculos.map(v => {
        const colorMarca = getColorForMarca(v.marca);
        const productosCompatible = v.productos_compatibles || 0;
        
        return `
            <tr>
                <td><span class="badge bg-secondary">${v.id_vehiculo}</span></td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="vehicle-badge me-2" style="background-color: ${colorMarca}; color: white;">●</span>
                        <span class="fw-bold">${v.marca || 'Sin marca'}</span>
                    </div>
                </td>
                <td>
                    <div class="fw-bold">${v.modelo || 'Sin modelo'}</div>
                </td>
                <td>
                    <span class="badge bg-light text-dark">${v.año || '—'}</span>
                </td>
                <td>${v.motor || '—'}</td>
                <td>
                    <span class="badge ${v.transmision === 'Automática' ? 'bg-info' : v.transmision === 'Manual' ? 'bg-warning' : v.transmision === 'CVT' ? 'bg-success' : 'bg-secondary'}">
                        ${v.transmision || '—'}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="badge bg-primary me-2">${productosCompatible}</span>
                        <button class="btn btn-sm btn-outline-success" onclick="verCompatibilidades(${v.id_vehiculo})" title="Ver productos compatibles">
                            <i class="fas fa-link"></i>
                        </button>
                    </div>
                </td>
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
                </td>
            </tr>
        `;
    }).join('');
    
    // También cargar vista de tarjetas
    cargarVistaTarjetas(vehiculos);
}

// ============================
// Cargar vista de tarjetas
// ============================
function cargarVistaTarjetas(vehiculos) {
    const container = document.getElementById('vistaTarjetas');
    container.innerHTML = '';
    
    if (vehiculos.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="fas fa-car fa-3x mb-3"></i><br>
                No hay vehículos para mostrar
            </div>
        `;
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
                        <div>
                            <strong>${v.marca || 'Sin marca'}</strong>
                            <div class="small">${v.modelo || 'Sin modelo'}</div>
                        </div>
                        <span class="badge bg-white text-dark">${v.año || '—'}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-2">
                        <small class="text-muted">Motor:</small>
                        <div class="fw-bold">${v.motor || 'No especificado'}</div>
                    </div>
                    <div class="mb-2">
                        <small class="text-muted">Transmisión:</small>
                        <div>
                            <span class="badge ${v.transmision === 'Automática' ? 'bg-info' : v.transmision === 'Manual' ? 'bg-warning' : v.transmision === 'CVT' ? 'bg-success' : 'bg-secondary'}">
                                ${v.transmision || '—'}
                            </span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">Compatibilidades:</small>
                        <div class="d-flex align-items-center">
                            <span class="badge bg-primary me-2">${productosCompatible} productos</span>
                            <button class="btn btn-sm btn-outline-success" onclick="verCompatibilidades(${v.id_vehiculo})">
                                <i class="fas fa-link"></i>
                            </button>
                        </div>
                    </div>
                    <p class="small text-muted mb-0">ID: ${v.id_vehiculo}</p>
                </div>
                <div class="card-footer bg-white text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="verDetalles(${v.id_vehiculo})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editarVehiculo(${v.id_vehiculo})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="eliminarVehiculo(${v.id_vehiculo})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// ============================
// Cargar distribución por marca
// ============================
function cargarDistribucionMarcas() {
    const container = document.getElementById('marcasDistribucion');
    const listaMarcas = document.getElementById('listaMarcas');
    
    if (vehiculosData.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay datos para mostrar</p>';
        listaMarcas.innerHTML = '<p class="text-muted">No hay marcas registradas</p>';
        return;
    }
    
    // Contar vehículos por marca
    const conteoMarcas = {};
    vehiculosData.forEach(v => {
        const marca = v.marca || 'Sin marca';
        conteoMarcas[marca] = (conteoMarcas[marca] || 0) + 1;
    });
    
    // Ordenar por cantidad (mayor a menor)
    const marcasOrdenadas = Object.entries(conteoMarcas)
        .sort((a, b) => b[1] - a[1]);
    
    // Generar gráfico de barras simple
    container.innerHTML = `
        <h6 class="card-title mb-3">Vehículos por Marca</h6>
        <div class="mb-3">
            ${marcasOrdenadas.map(([marca, cantidad]) => {
                const porcentaje = (cantidad / vehiculosData.length * 100).toFixed(1);
                const color = getColorForMarca(marca);
                return `
                    <div class="mb-2">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="small">${marca}</span>
                            <span class="small fw-bold">${cantidad} (${porcentaje}%)</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar" 
                                 role="progressbar" 
                                 style="width: ${porcentaje}%; background-color: ${color}"
                                 aria-valuenow="${porcentaje}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    // Generar lista de marcas
    listaMarcas.innerHTML = marcasOrdenadas.map(([marca, cantidad]) => `
        <div class="d-flex justify-content-between align-items-center mb-1">
            <div class="d-flex align-items-center">
                <span class="marca-badge me-2" style="background-color: ${getColorForMarca(marca)}; color: white;">●</span>
                <span>${marca}</span>
            </div>
            <span class="badge bg-light text-dark">${cantidad}</span>
        </div>
    `).join('');
}

// ============================
// Ver detalles de vehículo
// ============================
async function verDetalles(id) {
    try {
        let vehiculo = vehiculosData.find(v => v.id_vehiculo === id);
        
        if (!vehiculo) {
            const response = await fetch(`/api/vehiculos/${id}`);
            if (!response.ok) throw new Error('Vehículo no encontrado');
            vehiculo = await response.json();
        }
        
        mostrarDetallesModal(vehiculo);
        
    } catch (error) {
        console.error('Error en verDetalles:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

function mostrarDetallesModal(vehiculo) {
    const colorMarca = getColorForMarca(vehiculo.marca);
    
    document.getElementById('detallesContenido').innerHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <div class="text-center mb-3">
                    <div class="bg-primary rounded-circle d-inline-flex p-3" style="background-color: ${colorMarca} !important;">
                        <i class="fas fa-car fa-2x text-white"></i>
                    </div>
                </div>
                <h5 class="text-center">${vehiculo.marca || 'Sin marca'} ${vehiculo.modelo || 'Sin modelo'}</h5>
                <p class="text-center text-muted">ID: ${vehiculo.id_vehiculo}</p>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <div class="card-header bg-light">
                        <h6 class="mb-0"><i class="fas fa-cogs me-2"></i>Especificaciones</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-2">
                            <small class="text-muted">Año</small>
                            <div class="fw-bold">${vehiculo.año || '—'}</div>
                        </div>
                        <hr>
                        <div class="mb-2">
                            <small class="text-muted">Motor</small>
                            <div class="fw-bold">${vehiculo.motor || 'No especificado'}</div>
                        </div>
                        <hr>
                        <div class="mb-0">
                            <small class="text-muted">Transmisión</small>
                            <div>
                                <span class="badge ${vehiculo.transmision === 'Automática' ? 'bg-info' : vehiculo.transmision === 'Manual' ? 'bg-warning' : vehiculo.transmision === 'CVT' ? 'bg-success' : 'bg-secondary'}">
                                    ${vehiculo.transmision || '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <div class="card-header bg-light">
                        <h6 class="mb-0"><i class="fas fa-link me-2"></i>Compatibilidades</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-2">
                            <small class="text-muted">Productos compatibles</small>
                            <div class="fw-bold fs-4 text-primary">${vehiculo.productos_compatibles || 0}</div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-primary w-100" onclick="verCompatibilidades(${vehiculo.id_vehiculo})">
                                <i class="fas fa-link me-1"></i> Ver productos compatibles
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

// ============================
// Ver compatibilidades de vehículo
// ============================
async function verCompatibilidades(id) {
    try {
        const response = await fetch(`/api/compatibilidades/vehiculo/${id}`);
        if (!response.ok) {
            throw new Error('Error al cargar compatibilidades');
        }
        
        const compatibilidades = await response.json();
        const vehiculo = vehiculosData.find(v => v.id_vehiculo === id) || {};
        
        mostrarModalCompatibilidades(vehiculo, compatibilidades);
        
    } catch (error) {
        console.error('Error en verCompatibilidades:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

function mostrarModalCompatibilidades(vehiculo, compatibilidades) {
    const compatibilidadesCount = compatibilidades.length;
    
    document.getElementById('detallesContenido').innerHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <h6><i class="fas fa-car me-2 text-primary"></i>${vehiculo.marca || 'Vehículo'} ${vehiculo.modelo || ''}</h6>
                <p class="text-muted mb-2">Productos compatibles con este vehículo</p>
                
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Este vehículo es compatible con <strong>${compatibilidadesCount}</strong> productos
                </div>
            </div>
            <div class="col-12">
                ${compatibilidadesCount > 0 
                    ? `
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Categoría</th>
                                        <th>N° Parte</th>
                                        <th>Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${compatibilidades.map(compat => `
                                        <tr>
                                            <td>
                                                <div class="fw-bold">${compat.producto_nombre || '—'}</div>
                                                <small class="text-muted">${compat.producto_marca || ''}</small>
                                            </td>
                                            <td><span class="badge bg-light text-dark">${compat.categoria_nombre || 'Sin categoría'}</span></td>
                                            <td><code>${compat.numero_parte || '—'}</code></td>
                                            <td><small class="text-muted">${compat.notas || '—'}</small></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `
                    : `
                        <div class="text-center text-muted py-5">
                            <i class="fas fa-link fa-3x mb-3"></i><br>
                            <h5>No hay productos compatibles</h5>
                            <p>Este vehículo no tiene productos compatibles registrados.</p>
                        </div>
                    `
                }
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    modal.show();
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
        console.error('Error en editarVehiculo:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

function llenarFormularioEdicion(vehiculo, id) {
    const form = document.getElementById('formAgregarVehiculo');
    if (!form) {
        console.error('No se encontró el formulario');
        return;
    }
    
    vehiculoEditandoId = id;
    
    // Llenar campos del formulario
    form.querySelector('input[name="marca"]').value = vehiculo.marca || '';
    form.querySelector('input[name="modelo"]').value = vehiculo.modelo || '';
    form.querySelector('input[name="año"]').value = vehiculo.año || '';
    form.querySelector('input[name="motor"]').value = vehiculo.motor || '';
    form.querySelector('textarea[name="notas"]').value = vehiculo.notas || '';
    
    // Seleccionar transmisión correcta
    const transmisiones = form.querySelectorAll('input[name="transmision"]');
    transmisiones.forEach(radio => {
        if (radio.value === vehiculo.transmision) {
            radio.checked = true;
        }
    });
    
    // Cambiar título del modal
    const modalTitle = document.querySelector('#modalAgregarVehiculo .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Vehículo';
    }
    
    // Modificar el botón de guardar
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar vehículo';
        submitBtn.className = 'btn btn-warning';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalAgregarVehiculo'));
    modal.show();
}

// ============================
// Eliminar vehículo
// ============================
async function eliminarVehiculo(id) {
    const vehiculo = vehiculosData.find(v => v.id_vehiculo === id);
    if (!vehiculo) {
        mostrarNotificacion('Vehículo no encontrado', 'danger');
        return;
    }
    
    const productosCompatibles = vehiculo.productos_compatibles || 0;
    
    if (productosCompatibles > 0) {
        if (!confirm(`El vehículo "${vehiculo.marca} ${vehiculo.modelo}" tiene ${productosCompatibles} productos compatibles.\n\n¿Está seguro de eliminar? Las compatibilidades asociadas también se eliminarán.`)) {
            return;
        }
    } else {
        if (!confirm(`¿Está seguro de eliminar el vehículo "${vehiculo.marca} ${vehiculo.modelo}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }
    }
    
    try {
        const response = await fetch(`/api/vehiculos/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar el vehículo');
        }
        
        const result = await response.json();
        
        // Actualizar datos locales
        vehiculosData = vehiculosData.filter(v => v.id_vehiculo !== id);
        
        mostrarNotificacion('✅ ' + (result.message || 'Vehículo eliminado correctamente'), 'success');
        
        // Refrescar interfaz
        mostrarVehiculos(vehiculosData);
        calcularEstadisticas();
        cargarDistribucionMarcas();
        cargarFiltros();
        
    } catch (error) {
        console.error('Error en eliminarVehiculo:', error);
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
}

// ============================
// Aplicar filtros
// ============================
function aplicarFiltros() {
    const filtroMarca = document.getElementById('filterMarca').value;
    const filtroAño = document.getElementById('filterAño').value;
    const orden = document.getElementById('ordenarPor').value;
    
    let vehiculosFiltrados = [...vehiculosData];
    
    if (filtroMarca) {
        vehiculosFiltrados = vehiculosFiltrados.filter(v => v.marca === filtroMarca);
    }
    
    if (filtroAño) {
        vehiculosFiltrados = vehiculosFiltrados.filter(v => v.año == filtroAño);
    }
    
    // Aplicar ordenamiento
    vehiculosFiltrados.sort((a, b) => {
        switch(orden) {
            case 'modelo': return (a.modelo || '').localeCompare(b.modelo || '');
            case 'año_desc': return (b.año || 0) - (a.año || 0);
            case 'año_asc': return (a.año || 0) - (b.año || 0);
            default: return (a.marca || '').localeCompare(b.marca || '');
        }
    });
    
    mostrarVehiculos(vehiculosFiltrados);
    document.getElementById('contadorVehiculos').textContent = `${vehiculosFiltrados.length} vehículos`;
}

// ============================
// Buscar vehículos
// ============================
async function buscarVehiculos() {
    const busqueda = document.getElementById('globalSearch').value.trim();
    
    if (!busqueda) {
        mostrarVehiculos(vehiculosData);
        document.getElementById('contadorVehiculos').textContent = `${vehiculosData.length} vehículos`;
        return;
    }
    
    try {
        const response = await fetch(`/api/vehiculos/buscar/${encodeURIComponent(busqueda)}`);
        if (!response.ok) {
            throw new Error('Error en la búsqueda');
        }
        
        const resultados = await response.json();
        mostrarVehiculos(resultados);
        
        document.getElementById('contadorVehiculos').textContent = 
            `${resultados.length} vehículos encontrados`;
            
    } catch (error) {
        console.error('Error en buscarVehiculos:', error);
        // Búsqueda local si falla la API
        const resultados = vehiculosData.filter(v => 
            (v.marca && v.marca.toLowerCase().includes(busqueda.toLowerCase())) ||
            (v.modelo && v.modelo.toLowerCase().includes(busqueda.toLowerCase())) ||
            (v.motor && v.motor.toLowerCase().includes(busqueda.toLowerCase())) ||
            (v.año && v.año.toString().includes(busqueda)) ||
            (v.transmision && v.transmision.toLowerCase().includes(busqueda.toLowerCase()))
        );
        
        mostrarVehiculos(resultados);
        document.getElementById('contadorVehiculos').textContent = 
            `${resultados.length} vehículos encontrados`;
    }
}

// ============================
// Refrescar datos
// ============================
async function refreshVehiculos() {
    try {
        const tbody = document.getElementById('tblVehiculos');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <div class="spinner-border text-primary me-2"></div>
                        <span class="text-muted">Cargando vehículos...</span>
                    </td>
                </tr>
            `;
        }
        
        await cargarDatosIniciales();
        mostrarNotificacion('✅ Datos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('Error en refreshVehiculos:', error);
        mostrarError('Error al cargar vehículos: ' + error.message);
    }
}

// ============================
// Mostrar error
// ============================
function mostrarError(mensaje) {
    console.error('Mostrando error:', mensaje);
    
    const tbody = document.getElementById('tblVehiculos');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger py-5">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
                    ${mensaje}<br>
                    <small class="text-muted">Intenta recargar la página o verifica tu conexión</small>
                </td>
            </tr>
        `;
    }
    
    const contador = document.getElementById('contadorVehiculos');
    if (contador) {
        contador.textContent = 'Error al cargar';
    }
}

// ============================
// Mostrar notificación
// ============================
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Remover notificaciones anteriores
    const toastsAnteriores = document.querySelectorAll('.custom-toast');
    toastsAnteriores.forEach(toast => toast.remove());
    
    // Crear nueva notificación
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
    
    const bsToast = new bootstrap.Toast(toast, {
        delay: 3000,
        autohide: true
    });
    
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// ============================
// Handler para agregar/editar vehículo
// ============================
document.getElementById('formAgregarVehiculo').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('Enviando formulario de vehículo...');
    
    const formData = {
        marca: this.marca.value.trim(),
        modelo: this.modelo.value.trim(),
        año: this.año.value ? parseInt(this.año.value) : null,
        motor: this.motor.value.trim() || null,
        transmision: this.querySelector('input[name="transmision"]:checked')?.value || null
    };
    
    // Validaciones
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
            formData.id_vehiculo = vehiculoEditandoId;
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
            throw new Error(error.error || 'Error al guardar el vehículo');
        }
        
        const result = await response.json();
        
        mostrarNotificacion('✅ ' + (result.message || 'Vehículo guardado correctamente'), 'success');
        
        // Limpiar formulario y cerrar modal
        this.reset();
        vehiculoEditandoId = null;
        
        // Restaurar título y botón
        const modalTitle = document.querySelector('#modalAgregarVehiculo .modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-car me-2"></i>Agregar Vehículo';
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar vehículo';
            submitBtn.className = 'btn btn-primary';
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarVehiculo'));
        if (modal) {
            modal.hide();
        }
        
        // Refrescar datos
        await refreshVehiculos();
        
    } catch (error) {
        console.error('Error en submit formulario:', error);
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
});

// ============================
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando Vehiculos.js');
    
    // Configurar búsqueda
    const btnSearch = document.getElementById('btnSearch');
    const globalSearch = document.getElementById('globalSearch');
    
    if (btnSearch) {
        btnSearch.addEventListener('click', buscarVehiculos);
    }
    
    if (globalSearch) {
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarVehiculos();
            }
        });
        
        // Búsqueda en tiempo real con debounce
        let searchTimeout;
        globalSearch.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.trim().length >= 2 || this.value.trim().length === 0) {
                    buscarVehiculos();
                }
            }, 300);
        });
    }
    
    // Configurar botones de vista
    document.getElementById('btnVistaTabla').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('btnVistaTarjetas').classList.remove('active');
        document.getElementById('vistaTarjetas').classList.add('d-none');
        document.getElementById('vehiculos').classList.remove('d-none');
    });
    
    document.getElementById('btnVistaTarjetas').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('btnVistaTabla').classList.remove('active');
        document.getElementById('vistaTarjetas').classList.remove('d-none');
        document.getElementById('vehiculos').classList.add('d-none');
    });
    
    // Configurar ordenamiento
    document.getElementById('ordenarPor').addEventListener('change', aplicarFiltros);
    
    // Configurar aplicación de filtros
    const btnAplicarFiltros = document.querySelector('button[onclick="aplicarFiltros()"]');
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
    }
    
    // Validación en tiempo real para el año en el formulario
    const añoInput = document.querySelector('input[name="año"]');
    if (añoInput) {
        añoInput.addEventListener('blur', function() {
            const año = parseInt(this.value);
            
            if (this.value && (año < 1900 || año > 2026)) {
                this.classList.add('is-invalid');
                const feedback = this.nextElementSibling?.classList.contains('invalid-feedback') 
                    ? this.nextElementSibling 
                    : document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = 'Ingrese un año válido (1900-2026)';
                if (!this.nextElementSibling?.classList.contains('invalid-feedback')) {
                    this.parentNode.insertBefore(feedback, this.nextSibling);
                }
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
                const invalidFeedback = this.nextElementSibling;
                if (invalidFeedback && invalidFeedback.classList.contains('invalid-feedback')) {
                    invalidFeedback.remove();
                }
            }
        });
    }
    
    // Restaurar formulario cuando se cierre el modal
    const modalAgregar = document.getElementById('modalAgregarVehiculo');
    if (modalAgregar) {
        modalAgregar.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('formAgregarVehiculo');
            if (form) {
                form.reset();
                // Remover clases de validación
                const inputs = form.querySelectorAll('.form-control');
                inputs.forEach(input => {
                    input.classList.remove('is-valid', 'is-invalid');
                });
                // Remover mensajes de error
                const invalidFeedbacks = form.querySelectorAll('.invalid-feedback');
                invalidFeedbacks.forEach(fb => fb.remove());
            }
            vehiculoEditandoId = null;
            
            // Restaurar título y botón
            const modalTitle = document.querySelector('#modalAgregarVehiculo .modal-title');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-car me-2"></i>Agregar Vehículo';
            }
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar vehículo';
                submitBtn.className = 'btn btn-primary';
            }
        });
    }
    
    // Configurar tooltips para botones de acción
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[title]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Cargar datos iniciales
    cargarDatosIniciales();
    
    console.log('Vehiculos.js inicializado correctamente');
});

// ============================
// Función para editar desde detalles
// ============================
function editarVehiculoDesdeDetalles() {
    const modalDetalles = bootstrap.Modal.getInstance(document.getElementById('modalDetalles'));
    if (modalDetalles) {
        modalDetalles.hide();
    }
    
    // Obtener el ID del vehículo desde los detalles
    const detallesContenido = document.getElementById('detallesContenido');
    const idMatch = detallesContenido.textContent.match(/ID:\s*(\d+)/);
    if (idMatch && idMatch[1]) {
        editarVehiculo(parseInt(idMatch[1]));
    }
}