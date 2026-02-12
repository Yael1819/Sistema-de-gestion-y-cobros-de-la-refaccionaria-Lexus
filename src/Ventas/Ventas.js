// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================
const CONFIG = {
    IVA_PORCENTAJE: 0.16,
    MONEDA: 'MXN'
};

// ============================================
// VARIABLES GLOBALES
// ============================================
let productosVentaActual = [];
let siguienteIdDetalle = 1;
let facturaActual = null;

// ============================================
// FUNCIONES DE INICIALIZACIÓN Y UTILIDAD
// ============================================

// Función para actualizar fecha y hora
function actualizarFechaHora() {
    const ahora = new Date();
    const fechaActual = ahora.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const horaActual = ahora.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('fechaActual').textContent = fechaActual;
    document.getElementById('horaActual').textContent = horaActual;
    
    // Actualizar en el modal de venta si está abierto
    if (document.getElementById('fechaVentaDisplay')) {
        const fechaVenta = ahora.toLocaleDateString('es-MX');
        const horaVenta = ahora.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('fechaVentaDisplay').textContent = fechaVenta;
        document.getElementById('horaVentaDisplay').textContent = horaVenta;
        document.getElementById('ticketFecha').textContent = `${fechaVenta} ${horaVenta}`;
        
        // Guardar en campos ocultos
        document.getElementById('fechaVenta').value = ahora.toISOString().split('T')[0];
        document.getElementById('horaVenta').value = ahora.toTimeString().split(' ')[0].substring(0, 5);
    }
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear toast
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-${tipo} border-0 position-fixed bottom-0 end-0 m-3" style="z-index: 1060;">
            <div class="d-flex">
                <div class="toast-body">${mensaje}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { 
        delay: tipo === 'danger' ? 5000 : 3000 
    });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Función auxiliar para validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================
// FUNCIONES DE CLIENTES
// ============================================

// Función mejorada para cargar clientes
async function cargarClientes() {
    try {
        console.log('📥 Cargando clientes...');
        const response = await fetch('/api/clientes');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const clientes = await response.json();
        console.log(`✅ ${clientes.length} clientes cargados`);
        
        return clientes;
    } catch (error) {
        console.error('❌ Error cargando clientes:', error);
        mostrarNotificacion('Error al cargar clientes', 'danger');
        return [];
    }
}

// Función mejorada para autocompletar clientes
async function autocompletarClientes(valor) {
    const input = valor.trim().toLowerCase();
    const lista = document.getElementById('autocompleteList');
    
    // Limpiar lista anterior
    if (lista) lista.innerHTML = '';
    
    if (!input || input.length < 2) return false;
    
    try {
        const clientes = await cargarClientes();
        
        // Filtrar clientes que coincidan
        const clientesFiltrados = clientes.filter(cliente => {
            const nombre = cliente.nombre ? cliente.nombre.toLowerCase() : '';
            const telefono = cliente.telefono ? cliente.telefono.toLowerCase() : '';
            const email = cliente.email ? cliente.email.toLowerCase() : '';
            const rfc = cliente.rfc ? cliente.rfc.toLowerCase() : '';
            
            return nombre.includes(input) ||
                   telefono.includes(input) ||
                   email.includes(input) ||
                   rfc.includes(input);
        });
        
        // Mostrar resultados (máximo 10)
        if (clientesFiltrados.length > 0) {
            clientesFiltrados.slice(0, 10).forEach(cliente => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                div.innerHTML = `
                    <div class="fw-bold">${cliente.nombre || 'Sin nombre'}</div>
                    <div class="small text-muted">
                        <i class="fas fa-phone me-1"></i>${cliente.telefono || 'Sin teléfono'}
                        ${cliente.email ? '<br><i class="fas fa-envelope me-1"></i>' + cliente.email : ''}
                    </div>
                    ${cliente.rfc ? `<div class="small text-success mt-1"><i class="fas fa-id-card me-1"></i>RFC: ${cliente.rfc}</div>` : ''}
                `;
                div.dataset.id = cliente.id_cliente;
                div.dataset.nombre = cliente.nombre || '';
                div.dataset.telefono = cliente.telefono || '';
                div.dataset.email = cliente.email || '';
                div.dataset.rfc = cliente.rfc || '';
                div.dataset.direccion = cliente.direccion || '';
                div.dataset.ciudad = cliente.ciudad || '';
                div.dataset.estado = cliente.estado || '';
                
                div.addEventListener('click', function() {
                    seleccionarCliente(
                        this.dataset.id,
                        this.dataset.nombre,
                        this.dataset.telefono,
                        this.dataset.email,
                        this.dataset.direccion,
                        this.dataset.ciudad,
                        this.dataset.estado,
                        this.dataset.rfc
                    );
                });
                
                lista.appendChild(div);
            });
            
            // Asegurarse de que la lista sea visible
            lista.style.display = 'block';
        } else {
            // Si no hay coincidencias, mostrar opción para crear nuevo cliente
            const divNuevo = document.createElement('div');
            divNuevo.className = 'autocomplete-item nuevo-cliente';
            divNuevo.innerHTML = `
                <div class="fw-bold">
                    <i class="fas fa-plus-circle me-1"></i> Crear nuevo cliente
                </div>
                <div class="small text-muted">
                    Nombre: "${valor}"
                </div>
                <div class="small text-primary mt-1">
                    <i class="fas fa-info-circle me-1"></i> Haz clic para registrar
                </div>
            `;
            divNuevo.addEventListener('click', function() {
                // Guardar el valor actual
                const nombreCliente = valor.trim();
                document.getElementById('nuevoClienteNombre').value = nombreCliente;
                
                // Limpiar autocompletado
                lista.innerHTML = '';
                
                // Mostrar modal de nuevo cliente
                const modal = new bootstrap.Modal(document.getElementById('modalNuevoCliente'));
                modal.show();
                
                // Enfocar campo de teléfono
                setTimeout(() => {
                    document.getElementById('nuevoClienteTelefono').focus();
                }, 300);
            });
            
            lista.appendChild(divNuevo);
            lista.style.display = 'block';
        }
        
        return true;
    } catch (error) {
        console.error('Error en autocompletado:', error);
        
        // Mostrar mensaje de error
        const divError = document.createElement('div');
        divError.className = 'autocomplete-item text-danger';
        divError.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Error al cargar clientes';
        lista.appendChild(divError);
        lista.style.display = 'block';
        
        return false;
    }
}

// Función para seleccionar cliente (COMPLETAMENTE CORREGIDA)
function seleccionarCliente(id, nombre, telefono, email, direccion = '', ciudad = '', estado = '', rfc = '') {
    console.log('🔍 Seleccionando cliente:', { id, nombre, telefono, email, rfc });
    
    if (!id || !nombre) {
        mostrarNotificacion('Error: Datos del cliente incompletos', 'danger');
        return;
    }
    
    try {
        // Establecer valores en los campos
        const idClienteInput = document.getElementById('idClienteSeleccionado');
        const inputCliente = document.getElementById('inputCliente');
        
        if (!idClienteInput || !inputCliente) {
            console.error('❌ Elementos del DOM no encontrados');
            return;
        }
        
        idClienteInput.value = id;
        inputCliente.value = nombre;
        
        // Actualizar información mostrada
        const infoCliente = document.getElementById('infoCliente');
        if (!infoCliente) {
            console.error('❌ Elemento infoCliente no encontrado');
            return;
        }
        
        // Actualizar campos de información
        const nombreCliente = document.getElementById('nombreClienteSeleccionado');
        const telefonoCliente = document.getElementById('telefonoClienteSeleccionado');
        const emailCliente = document.getElementById('emailClienteSeleccionado');
        const direccionDisplay = document.getElementById('direccionClienteSeleccionado');
        const valorDireccionCliente = document.getElementById('valorDireccionCliente');
        const rfcDisplay = document.getElementById('rfcClienteSeleccionado');
        const valorRFCCliente = document.getElementById('valorRFCCliente');
        
        if (nombreCliente) nombreCliente.textContent = nombre || 'No especificado';
        if (telefonoCliente) telefonoCliente.textContent = telefono || 'No registrado';
        if (emailCliente) emailCliente.textContent = email || 'No registrado';
        
        // Mostrar dirección si está disponible
        if (direccionDisplay && valorDireccionCliente) {
            if (direccion && direccion.trim() !== '') {
                valorDireccionCliente.textContent = direccion;
                direccionDisplay.classList.remove('d-none');
            } else {
                direccionDisplay.classList.add('d-none');
            }
        }
        
        // Mostrar RFC si está disponible
        if (rfcDisplay && valorRFCCliente) {
            if (rfc && rfc.trim() !== '') {
                valorRFCCliente.textContent = rfc;
                rfcDisplay.classList.remove('d-none');
            } else {
                rfcDisplay.classList.add('d-none');
            }
        }
        
        // Mostrar la sección de información del cliente
        infoCliente.classList.remove('d-none');
        
        // Limpiar lista de autocompletado
        const autocompleteList = document.getElementById('autocompleteList');
        if (autocompleteList) {
            autocompleteList.innerHTML = '';
        }
        
        // Mostrar notificación
        mostrarNotificacion(`✅ Cliente "${nombre}" seleccionado`, 'success');
        
        console.log('✅ Cliente seleccionado exitosamente:', nombre);
        
    } catch (error) {
        console.error('❌ Error en seleccionarCliente:', error);
        mostrarNotificacion('Error al seleccionar cliente', 'danger');
    }
}

// Función para cambiar cliente
function cambiarCliente() {
    document.getElementById('idClienteSeleccionado').value = '';
    document.getElementById('inputCliente').value = '';
    document.getElementById('infoCliente').classList.add('d-none');
    document.getElementById('inputCliente').focus();
}

// Función para generar RFC genérico
function generarRFCDefault() {
    const nombre = document.getElementById('nuevoClienteNombre').value.trim();
    if (!nombre) {
        mostrarNotificacion('Primero ingrese el nombre del cliente', 'warning');
        return;
    }
    
    // Generar RFC genérico para pruebas
    document.getElementById('nuevoClienteRFC').value = 'XAXX010101000';
    mostrarNotificacion('RFC genérico generado. Puede modificarlo si lo desea.', 'info');
}

// Función para crear nuevo cliente
async function crearNuevoCliente() {
    const nombre = document.getElementById('nuevoClienteNombre').value.trim();
    const telefono = document.getElementById('nuevoClienteTelefono').value.trim();
    const email = document.getElementById('nuevoClienteEmail').value.trim();
    const rfc = document.getElementById('nuevoClienteRFC').value.trim().toUpperCase();
    const ciudad = document.getElementById('nuevoClienteCiudad').value.trim();
    const estado = document.getElementById('nuevoClienteEstado').value.trim();
    const direccion = document.getElementById('nuevoClienteDireccion').value.trim();
    
    // Validación manual
    if (!nombre) {
        mostrarNotificacion('El nombre del cliente es obligatorio', 'warning');
        document.getElementById('nuevoClienteNombre').focus();
        return;
    }
    
    if (!telefono) {
        mostrarNotificacion('El teléfono del cliente es obligatorio', 'warning');
        document.getElementById('nuevoClienteTelefono').focus();
        return;
    }
    
    // Validar formato de teléfono
    const telefonoRegex = /^[0-9\s\-\(\)\.\+]{10,20}$/;
    if (!telefonoRegex.test(telefono)) {
        mostrarNotificacion('Por favor, ingrese un teléfono válido', 'warning');
        document.getElementById('nuevoClienteTelefono').focus();
        return;
    }
    
    // Validar email si se proporciona
    if (email && !isValidEmail(email)) {
        mostrarNotificacion('Por favor, ingrese un email válido', 'warning');
        document.getElementById('nuevoClienteEmail').focus();
        return;
    }
    
    // Validar RFC si se proporciona (debe ser 13 caracteres si es persona moral)
    if (rfc && rfc.length !== 13) {
        mostrarNotificacion('El RFC debe tener 13 caracteres para persona moral', 'warning');
        document.getElementById('nuevoClienteRFC').focus();
        return;
    }
    
    try {
        const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                telefono: telefono,
                email: email || null,
                direccion: direccion || null,
                ciudad: ciudad || null,
                estado: estado || null,
                rfc: rfc || null
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Seleccionar el nuevo cliente
        seleccionarCliente(
            data.id,
            nombre,
            telefono,
            email,
            direccion,
            ciudad,
            estado,
            rfc
        );
        
        // Cerrar modal y limpiar
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevoCliente'));
        modal.hide();
        
        // Limpiar campos del modal
        document.getElementById('nuevoClienteNombre').value = '';
        document.getElementById('nuevoClienteTelefono').value = '';
        document.getElementById('nuevoClienteEmail').value = '';
        document.getElementById('nuevoClienteRFC').value = '';
        document.getElementById('nuevoClienteCiudad').value = '';
        document.getElementById('nuevoClienteEstado').value = '';
        document.getElementById('nuevoClienteDireccion').value = '';
        
        mostrarNotificacion(`Cliente "${nombre}" creado exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error creando cliente:', error);
        mostrarNotificacion(`Error: ${error.message}`, 'danger');
    }
}

// ============================================
// FUNCIONES DE FILTROS Y ESTADÍSTICAS
// ============================================

// Función para cargar filtros
async function cargarFiltros() {
    try {
        const clientes = await cargarClientes();
        const selectCliente = document.getElementById('filterCliente');
        
        // Limpiar opciones existentes
        selectCliente.innerHTML = '<option value="">Todos los clientes</option>';
        
        // Cargar clientes
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id_cliente;
            option.textContent = cliente.nombre;
            selectCliente.appendChild(option);
        });
        
        // Establecer fechas predeterminadas (últimos 30 días)
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);
        
        document.getElementById('filterFechaDesde').value = hace30Dias.toISOString().split('T')[0];
        document.getElementById('filterFechaHasta').value = hoy.toISOString().split('T')[0];
        
    } catch (error) {
        console.error('Error cargando filtros:', error);
    }
}

// Función para calcular estadísticas
async function calcularEstadisticas() {
    try {
        const response = await fetch('/api/ventas/estadisticas');
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        
        const stats = await response.json();
        
        // Actualizar tarjetas de estadísticas
        const ventasHoy = stats.ventasHoy && stats.ventasHoy[0] ? stats.ventasHoy[0].total : 0;
        const montoMes = stats.ventasMes && stats.ventasMes[0] ? parseFloat(stats.ventasMes[0].monto_total || 0).toFixed(2) : '0.00';
        const ticketPromedio = stats.ticketPromedio && stats.ticketPromedio[0] ? parseFloat(stats.ticketPromedio[0].promedio || 0).toFixed(2) : '0.00';
        const productosVendidos = stats.productosVendidos && stats.productosVendidos[0] ? stats.productosVendidos[0].total : 0;
        
        document.getElementById('countVentasHoy').textContent = ventasHoy;
        document.getElementById('countVentasMes').textContent = `$${montoMes}`;
        document.getElementById('countTicketPromedio').textContent = `$${ticketPromedio}`;
        document.getElementById('countProductosVendidos').textContent = productosVendidos;
        
    } catch (error) {
        console.error('Error calculando estadísticas:', error);
    }
}

// ============================================
// FUNCIONES DE PRODUCTOS
// ============================================

// Función para buscar productos
async function buscarProductos() {
    const query = document.getElementById('buscarProducto').value.trim();
    const resultados = document.getElementById('resultadosBusqueda');
    
    resultados.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border spinner-border-sm"></div> Buscando...</td></tr>';
    
    try {
        let url = '/api/productos/stock';
        if (query) {
            url = `/api/productos/buscar/${encodeURIComponent(query)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al buscar productos');
        
        const productos = await response.json();
        
        resultados.innerHTML = '';
        
        if (productos.length === 0) {
            resultados.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No se encontraron productos con stock disponible</td></tr>';
            return;
        }
        
        productos.forEach(producto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="small fw-bold">${producto.nombre}</div>
                    <div class="small text-muted">${producto.marca} - ${producto.numero_parte}</div>
                </td>
                <td>$${parseFloat(producto.precio_venta).toFixed(2)}</td>
                <td>
                    <span class="badge ${producto.stock_actual > 0 ? 'bg-success' : 'bg-danger'}">
                        ${producto.stock_actual}
                    </span>
                    ${producto.stock_actual <= producto.stock_minimo ? 
                        '<i class="fas fa-exclamation-triangle text-warning ms-1" title="Stock bajo"></i>' : ''}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="agregarProductoVenta(${producto.id_producto})" 
                            ${producto.stock_actual === 0 ? 'disabled' : ''}
                            title="Agregar a la venta">
                        <i class="fas fa-plus"></i>
                    </button>
                </td>
            `;
            resultados.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Error buscando productos:', error);
        resultados.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al buscar productos</td></tr>';
    }
}

// Búsqueda rápida de productos
function buscarProductosRapido(valor) {
    if (valor.length >= 2) {
        setTimeout(() => buscarProductos(), 300);
    }
}

// Agregar producto a la venta actual
async function agregarProductoVenta(idProducto) {
    try {
        // Verificar stock actual
        const response = await fetch(`/api/productos/${idProducto}`);
        if (!response.ok) throw new Error('Error al obtener producto');
        
        const producto = await response.json();
        
        // Verificar stock disponible
        if (producto.stock_actual <= 0) {
            mostrarNotificacion('Producto sin stock disponible', 'warning');
            return;
        }
        
        // Verificar si el producto ya está en la venta
        const productoExistente = productosVentaActual.find(p => p.id_producto === idProducto);
        
        if (productoExistente) {
            // Verificar stock disponible
            if (productoExistente.cantidad + 1 > producto.stock_actual) {
                mostrarNotificacion(`No hay suficiente stock. Disponible: ${producto.stock_actual}`, 'warning');
                return;
            }
            
            // Incrementar cantidad
            productoExistente.cantidad++;
            productoExistente.subtotal = productoExistente.cantidad * productoExistente.precio_unitario;
        } else {
            // Agregar nuevo producto
            productosVentaActual.push({
                id_detalle: siguienteIdDetalle++,
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                marca: producto.marca,
                numero_parte: producto.numero_parte,
                precio_unitario: parseFloat(producto.precio_venta),
                cantidad: 1,
                subtotal: parseFloat(producto.precio_venta)
            });
        }
        
        actualizarVistaVenta();
        document.getElementById('buscarProducto').focus();
        
    } catch (error) {
        console.error('Error agregando producto:', error);
        mostrarNotificacion('Error al agregar producto', 'danger');
    }
}

// Actualizar vista de la venta
function actualizarVistaVenta() {
    const productosContainer = document.getElementById('productosVenta');
    const resumenContainer = document.getElementById('resumenProductos');
    const alertaSinProductos = document.getElementById('alertaSinProductos');
    const contadorProductos = document.getElementById('contadorProductos');
    
    // Actualizar contador
    const totalProductos = productosVentaActual.reduce((sum, p) => sum + p.cantidad, 0);
    contadorProductos.textContent = `${productosVentaActual.length} productos (${totalProductos} unidades)`;
    
    if (productosVentaActual.length === 0) {
        productosContainer.innerHTML = '';
        resumenContainer.innerHTML = '';
        alertaSinProductos.classList.remove('d-none');
        actualizarTotales();
        return;
    }
    
    alertaSinProductos.classList.add('d-none');
    
    // Actualizar lista de productos
    productosContainer.innerHTML = productosVentaActual.map(producto => `
        <div class="product-item">
            <div class="d-flex justify-content-between align-items-center">
                <div style="flex: 1;">
                    <div class="fw-bold">${producto.nombre}</div>
                    <div class="small text-muted">
                        ${producto.marca} - ${producto.numero_parte}
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <div class="me-3 text-end">
                        <div class="fw-bold">$${producto.precio_unitario.toFixed(2)} c/u</div>
                        <div class="text-success fw-bold">$${producto.subtotal.toFixed(2)}</div>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="modificarCantidad(${producto.id_detalle}, -1)" title="Reducir cantidad">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="btn btn-light" style="min-width: 40px;">${producto.cantidad}</span>
                        <button class="btn btn-outline-secondary" onclick="modificarCantidad(${producto.id_detalle}, 1)" title="Aumentar cantidad">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-outline-danger ms-2" onclick="eliminarProductoVenta(${producto.id_detalle})" title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Actualizar resumen
    resumenContainer.innerHTML = productosVentaActual.map(producto => `
        <div class="d-flex justify-content-between small mb-1">
            <span class="text-truncate" style="max-width: 180px;">${producto.nombre} x${producto.cantidad}</span>
            <span class="fw-bold">$${producto.subtotal.toFixed(2)}</span>
        </div>
    `).join('');
    
    actualizarTotales();
}

// Modificar cantidad de un producto
async function modificarCantidad(idDetalle, cambio) {
    const producto = productosVentaActual.find(p => p.id_detalle === idDetalle);
    if (!producto) return;
    
    const nuevaCantidad = producto.cantidad + cambio;
    
    if (nuevaCantidad < 1) {
        eliminarProductoVenta(idDetalle);
        return;
    }
    
    try {
        // Verificar stock en la base de datos
        const response = await fetch(`/api/productos/${producto.id_producto}`);
        if (!response.ok) throw new Error('Error al verificar stock');
        
        const productoStock = await response.json();
        
        if (nuevaCantidad > productoStock.stock_actual) {
            mostrarNotificacion(`No hay suficiente stock. Disponible: ${productoStock.stock_actual}`, 'warning');
            return;
        }
        
        producto.cantidad = nuevaCantidad;
        producto.subtotal = producto.cantidad * producto.precio_unitario;
        
        actualizarVistaVenta();
        
    } catch (error) {
        console.error('Error modificando cantidad:', error);
        mostrarNotificacion('Error al verificar stock', 'danger');
    }
}

// Eliminar producto de la venta
function eliminarProductoVenta(idDetalle) {
    productosVentaActual = productosVentaActual.filter(p => p.id_detalle !== idDetalle);
    actualizarVistaVenta();
}

// Actualizar totales de la venta
function actualizarTotales() {
    const subtotal = productosVentaActual.reduce((sum, p) => sum + p.subtotal, 0);
    const iva = subtotal * CONFIG.IVA_PORCENTAJE;
    const total = subtotal + iva;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('iva').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    
    // Actualizar cambio si hay pago
    calcularCambio();
}

// Calcular cambio
function calcularCambio() {
    const total = productosVentaActual.reduce((sum, p) => sum + p.subtotal, 0) * (1 + CONFIG.IVA_PORCENTAJE);
    const pagoCon = parseFloat(document.getElementById('pagoCon').value) || 0;
    const cambio = pagoCon - total;
    
    const cambioInput = document.getElementById('cambio');
    if (cambio >= 0) {
        cambioInput.value = `$${cambio.toFixed(2)}`;
        cambioInput.classList.remove('text-danger');
        cambioInput.classList.add('text-success');
    } else {
        cambioInput.value = `-$${Math.abs(cambio).toFixed(2)}`;
        cambioInput.classList.remove('text-success');
        cambioInput.classList.add('text-danger');
    }
    
    return cambio;
}

// ============================================
// FUNCIONES DE GESTIÓN DE VENTAS
// ============================================

// Cargar ventas en la tabla
async function refreshVentas() {
    const tbody = document.getElementById('tblVentas');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border spinner-border-sm"></div> Cargando ventas...</td></tr>';
    
    try {
        // Aplicar filtros
        const fechaDesde = document.getElementById('filterFechaDesde').value;
        const fechaHasta = document.getElementById('filterFechaHasta').value;
        const filtroCliente = document.getElementById('filterCliente').value;
        const orden = document.getElementById('ordenarPor').value;
        
        let url = '/api/ventas';
        const params = new URLSearchParams();
        
        if (fechaDesde) params.append('fechaDesde', fechaDesde);
        if (fechaHasta) params.append('fechaHasta', fechaHasta);
        if (filtroCliente) params.append('cliente', filtroCliente);
        if (orden) params.append('orden', orden);
        
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al cargar ventas');
        
        const ventas = await response.json();
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        if (ventas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-shopping-cart fa-2x mb-2"></i><br>
                        No hay ventas registradas
                    </td>
                </tr>
            `;
            return;
        }
        
        // Mostrar ventas
        for (const venta of ventas) {
            // Obtener detalles de la venta
            const detallesResponse = await fetch(`/api/ventas/${venta.id_venta}/detalles`);
            const detalles = detallesResponse.ok ? await detallesResponse.json() : [];
            const cantidadProductos = detalles.reduce((sum, d) => sum + d.cantidad, 0);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="badge bg-secondary">${venta.id_venta}</span></td>
                <td>
                    <div class="fw-bold">${venta.fecha}</div>
                    <div class="small text-muted">${venta.hora}</div>
                </td>
                <td>${venta.cliente_nombre || 'Cliente no encontrado'}</td>
                <td>
                    <div class="small">${cantidadProductos} productos</div>
                    <div class="small text-muted">${detalles.length} diferentes</div>
                </td>
                <td>
                    <div class="fw-bold text-success">$${parseFloat(venta.total).toFixed(2)}</div>
                    <div class="small text-muted">${venta.metodo_pago}</div>
                </td>
                <td>
                    <span class="badge bg-success">Completada</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info btn-action" onclick="verDetallesVenta(${venta.id_venta})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary btn-action" onclick="generarFactura(${venta.id_venta})" title="Generar factura">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-action" onclick="cancelarVenta(${venta.id_venta})" title="Cancelar venta">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        }
        
        // Actualizar estadísticas
        await calcularEstadisticas();
        document.getElementById('contadorVentas').textContent = `${ventas.length} ventas`;
        
    } catch (error) {
        console.error('Error refrescando ventas:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
                    Error al cargar ventas: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Ver detalles de venta
async function verDetallesVenta(id) {
    try {
        console.log(`🔍 Buscando detalles de venta ID: ${id}`);
        
        const [ventaResponse, detallesResponse] = await Promise.all([
            fetch(`/api/ventas/${id}`),
            fetch(`/api/ventas/${id}/detalles`)
        ]);
        
        if (!ventaResponse.ok) {
            throw new Error('Venta no encontrada');
        }
        
        const venta = await ventaResponse.json();
        const detalles = detallesResponse.ok ? await detallesResponse.json() : [];
        
        const subtotal = detalles.reduce((sum, d) => sum + parseFloat(d.subtotal || 0), 0);
        const iva = subtotal * CONFIG.IVA_PORCENTAJE;
        
        // Guardar ID en el modal para referencia
        const modalElement = document.getElementById('modalDetallesVenta');
        modalElement.dataset.ventaId = id;
        
        document.getElementById('detallesVentaContenido').innerHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <div class="text-center mb-3">
                        <i class="fas fa-receipt fa-3x text-primary"></i>
                    </div>
                    <h5 class="text-center">Ticket de Venta #${venta.id_venta}</h5>
                    <p class="text-center text-muted">${venta.fecha} ${venta.hora}</p>
                </div>
                
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Información de la Venta</h6>
                            <table class="table table-sm">
                                <tr><td><strong>ID:</strong></td><td>#${venta.id_venta}</td></tr>
                                <tr><td><strong>Fecha:</strong></td><td>${venta.fecha}</td></tr>
                                <tr><td><strong>Hora:</strong></td><td>${venta.hora}</td></tr>
                                <tr><td><strong>Cliente:</strong></td><td>${venta.cliente_nombre || 'No especificado'}</td></tr>
                                <tr><td><strong>Teléfono:</strong></td><td>${venta.cliente_telefono || 'No registrado'}</td></tr>
                                <tr><td><strong>Método de Pago:</strong></td><td>${venta.metodo_pago}</td></tr>
                                ${venta.notas ? `<tr><td><strong>Notas:</strong></td><td>${venta.notas}</td></tr>` : ''}
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Resumen Financiero</h6>
                            <div class="receipt">
                                <div class="border-bottom pb-2 mb-2">
                                    ${detalles.map(detalle => `
                                        <div class="d-flex justify-content-between small mb-1">
                                            <span>${detalle.producto_nombre} x${detalle.cantidad}</span>
                                            <span>$${parseFloat(detalle.subtotal).toFixed(2)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Subtotal:</span>
                                    <span>$${subtotal.toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>IVA (${(CONFIG.IVA_PORCENTAJE * 100)}%):</span>
                                    <span>$${iva.toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between total-display">
                                    <span>TOTAL:</span>
                                    <span>$${parseFloat(venta.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Productos Vendidos</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unitario</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${detalles.map(detalle => `
                                            <tr>
                                                <td>
                                                    <div class="fw-bold">${detalle.producto_nombre}</div>
                                                    <div class="small text-muted">${detalle.producto_marca} - ${detalle.numero_parte}</div>
                                                </td>
                                                <td>${detalle.cantidad}</td>
                                                <td>$${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                                <td>$${parseFloat(detalle.subtotal).toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('modalDetallesVenta'));
        modal.show();
        
    } catch (error) {
        console.error('Error mostrando detalles:', error);
        mostrarNotificacion('Error al cargar detalles de venta', 'danger');
    }
}

// Cancelar venta
async function cancelarVenta(id) {
    if (!confirm(`¿Está seguro de cancelar la venta #${id}?\n\n⚠️ Esta acción no se puede deshacer.\n✅ El stock de productos será revertido.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/ventas/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al cancelar venta');
        }
        
        const data = await response.json();
        
        mostrarNotificacion(data.message, 'success');
        refreshVentas();
        
    } catch (error) {
        console.error('Error cancelando venta:', error);
        mostrarNotificacion(error.message, 'danger');
    }
}

// ============================================
// FUNCIONES DE FACTURACIÓN
// ============================================

// Generar factura
async function generarFactura(id) {
    try {
        console.log(`🔄 Iniciando generación de factura para venta #${id}`);
        
        // Mostrar indicador de carga
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-overlay';
        loadingIndicator.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <div class="ms-2 text-white">Generando factura...</div>
        `;
        document.body.appendChild(loadingIndicator);
        
        const response = await fetch(`/api/ventas/${id}/factura`);
        
        // Remover indicador de carga
        document.body.removeChild(loadingIndicator);
        
        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.details || errorMessage;
                console.error('❌ Error del servidor:', errorData);
            } catch (jsonError) {
                console.error('❌ No se pudo parsear la respuesta de error');
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('✅ Datos de factura recibidos:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido al generar factura');
        }
        
        // Guardar factura globalmente
        facturaActual = data.factura;
        
        // Mostrar vista previa de factura
        mostrarVistaPreviaFactura(data.factura);
        
    } catch (error) {
        console.error('❌ Error generando factura:', error);
        
        // Mostrar error específico
        let mensajeError = error.message;
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            mensajeError = 'Error de conexión con el servidor. Verifique que el servidor esté ejecutándose.';
        } else if (error.message.includes('404')) {
            mensajeError = 'La venta no fue encontrada en el sistema.';
        } else if (error.message.includes('500')) {
            mensajeError = 'Error interno del servidor al generar la factura.';
        }
        
        mostrarNotificacion(`❌ ${mensajeError}`, 'danger');
    }
}

// Mostrar vista previa de factura
function mostrarVistaPreviaFactura(facturaData) {
    console.log('📄 Mostrando vista previa de factura:', facturaData);
    
    const modalHTML = `
        <div class="modal fade" id="modalFactura" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-file-invoice me-2"></i>
                            Factura #${facturaData.venta.id_venta || 'N/A'}
                            ${facturaData.venta.cliente_rfc ? 
                                '<span class="badge bg-success ms-2">CON RFC</span>' : 
                                '<span class="badge bg-warning ms-2">SIN RFC</span>'}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="facturaContenido" class="receipt">
                            ${generarHTMLFactura(facturaData)}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i> Cerrar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="imprimirFactura()">
                            <i class="fas fa-print me-1"></i> Imprimir
                        </button>
                        <button type="button" class="btn btn-success" onclick="descargarFacturaPDF()">
                            <i class="fas fa-download me-1"></i> Descargar PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al DOM si no existe
    if (!document.getElementById('modalFactura')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } else {
        document.getElementById('facturaContenido').innerHTML = generarHTMLFactura(facturaData);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalFactura'));
    modal.show();
}

// Generar HTML de la factura
function generarHTMLFactura(facturaData) {
    const rfcCliente = facturaData.venta.cliente_rfc || 'No especificado';
    const direccionCliente = facturaData.venta.cliente_direccion || 'No especificada';
    const ciudadCliente = facturaData.venta.cliente_ciudad || '';
    const estadoCliente = facturaData.venta.cliente_estado || '';
    
    // Construir dirección completa
    let direccionCompleta = direccionCliente;
    if (ciudadCliente || estadoCliente) {
        direccionCompleta += `, ${ciudadCliente}${estadoCliente ? `, ${estadoCliente}` : ''}`;
    }
    
    return `
        <div class="text-center mb-4 border-bottom pb-3">
            <h3 class="fw-bold text-primary">${facturaData.empresa.nombre}</h3>
            <p class="mb-1">${facturaData.empresa.direccion}</p>
            <p class="mb-1"><strong>RFC:</strong> ${facturaData.empresa.rfc}</p>
            <p class="mb-1">Tel: ${facturaData.empresa.telefono} | Email: ${facturaData.empresa.email}</p>
            <h4 class="mt-3">FACTURA #${facturaData.venta.id_venta}</h4>
            <p class="text-muted mb-0">Fecha de emisión: ${facturaData.fecha_emision} ${facturaData.hora_emision}</p>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title"><i class="fas fa-user me-2"></i>Datos del Cliente</h6>
                        <table class="table table-sm table-borderless">
                            <tr><td><strong>Nombre:</strong></td><td>${facturaData.venta.cliente_nombre || 'No especificado'}</td></tr>
                            <tr><td><strong>RFC:</strong></td><td><span class="fw-bold ${rfcCliente !== 'No especificado' ? 'text-success' : 'text-warning'}">${rfcCliente}</span></td></tr>
                            <tr><td><strong>Dirección:</strong></td><td>${direccionCompleta}</td></tr>
                            <tr><td><strong>Teléfono:</strong></td><td>${facturaData.venta.cliente_telefono || 'No registrado'}</td></tr>
                            <tr><td><strong>Email:</strong></td><td>${facturaData.venta.cliente_email || 'No registrado'}</td></tr>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title"><i class="fas fa-calendar me-2"></i>Datos de la Factura</h6>
                        <table class="table table-sm table-borderless">
                            <tr><td><strong>Fecha de Venta:</strong></td><td>${facturaData.venta.fecha}</td></tr>
                            <tr><td><strong>Hora:</strong></td><td>${facturaData.venta.hora}</td></tr>
                            <tr><td><strong>Método de Pago:</strong></td><td>${facturaData.venta.metodo_pago || 'No especificado'}</td></tr>
                            <tr><td><strong>Uso CFDI:</strong></td><td>G03 - Gastos en general</td></tr>
                            <tr><td><strong>Regimen Fiscal:</strong></td><td>Régimen General de Ley Personas Morales</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        ${generarTablaProductosFactura(facturaData)}
        
        <div class="row mt-4">
            <div class="col-md-8">
                <div class="alert ${rfcCliente !== 'No especificado' ? 'alert-success' : 'alert-warning'}">
                    <h6><i class="fas ${rfcCliente !== 'No especificado' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
                        Información Fiscal ${rfcCliente !== 'No especificado' ? 'Completa' : 'Incompleta'}
                    </h6>
                    ${rfcCliente === 'No especificado' ? 
                        '<p class="mb-1"><i class="fas fa-info-circle me-1"></i> Esta factura no incluye RFC. Para facturación fiscal completa, registre el RFC del cliente.</p>' : 
                        '<p class="mb-1"><i class="fas fa-check me-1"></i> Factura válida para deducciones fiscales.</p>'}
                    ${facturaData.venta.notas ? `<p class="mb-1"><strong>Notas:</strong> ${facturaData.venta.notas}</p>` : ''}
                    <p class="mb-0"><strong>Condiciones de pago:</strong> Contado</p>
                </div>
            </div>
            <div class="col-md-4 text-center">
                <div class="border p-3 mt-4">
                    <p class="mb-0">_________________________</p>
                    <p class="mb-0"><strong>Firma Autorizada</strong></p>
                    <p class="small text-muted mb-0">${facturaData.empresa.nombre}</p>
                    <p class="small text-muted mb-0">${facturaData.empresa.rfc}</p>
                </div>
            </div>
        </div>
        
        <div class="text-center mt-4 pt-3 border-top">
            <p class="small text-muted">
                Este documento es una representación digital válida para efectos fiscales.<br>
                Para consultar el CFD/CFDI correspondiente, contacte al área de facturación.
            </p>
        </div>
    `;
}

// Función auxiliar para tabla de productos
function generarTablaProductosFactura(facturaData) {
    return `
        <h6><i class="fas fa-boxes me-2"></i>Detalle de Productos</h6>
        <table class="table table-bordered">
            <thead class="table-light">
                <tr>
                    <th width="50">#</th>
                    <th>Descripción</th>
                    <th width="80">Cantidad</th>
                    <th width="100">P. Unitario</th>
                    <th width="120">Importe</th>
                </tr>
            </thead>
            <tbody>
                ${facturaData.detalles.map((detalle, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <div class="fw-bold">${detalle.producto_nombre}</div>
                            <div class="small text-muted">${detalle.producto_marca} - ${detalle.numero_parte}</div>
                        </td>
                        <td class="text-center">${detalle.cantidad}</td>
                        <td class="text-end">$${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                        <td class="text-end">$${parseFloat(detalle.subtotal).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot class="table-light">
                <tr>
                    <td colspan="4" class="text-end"><strong>Subtotal:</strong></td>
                    <td class="text-end"><strong>$${facturaData.subtotal}</strong></td>
                </tr>
                <tr>
                    <td colspan="4" class="text-end"><strong>IVA (16%):</strong></td>
                    <td class="text-end"><strong>$${facturaData.iva}</strong></td>
                </tr>
                <tr class="table-active">
                    <td colspan="4" class="text-end"><strong class="fs-5">TOTAL:</strong></td>
                    <td class="text-end"><strong class="fs-5">$${facturaData.total}</strong></td>
                </tr>
            </tfoot>
        </table>
    `;
}

// ============================================
// FUNCIONES DE IMPRESIÓN Y PDF
// ============================================

// Función para imprimir ticket
function imprimirTicket() {
    try {
        console.log('🖨️ Imprimiendo ticket...');
        
        // Obtener ID de venta del modal
        const modalElement = document.getElementById('modalDetallesVenta');
        const ventaId = modalElement ? modalElement.dataset.ventaId : null;
        
        if (!ventaId) {
            mostrarNotificacion('No se pudo obtener el ID de la venta', 'warning');
            return;
        }
        
        // Obtener el contenido del modal
        const contenido = document.getElementById('detallesVentaContenido').innerHTML;
        
        // Crear una ventana de impresión
        const ventana = window.open('', '_blank', 'width=400,height=600');
        
        // Generar contenido para impresión
        ventana.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket de Venta #${ventaId}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    @media print {
                        body { margin: 0; padding: 10px; font-size: 12px; }
                        .no-print { display: none !important; }
                        .ticket { width: 80mm; margin: 0 auto; font-family: 'Courier New', monospace; }
                        .ticket-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
                        .ticket-footer { border-top: 2px dashed #000; padding-top: 10px; margin-top: 15px; text-align: center; }
                        .producto-item { border-bottom: 1px dashed #ccc; padding: 5px 0; }
                        .total-line { font-weight: bold; font-size: 14px; }
                    }
                    body { font-family: Arial, sans-serif; }
                    .ticket { width: 80mm; margin: 0 auto; padding: 10px; }
                    .ticket-header h4 { margin: 0; font-size: 16px; }
                    .ticket-header p { margin: 0; font-size: 11px; }
                </style>
            </head>
            <body onload="window.print(); setTimeout(() => window.close(), 1000);">
                <div class="ticket">
                    <div class="ticket-header">
                        <h4><strong>REFACCIONARIA LEXUS</strong></h4>
                        <p>Calle Principal #123, Oaxaca, México</p>
                        <p>Tel: 951-123-4567</p>
                        <p>Ticket #${ventaId}</p>
                        <p>${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}</p>
                    </div>
                    
                    <div class="ticket-body">
                        ${contenido}
                    </div>
                    
                    <div class="ticket-footer">
                        <p>¡Gracias por su compra!</p>
                        <p>Vuelva pronto</p>
                        <p class="small">${new Date().toLocaleString('es-MX')}</p>
                    </div>
                </div>
                
                <div class="text-center mt-4 no-print">
                    <button class="btn btn-primary" onclick="window.print()">
                        <i class="fas fa-print me-1"></i> Imprimir
                    </button>
                    <button class="btn btn-secondary" onclick="window.close()">
                        <i class="fas fa-times me-1"></i> Cerrar
                    </button>
                </div>
            </body>
            </html>
        `);
        
        ventana.document.close();
        
    } catch (error) {
        console.error('❌ Error imprimiendo ticket:', error);
        mostrarNotificacion('Error al imprimir ticket', 'danger');
    }
}

// Función para imprimir factura
function imprimirFactura() {
    try {
        if (!facturaActual) {
            mostrarNotificacion('No hay factura disponible para imprimir', 'warning');
            return;
        }
        
        console.log('🖨️ Imprimiendo factura...');
        const contenido = document.getElementById('facturaContenido').innerHTML;
        const ventaId = facturaActual.venta.id_venta;
        
        const ventana = window.open('', '_blank');
        ventana.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Factura #${ventaId} - Refaccionaria Lexus</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    @media print {
                        body { margin: 0; padding: 20px; }
                        .no-print { display: none !important; }
                        .receipt { font-size: 12px; max-width: 800px; margin: 0 auto; }
                        .table { width: 100%; border-collapse: collapse; }
                        .table th, .table td { padding: 8px; border: 1px solid #dee2e6; }
                        .factura-header { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                    }
                    @page { margin: 0.5cm; }
                    body { font-family: Arial, sans-serif; }
                    .receipt { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .factura-header { 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 10px 10px 0 0;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    ${contenido}
                </div>
                <div class="text-center mt-4 no-print">
                    <button class="btn btn-primary" onclick="window.print()">
                        <i class="fas fa-print me-1"></i> Imprimir Factura
                    </button>
                    <button class="btn btn-secondary" onclick="window.close()">
                        <i class="fas fa-times me-1"></i> Cerrar
                    </button>
                </div>
                <script>
                    // Auto-print después de cargar
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        ventana.document.close();
        
    } catch (error) {
        console.error('❌ Error imprimiendo factura:', error);
        mostrarNotificacion('Error al imprimir factura', 'danger');
    }
}

// Función para descargar factura PDF
async function descargarFacturaPDF() {
    if (!facturaActual || !facturaActual.venta || !facturaActual.venta.id_venta) {
        mostrarNotificacion('No hay factura disponible para descargar', 'warning');
        console.error('❌ facturaActual no definida o sin ID:', facturaActual);
        return;
    }
    
    const ventaId = facturaActual.venta.id_venta;
    console.log(`📥 Descargando PDF para venta #${ventaId}`);
    
    try {
        // Mostrar indicador de carga
        mostrarNotificacion(`⏳ Generando PDF para factura #${ventaId}...`, 'info');
        
        // Abrir en nueva pestaña
        window.open(`/api/ventas/${ventaId}/factura/pdf`, '_blank');
        
    } catch (error) {
        console.error('❌ Error descargando PDF:', error);
        
        // Si falla la ruta de PDF, ofrecer alternativa
        mostrarNotificacion(
            'La función de PDF está en desarrollo. Use la opción "Imprimir" para guardar como PDF.',
            'warning'
        );
        
        // Alternativa: Usar impresión
        setTimeout(() => {
            if (confirm('¿Desea usar la versión de impresión como alternativa?')) {
                imprimirFactura();
            }
        }, 1000);
    }
}

// Función para generar factura desde detalles
function generarFacturaDesdeDetalles() {
    try {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetallesVenta'));
        if (modal) modal.hide();
        
        // Obtener ID de venta del modal
        const modalElement = document.getElementById('modalDetallesVenta');
        const ventaId = modalElement ? modalElement.dataset.ventaId : null;
        
        if (ventaId) {
            console.log(`🔍 ID de venta encontrado en modal: ${ventaId}`);
            generarFactura(ventaId);
        } else {
            // Si no se encuentra, mostrar ventana para ingresar manualmente
            const ventaIdManual = prompt('Ingrese el número de venta para generar factura:');
            if (ventaIdManual) {
                generarFactura(ventaIdManual);
            }
        }
        
    } catch (error) {
        console.error('❌ Error generando factura desde detalles:', error);
        mostrarNotificacion('Error al generar factura desde detalles', 'danger');
    }
}

// ============================================
// FUNCIONES DE PROCESAMIENTO DE VENTA
// ============================================

// Función para procesar nueva venta
async function procesarNuevaVenta(e) {
    e.preventDefault();
    
    console.log('🔄 Iniciando proceso de venta...');
    
    // Validación de productos
    if (productosVentaActual.length === 0) {
        mostrarNotificacion('❌ Debe agregar al menos un producto a la venta', 'warning');
        return;
    }
    
    const clienteId = document.getElementById('idClienteSeleccionado').value;
    const metodoPago = document.getElementById('metodoPago').value;
    const notas = document.getElementById('notasVenta').value;
    const pagoCon = parseFloat(document.getElementById('pagoCon').value) || 0;
    
    console.log('📋 Datos capturados:', { 
        clienteId, 
        metodoPago, 
        productos: productosVentaActual.length
    });
    
    // Validaciones
    if (!clienteId) {
        mostrarNotificacion('❌ Debe seleccionar o crear un cliente', 'warning');
        return;
    }
    
    if (!metodoPago) {
        mostrarNotificacion('❌ Debe seleccionar un método de pago', 'warning');
        return;
    }
    
    // Calcular totales
    const subtotal = productosVentaActual.reduce((sum, p) => sum + p.subtotal, 0);
    const iva = subtotal * CONFIG.IVA_PORCENTAJE;
    const total = subtotal + iva;
    
    console.log('💰 Totales calculados:', { subtotal, iva, total });
    
    // Verificar pago si es en efectivo
    if (metodoPago === 'efectivo') {
        const cambio = pagoCon - total;
        if (cambio < 0) {
            mostrarNotificacion(`❌ El pago es insuficiente. Total: $${total.toFixed(2)}, Pago: $${pagoCon.toFixed(2)}`, 'warning');
            return;
        }
    }
    
    // Obtener fecha y hora actuales
    const ahora = new Date();
    const fechaVenta = ahora.toISOString().split('T')[0];
    const horaVenta = ahora.toTimeString().split(' ')[0].substring(0, 5);
    
    console.log('📅 Fecha y hora:', { fechaVenta, horaVenta });
    
    // Mostrar confirmación
    if (!confirm(`¿Procesar venta por $${total.toFixed(2)}?\n\nCliente: ${document.getElementById('nombreClienteSeleccionado').textContent}\nProductos: ${productosVentaActual.length}`)) {
        return;
    }
    
    // Preparar datos para enviar
    const ventaData = {
        venta: {
            fecha: fechaVenta,
            hora: horaVenta,
            total: parseFloat(total.toFixed(2)),
            id_cliente: parseInt(clienteId),
            metodo_pago: metodoPago,
            pago_con: metodoPago === 'efectivo' ? pagoCon : total,
            cambio: metodoPago === 'efectivo' ? (pagoCon - total).toFixed(2) : '0.00',
            notas: notas.trim() || null
        },
        detalles: productosVentaActual.map(p => ({
            id_producto: p.id_producto,
            cantidad: p.cantidad,
            precio_unitario: p.precio_unitario,
            subtotal: p.subtotal
        }))
    };
    
    console.log('📤 Datos a enviar:', ventaData);
    
    try {
        mostrarNotificacion('⏳ Procesando venta...', 'info');
        
        const response = await fetch('/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ventaData)
        });
        
        console.log('📥 Respuesta del servidor:', response);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Venta procesada exitosamente:', data);
        
        // Resetear formulario
        productosVentaActual = [];
        siguienteIdDetalle = 1;
        document.getElementById('formNuevaVenta').reset();
        document.getElementById('idClienteSeleccionado').value = '';
        document.getElementById('inputCliente').value = '';
        document.getElementById('infoCliente').classList.add('d-none');
        document.getElementById('pagoCon').value = '';
        document.getElementById('cambio').value = '';
        actualizarVistaVenta();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaVenta'));
        if (modal) modal.hide();
        
        // Mostrar notificación de éxito
        mostrarNotificacion(
            `✅ Venta #${data.ventaId || data.venta?.id_venta} procesada exitosamente por $${total.toFixed(2)}`,
            'success'
        );
        
        // Actualizar vista
        refreshVentas();
        
        // Preguntar si desea generar factura
        setTimeout(() => {
            if (confirm('¿Desea generar la factura de esta venta?')) {
                generarFactura(data.ventaId || data.venta?.id_venta);
            }
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error procesando venta:', error);
        mostrarNotificacion(`❌ Error: ${error.message}`, 'danger');
    }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

// Función para probar la conexión
async function testConnection() {
    try {
        const response = await fetch('/api/test');
        const data = await response.json();
        console.log('✅ Conexión al servidor:', data);
        mostrarNotificacion('Conexión al servidor establecida', 'success');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        mostrarNotificacion('Error de conexión con el servidor', 'danger');
        return false;
    }
}

// Función para verificar productos disponibles
async function verificarProductosDisponibles() {
    try {
        const response = await fetch('/api/productos/stock');
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const productos = await response.json();
        console.log('📦 Productos con stock:', productos.length);
        
        if (productos.length === 0) {
            mostrarNotificacion('⚠️ No hay productos con stock disponible', 'warning');
        }
        
        return productos.length > 0;
    } catch (error) {
        console.error('Error verificando productos:', error);
        mostrarNotificacion('Error al verificar productos disponibles', 'danger');
        return false;
    }
}

// Funciones de utilidad para filtros
function verVentasHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('filterFechaDesde').value = hoy;
    document.getElementById('filterFechaHasta').value = hoy;
    document.getElementById('filterCliente').value = '';
    aplicarFiltros();
}

function verVentasMes() {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('filterFechaDesde').value = primerDiaMes;
    document.getElementById('filterFechaHasta').value = hoy.toISOString().split('T')[0];
    document.getElementById('filterCliente').value = '';
    aplicarFiltros();
}

function aplicarFiltros() {
    refreshVentas();
}

// Reiniciar venta actual
function reiniciarVenta() {
    if (productosVentaActual.length > 0 && !confirm('¿Está seguro de reiniciar la venta? Se perderán todos los productos agregados.')) {
        return;
    }
    
    productosVentaActual = [];
    siguienteIdDetalle = 1;
    actualizarVistaVenta();
    document.getElementById('buscarProducto').value = '';
    document.getElementById('resultadosBusqueda').innerHTML = 
        '<tr><td colspan="4" class="text-center text-muted">Busca productos para agregar</td></tr>';
    mostrarNotificacion('Venta reiniciada', 'info');
}

// ============================================
// CONFIGURACIÓN DE AUTCOMPLETADO
// ============================================

function configurarAutocompletado() {
    // Cerrar autocompletado al hacer clic fuera
    document.addEventListener('click', function(e) {
        const autocompleteList = document.getElementById('autocompleteList');
        const inputCliente = document.getElementById('inputCliente');
        
        if (autocompleteList && 
            !autocompleteList.contains(e.target) && 
            e.target !== inputCliente) {
            autocompleteList.innerHTML = '';
            if (autocompleteList.style) autocompleteList.style.display = 'none';
        }
    });
    
    // Configurar evento keydown para tecla Escape
    const inputCliente = document.getElementById('inputCliente');
    if (inputCliente) {
        inputCliente.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const autocompleteList = document.getElementById('autocompleteList');
                if (autocompleteList) {
                    autocompleteList.innerHTML = '';
                    autocompleteList.style.display = 'none';
                }
            }
        });
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Función de inicialización del sistema
async function initVentasSystem() {
    try {
        console.log('🚀 Inicializando sistema de ventas...');
        
        // Configurar formulario de nueva venta
        const formNuevaVenta = document.getElementById('formNuevaVenta');
        if (formNuevaVenta) {
            formNuevaVenta.addEventListener('submit', procesarNuevaVenta);
            console.log('✅ Formulario de venta configurado');
        }
        
        // Configurar autocompletado de clientes
        configurarAutocompletado();
        
        const inputCliente = document.getElementById('inputCliente');
        if (inputCliente) {
            let timeout;
            
            inputCliente.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (this.value.trim().length >= 2) {
                        autocompletarClientes(this.value);
                    } else {
                        const lista = document.getElementById('autocompleteList');
                        if (lista) {
                            lista.innerHTML = '';
                            lista.style.display = 'none';
                        }
                    }
                }, 300);
            });
            
            // Limpiar selección si se borra el input
            inputCliente.addEventListener('blur', function() {
                setTimeout(() => {
                    if (!this.value.trim()) {
                        cambiarCliente();
                    }
                }, 200);
            });
            
            console.log('✅ Autocompletado de clientes configurado');
        }
        
        // Configurar cálculo de cambio
        const pagoConInput = document.getElementById('pagoCon');
        if (pagoConInput) {
            pagoConInput.addEventListener('input', calcularCambio);
            pagoConInput.addEventListener('blur', function() {
                if (this.value) {
                    this.value = parseFloat(this.value).toFixed(2);
                    calcularCambio();
                }
            });
            console.log('✅ Cálculo de cambio configurado');
        }
        
        // Configurar búsqueda rápida de productos
        const buscarProductoInput = document.getElementById('buscarProducto');
        if (buscarProductoInput) {
            let timeout;
            buscarProductoInput.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (this.value.trim().length >= 2) {
                        buscarProductos();
                    } else if (this.value.trim().length === 0) {
                        document.getElementById('resultadosBusqueda').innerHTML = 
                            '<tr><td colspan="4" class="text-center text-muted">Ingresa un término para buscar productos</td></tr>';
                    }
                }, 300);
            });
            
            buscarProductoInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarProductos();
                }
            });
            console.log('✅ Búsqueda de productos configurada');
        }
        
        // Verificar productos cuando se abre el modal de venta
        const modalVenta = document.getElementById('modalNuevaVenta');
        if (modalVenta) {
            modalVenta.addEventListener('show.bs.modal', function() {
                // Esperar a que el modal esté completamente visible
                setTimeout(() => {
                    verificarProductosDisponibles();
                }, 300);
            });
        }
        
        // Actualizar fecha y hora
        actualizarFechaHora();
        setInterval(actualizarFechaHora, 1000);
        
        // Test de conexión inicial
        const conexionOk = await testConnection();
        
        if (conexionOk) {
            // Cargar datos iniciales
            await cargarFiltros();
            await refreshVentas();
            actualizarVistaVenta();
            
            console.log('✅ Sistema de ventas inicializado correctamente');
            mostrarNotificacion('Sistema de ventas cargado correctamente', 'success');
        } else {
            console.error('❌ No se pudo inicializar por problemas de conexión');
            mostrarNotificacion('Error de conexión con el servidor', 'danger');
        }
        
    } catch (error) {
        console.error('❌ Error crítico en inicialización:', error);
        mostrarNotificacion('Error crítico al inicializar el sistema', 'danger');
    }
}

// ============================================
// FUNCIONES GLOBALES
// ============================================

window.imprimirTicket = imprimirTicket;
window.imprimirFactura = imprimirFactura;
window.descargarFacturaPDF = descargarFacturaPDF;
window.generarFacturaDesdeDetalles = generarFacturaDesdeDetalles;
window.generarFactura = generarFactura;
window.refreshVentas = refreshVentas;
window.verDetallesVenta = verDetallesVenta;
window.cancelarVenta = cancelarVenta;
window.agregarProductoVenta = agregarProductoVenta;
window.modificarCantidad = modificarCantidad;
window.eliminarProductoVenta = eliminarProductoVenta;
window.buscarProductos = buscarProductos;
window.buscarProductosRapido = buscarProductosRapido;
window.cambiarCliente = cambiarCliente;
window.crearNuevoCliente = crearNuevoCliente;
window.generarRFCDefault = generarRFCDefault;
window.verVentasHoy = verVentasHoy;
window.verVentasMes = verVentasMes;
window.aplicarFiltros = aplicarFiltros;
window.reiniciarVenta = reiniciarVenta;

// Función de diagnóstico
async function diagnosticarSistema() {
    console.log('🔍 Diagnóstico del sistema de facturación:');
    
    const endpoints = [
        '/api/test',
        '/api/ventas',
        '/api/productos/stock',
        '/api/clientes'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint);
            console.log(`${endpoint}: ${response.ok ? '✅ OK' : '❌ Error'}`);
        } catch (error) {
            console.error(`${endpoint}: ❌ ${error.message}`);
        }
    }
}

// Hacer diagnóstico disponible globalmente
window.diagnosticarSistema = diagnosticarSistema;

// Inicializar cuando el DOM esté cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVentasSystem);
} else {
    initVentasSystem();
}