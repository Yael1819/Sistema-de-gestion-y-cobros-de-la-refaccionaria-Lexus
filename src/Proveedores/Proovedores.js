// ============================
// Variables globales
// ============================
let proveedoresData = [];
let proveedorEditandoId = null;

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
    
    document.getElementById('countProveedores').textContent = total;
    document.getElementById('countProductos').textContent = totalProductos;
    document.getElementById('contadorProveedores').textContent = `${total} proveedores`;
}

// ============================
// Mostrar proveedores en la tabla
// ============================
function mostrarProveedores(proveedores) {
    const tbody = document.getElementById('tblProveedores');
    const contador = document.getElementById('contadorProveedores');
    
    if (!tbody || !contador) return;
    
    console.log('Mostrando proveedores:', proveedores.length);
    
    if (proveedores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-truck fa-2x mb-2"></i><br>
                    No hay proveedores registrados
                </td>
            </tr>
        `;
        contador.textContent = '0 proveedores';
        return;
    }
    
    contador.textContent = `${proveedores.length} proveedores`;
    
    tbody.innerHTML = proveedores.map(p => {
        return `
            <tr>
                <td><span class="badge bg-secondary">${p.id_proveedor}</span></td>
                <td>
                    <div class="fw-bold">${p.nombre || 'Sin nombre'}</div>
                    <small class="text-muted">${p.contacto || 'Sin contacto'}</small>
                </td>
                <td>${p.contacto || '—'}</td>
                <td>
                    ${p.telefono ? `<a href="tel:${p.telefono}" class="text-decoration-none">
                        <i class="fas fa-phone me-1"></i>${p.telefono}
                    </a>` : '—'}
                </td>
                <td>
                    ${p.email ? `<a href="mailto:${p.email}" class="text-decoration-none">
                        <i class="fas fa-envelope me-1"></i>${p.email}
                    </a>` : '—'}
                </td>
                <td>${p.direccion || '—'}</td>
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
                </td>
            </tr>
        `;
    }).join('');
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
            mostrarDetallesModal(proveedorDetalle);
            return;
        }
        
        mostrarDetallesModal(proveedor);
        
    } catch (error) {
        console.error('Error en verDetalles:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'danger');
    }
}

function mostrarDetallesModal(proveedor) {
    document.getElementById('detallesContenido').innerHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <div class="text-center mb-3">
                    <i class="fas fa-truck fa-3x text-primary"></i>
                </div>
                <h5 class="text-center">${proveedor.nombre || 'Sin nombre'}</h5>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">Información de Contacto</h6>
                        <div class="mb-2">
                            <strong>Contacto:</strong>
                            <span class="float-end">${proveedor.contacto || '—'}</span>
                        </div>
                        <div class="mb-2">
                            <strong>Teléfono:</strong>
                            <span class="float-end">
                                ${proveedor.telefono ? `<a href="tel:${proveedor.telefono}" class="text-decoration-none">
                                    ${proveedor.telefono}
                                </a>` : '—'}
                            </span>
                        </div>
                        <div class="mb-2">
                            <strong>Email:</strong>
                            <span class="float-end">
                                ${proveedor.email ? `<a href="mailto:${proveedor.email}" class="text-decoration-none">${proveedor.email}</a>` : '—'}
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
                            <p class="mt-1">${proveedor.direccion || '—'}</p>
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
                            <button class="btn btn-outline-warning" onclick="editarProveedor(${proveedor.id_proveedor})">
                                <i class="fas fa-edit me-1"></i> Editar proveedor
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
    document.getElementById('productosProveedorContenido').innerHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <h6>Proveedor: ${proveedor.nombre || 'Sin nombre'}</h6>
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
                                            <td>${producto.nombre || '—'}</td>
                                            <td><span class="badge bg-light text-dark">${producto.categoria_nombre || 'Sin categoría'}</span></td>
                                            <td><code>${producto.numero_parte || '—'}</code></td>
                                            <td>$${parseFloat(producto.precio_venta || 0).toFixed(2)}</td>
                                            <td><span class="badge ${stockClass}">${stock}</span></td>
                                        </tr>
                                    `;
                                }).join('')
                                : `
                                    <tr>
                                        <td colspan="5" class="text-center text-muted py-3">
                                            <i class="fas fa-box-open fa-2x mb-2"></i><br>
                                            No hay productos registrados para este proveedor
                                        </td>
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
    
    // Solo llenar los campos que existen en la BD
    form.querySelector('input[name="nombre"]').value = proveedor.nombre || '';
    form.querySelector('input[name="contacto"]').value = proveedor.contacto || '';
    form.querySelector('input[name="telefono"]').value = proveedor.telefono || '';
    form.querySelector('input[name="email"]').value = proveedor.email || '';
    form.querySelector('textarea[name="direccion"]').value = proveedor.direccion || '';
    
    // Cambiar título del modal
    const modalTitle = document.querySelector('#modalAgregarProveedor .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Proveedor';
    }
    
    // Modificar el botón de guardar
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
        
        // Refrescar datos
        refreshProveedores();
        
    } catch (error) {
        console.error('Error en eliminarProveedor:', error);
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
}

// ============================
// Aplicar filtros
// ============================
function aplicarFiltros() {
    const busqueda = document.getElementById('globalSearch').value.toLowerCase().trim();
    
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
    document.getElementById('contadorProveedores').textContent = `${resultados.length} proveedores encontrados`;
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
                    </td>
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
// Mostrar error
// ============================
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
// Mostrar notificación
// ============================
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
    
    // Validaciones básicas
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
            
            // Para actualizar, necesitas enviar todos los campos
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
        
        // Limpiar formulario y cerrar modal
        this.reset();
        proveedorEditandoId = null;
        
        // Restaurar título y botón
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
        
        // Refrescar datos
        refreshProveedores();
        
    } catch (error) {
        console.error('Error en submit formulario:', error);
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
});

// ============================
// Buscar proveedores
// ============================
function buscarProveedores() {
    aplicarFiltros();
}

// ============================
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando Proovedores.js');
    
    // Búsqueda global
    const btnSearch = document.getElementById('btnSearch');
    if (btnSearch) {
        btnSearch.addEventListener('click', buscarProveedores);
    }
    
    // Permitir búsqueda con Enter
    const globalSearch = document.getElementById('globalSearch');
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
            
            // Restaurar título y botón
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