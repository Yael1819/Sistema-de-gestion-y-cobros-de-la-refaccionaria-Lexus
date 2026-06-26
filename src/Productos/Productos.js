// ============================
// Variables globales
// ============================
let productosData = [];
let categoriasData = [];
let proveedoresData = [];
let productoEditandoId = null;

// Variables para paginación - 5 productos por página
let currentPage = 1;
const itemsPerPage = 5;
let filteredProducts = [];

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

function getEstadoStock(stock, minimo) {
    if (stock === 0) return {text: 'Sin Stock', class: 'danger'};
    if (stock < minimo) return {text: 'Bajo Stock', class: 'warning'};
    if (stock < minimo * 2) return {text: 'Stock Normal', class: 'info'};
    return {text: 'Stock Alto', class: 'success'};
}

function getProveedorNombre(id) {
    if (!id) return null;
    const proveedor = proveedoresData.find(p => p.id_proveedor === id);
    return proveedor ? proveedor.nombre : null;
}

function mostrarError(mensaje) {
    console.error('Error:', mensaje);
    const tbody = document.getElementById('tblProductos');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${mensaje}
                </td>
            </tr>
        `;
    }
    const contador = document.getElementById('contadorProductos');
    if (contador) {
        contador.textContent = 'Error al cargar';
    }
}

// ============================
// Mostrar notificación flotante
// ============================
function mostrarNotificacion(mensaje, tipo = 'danger') {
    // Crear notificación temporal
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} alert-dismissible fade show toast-notification`;
    notificacion.innerHTML = `
        <i class="fas ${tipo === 'warning' ? 'fa-exclamation-triangle' : tipo === 'success' ? 'fa-check-circle' : 'fa-info-circle'} me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notificacion);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// ============================
// Validar que no se ingresen números negativos
// ============================
function validarNumeroPositivo(input) {
    if (input) {
        let valor = parseFloat(input.value);
        if (isNaN(valor)) {
            input.value = 0;
        } else if (valor < 0) {
            input.value = 0;
            mostrarNotificacion('⚠️ No se permiten números negativos. Se ha asignado el valor 0.', 'warning');
        }
        // Disparar evento para recalcular si es necesario
        input.dispatchEvent(new Event('input'));
    }
}

// ============================
// Validar que precio venta sea mayor que precio compra
// ============================
function validarPrecios() {
    const form = document.getElementById('formAgregarProducto');
    if (!form) return false;
    
    const precioCompra = form.querySelector('input[name="precio_compra"]');
    const precioVenta = form.querySelector('input[name="precio_venta"]');
    const btnGuardar = document.getElementById('btnGuardarProducto');
    
    if (!precioCompra || !precioVenta || !btnGuardar) return true;
    
    const compra = parseFloat(precioCompra.value) || 0;
    const venta = parseFloat(precioVenta.value) || 0;
    
    // Validar que precio venta sea mayor que precio compra
    if (compra > 0 && venta > 0 && venta <= compra) {
        // Mostrar error visual en los campos
        precioCompra.classList.add('is-invalid-custom');
        precioVenta.classList.add('is-invalid-custom');
        btnGuardar.disabled = true;
        btnGuardar.title = 'El precio de venta debe ser mayor que el precio de compra';
        
        // Mostrar notificación
        mostrarNotificacion('⚠️ El precio de venta debe ser MAYOR que el precio de compra', 'warning');
        return false;
    } else {
        // Quitar error visual
        precioCompra.classList.remove('is-invalid-custom');
        precioVenta.classList.remove('is-invalid-custom');
        precioCompra.classList.add('is-valid-custom');
        precioVenta.classList.add('is-valid-custom');
        btnGuardar.disabled = false;
        btnGuardar.title = '';
        return true;
    }
}

// ============================
// Ajustar precio venta automáticamente si es menor o igual
// ============================
function ajustarPrecioVenta() {
    const form = document.getElementById('formAgregarProducto');
    if (!form) return;
    
    const precioCompra = form.querySelector('input[name="precio_compra"]');
    const precioVenta = form.querySelector('input[name="precio_venta"]');
    
    if (!precioCompra || !precioVenta) return;
    
    const compra = parseFloat(precioCompra.value) || 0;
    let venta = parseFloat(precioVenta.value) || 0;
    
    // Si el precio de venta es menor o igual al de compra y hay precio de compra
    if (compra > 0 && venta <= compra) {
        // Sugerir un precio de venta con 30% de margen
        const precioSugerido = compra * 1.3;
        precioVenta.value = precioSugerido.toFixed(2);
        venta = precioSugerido;
        mostrarNotificacion(`💡 Se ha sugerido un precio de venta de $${precioSugerido.toFixed(2)} (30% de margen)`, 'info');
    }
    
    actualizarCalculosFormulario();
    validarPrecios();
}

// ============================
// Renderizar controles de paginación centrados
// ============================
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
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
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    currentPage = page;
    mostrarProductos(filteredProducts, false);
}

// ============================
// Mostrar productos en tabla (con paginación de 5 en 5)
// ============================
function mostrarProductos(productos, resetPage = true) {
    const tbody = document.getElementById('tblProductos');
    const contador = document.getElementById('contadorProductos');
    
    if (!tbody || !contador) {
        console.error('No se encontraron elementos necesarios');
        return;
    }
    
    // Guardar productos filtrados
    filteredProducts = productos;
    
    // Resetear a primera página si es necesario
    if (resetPage) {
        currentPage = 1;
    }
    
    console.log('Mostrando productos - Página:', currentPage, 'Total:', filteredProducts.length);
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="fas fa-box fa-2x mb-2"></i><br>
                    No hay productos registrados
                </td>
            </tr>
        `;
        contador.textContent = '0 productos';
        renderPagination();
        return;
    }
    
    // Calcular índices para la página actual (5 productos por página)
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productosPagina = filteredProducts.slice(startIndex, endIndex);
    
    // Actualizar contador
    const totalMostrados = Math.min(endIndex, filteredProducts.length);
    contador.textContent = `${filteredProducts.length} productos (Mostrando ${startIndex + 1}-${totalMostrados})`;
    
    // Renderizar productos de la página actual
    tbody.innerHTML = productosPagina.map(p => {
        const estado = getEstadoStock(p.stock_actual, p.stock_minimo);
        const margen = p.precio_compra && p.precio_compra > 0 ? 
            (((p.precio_venta - p.precio_compra) / p.precio_compra * 100) || 0).toFixed(1) + '%' : 
            'N/A';
        
        const proveedorNombre = p.proveedor_nombre || getProveedorNombre(p.id_proveedor) || 'Sin proveedor';
        
        // Resaltar si el precio de venta es menor o igual al de compra (error)
        const precioError = (p.precio_compra > 0 && p.precio_venta <= p.precio_compra);
        
        return `
            <tr>
                <td><span class="badge bg-secondary">${p.id_producto}</span></td>
                <td>
                    <div class="fw-bold">${escapeHtml(p.nombre) || 'Sin nombre'}</div>
                    <small class="text-muted">${escapeHtml(p.modelo_producto) || 'Sin modelo'}</small>
                </div>
                <td>${escapeHtml(p.marca) || '—'}</div>
                <td><code>${escapeHtml(p.numero_parte) || 'Sin número'}</code></div>
                <td>
                    <div class="fw-bold ${precioError ? 'text-danger' : 'text-success'}">
                        $${parseFloat(p.precio_venta || 0).toFixed(2)}
                        ${precioError ? '<i class="fas fa-exclamation-triangle ms-1" title="Precio venta menor o igual al de compra"></i>' : ''}
                    </div>
                    <small class="text-muted">Compra: $${parseFloat(p.precio_compra || 0).toFixed(2)}</small>
                    <div><small class="text-primary">Margen: ${margen}</small></div>
                </div>
                <td>
                    <div class="fw-bold">${p.stock_actual}</div>
                    <small class="text-muted">Mín: ${p.stock_minimo}</small>
                    <div><span class="badge bg-${estado.class}">${estado.text}</span></div>
                </div>
                <td>${escapeHtml(p.categoria_nombre) || 'Sin categoría'}</div>
                <td>${escapeHtml(proveedorNombre)}</div>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info btn-action" onclick="verDetalles(${p.id_producto})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-action" onclick="editarProducto(${p.id_producto})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-action" onclick="eliminarProducto(${p.id_producto})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </tr>
        `;
    }).join('');
    
    // Renderizar controles de paginación centrados
    renderPagination();
}

// ============================
// Cargar datos iniciales
// ============================
async function cargarDatosIniciales() {
    try {
        console.log('Cargando datos iniciales...');
        
        // Cargar productos
        const productosResponse = await fetch('/api/productos');
        if (!productosResponse.ok) {
            throw new Error(`Error al cargar productos: ${productosResponse.status}`);
        }
        productosData = await productosResponse.json();
        console.log('Productos cargados:', productosData.length);
        
        // Cargar categorías
        const categoriasResponse = await fetch('/api/categorias');
        if (!categoriasResponse.ok) {
            throw new Error('Error al cargar categorías');
        }
        const categoriasTemp = await categoriasResponse.json();
        categoriasData = categoriasTemp.map(c => ({
            id_categoria: c.id_categoria,
            nombre: c.nombre,
            descripcion: c.descripcion
        }));
        console.log('Categorías cargadas:', categoriasData.length);
        
        // Cargar proveedores
        const proveedoresResponse = await fetch('/api/proveedores');
        if (proveedoresResponse.ok) {
            const proveedoresTemp = await proveedoresResponse.json();
            proveedoresData = proveedoresTemp.map(p => ({
                id_proveedor: p.id_proveedor,
                nombre: p.nombre,
                contacto: p.contacto,
                telefono: p.telefono,
                email: p.email,
                direccion: p.direccion
            }));
            console.log('Proveedores cargados:', proveedoresData.length);
        }
        
        // Cargar filtros
        cargarFiltrosCategorias();
        
        // Mostrar productos
        mostrarProductos(productosData);
        
        // Calcular estadísticas
        calcularEstadisticas();
        
    } catch (error) {
        console.error('Error en cargarDatosIniciales:', error);
        mostrarError('Error al cargar datos: ' + error.message);
    }
}

// ============================
// Cargar filtros de categorías
// ============================
function cargarFiltrosCategorias() {
    const selectCategoria = document.getElementById('filterCategoria');
    const selectCategoriaForm = document.querySelector('select[name="id_categoria"]');
    const selectProveedorForm = document.querySelector('select[name="id_proveedor"]');
    
    if (!selectCategoria || !selectCategoriaForm || !selectProveedorForm) {
        console.warn('No se encontraron elementos para cargar filtros');
        return;
    }
    
    // Limpiar opciones existentes
    selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
    selectCategoriaForm.innerHTML = '<option value="">Seleccionar categoría...</option>';
    selectProveedorForm.innerHTML = '<option value="">Seleccionar proveedor...</option>';
    
    // Cargar categorías
    if (categoriasData && categoriasData.length > 0) {
        categoriasData.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id_categoria;
            option.textContent = categoria.nombre;
            selectCategoria.appendChild(option);
            
            const optionForm = document.createElement('option');
            optionForm.value = categoria.id_categoria;
            optionForm.textContent = categoria.nombre;
            selectCategoriaForm.appendChild(optionForm);
        });
    }
    
    // Cargar proveedores
    if (proveedoresData && proveedoresData.length > 0) {
        proveedoresData.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.id_proveedor;
            option.textContent = proveedor.nombre;
            selectProveedorForm.appendChild(option);
        });
    }
}

// ============================
// Calcular estadísticas
// ============================
function calcularEstadisticas() {
    const total = productosData.length;
    const bajoStock = productosData.filter(p => p.stock_actual > 0 && p.stock_actual < p.stock_minimo).length;
    const sinStock = productosData.filter(p => p.stock_actual === 0).length;
    const valorInventario = productosData.reduce((sum, p) => {
        const precioCompra = parseFloat(p.precio_compra) || 0;
        return sum + (precioCompra * p.stock_actual);
    }, 0);
    
    const countProductos = document.getElementById('countProductos');
    const countBajoStock = document.getElementById('countBajoStock');
    const countSinStock = document.getElementById('countSinStock');
    const countValorInventario = document.getElementById('countValorInventario');
    
    if (countProductos) countProductos.textContent = total;
    if (countBajoStock) countBajoStock.textContent = bajoStock;
    if (countSinStock) countSinStock.textContent = sinStock;
    if (countValorInventario) {
        countValorInventario.textContent = `$${valorInventario.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }
}

// ============================
// Aplicar filtros
// ============================
function aplicarFiltros() {
    const filtroCategoria = document.getElementById('filterCategoria').value;
    const filtroStock = document.getElementById('filterStock').value;
    const orden = document.getElementById('ordenarPor').value;
    
    console.log('Aplicando filtros:', { filtroCategoria, filtroStock, orden });
    
    let dataFiltrada = [...productosData];
    
    // Filtrar por categoría
    if (filtroCategoria) {
        dataFiltrada = dataFiltrada.filter(p => p.id_categoria == filtroCategoria);
    }
    
    // Filtrar por stock
    if (filtroStock) {
        dataFiltrada = dataFiltrada.filter(p => {
            const estado = getEstadoStock(p.stock_actual, p.stock_minimo);
            if (filtroStock === 'bajo') return estado.class === 'warning';
            if (filtroStock === 'normal') return estado.class === 'info' || estado.class === 'success';
            if (filtroStock === 'sin') return estado.class === 'danger';
            return true;
        });
    }
    
    // Ordenar
    switch(orden) {
        case 'precio_asc': 
            dataFiltrada.sort((a, b) => (parseFloat(a.precio_venta) || 0) - (parseFloat(b.precio_venta) || 0));
            break;
        case 'precio_desc': 
            dataFiltrada.sort((a, b) => (parseFloat(b.precio_venta) || 0) - (parseFloat(a.precio_venta) || 0));
            break;
        case 'stock_asc': 
            dataFiltrada.sort((a, b) => a.stock_actual - b.stock_actual);
            break;
        case 'stock_desc': 
            dataFiltrada.sort((a, b) => b.stock_actual - a.stock_actual);
            break;
        case 'nombre':
        default:
            dataFiltrada.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            break;
    }
    
    mostrarProductos(dataFiltrada);
}

// ============================
// Buscar productos
// ============================
function buscarProductos() {
    const busqueda = document.getElementById('globalSearch').value.toLowerCase().trim();
    
    if (!busqueda) {
        mostrarProductos(productosData);
        return;
    }
    
    const resultados = productosData.filter(p => {
        return (
            (p.nombre && p.nombre.toLowerCase().includes(busqueda)) ||
            (p.marca && p.marca.toLowerCase().includes(busqueda)) ||
            (p.numero_parte && p.numero_parte.toLowerCase().includes(busqueda)) ||
            (p.modelo_producto && p.modelo_producto.toLowerCase().includes(busqueda)) ||
            (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(busqueda))
        );
    });
    
    mostrarProductos(resultados);
}

// ============================
// Refrescar datos
// ============================
async function refreshProductos() {
    try {
        const tbody = document.getElementById('tblProductos');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                        Cargando productos...
                    </td>
                </tr>
            `;
        }
        await cargarDatosIniciales();
    } catch (error) {
        console.error('Error en refreshProductos:', error);
        mostrarError('Error al cargar productos: ' + error.message);
    }
}

// ============================
// Ver detalles de producto
// ============================
async function verDetalles(id) {
    try {
        let producto = productosData.find(p => p.id_producto === id);
        
        if (!producto) {
            const response = await fetch(`/api/productos/${id}`);
            if (!response.ok) {
                throw new Error('Producto no encontrado');
            }
            producto = await response.json();
        }
        
        mostrarDetallesModal(producto);
    } catch (error) {
        console.error('Error en verDetalles:', error);
        alert('❌ Error: ' + error.message);
    }
}

function mostrarDetallesModal(producto) {
    const estado = getEstadoStock(producto.stock_actual, producto.stock_minimo);
    const margen = producto.precio_compra && producto.precio_compra > 0 ? 
        (((producto.precio_venta - producto.precio_compra) / producto.precio_compra * 100) || 0).toFixed(1) + '%' : 
        'N/A';
    
    const proveedorNombre = producto.proveedor_nombre || getProveedorNombre(producto.id_proveedor);
    const precioError = (producto.precio_compra > 0 && producto.precio_venta <= producto.precio_compra);
    
    document.getElementById('detallesContenido').innerHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <h6>${escapeHtml(producto.nombre) || 'Sin nombre'}</h6>
                <p class="text-muted mb-1">${escapeHtml(producto.marca) || 'Sin marca'} - ${escapeHtml(producto.numero_parte) || 'Sin número'}</p>
                <p class="text-muted">${escapeHtml(producto.modelo_producto) || 'Sin modelo específico'}</p>
            </div>
            <div class="col-md-6 mb-2">
                <strong>Categoría:</strong><br>
                <span class="badge bg-light text-dark">${escapeHtml(producto.categoria_nombre) || 'Sin categoría'}</span>
            </div>
            <div class="col-md-6 mb-2">
                <strong>Proveedor:</strong><br>
                ${escapeHtml(proveedorNombre) || 'Sin proveedor'}
            </div>
            <div class="col-md-6 mb-2">
                <strong>Precio Compra:</strong><br>
                $${parseFloat(producto.precio_compra || 0).toFixed(2)}
            </div>
            <div class="col-md-6 mb-2">
                <strong>Precio Venta:</strong><br>
                <span class="${precioError ? 'text-danger fw-bold' : 'text-success'}">
                    $${parseFloat(producto.precio_venta || 0).toFixed(2)}
                    ${precioError ? '<i class="fas fa-exclamation-triangle ms-1" title="Precio venta menor o igual al de compra"></i>' : ''}
                </span>
            </div>
            <div class="col-md-6 mb-2">
                <strong>Margen:</strong><br>
                <span class="text-primary">${margen}</span>
            </div>
            <div class="col-md-6 mb-2">
                <strong>Estado:</strong><br>
                <span class="badge bg-${estado.class}">${estado.text}</span>
            </div>
            <div class="col-md-6 mb-2">
                <strong>Stock Actual:</strong><br>
                ${producto.stock_actual}
            </div>
            <div class="col-md-6 mb-2">
                <strong>Stock Mínimo:</strong><br>
                ${producto.stock_minimo}
            </div>
            <div class="col-12 mt-3">
                <div class="alert alert-${precioError ? 'danger' : estado.class}">
                    <i class="fas fa-info-circle me-2"></i>
                    ${precioError ? '⚠️ ADVERTENCIA: El precio de venta es menor o igual al precio de compra. Esto generará pérdidas.' :
                      producto.stock_actual === 0 ? 'Producto agotado - Se necesita reabastecimiento' :
                      producto.stock_actual < producto.stock_minimo ? 'Stock bajo - Considerar reordenar' :
                      'Stock en niveles normales'}
                </div>
            </div>
        </div>
    `;
    
    new bootstrap.Modal(document.getElementById('modalDetalles')).show();
}

// ============================
// Editar producto
// ============================
function editarProducto(id) {
    const producto = productosData.find(p => p.id_producto === id);
    if (!producto) {
        alert('Producto no encontrado');
        return;
    }
    
    productoEditandoId = id;
    
    const form = document.getElementById('formAgregarProducto');
    form.querySelector('input[name="nombre"]').value = producto.nombre || '';
    form.querySelector('input[name="marca"]').value = producto.marca || '';
    form.querySelector('input[name="numero_parte"]').value = producto.numero_parte || '';
    form.querySelector('input[name="modelo_producto"]').value = producto.modelo_producto || '';
    form.querySelector('input[name="precio_compra"]').value = producto.precio_compra || '';
    form.querySelector('input[name="precio_venta"]').value = producto.precio_venta || '';
    form.querySelector('input[name="stock_actual"]').value = producto.stock_actual || 0;
    form.querySelector('input[name="stock_minimo"]').value = producto.stock_minimo || 5;
    form.querySelector('select[name="id_categoria"]').value = producto.id_categoria || '';
    form.querySelector('select[name="id_proveedor"]').value = producto.id_proveedor || '';
    
    const modalTitle = document.querySelector('#modalAgregarProducto .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Producto';
    }
    
    actualizarCalculosFormulario();
    validarPrecios();
    new bootstrap.Modal(document.getElementById('modalAgregarProducto')).show();
}

// ============================
// Eliminar producto
// ============================
async function eliminarProducto(id) {
    const producto = productosData.find(p => p.id_producto === id);
    if (!producto) {
        alert('Producto no encontrado');
        return;
    }
    
    if (!confirm(`¿Está seguro de eliminar el producto "${producto.nombre}" (${producto.numero_parte})?\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar');
        }
        
        mostrarNotificacion('✅ Producto eliminado correctamente', 'success');
        refreshProductos();
    } catch (error) {
        console.error('Error en eliminarProducto:', error);
        alert('❌ ' + error.message);
    }
}

// ============================
// Actualizar cálculos del formulario (con validación de negativos y precios)
// ============================
function actualizarCalculosFormulario() {
    const form = document.getElementById('formAgregarProducto');
    if (!form) return;
    
    const precioCompra = form.querySelector('input[name="precio_compra"]');
    const precioVenta = form.querySelector('input[name="precio_venta"]');
    const margenInput = document.getElementById('margenCalculado');
    const stockActual = form.querySelector('input[name="stock_actual"]');
    const stockMinimo = form.querySelector('input[name="stock_minimo"]');
    const estadoInput = document.getElementById('estadoStock');
    
    if (!precioCompra || !precioVenta || !margenInput || !stockActual || !stockMinimo || !estadoInput) return;
    
    // Validar que no sean negativos
    let compra = parseFloat(precioCompra.value) || 0;
    let venta = parseFloat(precioVenta.value) || 0;
    let stock = parseInt(stockActual.value) || 0;
    let minimo = parseInt(stockMinimo.value) || 0;
    
    // Asegurar valores no negativos
    if (compra < 0) {
        compra = 0;
        precioCompra.value = 0;
    }
    if (venta < 0) {
        venta = 0;
        precioVenta.value = 0;
    }
    if (stock < 0) {
        stock = 0;
        stockActual.value = 0;
    }
    if (minimo < 0) {
        minimo = 0;
        stockMinimo.value = 0;
    }
    
    // Calcular margen (solo si venta > compra)
    if (compra > 0 && venta > 0 && venta > compra) {
        const margen = ((venta - compra) / compra * 100).toFixed(1);
        margenInput.value = margen + '%';
        margenInput.className = margen >= 30 ? 'form-control bg-success text-white' : 
                                margen >= 20 ? 'form-control bg-warning text-dark' : 
                                margen >= 10 ? 'form-control bg-info text-white' : 
                                'form-control bg-danger text-white';
    } else if (compra > 0 && venta > 0 && venta <= compra) {
        margenInput.value = 'Precio venta debe ser mayor';
        margenInput.className = 'form-control bg-danger text-white';
    } else {
        margenInput.value = compra === 0 ? 'Sin costo' : 'Ingrese ambos precios';
        margenInput.className = 'form-control bg-light';
    }
    
    const estado = getEstadoStock(stock, minimo);
    estadoInput.value = estado.text;
    estadoInput.className = `form-control bg-${estado.class} text-white`;
}

// ============================
// Event Listeners
// ============================
document.getElementById('formAgregarProducto').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validar precios antes de enviar
    const precioCompra = parseFloat(this.precio_compra.value) || 0;
    const precioVenta = parseFloat(this.precio_venta.value) || 0;
    
    if (precioCompra > 0 && precioVenta <= precioCompra) {
        mostrarNotificacion('❌ El precio de venta debe ser MAYOR que el precio de compra', 'danger');
        return;
    }
    
    const formData = {
        nombre: this.nombre.value,
        marca: this.marca.value || null,
        numero_parte: this.numero_parte.value,
        modelo_producto: this.modelo_producto.value || null,
        precio_compra: Math.max(0, parseFloat(this.precio_compra.value) || 0),
        precio_venta: Math.max(0, parseFloat(this.precio_venta.value) || 0),
        stock_actual: Math.max(0, parseInt(this.stock_actual.value) || 0),
        stock_minimo: Math.max(0, parseInt(this.stock_minimo.value) || 5),
        id_categoria: parseInt(this.id_categoria.value) || null,
        id_proveedor: parseInt(this.id_proveedor.value) || null
    };
    
    if (!formData.nombre || !formData.numero_parte || !formData.precio_venta) {
        mostrarNotificacion('❌ Nombre, número de parte y precio de venta son obligatorios', 'danger');
        return;
    }
    
    try {
        let url = '/api/productos';
        let method = 'POST';
        
        if (productoEditandoId) {
            url = `/api/productos/${productoEditandoId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al guardar');
        }
        
        mostrarNotificacion('✅ Producto guardado correctamente', 'success');
        
        this.reset();
        productoEditandoId = null;
        
        const modalTitle = document.querySelector('#modalAgregarProducto .modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-box me-2"></i>Agregar Producto';
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarProducto'));
        if (modal) modal.hide();
        
        refreshProductos();
    } catch (error) {
        console.error('Error en submit:', error);
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
});

document.getElementById('formAgregarCategoria')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        nombre: this.nombre.value,
        descripcion: this.descripcion.value || null
    };
    
    if (!formData.nombre) {
        mostrarNotificacion('❌ El nombre de la categoría es obligatorio', 'danger');
        return;
    }
    
    try {
        const response = await fetch('/api/categorias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al guardar');
        }
        
        mostrarNotificacion('✅ Categoría agregada correctamente', 'success');
        this.reset();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarCategoria'));
        if (modal) modal.hide();
        
        await refreshProductos();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('❌ ' + error.message, 'danger');
    }
});

// ============================
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando Productos.js');
    
    // Cargar información del usuario
    cargarUsuario();
    
    // Configurar eventos para cálculos automáticos y validación de negativos
    const form = document.getElementById('formAgregarProducto');
    if (form) {
        const precioCompra = form.querySelector('input[name="precio_compra"]');
        const precioVenta = form.querySelector('input[name="precio_venta"]');
        const stockActual = form.querySelector('input[name="stock_actual"]');
        const stockMinimo = form.querySelector('input[name="stock_minimo"]');
        
        // Función para validar y prevenir el signo negativo
        const prevenirNegativo = function(e) {
            // Prevenir que se escriba el signo menos al inicio
            if (e.key === '-' && this.value === '') {
                e.preventDefault();
                mostrarNotificacion('⚠️ No se permiten números negativos', 'warning');
                return false;
            }
        };
        
        if (precioCompra) {
            precioCompra.addEventListener('input', function() {
                actualizarCalculosFormulario();
                validarPrecios();
            });
            precioCompra.addEventListener('blur', function() { 
                validarNumeroPositivo(this);
                ajustarPrecioVenta();
            });
            precioCompra.addEventListener('keydown', prevenirNegativo);
        }
        
        if (precioVenta) {
            precioVenta.addEventListener('input', function() {
                actualizarCalculosFormulario();
                validarPrecios();
            });
            precioVenta.addEventListener('blur', function() { 
                validarNumeroPositivo(this);
                validarPrecios();
            });
            precioVenta.addEventListener('keydown', prevenirNegativo);
        }
        
        if (stockActual) {
            stockActual.addEventListener('input', actualizarCalculosFormulario);
            stockActual.addEventListener('blur', function() { validarNumeroPositivo(this); });
            stockActual.addEventListener('keydown', prevenirNegativo);
        }
        
        if (stockMinimo) {
            stockMinimo.addEventListener('input', actualizarCalculosFormulario);
            stockMinimo.addEventListener('blur', function() { validarNumeroPositivo(this); });
            stockMinimo.addEventListener('keydown', prevenirNegativo);
        }
    }
    
    // Configurar búsqueda
    const btnSearch = document.getElementById('btnSearch');
    if (btnSearch) {
        btnSearch.addEventListener('click', buscarProductos);
    }
    
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') buscarProductos();
        });
    }
    
    // Configurar filtros
    const ordenarPor = document.getElementById('ordenarPor');
    if (ordenarPor) {
        ordenarPor.addEventListener('change', aplicarFiltros);
    }
    
    // Limpiar formulario al cerrar modal
    const modalAgregar = document.getElementById('modalAgregarProducto');
    if (modalAgregar) {
        modalAgregar.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('formAgregarProducto');
            if (form) form.reset();
            productoEditandoId = null;
            
            // Limpiar clases de validación
            const precioCompra = form.querySelector('input[name="precio_compra"]');
            const precioVenta = form.querySelector('input[name="precio_venta"]');
            if (precioCompra) {
                precioCompra.classList.remove('is-invalid-custom', 'is-valid-custom');
            }
            if (precioVenta) {
                precioVenta.classList.remove('is-invalid-custom', 'is-valid-custom');
            }
            
            // Habilitar botón guardar
            const btnGuardar = document.getElementById('btnGuardarProducto');
            if (btnGuardar) {
                btnGuardar.disabled = false;
            }
            
            const modalTitle = document.querySelector('#modalAgregarProducto .modal-title');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-box me-2"></i>Agregar Producto';
            }
        });
    }
    
    // Cargar datos iniciales
    cargarDatosIniciales();
});