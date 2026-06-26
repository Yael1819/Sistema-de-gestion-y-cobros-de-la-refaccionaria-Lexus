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
let usuarioActual = null;

// Variables para paginación - 5 ventas por página
let currentPage = 1;
const itemsPerPage = 5;
let filteredVentas = [];
let allVentasData = [];

// ============================================
// FUNCIONES DE SESIÓN
// ============================================
function cargarUsuario() {
  const isLoggedIn  = sessionStorage.getItem('is_logged_in');
  const timestamp   = sessionStorage.getItem('login_timestamp');

  if (isLoggedIn !== 'true' || !timestamp) {
    const rawLocal = localStorage.getItem('usuarioActual');
    if (rawLocal) {
      try {
        const u = JSON.parse(rawLocal);
        usuarioActual = u;
        actualizarInfoUsuario(u);
        return u;
      } catch(e) {}
    }
    window.location.href = '/src/Login/Login.html';
    return null;
  }

  const ocho_horas = 8 * 60 * 60 * 1000;
  if (Date.now() - parseInt(timestamp) > ocho_horas) {
    sessionStorage.clear();
    window.location.href = '/src/Login/Login.html';
    return null;
  }

  const nombre = sessionStorage.getItem('user_name')  || 'Usuario';
  const rol    = sessionStorage.getItem('user_role')  || '';
  
  usuarioActual = { nombre, rol, id: sessionStorage.getItem('user_id') || 1 };
  actualizarInfoUsuario(usuarioActual);
  return usuarioActual;
}

function actualizarInfoUsuario(usuario) {
    const nombreElement = document.getElementById('navUsuarioNombre');
    const rolElement = document.getElementById('navUsuarioRol');
    if (nombreElement) nombreElement.textContent = usuario?.nombre || 'Usuario';
    if (rolElement) rolElement.textContent = usuario?.rol || '';
}

function cerrarSesion() {
  sessionStorage.clear();
  localStorage.removeItem('usuarioActual');
  window.location.href = '/src/Login/Login.html';
}

function obtenerUsuarioActual() {
    if (!usuarioActual) {
        usuarioActual = cargarUsuario();
    }
    return usuarioActual;
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
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

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

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
    
    const fechaActualElem = document.getElementById('fechaActual');
    const horaActualElem = document.getElementById('horaActual');
    if (fechaActualElem) fechaActualElem.textContent = fechaActual;
    if (horaActualElem) horaActualElem.textContent = horaActual;
    
    if (document.getElementById('fechaVentaDisplay')) {
        const fechaVenta = ahora.toLocaleDateString('es-MX');
        const horaVenta = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        
        const fechaVentaDisplay = document.getElementById('fechaVentaDisplay');
        const horaVentaDisplay = document.getElementById('horaVentaDisplay');
        const ticketFecha = document.getElementById('ticketFecha');
        const fechaVentaInput = document.getElementById('fechaVenta');
        const horaVentaInput = document.getElementById('horaVenta');
        
        if (fechaVentaDisplay) fechaVentaDisplay.textContent = fechaVenta;
        if (horaVentaDisplay) horaVentaDisplay.textContent = horaVenta;
        if (ticketFecha) ticketFecha.textContent = `${fechaVenta} ${horaVenta}`;
        if (fechaVentaInput) fechaVentaInput.value = ahora.toISOString().split('T')[0];
        if (horaVentaInput) horaVentaInput.value = ahora.toTimeString().split(' ')[0].substring(0, 5);
    }
}

// ============================================
// RENDERIZAR PAGINACIÓN
// ============================================
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);
    
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
    const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    mostrarVentasTabla(filteredVentas, false);
}

// ============================================
// MOSTRAR VENTAS EN TABLA CON PAGINACIÓN
// ============================================
function mostrarVentasTabla(ventas, resetPage = true) {
    const tbody = document.getElementById('tblVentas');
    const contador = document.getElementById('contadorVentas');
    
    if (!tbody) return;
    
    filteredVentas = ventas;
    
    if (resetPage) currentPage = 1;
    
    if (filteredVentas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4"><i class="fas fa-shopping-cart fa-2x mb-2"></i><br>No hay ventas registradas</td></tr>`;
        if (contador) contador.textContent = '0 ventas';
        renderPagination();
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const ventasPagina = filteredVentas.slice(startIndex, endIndex);
    const totalMostrados = Math.min(endIndex, filteredVentas.length);
    
    if (contador) contador.textContent = `${filteredVentas.length} ventas (Mostrando ${startIndex + 1}-${totalMostrados})`;
    
    tbody.innerHTML = '';
    
    ventasPagina.forEach(venta => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge bg-secondary">${venta.id_venta}</span></td>
            <td><div class="fw-bold">${venta.fecha}</div><small class="text-muted">${venta.hora}</small></td>
            <td>${escapeHtml(venta.cliente_nombre) || 'N/A'}</td>
            <td><small>Cargando...</small></td>
            <td><div class="fw-bold">${escapeHtml(venta.vendedor_nombre) || 'No asignado'}</div><small>${escapeHtml(venta.vendedor_email) || ''}</small></td>
            <td><span class="fw-bold text-success">$${parseFloat(venta.total).toFixed(2)}</span><br><small>${venta.metodo_pago}</small></td>
            <td><span class="badge bg-success">Completada</span></td>
            <td><div class="btn-group btn-group-sm">
                <button class="btn btn-outline-info btn-action" onclick="verDetallesVenta(${venta.id_venta})" title="Ver detalles"><i class="fas fa-eye"></i></button>
                <button class="btn btn-outline-primary btn-action" onclick="generarFactura(${venta.id_venta})" title="Generar factura"><i class="fas fa-file-invoice"></i></button>
                <button class="btn btn-outline-danger btn-action" onclick="cancelarVenta(${venta.id_venta})" title="Cancelar venta"><i class="fas fa-times"></i></button>
            </div></td>
        `;
        tbody.appendChild(tr);
        
        // Cargar cantidad de productos
        fetch(`/api/ventas/${venta.id_venta}/detalles`)
            .then(res => res.json())
            .then(detalles => {
                const total = detalles.reduce((s,d) => s + d.cantidad, 0);
                tr.cells[3].innerHTML = `<small>${total} productos (${detalles.length} tipos)</small>`;
            })
            .catch(() => tr.cells[3].innerHTML = '<small>Error</small>');
    });
    
    renderPagination();
}

// ============================================
// FUNCIONES DE CLIENTES
// ============================================
async function cargarClientes() {
    try {
        const response = await fetch('/api/clientes');
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Error cargando clientes:', error);
        return [];
    }
}

async function autocompletarClientes(valor) {
    const input = valor.trim().toLowerCase();
    const lista = document.getElementById('autocompleteList');
    if (lista) lista.innerHTML = '';
    if (!input || input.length < 2) return false;
    
    try {
        const clientes = await cargarClientes();
        const clientesFiltrados = clientes.filter(cliente => {
            const nombre = cliente.nombre ? cliente.nombre.toLowerCase() : '';
            const telefono = cliente.telefono ? cliente.telefono.toLowerCase() : '';
            const email = cliente.email ? cliente.email.toLowerCase() : '';
            const rfc = cliente.rfc ? cliente.rfc.toLowerCase() : '';
            return nombre.includes(input) || telefono.includes(input) || email.includes(input) || rfc.includes(input);
        });
        
        if (lista) {
            if (clientesFiltrados.length > 0) {
                clientesFiltrados.slice(0, 10).forEach(cliente => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.innerHTML = `
                        <div class="fw-bold">${escapeHtml(cliente.nombre) || 'Sin nombre'}</div>
                        <div class="small text-muted">
                            <i class="fas fa-phone me-1"></i>${escapeHtml(cliente.telefono) || 'Sin teléfono'}
                            ${cliente.email ? '<br><i class="fas fa-envelope me-1"></i>' + escapeHtml(cliente.email) : ''}
                        </div>
                        ${cliente.rfc ? `<div class="small text-success mt-1"><i class="fas fa-id-card me-1"></i>RFC: ${escapeHtml(cliente.rfc)}</div>` : ''}
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
                lista.style.display = 'block';
            } else {
                const divNuevo = document.createElement('div');
                divNuevo.className = 'autocomplete-item nuevo-cliente';
                divNuevo.innerHTML = `
                    <div class="fw-bold"><i class="fas fa-plus-circle me-1"></i> Crear nuevo cliente</div>
                    <div class="small text-muted">Nombre: "${escapeHtml(valor)}"</div>
                    <div class="small text-primary mt-1"><i class="fas fa-info-circle me-1"></i> Haz clic para registrar</div>
                `;
                divNuevo.addEventListener('click', function() {
                    const nombreCliente = valor.trim();
                    document.getElementById('nuevoClienteNombre').value = nombreCliente;
                    lista.innerHTML = '';
                    const modal = new bootstrap.Modal(document.getElementById('modalNuevoCliente'));
                    modal.show();
                    setTimeout(() => document.getElementById('nuevoClienteTelefono').focus(), 300);
                });
                lista.appendChild(divNuevo);
                lista.style.display = 'block';
            }
        }
        return true;
    } catch (error) {
        console.error('Error en autocompletado:', error);
        if (lista) {
            const divError = document.createElement('div');
            divError.className = 'autocomplete-item text-danger';
            divError.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Error al cargar clientes';
            lista.appendChild(divError);
            lista.style.display = 'block';
        }
        return false;
    }
}

function seleccionarCliente(id, nombre, telefono, email, direccion, ciudad, estado, rfc) {
    if (!id || !nombre) {
        mostrarNotificacion('Error: Datos del cliente incompletos', 'danger');
        return;
    }
    
    document.getElementById('idClienteSeleccionado').value = id;
    document.getElementById('inputCliente').value = nombre;
    
    const infoCliente = document.getElementById('infoCliente');
    document.getElementById('nombreClienteSeleccionado').textContent = nombre || 'No especificado';
    document.getElementById('telefonoClienteSeleccionado').textContent = telefono || 'No registrado';
    document.getElementById('emailClienteSeleccionado').textContent = email || 'No registrado';
    
    infoCliente.classList.remove('d-none');
    
    const autocompleteList = document.getElementById('autocompleteList');
    if (autocompleteList) {
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none';
    }
    
    mostrarNotificacion(`✅ Cliente "${nombre}" seleccionado`, 'success');
}

function cambiarCliente() {
    document.getElementById('idClienteSeleccionado').value = '';
    document.getElementById('inputCliente').value = '';
    document.getElementById('infoCliente').classList.add('d-none');
    document.getElementById('inputCliente').focus();
}

function generarRFCDefault() {
    const nombre = document.getElementById('nuevoClienteNombre').value.trim();
    if (!nombre) {
        mostrarNotificacion('Primero ingrese el nombre del cliente', 'warning');
        return;
    }
    document.getElementById('nuevoClienteRFC').value = 'XAXX010101000';
    mostrarNotificacion('RFC genérico generado. Puede modificarlo si lo desea.', 'info');
}

async function crearNuevoCliente() {
    const nombre = document.getElementById('nuevoClienteNombre').value.trim();
    const telefono = document.getElementById('nuevoClienteTelefono').value.trim();
    const email = document.getElementById('nuevoClienteEmail').value.trim();
    const rfc = document.getElementById('nuevoClienteRFC').value.trim().toUpperCase();
    const ciudad = document.getElementById('nuevoClienteCiudad').value.trim();
    const estado = document.getElementById('nuevoClienteEstado').value.trim();
    const direccion = document.getElementById('nuevoClienteDireccion').value.trim();
    
    if (!nombre || !telefono) {
        mostrarNotificacion('Nombre y teléfono son obligatorios', 'warning');
        return;
    }
    
    if (email && !isValidEmail(email)) {
        mostrarNotificacion('Email no válido', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono, email: email || null, direccion: direccion || null, ciudad: ciudad || null, estado: estado || null, rfc: rfc || null })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(error.error || `Error ${response.status}`);
        }
        
        const data = await response.json();
        
        seleccionarCliente(data.id, nombre, telefono, email, direccion, ciudad, estado, rfc);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevoCliente'));
        if (modal) modal.hide();
        
        ['nuevoClienteNombre', 'nuevoClienteTelefono', 'nuevoClienteEmail', 'nuevoClienteRFC', 'nuevoClienteCiudad', 'nuevoClienteEstado', 'nuevoClienteDireccion'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
        
        mostrarNotificacion(`Cliente "${nombre}" creado exitosamente`, 'success');
    } catch (error) {
        console.error('Error creando cliente:', error);
        mostrarNotificacion(`Error: ${error.message}`, 'danger');
    }
}

// ============================================
// FUNCIONES DE FILTROS Y ESTADÍSTICAS
// ============================================
async function cargarFiltros() {
    try {
        const clientes = await cargarClientes();
        const selectCliente = document.getElementById('filterCliente');
        if (selectCliente) {
            selectCliente.innerHTML = '<option value="">Todos los clientes</option>';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id_cliente;
                option.textContent = cliente.nombre;
                selectCliente.appendChild(option);
            });
        }
        
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);
        
        const fechaDesde = document.getElementById('filterFechaDesde');
        const fechaHasta = document.getElementById('filterFechaHasta');
        if (fechaDesde) fechaDesde.value = hace30Dias.toISOString().split('T')[0];
        if (fechaHasta) fechaHasta.value = hoy.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error cargando filtros:', error);
    }
}

async function calcularEstadisticas() {
    try {
        const response = await fetch('/api/ventas/estadisticas');
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        const stats = await response.json();
        
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

function aplicarFiltros() {
    refreshVentas();
}

// ============================================
// FUNCIONES DE PRODUCTOS
// ============================================
async function buscarProductos() {
    const query = document.getElementById('buscarProducto').value.trim();
    const resultados = document.getElementById('resultadosBusqueda');
    if (resultados) resultados.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border spinner-border-sm"></div> Buscando...</td></tr>';
    
    try {
        let url = '/api/productos/stock';
        if (query) url = `/api/productos/buscar/${encodeURIComponent(query)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al buscar productos');
        const productos = await response.json();
        
        if (resultados) {
            resultados.innerHTML = '';
            
            if (productos.length === 0) {
                resultados.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No se encontraron productos con stock disponible</td></tr>';
                return;
            }
            
            productos.forEach(producto => {
                const precio = parseFloat(producto.precio_venta);
                const esPrecioNegativo = precio < 0;
                const precioClass = esPrecioNegativo ? 'text-danger' : '';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><div class="small fw-bold">${escapeHtml(producto.nombre)}</div><div class="small text-muted">${escapeHtml(producto.marca)} - ${escapeHtml(producto.numero_parte)}</div></td>
                    <td class="${precioClass}">$${Math.abs(precio).toFixed(2)}</td>
                    <td><span class="badge ${producto.stock_actual > 0 ? 'bg-success' : 'bg-danger'}">${producto.stock_actual}</span></td>
                    <td><button class="btn btn-sm ${esPrecioNegativo ? 'btn-danger' : 'btn-primary'}" onclick="agregarProductoVenta(${producto.id_producto})" ${producto.stock_actual === 0 ? 'disabled' : ''}><i class="fas fa-plus"></i></button></td>
                `;
                resultados.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error buscando productos:', error);
        if (resultados) resultados.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al buscar productos</td></tr>';
    }
}

function limpiarBusquedaProductos() {
    document.getElementById('buscarProducto').value = '';
    document.getElementById('resultadosBusqueda').innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3"><i class="fas fa-search me-1"></i>Ingresa un término para buscar productos</td></tr>';
}

async function agregarProductoVenta(idProducto) {
    try {
        const response = await fetch(`/api/productos/${idProducto}`);
        if (!response.ok) throw new Error('Error al obtener producto');
        const producto = await response.json();
        
        if (parseFloat(producto.precio_venta) < 0) {
            mostrarNotificacion('❌ No se puede agregar un producto con precio negativo', 'danger');
            return;
        }
        
        if (producto.stock_actual <= 0) {
            mostrarNotificacion('Producto sin stock disponible', 'warning');
            return;
        }
        
        const productoExistente = productosVentaActual.find(p => p.id_producto === idProducto);
        
        if (productoExistente) {
            if (productoExistente.cantidad + 1 > producto.stock_actual) {
                mostrarNotificacion(`No hay suficiente stock. Disponible: ${producto.stock_actual}`, 'warning');
                return;
            }
            productoExistente.cantidad++;
            // El precio final es el precio con IVA incluido
            productoExistente.subtotal = productoExistente.cantidad * productoExistente.precio_final;
        } else {
            const precioFinal = parseFloat(producto.precio_venta); // Precio con IVA incluido
            // Calcular precio sin IVA para el desglose
            const precioSinIVA = precioFinal / (1 + CONFIG.IVA_PORCENTAJE);
            
            productosVentaActual.push({
                id_detalle: siguienteIdDetalle++,
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                marca: producto.marca,
                numero_parte: producto.numero_parte,
                precio_final: precioFinal, // Precio con IVA incluido
                precio_sin_iva: precioSinIVA, // Precio sin IVA (para desglose)
                cantidad: 1,
                subtotal: precioFinal // Subtotal con IVA incluido
            });
        }
        
        actualizarVistaVenta();
        document.getElementById('buscarProducto').focus();
    } catch (error) {
        console.error('Error agregando producto:', error);
        mostrarNotificacion('Error al agregar producto', 'danger');
    }
}

function actualizarVistaVenta() {
    const productosContainer = document.getElementById('productosVenta');
    const resumenContainer = document.getElementById('resumenProductos');
    const alertaSinProductos = document.getElementById('alertaSinProductos');
    const contadorProductos = document.getElementById('contadorProductos');
    
    const totalProductos = productosVentaActual.reduce((sum, p) => sum + p.cantidad, 0);
    if (contadorProductos) contadorProductos.textContent = `${productosVentaActual.length} productos (${totalProductos} unidades)`;
    
    if (productosVentaActual.length === 0) {
        if (productosContainer) productosContainer.innerHTML = '';
        if (resumenContainer) resumenContainer.innerHTML = '';
        if (alertaSinProductos) alertaSinProductos.classList.remove('d-none');
        actualizarTotales();
        return;
    }
    
    if (alertaSinProductos) alertaSinProductos.classList.add('d-none');
    
    if (productosContainer) {
        productosContainer.innerHTML = productosVentaActual.map(producto => {
            const precioFinal = producto.precio_final;
            const subtotal = producto.subtotal;
            const esPrecioNegativo = precioFinal < 0;
            const precioClass = esPrecioNegativo ? 'text-danger' : '';
            const subtotalClass = subtotal < 0 ? 'text-danger' : 'text-success';
            
            return `
            <div class="product-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div style="flex: 1;">
                        <div class="fw-bold">${escapeHtml(producto.nombre)}</div>
                        <div class="small text-muted">${escapeHtml(producto.marca)} - ${escapeHtml(producto.numero_parte)}</div>
                        <div class="small text-muted">Precio: $${Math.abs(precioFinal).toFixed(2)} (IVA incluido)</div>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="me-3 text-end">
                            <div class="fw-bold ${precioClass}">$${Math.abs(precioFinal).toFixed(2)} c/u</div>
                            <div class="${subtotalClass} fw-bold">$${Math.abs(subtotal).toFixed(2)}</div>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-secondary" onclick="modificarCantidad(${producto.id_detalle}, -1)"><i class="fas fa-minus"></i></button>
                            <span class="btn btn-light" style="min-width: 40px;">${producto.cantidad}</span>
                            <button class="btn btn-outline-secondary" onclick="modificarCantidad(${producto.id_detalle}, 1)"><i class="fas fa-plus"></i></button>
                        </div>
                        <button class="btn btn-outline-danger ms-2" onclick="eliminarProductoVenta(${producto.id_detalle})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
    
    if (resumenContainer) {
        resumenContainer.innerHTML = productosVentaActual.map(producto => {
            const esNegativo = producto.subtotal < 0;
            const claseColor = esNegativo ? 'text-danger' : '';
            return `
            <div class="d-flex justify-content-between small mb-1">
                <span class="text-truncate" style="max-width: 180px;">${escapeHtml(producto.nombre)} x${producto.cantidad}</span>
                <span class="fw-bold ${claseColor}">$${Math.abs(producto.subtotal).toFixed(2)}</span>
            </div>`;
        }).join('');
    }
    
    actualizarTotales();
}

async function modificarCantidad(idDetalle, cambio) {
    const producto = productosVentaActual.find(p => p.id_detalle === idDetalle);
    if (!producto) return;
    
    const nuevaCantidad = producto.cantidad + cambio;
    if (nuevaCantidad < 1) {
        eliminarProductoVenta(idDetalle);
        return;
    }
    
    try {
        const response = await fetch(`/api/productos/${producto.id_producto}`);
        if (!response.ok) throw new Error('Error al verificar stock');
        const productoStock = await response.json();
        
        if (nuevaCantidad > productoStock.stock_actual) {
            mostrarNotificacion(`No hay suficiente stock. Disponible: ${productoStock.stock_actual}`, 'warning');
            return;
        }
        
        producto.cantidad = nuevaCantidad;
        producto.subtotal = producto.cantidad * producto.precio_final;
        actualizarVistaVenta();
    } catch (error) {
        console.error('Error modificando cantidad:', error);
        mostrarNotificacion('Error al verificar stock', 'danger');
    }
}

function eliminarProductoVenta(idDetalle) {
    productosVentaActual = productosVentaActual.filter(p => p.id_detalle !== idDetalle);
    actualizarVistaVenta();
}

// ============================================
// FUNCIONES DE TOTALES CON IVA DESGLOSADO
// ============================================
function actualizarTotales() {
    // El subtotal es el total con IVA incluido (precio final)
    const totalConIVA = productosVentaActual.reduce((sum, p) => sum + p.subtotal, 0);
    // Calcular el subtotal sin IVA (desglosar)
    const subtotalSinIVA = totalConIVA / (1 + CONFIG.IVA_PORCENTAJE);
    // El IVA es la diferencia
    const iva = totalConIVA - subtotalSinIVA;
    
    document.getElementById('subtotal').textContent = `$${Math.abs(subtotalSinIVA).toFixed(2)}`;
    document.getElementById('iva').textContent = `$${Math.abs(iva).toFixed(2)}`;
    document.getElementById('total').textContent = `$${Math.abs(totalConIVA).toFixed(2)}`;
    
    calcularCambio();
}

function calcularCambio() {
    const totalConIVA = productosVentaActual.reduce((sum, p) => sum + p.subtotal, 0);
    const pagoCon = parseFloat(document.getElementById('pagoCon')?.value) || 0;
    const cambio = pagoCon - totalConIVA;
    
    const cambioInput = document.getElementById('cambio');
    if (cambioInput) {
        if (cambio >= 0) {
            cambioInput.value = `$${cambio.toFixed(2)}`;
            cambioInput.classList.remove('text-danger');
            cambioInput.classList.add('text-success');
        } else {
            cambioInput.value = `-$${Math.abs(cambio).toFixed(2)}`;
            cambioInput.classList.remove('text-success');
            cambioInput.classList.add('text-danger');
        }
    }
    return cambio;
}

// ============================================
// FUNCIONES DE GESTIÓN DE VENTAS
// ============================================
async function refreshVentas() {
    const tbody = document.getElementById('tblVentas');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-border spinner-border-sm"></div> Cargando ventas...</td></tr>';
    
    try {
        const fechaDesde = document.getElementById('filterFechaDesde')?.value;
        const fechaHasta = document.getElementById('filterFechaHasta')?.value;
        const filtroCliente = document.getElementById('filterCliente')?.value;
        const filtroVendedor = document.getElementById('filterVendedor')?.value;
        const orden = document.getElementById('ordenarPor')?.value;
        
        let url = '/api/ventas';
        const params = new URLSearchParams();
        if (fechaDesde) params.append('fechaDesde', fechaDesde);
        if (fechaHasta) params.append('fechaHasta', fechaHasta);
        if (filtroCliente) params.append('cliente', filtroCliente);
        if (filtroVendedor) params.append('vendedor', filtroVendedor);
        if (orden) params.append('orden', orden);
        
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al cargar ventas');
        const ventas = await response.json();
        
        allVentasData = ventas;
        mostrarVentasTabla(ventas);
        
        await calcularEstadisticas();
    } catch (error) {
        console.error('Error refrescando ventas:', error);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4"><i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>Error al cargar ventas: ${error.message}</td></tr>`;
    }
}

async function verDetallesVenta(id) {
    try {
        const [ventaResponse, detallesResponse] = await Promise.all([
            fetch(`/api/ventas/${id}`),
            fetch(`/api/ventas/${id}/detalles`)
        ]);
        
        if (!ventaResponse.ok) throw new Error('Venta no encontrada');
        const venta = await ventaResponse.json();
        const detalles = detallesResponse.ok ? await detallesResponse.json() : [];
        
        // Calcular el total de la venta (con IVA incluido)
        const totalConIVA = detalles.reduce((sum, d) => sum + parseFloat(d.subtotal || 0), 0);
        const subtotalSinIVA = totalConIVA / (1 + CONFIG.IVA_PORCENTAJE);
        const iva = totalConIVA - subtotalSinIVA;
        
        document.getElementById('modalDetallesVenta').dataset.ventaId = id;
        
        const contenido = document.getElementById('detallesVentaContenido');
        if (contenido) {
            contenido.innerHTML = `
                <div class="row">
                    <div class="col-12 mb-3">
                        <div class="text-center mb-3"><i class="fas fa-receipt fa-3x text-primary"></i></div>
                        <h5 class="text-center">Ticket de Venta #${venta.id_venta}</h5>
                        <p class="text-center text-muted">${venta.fecha} ${venta.hora}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card"><div class="card-body">
                            <h6 class="card-title">Información de la Venta</h6>
                            <table class="table table-sm">
                                <tr><th>ID:</th><td>#${venta.id_venta}</td></tr>
                                <tr><th>Fecha:</th><td>${venta.fecha}</td></tr>
                                <tr><th>Hora:</th><td>${venta.hora}</td></tr>
                                <tr><th>Cliente:</th><td>${escapeHtml(venta.cliente_nombre) || 'No especificado'}</td></tr>
                                <tr><th>Teléfono:</th><td>${escapeHtml(venta.cliente_telefono) || 'No registrado'}</td></tr>
                                <tr><th>Método de Pago:</th><td>${venta.metodo_pago}</td></tr>
                                <tr><th>Vendedor:</th><td class="text-primary fw-bold">${escapeHtml(venta.vendedor_nombre) || 'No asignado'}</td></tr>
                                ${venta.notas ? `<tr><th>Notas:</th><td>${escapeHtml(venta.notas)}</td></tr>` : ''}
                            </table>
                        </div></div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card"><div class="card-body">
                            <h6 class="card-title">Resumen Financiero</h6>
                            <div class="receipt">
                                <div class="border-bottom pb-2 mb-2">
                                    ${detalles.map(detalle => `<div class="d-flex justify-content-between small mb-1"><span>${escapeHtml(detalle.producto_nombre)} x${detalle.cantidad}</span><span>$${parseFloat(detalle.subtotal).toFixed(2)}</span></div>`).join('')}
                                </div>
                                <div class="d-flex justify-content-between"><span>Subtotal (sin IVA):</span><span>$${Math.abs(subtotalSinIVA).toFixed(2)}</span></div>
                                <div class="d-flex justify-content-between"><span>IVA (${(CONFIG.IVA_PORCENTAJE * 100)}%):</span><span>$${Math.abs(iva).toFixed(2)}</span></div>
                                <div class="d-flex justify-content-between total-display"><span>TOTAL:</span><span>$${Math.abs(totalConIVA).toFixed(2)}</span></div>
                            </div>
                        </div></div>
                    </div>
                    <div class="col-12">
                        <div class="card"><div class="card-body">
                            <h6 class="card-title">Productos Vendidos</h6>
                            <div class="table-responsive">
                                <table class="table table-sm"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unitario</th><th>Subtotal</th></tr></thead>
                                <tbody>${detalles.map(detalle => `<tr><td><div class="fw-bold">${escapeHtml(detalle.producto_nombre)}</div><div class="small text-muted">${escapeHtml(detalle.producto_marca)} - ${escapeHtml(detalle.numero_parte)}</div></td><td>${detalle.cantidad}</td><td>$${parseFloat(detalle.precio_unitario).toFixed(2)}</td><td>$${parseFloat(detalle.subtotal).toFixed(2)}</td></tr>`).join('')}</tbody>
                                </table>
                            </div>
                        </div></div>
                    </div>
                </div>
            `;
        }
        
        new bootstrap.Modal(document.getElementById('modalDetallesVenta')).show();
    } catch (error) {
        console.error('Error mostrando detalles:', error);
        mostrarNotificacion('Error al cargar detalles de venta', 'danger');
    }
}

async function cancelarVenta(id) {
    const usuario = obtenerUsuarioActual();
    if (!confirm(`¿Está seguro de cancelar la venta #${id}?\n\n⚠️ Esta acción no se puede deshacer.\n✅ El stock de productos será revertido.`)) return;
    
    try {
        const response = await fetch(`/api/ventas/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: usuario?.id, rol: usuario?.rol })
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
async function generarFactura(id) {
    try {
        const response = await fetch(`/api/ventas/${id}/factura`);
        if (!response.ok) {
            let errorMessage = `Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.details || errorMessage;
            } catch (jsonError) {}
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Error desconocido');
        
        facturaActual = data.factura;
        mostrarFactura(data.factura);
    } catch (error) {
        console.error('Error generando factura:', error);
        mostrarNotificacion(`❌ ${error.message}`, 'danger');
    }
}

function mostrarFactura(facturaData) {
    const rfcCliente = facturaData.venta.cliente_rfc || 'No especificado';
    const vendedor = facturaData.vendedor || { nombre: 'No asignado', email: 'No registrado' };
    
    // El total ya viene con IVA incluido de la base de datos
    const totalConIVA = parseFloat(facturaData.total) || 0;
    const subtotalSinIVA = totalConIVA / (1 + CONFIG.IVA_PORCENTAJE);
    const iva = totalConIVA - subtotalSinIVA;
    
    const contenido = document.getElementById('facturaContenido');
    if (contenido) {
        contenido.innerHTML = `
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
                    <div class="card"><div class="card-body">
                        <h6 class="card-title"><i class="fas fa-user me-2"></i>Datos del Cliente</h6>
                        <table class="table table-sm table-borderless">
                            <tr><th>Nombre:</th><td>${escapeHtml(facturaData.venta.cliente_nombre) || 'No especificado'}</td></tr>
                            <tr><th>RFC:</th><td><span class="fw-bold ${rfcCliente !== 'No especificado' ? 'text-success' : 'text-warning'}">${rfcCliente}</span></td></tr>
                            <tr><th>Teléfono:</th><td>${escapeHtml(facturaData.venta.cliente_telefono) || 'No registrado'}</td></tr>
                        </table>
                    </div></div>
                </div>
                <div class="col-md-6">
                    <div class="card"><div class="card-body">
                        <h6 class="card-title"><i class="fas fa-calendar me-2"></i>Datos de la Factura</h6>
                        <table class="table table-sm table-borderless">
                            <tr><th>Fecha de Venta:</th><td>${facturaData.venta.fecha}</td></tr>
                            <tr><th>Hora:</th><td>${facturaData.venta.hora}</td></tr>
                            <tr><th>Método de Pago:</th><td>${facturaData.venta.metodo_pago || 'No especificado'}</td></tr>
                            <tr><th>Vendedor:</th><td class="text-primary fw-bold">${escapeHtml(vendedor.nombre)}</td></tr>
                        </table>
                    </div></div>
                </div>
            </div>
            <h6><i class="fas fa-boxes me-2"></i>Detalle de Productos</h6>
            <table class="table table-bordered">
                <thead class="table-light"><tr><th width="50">#</th><th>Descripción</th><th width="80">Cantidad</th><th width="100">P. Unitario</th><th width="120">Importe</th></tr></thead>
                <tbody>${facturaData.detalles.map((detalle, index) => `<tr><td>${index + 1}</td><td><div class="fw-bold">${escapeHtml(detalle.producto_nombre)}</div><div class="small text-muted">${escapeHtml(detalle.producto_marca)} - ${escapeHtml(detalle.numero_parte)}</div></td><td class="text-center">${detalle.cantidad}</td><td class="text-end">$${parseFloat(detalle.precio_unitario).toFixed(2)}</td><td class="text-end">$${parseFloat(detalle.subtotal).toFixed(2)}</td></tr>`).join('')}</tbody>
                <tfoot class="table-light">
                    <tr><td colspan="4" class="text-end"><strong>Subtotal (sin IVA):</strong></td><td class="text-end"><strong>$${subtotalSinIVA.toFixed(2)}</strong></td></tr>
                    <tr><td colspan="4" class="text-end"><strong>IVA (16%):</strong></td><td class="text-end"><strong>$${iva.toFixed(2)}</strong></td></tr>
                    <tr class="table-active"><td colspan="4" class="text-end"><strong class="fs-5">TOTAL:</strong></td><td class="text-end"><strong class="fs-5">$${totalConIVA.toFixed(2)}</strong></td></tr>
                </tfoot>
            </table>
            ${facturaData.venta.notas ? `<div class="alert alert-info"><p class="mb-0"><strong>Notas:</strong> ${escapeHtml(facturaData.venta.notas)}</p></div>` : ''}
        `;
    }
    
    new bootstrap.Modal(document.getElementById('modalFactura')).show();
}

function imprimirTicket() {
    const modalElement = document.getElementById('modalDetallesVenta');
    const ventaId = modalElement ? modalElement.dataset.ventaId : null;
    if (!ventaId) {
        mostrarNotificacion('No se pudo obtener el ID de la venta', 'warning');
        return;
    }
    
    const contenido = document.getElementById('detallesVentaContenido').innerHTML;
    const ventana = window.open('', '_blank', 'width=400,height=600');
    
    ventana.document.write(`
        <!DOCTYPE html><html><head><title>Ticket de Venta #${ventaId}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>@media print{body{margin:0;padding:10px;font-size:12px}.no-print{display:none!important}.ticket{width:80mm;margin:0 auto;font-family:'Courier New',monospace}}</style>
        </head><body onload="window.print(); setTimeout(() => window.close(), 1000);">
        <div class="ticket">${contenido}</div>
        <div class="text-center mt-4 no-print"><button class="btn btn-primary" onclick="window.print()">Imprimir</button> <button class="btn btn-secondary" onclick="window.close()">Cerrar</button></div>
        </body></html>
    `);
    ventana.document.close();
}

function imprimirFactura() {
    if (!facturaActual) {
        mostrarNotificacion('No hay factura disponible', 'warning');
        return;
    }
    
    const contenido = document.getElementById('facturaContenido').innerHTML;
    const ventana = window.open('', '_blank');
    
    ventana.document.write(`
        <!DOCTYPE html><html><head><title>Factura #${facturaActual.venta.id_venta}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>@media print{body{margin:0;padding:20px}.no-print{display:none!important}}</style>
        </head><body><div class="container">${contenido}</div>
        <div class="text-center mt-4 no-print"><button class="btn btn-primary" onclick="window.print()">Imprimir</button> <button class="btn btn-secondary" onclick="window.close()">Cerrar</button></div>
        <script>window.onload=function(){setTimeout(()=>window.print(),500)}<\/script>
        </body></html>
    `);
    ventana.document.close();
}

// ============================================
// PROCESAMIENTO DE VENTA
// ============================================
async function procesarNuevaVenta(e) {
    e.preventDefault();
    
    if (productosVentaActual.length === 0) {
        mostrarNotificacion('❌ Debe agregar al menos un producto a la venta', 'warning');
        return;
    }
    
    const clienteId = document.getElementById('idClienteSeleccionado').value;
    const metodoPago = document.getElementById('metodoPago').value;
    const notas = document.getElementById('notasVenta').value;
    const pagoCon = parseFloat(document.getElementById('pagoCon').value) || 0;
    const idVendedor = document.getElementById('idVendedorActual')?.value;
    
    if (!clienteId) {
        mostrarNotificacion('❌ Debe seleccionar o crear un cliente', 'warning');
        return;
    }
    
    if (!metodoPago) {
        mostrarNotificacion('❌ Debe seleccionar un método de pago', 'warning');
        return;
    }
    
    const usuario = obtenerUsuarioActual();
    if (!usuario) {
        mostrarNotificacion('❌ No se pudo identificar al vendedor. Inicie sesión nuevamente.', 'danger');
        return;
    }
    
    // Calcular el total (con IVA incluido)
    const totalConIVA = productosVentaActual.reduce((sum, p) => sum + p.subtotal, 0);
    
    if (totalConIVA <= 0) {
        mostrarNotificacion('❌ No se puede procesar una venta con total negativo o cero.', 'danger');
        return;
    }
    
    if (metodoPago === 'efectivo' && pagoCon - totalConIVA < 0) {
        mostrarNotificacion(`❌ El pago es insuficiente. Total: $${totalConIVA.toFixed(2)}`, 'warning');
        return;
    }
    
    if (!confirm(`¿Procesar venta por $${totalConIVA.toFixed(2)}?\n\nVendedor: ${usuario.nombre}\nProductos: ${productosVentaActual.length}`)) return;
    
    const ahora = new Date();
    const fechaVenta = ahora.toISOString().split('T')[0];
    const horaVenta = ahora.toTimeString().split(' ')[0].substring(0, 5);
    
    const ventaData = {
        venta: {
            fecha: fechaVenta,
            hora: horaVenta,
            total: parseFloat(totalConIVA.toFixed(2)),
            id_cliente: parseInt(clienteId),
            metodo_pago: metodoPago,
            pago_con: metodoPago === 'efectivo' ? pagoCon : totalConIVA,
            cambio: metodoPago === 'efectivo' ? (pagoCon - totalConIVA).toFixed(2) : '0.00',
            notas: notas.trim() || null
        },
        detalles: productosVentaActual.map(p => ({
            id_producto: p.id_producto,
            cantidad: p.cantidad,
            precio_unitario: p.precio_final, // Precio con IVA incluido
            subtotal: p.subtotal // Subtotal con IVA incluido
        })),
        id_usuario: usuario.id
    };
    
    try {
        mostrarNotificacion('⏳ Procesando venta...', 'info');
        const response = await fetch('/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventaData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        const data = await response.json();
        
        productosVentaActual = [];
        siguienteIdDetalle = 1;
        document.getElementById('formNuevaVenta').reset();
        document.getElementById('idClienteSeleccionado').value = '';
        document.getElementById('inputCliente').value = '';
        document.getElementById('infoCliente').classList.add('d-none');
        document.getElementById('pagoCon').value = '';
        document.getElementById('cambio').value = '';
        actualizarVistaVenta();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaVenta'));
        if (modal) modal.hide();
        
        const subtotalSinIVA = totalConIVA / (1 + CONFIG.IVA_PORCENTAJE);
        const iva = totalConIVA - subtotalSinIVA;
        mostrarNotificacion(`✅ Venta #${data.ventaId} procesada por $${totalConIVA.toFixed(2)} (Subtotal: $${subtotalSinIVA.toFixed(2)} + IVA: $${iva.toFixed(2)})`, 'success');
        refreshVentas();
        
        setTimeout(() => {
            if (confirm('¿Desea generar la factura de esta venta?')) generarFactura(data.ventaId);
        }, 1500);
    } catch (error) {
        console.error('Error procesando venta:', error);
        mostrarNotificacion(`❌ Error: ${error.message}`, 'danger');
    }
}

function reiniciarVenta() {
    if (productosVentaActual.length > 0 && !confirm('¿Está seguro de reiniciar la venta? Se perderán todos los productos agregados.')) return;
    
    productosVentaActual = [];
    siguienteIdDetalle = 1;
    actualizarVistaVenta();
    
    document.getElementById('buscarProducto').value = '';
    document.getElementById('resultadosBusqueda').innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3"><i class="fas fa-search me-1"></i>Ingresa un término para buscar productos</td></tr>';
    
    mostrarNotificacion('Venta reiniciada', 'info');
}

// ============================================
// INICIALIZACIÓN
// ============================================
function configurarAutocompletado() {
    document.addEventListener('click', function(e) {
        const autocompleteList = document.getElementById('autocompleteList');
        const inputCliente = document.getElementById('inputCliente');
        if (autocompleteList && !autocompleteList.contains(e.target) && e.target !== inputCliente) {
            autocompleteList.innerHTML = '';
            autocompleteList.style.display = 'none';
        }
    });
    
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

async function initVentasSystem() {
    try {
        console.log('🚀 Inicializando sistema de ventas...');
        
        const usuario = cargarUsuario();
        if (usuario) {
            document.getElementById('vendedorNombreActual').textContent = usuario.nombre;
            document.getElementById('vendedorEmailActual').textContent = usuario.email || 'No registrado';
            document.getElementById('vendedorRolActual').textContent = usuario.rol === 'admin' ? 'Administrador' : 'Vendedor';
            document.getElementById('idVendedorActual').value = usuario.id;
        }
        
        document.getElementById('formNuevaVenta').addEventListener('submit', procesarNuevaVenta);
        configurarAutocompletado();
        
        const inputCliente = document.getElementById('inputCliente');
        if (inputCliente) {
            let timeout;
            inputCliente.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (this.value.trim().length >= 2) autocompletarClientes(this.value);
                    else {
                        const lista = document.getElementById('autocompleteList');
                        if (lista) { lista.innerHTML = ''; lista.style.display = 'none'; }
                    }
                }, 300);
            });
        }
        
        const pagoConInput = document.getElementById('pagoCon');
        if (pagoConInput) {
            pagoConInput.addEventListener('input', calcularCambio);
        }
        
        const buscarProductoInput = document.getElementById('buscarProducto');
        if (buscarProductoInput) {
            let timeout;
            buscarProductoInput.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (this.value.trim().length >= 2) buscarProductos();
                    else limpiarBusquedaProductos();
                }, 300);
            });
            buscarProductoInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); buscarProductos(); }
            });
        }
        
        const globalSearch = document.getElementById('globalSearch');
        const btnSearch = document.getElementById('btnSearch');
        if (globalSearch && btnSearch) {
            const buscarGlobal = () => {
                const termino = globalSearch.value.trim();
                if (termino) buscarVentasPorTermino(termino);
                else refreshVentas();
            };
            btnSearch.addEventListener('click', buscarGlobal);
            globalSearch.addEventListener('keypress', e => { if (e.key === 'Enter') buscarGlobal(); });
        }
        
        // Configurar método de pago
        const metodoPago = document.getElementById('metodoPago');
        const seccionEfectivo = document.getElementById('seccionEfectivo');
        if (metodoPago && seccionEfectivo) {
            function toggleEfectivo() {
                seccionEfectivo.style.display = metodoPago.value === 'efectivo' ? 'block' : 'none';
                if (metodoPago.value === 'efectivo') document.getElementById('pagoCon')?.focus();
                else { document.getElementById('pagoCon').value = ''; document.getElementById('cambio').value = ''; }
            }
            toggleEfectivo();
            metodoPago.addEventListener('change', toggleEfectivo);
        }
        
        actualizarFechaHora();
        setInterval(actualizarFechaHora, 1000);
        
        await cargarFiltros();
        await refreshVentas();
        actualizarVistaVenta();
        
        console.log('✅ Sistema de ventas inicializado correctamente');
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        mostrarNotificacion('Error al inicializar el sistema', 'danger');
    }
}

// Función para buscar ventas por término
async function buscarVentasPorTermino(termino) {
    const tbody = document.getElementById('tblVentas');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-border spinner-border-sm"></div> Buscando...</td></tr>';
    
    try {
        const response = await fetch(`/api/ventas/filtradas?termino=${encodeURIComponent(termino)}`);
        if (!response.ok) throw new Error('Error en la búsqueda');
        const ventas = await response.json();
        mostrarVentasTabla(ventas);
    } catch (error) {
        console.error('Error buscando ventas:', error);
        mostrarNotificacion('Error al buscar', 'danger');
        refreshVentas();
    }
}

// ============================================
// FUNCIONES GLOBALES EXPORTADAS
// ============================================
window.imprimirTicket = imprimirTicket;
window.imprimirFactura = imprimirFactura;
window.generarFactura = generarFactura;
window.refreshVentas = refreshVentas;
window.verDetallesVenta = verDetallesVenta;
window.cancelarVenta = cancelarVenta;
window.agregarProductoVenta = agregarProductoVenta;
window.modificarCantidad = modificarCantidad;
window.eliminarProductoVenta = eliminarProductoVenta;
window.buscarProductos = buscarProductos;
window.limpiarBusquedaProductos = limpiarBusquedaProductos;
window.cambiarCliente = cambiarCliente;
window.crearNuevoCliente = crearNuevoCliente;
window.generarRFCDefault = generarRFCDefault;
window.aplicarFiltros = aplicarFiltros;
window.reiniciarVenta = reiniciarVenta;
window.cerrarSesion = cerrarSesion;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVentasSystem);
} else {
    initVentasSystem();
}