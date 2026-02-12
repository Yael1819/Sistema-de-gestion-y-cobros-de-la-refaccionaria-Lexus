// ============================
// Variables globales
// ============================
let productosData = [];
let categoriasData = [];
let proveedoresData = [];
let productoEditandoId = null;

// ============================
// Cargar datos iniciales
// ============================
async function cargarDatosIniciales() {
    try {
        console.log('Cargando datos iniciales...');
        
        // Cargar productos
        console.log('Solicitando productos...');
        const productosResponse = await fetch('/api/productos');
        console.log('Respuesta productos status:', productosResponse.status);
        
        if (!productosResponse.ok) {
            const errorText = await productosResponse.text();
            console.error('Error response productos:', errorText);
            throw new Error(`Error al cargar productos: ${productosResponse.status} ${productosResponse.statusText}`);
        }
        
        productosData = await productosResponse.json();
        console.log('Productos cargados:', productosData.length);
        if (productosData.length > 0) {
            console.log('Primer producto:', productosData[0]);
        }
        
        // Cargar categorías para filtros y formulario
        console.log('Solicitando categorías...');
        const categoriasResponse = await fetch('/api/categorias');
        if (!categoriasResponse.ok) {
            console.error('Error cargando categorías:', categoriasResponse.status);
            throw new Error('Error al cargar categorías');
        }
        const categoriasTemp = await categoriasResponse.json();
        categoriasData = categoriasTemp.map(c => ({
            id_categoria: c.id_categoria,
            nombre: c.nombre,
            descripcion: c.descripcion
        }));
        console.log('Categorías cargadas:', categoriasData.length);
        
        // Cargar proveedores para formulario
        console.log('Solicitando proveedores...');
        const proveedoresResponse = await fetch('/api/proveedores');
        if (!proveedoresResponse.ok) {
            console.warn('Error cargando proveedores, continuando sin ellos:', proveedoresResponse.status);
            proveedoresData = [];
        } else {
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
// Función para determinar estado de stock
// ============================
function getEstadoStock(stock, minimo) {
    if (stock === 0) return {text: 'Sin Stock', class: 'danger'};
    if (stock < minimo) return {text: 'Bajo Stock', class: 'warning'};
    if (stock < minimo * 2) return {text: 'Stock Normal', class: 'info'};
    return {text: 'Stock Alto', class: 'success'};
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
    
    console.log('Cargando filtros...');
    
    // Limpiar opciones existentes
    selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
    selectCategoriaForm.innerHTML = '<option value="">Seleccionar categoría...</option>';
    selectProveedorForm.innerHTML = '<option value="">Seleccionar proveedor...</option>';
    
    // Cargar categorías en filtro
    if (categoriasData && categoriasData.length > 0) {
        categoriasData.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id_categoria;
            option.textContent = categoria.nombre;
            selectCategoria.appendChild(option);
        });
    } else {
        console.warn('No hay categorías para cargar en filtros');
    }
    
    // Cargar categorías en formulario
    if (categoriasData && categoriasData.length > 0) {
        categoriasData.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id_categoria;
            option.textContent = categoria.nombre;
            selectCategoriaForm.appendChild(option);
        });
    }
    
    // Cargar proveedores en formulario
    if (proveedoresData && proveedoresData.length > 0) {
        proveedoresData.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.id_proveedor;
            option.textContent = proveedor.nombre;
            selectProveedorForm.appendChild(option);
        });
    } else {
        console.warn('No hay proveedores para cargar en formulario');
    }
    
    console.log('Filtros cargados correctamente');
}

// ============================
// Mostrar productos en tabla
// ============================
function mostrarProductos(productos) {
    const tbody = document.getElementById('tblProductos');
    const contador = document.getElementById('contadorProductos');
    
    if (!tbody) {
        console.error('No se encontró el tbody con id tblProductos');
        return;
    }
    
    if (!contador) {
        console.error('No se encontró el contador con id contadorProductos');
        return;
    }
    
    console.log('Mostrando productos:', productos.length);
    
    if (productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="fas fa-box fa-2x mb-2"></i><br>
                    No hay productos registrados
                </td>
            </tr>
        `;
        contador.textContent = '0 productos';
        return;
    }
    
    contador.textContent = `${productos.length} productos`;
    
    tbody.innerHTML = productos.map(p => {
        const estado = getEstadoStock(p.stock_actual, p.stock_minimo);
        const margen = p.precio_compra ? 
            (((p.precio_venta - p.precio_compra) / p.precio_compra * 100) || 0).toFixed(1) + '%' : 
            'N/A';
        
        // Usar proveedor_nombre si está disponible, si no buscar en proveedoresData
        const proveedorNombre = p.proveedor_nombre || getProveedorNombre(p.id_proveedor) || 'Sin proveedor';
        
        return `
            <tr>
                <td><span class="badge bg-secondary">${p.id_producto}</span></td>
                <td>
                    <div class="fw-bold">${p.nombre || 'Sin nombre'}</div>
                    <small class="text-muted">${p.modelo_producto || 'Sin modelo'}</small>
                </td>
                <td>${p.marca || '—'}</td>
                <td><code>${p.numero_parte || 'Sin número'}</code></td>
                <td>
                    <div class="fw-bold text-success">$${parseFloat(p.precio_venta || 0).toFixed(2)}</div>
                    <small class="text-muted">Compra: $${parseFloat(p.precio_compra || 0).toFixed(2)}</small>
                    <div><small class="text-primary">Margen: ${margen}</small></div>
                </td>
                <td>
                    <div class="fw-bold">${p.stock_actual}</div>
                    <small class="text-muted">Mín: ${p.stock_minimo}</small>
                    <div><span class="badge bg-${estado.class}">${estado.text}</span></div>
                </td>
                <td>${p.categoria_nombre || 'Sin categoría'}</td>
                <td>${proveedorNombre}</td>
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
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('Productos renderizados en tabla');
}

// ============================
// Obtener nombre del proveedor por ID
// ============================
function getProveedorNombre(id) {
    if (!id) return null;
    const proveedor = proveedoresData.find(p => p.id_proveedor === id);
    return proveedor ? proveedor.nombre : null;
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
    
    console.log('Estadísticas calculadas:', { total, bajoStock, sinStock, valorInventario });
}

// ============================
// Ver detalles de producto
// ============================
async function verDetalles(id) {
    try {
        console.log('Buscando producto con ID:', id);
        
        // Buscar en datos locales primero
        let producto = productosData.find(p => p.id_producto === id);
        
        if (!producto) {
            console.log('Producto no encontrado en cache, solicitando al servidor...');
            // Intentar obtener del servidor si no está en cache
            const response = await fetch(`/api/productos/${id}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Producto no encontrado: ${errorText}`);
            }
            producto = await response.json();
        }
        
        console.log('Producto encontrado:', producto);
        mostrarDetallesModal(producto);
        
    } catch (error) {
        console.error('Error en verDetalles:', error);
        alert('❌ Error: ' + error.message);
    }
}

function mostrarDetallesModal(producto) {
    const estado = getEstadoStock(producto.stock_actual, producto.stock_minimo);
    const margen = producto.precio_compra ? 
        (((producto.precio_venta - producto.precio_compra) / producto.precio_compra * 100) || 0).toFixed(1) + '%' : 
        'N/A';
    
    const proveedorNombre = producto.proveedor_nombre || getProveedorNombre(producto.id_proveedor);
    
    document.getElementById('detallesContenido').innerHTML = `
        <div class="row">
            <div class="col-12 mb-3">
                <h6>${producto.nombre || 'Sin nombre'}</h6>
                <p class="text-muted mb-1">${producto.marca || 'Sin marca'} - ${producto.numero_parte || 'Sin número'}</p>
                <p class="text-muted">${producto.modelo_producto || 'Sin modelo específico'}</p>
            </div>
            <div class="col-md-6 mb-2">
                <strong>Categoría:</strong><br>
                <span class="badge bg-light text-dark">${producto.categoria_nombre || 'Sin categoría'}</span>
            </div>
            <div class="col-md-6 mb-2">
                <strong>Proveedor:</strong><br>
                ${proveedorNombre || 'Sin proveedor'}
            </div>
            <div class="col-md-6 mb-2">
                <strong>Precio Compra:</strong><br>
                $${parseFloat(producto.precio_compra || 0).toFixed(2)}
            </div>
            <div class="col-md-6 mb-2">
                <strong>Precio Venta:</strong><br>
                $${parseFloat(producto.precio_venta || 0).toFixed(2)}
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
                <div class="alert alert-${estado.class}">
                    <i class="fas fa-info-circle me-2"></i>
                    ${producto.stock_actual === 0 ? 'Producto agotado - Se necesita reabastecimiento' :
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
    
    console.log('Editando producto:', producto);
    
    productoEditandoId = id;
    
    const form = document.getElementById('formAgregarProducto');
    if (!form) {
        console.error('No se encontró el formulario');
        return;
    }
    
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
    
    // Cambiar título del modal
    const modalTitle = document.querySelector('#modalAgregarProducto .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Producto';
    }
    
    // Actualizar cálculos iniciales
    actualizarCalculosFormulario();
    
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
        const response = await fetch(`/api/productos/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar');
        }
        
        const result = await response.json();
        alert('✅ ' + (result.message || 'Producto eliminado correctamente'));
        
        // Refrescar datos
        refreshProductos();
        
    } catch (error) {
        console.error('Error en eliminarProducto:', error);
        alert('❌ ' + error.message);
    }
}

// ============================
// Guardar (Crear/Editar) producto
// ============================
document.getElementById('formAgregarProducto').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('Enviando formulario de producto...');
    
    const formData = {
        nombre: this.nombre.value,
        marca: this.marca.value || null,
        numero_parte: this.numero_parte.value,
        modelo_producto: this.modelo_producto.value || null,
        precio_compra: parseFloat(this.precio_compra.value) || 0,
        precio_venta: parseFloat(this.precio_venta.value) || 0,
        stock_actual: parseInt(this.stock_actual.value) || 0,
        stock_minimo: parseInt(this.stock_minimo.value) || 5,
        id_categoria: parseInt(this.id_categoria.value) || null,
        id_proveedor: parseInt(this.id_proveedor.value) || null
    };
    
    console.log('Datos del formulario:', formData);
    
    // Validaciones básicas
    if (!formData.nombre || !formData.numero_parte || !formData.precio_venta) {
        alert('❌ Nombre, número de parte y precio de venta son obligatorios');
        return;
    }
    
    try {
        let url = '/api/productos';
        let method = 'POST';
        
        if (productoEditandoId) {
            url = `/api/productos/${productoEditandoId}`;
            method = 'PUT';
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
        alert('✅ ' + (result.message || 'Producto guardado correctamente'));
        
        // Limpiar formulario y cerrar modal
        this.reset();
        productoEditandoId = null;
        
        // Restaurar título
        const modalTitle = document.querySelector('#modalAgregarProducto .modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-box me-2"></i>Agregar Producto';
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarProducto'));
        if (modal) {
            modal.hide();
        }
        
        // Refrescar datos
        refreshProductos();
        
    } catch (error) {
        console.error('Error en submit formulario:', error);
        alert('❌ ' + error.message);
    }
});

// ============================
// Función para actualizar cálculos en el formulario
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
    
    // Calcular margen
    const compra = parseFloat(precioCompra.value) || 0;
    const venta = parseFloat(precioVenta.value) || 0;
    
    if (compra > 0 && venta > 0) {
        const margen = ((venta - compra) / compra * 100).toFixed(1);
        margenInput.value = margen + '%';
        margenInput.className = margen >= 30 ? 'form-control bg-success text-white' : 
                                margen >= 20 ? 'form-control bg-warning text-dark' : 
                                margen >= 10 ? 'form-control bg-info text-white' : 
                                'form-control bg-danger text-white';
    } else {
        margenInput.value = compra === 0 ? 'Sin costo' : 'Ingrese ambos precios';
        margenInput.className = 'form-control bg-light';
    }
    
    // Calcular estado de stock
    const stock = parseInt(stockActual.value) || 0;
    const minimo = parseInt(stockMinimo.value) || 1;
    const estado = getEstadoStock(stock, minimo);
    estadoInput.value = estado.text;
    estadoInput.className = `form-control bg-${estado.class} text-white`;
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
        console.log(`Filtrado por categoría ${filtroCategoria}: ${dataFiltrada.length} productos`);
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
        console.log(`Filtrado por stock ${filtroStock}: ${dataFiltrada.length} productos`);
    }
    
    // Ordenar
    switch(orden) {
        case 'precio_asc': 
            dataFiltrada.sort((a, b) => (parseFloat(a.precio_venta) || 0) - (parseFloat(b.precio_venta) || 0));
            console.log('Ordenado por precio ascendente');
            break;
        case 'precio_desc': 
            dataFiltrada.sort((a, b) => (parseFloat(b.precio_venta) || 0) - (parseFloat(a.precio_venta) || 0));
            console.log('Ordenado por precio descendente');
            break;
        case 'stock_asc': 
            dataFiltrada.sort((a, b) => a.stock_actual - b.stock_actual);
            console.log('Ordenado por stock ascendente');
            break;
        case 'stock_desc': 
            dataFiltrada.sort((a, b) => b.stock_actual - a.stock_actual);
            console.log('Ordenado por stock descendente');
            break;
        case 'nombre':
        default:
            dataFiltrada.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            console.log('Ordenado por nombre');
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
    
    console.log('Buscando:', busqueda);
    
    const resultados = productosData.filter(p => {
        return (
            (p.nombre && p.nombre.toLowerCase().includes(busqueda)) ||
            (p.marca && p.marca.toLowerCase().includes(busqueda)) ||
            (p.numero_parte && p.numero_parte.toLowerCase().includes(busqueda)) ||
            (p.modelo_producto && p.modelo_producto.toLowerCase().includes(busqueda)) ||
            (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(busqueda))
        );
    });
    
    console.log('Resultados de búsqueda:', resultados.length);
    mostrarProductos(resultados);
}

// ============================
// Refrescar datos
// ============================
async function refreshProductos() {
    try {
        console.log('Refrescando productos...');
        
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
// Mostrar error
// ============================
function mostrarError(mensaje) {
    console.error('Mostrando error:', mensaje);
    
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
    
    // También actualizar el contador
    const contador = document.getElementById('contadorProductos');
    if (contador) {
        contador.textContent = 'Error al cargar';
    }
}

// ============================
// Handler para agregar categoría
// ============================
document.getElementById('formAgregarCategoria')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        nombre: this.nombre.value,
        descripcion: this.descripcion.value || null
    };
    
    if (!formData.nombre) {
        alert('❌ El nombre de la categoría es obligatorio');
        return;
    }
    
    try {
        const response = await fetch('/api/categorias', {
            method: 'POST',
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
        alert('✅ ' + (result.message || 'Categoría agregada correctamente'));
        
        // Limpiar formulario
        this.reset();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarCategoria'));
        if (modal) {
            modal.hide();
        }
        
        // Refrescar categorías y productos
        await refreshProductos();
        
    } catch (error) {
        console.error('Error en agregar categoría:', error);
        alert('❌ ' + error.message);
    }
});

// ============================
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando Productos.js');
    
    // Configurar eventos para cálculos automáticos
    const form = document.getElementById('formAgregarProducto');
    if (form) {
        const precioCompra = form.querySelector('input[name="precio_compra"]');
        const precioVenta = form.querySelector('input[name="precio_venta"]');
        const stockActual = form.querySelector('input[name="stock_actual"]');
        const stockMinimo = form.querySelector('input[name="stock_minimo"]');
        
        if (precioCompra && precioVenta && stockActual && stockMinimo) {
            precioCompra.addEventListener('input', actualizarCalculosFormulario);
            precioVenta.addEventListener('input', actualizarCalculosFormulario);
            stockActual.addEventListener('input', actualizarCalculosFormulario);
            stockMinimo.addEventListener('input', actualizarCalculosFormulario);
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
            if (e.key === 'Enter') {
                buscarProductos();
            }
        });
    }
    
    // Restaurar formulario cuando se cierre el modal
    const modalAgregar = document.getElementById('modalAgregarProducto');
    if (modalAgregar) {
        modalAgregar.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('formAgregarProducto');
            if (form) {
                form.reset();
            }
            productoEditandoId = null;
            
            // Restaurar título
            const modalTitle = document.querySelector('#modalAgregarProducto .modal-title');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-box me-2"></i>Agregar Producto';
            }
        });
    }
    
    // Configurar eventos de filtros
    const ordenarPor = document.getElementById('ordenarPor');
    if (ordenarPor) {
        ordenarPor.addEventListener('change', aplicarFiltros);
    }
    
    // Cargar datos iniciales
    cargarDatosIniciales();
    
    console.log('Productos.js inicializado correctamente');
});