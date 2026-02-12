// ============================
// Variables globales
// ============================
let clientesData = [];
let clienteEditandoId = null;

// ============================
// Cargar clientes desde API
// ============================
async function cargarClientes() {
  try {
    const res = await fetch('/api/clientes');
    if (!res.ok) throw new Error('Error al cargar clientes');

    clientesData = await res.json();
    renderClientes(clientesData);
    actualizarEstadisticas();
  } catch (err) {
    console.error('❌ Error:', err.message);
    mostrarNotificacion('Error cargando clientes. Revisa consola.', 'danger');
  }
}

// ============================
// Renderizar tabla (ACTUALIZADA CON RFC)
// ============================
function renderClientes(data) {
  const tbody = document.getElementById('tblClientes');
  const contador = document.getElementById('contadorClientes');

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">
          <i class="fas fa-users fa-2x mb-2"></i><br>
          No hay clientes registrados
        </td>
      </tr>
    `;
    contador.textContent = '0 clientes';
    return;
  }

  contador.textContent = `${data.length} clientes`;

  tbody.innerHTML = data.map(c => `
    <tr>
      <td><span class="badge bg-secondary">${c.id_cliente}</span></td>
      <td>
        <div class="fw-bold">${c.nombre}</div>
        ${c.ciudad ? `<div class="small text-muted">${c.ciudad}</div>` : ''}
      </td>
      <td>
        <div>${c.telefono || '-'}</div>
        ${c.email ? `<div class="small text-muted">${c.email}</div>` : ''}
      </td>
      <td class="small">${c.direccion || '-'}</td>
      <td>
        ${c.rfc ? `<span class="badge bg-info badge-rfc">${c.rfc}</span>` : '<span class="text-muted">Sin RFC</span>'}
      </td>
      <td>
        <span class="badge bg-success">Activo</span>
      </td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-info btn-action"
            onclick="verCliente(${c.id_cliente})" title="Ver detalles">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-outline-warning btn-action"
            onclick="editarCliente(${c.id_cliente})" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline-danger btn-action"
            onclick="eliminarCliente(${c.id_cliente})" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============================
// Estadísticas (actualizadas)
// ============================
function actualizarEstadisticas() {
  if (!clientesData.length) {
    document.getElementById('countClientes').textContent = '0';
    document.getElementById('countConRFC').textContent = '0';
    document.getElementById('countConEmail').textContent = '0';
    document.getElementById('countConDireccion').textContent = '0';
    return;
  }
  
  const totalClientes = clientesData.length;
  const conRFC = clientesData.filter(c => c.rfc && c.rfc.trim()).length;
  const conEmail = clientesData.filter(c => c.email && c.email.trim()).length;
  const conDireccion = clientesData.filter(c => c.direccion && c.direccion.trim()).length;
  
  document.getElementById('countClientes').textContent = totalClientes;
  document.getElementById('countConRFC').textContent = conRFC;
  document.getElementById('countConEmail').textContent = conEmail;
  document.getElementById('countConDireccion').textContent = conDireccion;
}

// ============================
// Ver cliente (ACTUALIZADO CON RFC)
// ============================
function verCliente(id) {
  const c = clientesData.find(x => x.id_cliente === id);
  if (!c) return;

  const contenedor = document.getElementById('detallesContenido');

  contenedor.innerHTML = `
    <div class="row">
      <div class="col-12 mb-3">
        <h5 class="border-bottom pb-2">${c.nombre}</h5>
        <span class="badge bg-secondary">ID: ${c.id_cliente}</span>
      </div>
      <div class="col-md-6">
        <p><b><i class="fas fa-phone me-2"></i>Teléfono:</b><br>${c.telefono || '-'}</p>
        <p><b><i class="fas fa-envelope me-2"></i>Email:</b><br>${c.email || '-'}</p>
        <p><b><i class="fas fa-id-card me-2"></i>RFC:</b><br>${c.rfc ? `<span class="badge bg-info">${c.rfc}</span>` : 'No registrado'}</p>
      </div>
      <div class="col-md-6">
        <p><b><i class="fas fa-map-marker-alt me-2"></i>Dirección:</b><br>${c.direccion || '-'}</p>
        <p><b><i class="fas fa-city me-2"></i>Ciudad:</b><br>${c.ciudad || '-'}</p>
        <p><b><i class="fas fa-building me-2"></i>Estado:</b><br>${c.estado || '-'}</p>
      </div>
      <div class="col-12 mt-3">
        <div class="alert alert-light">
          <small><i class="fas fa-info-circle me-1"></i> Cliente registrado en el sistema.</small>
        </div>
      </div>
    </div>
  `;

  new bootstrap.Modal(
    document.getElementById('modalDetalles')
  ).show();
}

// ============================
// Editar cliente (ACTUALIZADO CON RFC)
// ============================
function editarCliente(id) {
  const c = clientesData.find(x => x.id_cliente === id);
  if (!c) return;

  clienteEditandoId = id;
  const form = document.getElementById('formAgregarCliente');

  // Llenar todos los campos que existen en la DB
  form.nombre.value    = c.nombre || '';
  form.telefono.value  = c.telefono || '';
  form.email.value     = c.email || '';
  form.direccion.value = c.direccion || '';
  form.rfc.value       = c.rfc || '';
  form.ciudad.value    = c.ciudad || '';
  form.estado.value    = c.estado || '';

  document.querySelector('#modalAgregarCliente .modal-title')
    .innerHTML = '<i class="fas fa-edit me-2"></i>Editar Cliente';

  new bootstrap.Modal(
    document.getElementById('modalAgregarCliente')
  ).show();
}

// ============================
// Guardar cliente (crear / editar) - ACTUALIZADO CON RFC
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formAgregarCliente');

  // Auto-mayúsculas para RFC
  const rfcInput = form.querySelector('input[name="rfc"]');
  if (rfcInput) {
    rfcInput.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Validación básica
    if (!this.nombre.value || !this.telefono.value) {
      mostrarNotificacion('Nombre y teléfono son obligatorios', 'warning');
      return;
    }

    // Validar RFC si se ingresa
    if (this.rfc.value) {
      const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
      if (!rfcRegex.test(this.rfc.value.toUpperCase())) {
        mostrarNotificacion('RFC no válido. Formato: XAXX010101000', 'warning');
        this.rfc.focus();
        return;
      }
    }

    // Validar teléfono
    const telefono = this.telefono.value.trim();
    if (!/^[0-9\s\-\(\)\.\+]{10,20}$/.test(telefono)) {
      mostrarNotificacion('Teléfono no válido. Use solo números y caracteres de teléfono.', 'warning');
      this.telefono.focus();
      return;
    }

    // Preparar datos
    const data = {
      nombre: this.nombre.value.trim(),
      telefono: telefono,
      email: this.email.value.trim() || null,
      direccion: this.direccion.value.trim() || null,
      rfc: this.rfc.value.trim().toUpperCase() || null,
      ciudad: this.ciudad.value.trim() || null,
      estado: this.estado.value.trim() || null
    };

    try {
      let url = '/api/clientes';
      let method = 'POST';

      if (clienteEditandoId) {
        url = `/api/clientes/${clienteEditandoId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar cliente');
      }

      const result = await res.json();
      
      clienteEditandoId = null;
      this.reset();

      bootstrap.Modal.getInstance(
        document.getElementById('modalAgregarCliente')
      ).hide();

      mostrarNotificacion(
        result.message || (clienteEditandoId ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente'),
        'success'
      );

      cargarClientes();

    } catch (err) {
      console.error('Error:', err);
      mostrarNotificacion(err.message, 'danger');
    }
  });

  // Configurar búsqueda global
  document.getElementById('btnSearch').addEventListener('click', buscarClientesGlobal);
  document.getElementById('globalSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') buscarClientesGlobal();
  });

  // Configurar búsqueda local
  document.getElementById('buscarCliente').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') buscarClientes();
  });

  // Cargar clientes al iniciar
  cargarClientes();
});

// ============================
// Función para mostrar notificaciones
// ============================
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

// ============================
// Eliminar cliente
// ============================
async function eliminarCliente(id) {
  if (!confirm('¿Está seguro de eliminar este cliente?\n\nEsta acción no se puede deshacer.')) return;

  try {
    const res = await fetch(`/api/clientes/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error eliminando cliente');
    }

    const result = await res.json();
    mostrarNotificacion(result.message || 'Cliente eliminado exitosamente', 'success');
    cargarClientes();
  } catch (err) {
    mostrarNotificacion(`❌ ${err.message}`, 'danger');
  }
}

// ============================
// Funciones de búsqueda
// ============================
function buscarClientes() {
  const termino = document.getElementById('buscarCliente').value.toLowerCase();
  
  if (!termino.trim()) {
    // Si está vacío, mostrar todos
    renderClientes(clientesData);
    document.getElementById('contadorClientes').textContent = `${clientesData.length} clientes`;
    return;
  }
  
  const clientesFiltrados = clientesData.filter(c => 
    (c.nombre && c.nombre.toLowerCase().includes(termino)) || 
    (c.telefono && c.telefono.includes(termino)) ||
    (c.email && c.email.toLowerCase().includes(termino)) ||
    (c.rfc && c.rfc.toLowerCase().includes(termino)) ||
    (c.ciudad && c.ciudad.toLowerCase().includes(termino)) ||
    (c.estado && c.estado.toLowerCase().includes(termino)) ||
    (c.direccion && c.direccion.toLowerCase().includes(termino))
  );
  
  renderClientes(clientesFiltrados);
  document.getElementById('contadorClientes').textContent = `${clientesFiltrados.length} clientes encontrados`;
}

function buscarClientesGlobal() {
  const termino = document.getElementById('globalSearch').value.toLowerCase();
  document.getElementById('buscarCliente').value = termino;
  buscarClientes();
}

function limpiarBusqueda() {
  document.getElementById('buscarCliente').value = '';
  document.getElementById('globalSearch').value = '';
  cargarClientes();
}

// ============================
// Ordenar clientes
// ============================
function ordenarClientes() {
  const orden = document.getElementById('ordenarPor').value;
  let clientesOrdenados = [...clientesData];
  
  switch(orden) {
    case 'nombre':
      clientesOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    case 'nombre_desc':
      clientesOrdenados.sort((a, b) => b.nombre.localeCompare(a.nombre));
      break;
    case 'id_desc':
      clientesOrdenados.sort((a, b) => b.id_cliente - a.id_cliente);
      break;
    case 'id_asc':
      clientesOrdenados.sort((a, b) => a.id_cliente - b.id_cliente);
      break;
    case 'rfc':
      clientesOrdenados.sort((a, b) => {
        const aRfc = a.rfc || '';
        const bRfc = b.rfc || '';
        if (aRfc && !bRfc) return -1;
        if (!aRfc && bRfc) return 1;
        return aRfc.localeCompare(bRfc);
      });
      break;
  }
  
  renderClientes(clientesOrdenados);
}

// ============================
// Funciones auxiliares
// ============================
function editarClienteDesdeDetalles() {
  const modal = document.getElementById('modalDetalles');
  bootstrap.Modal.getInstance(modal).hide();
  
  // Recargar para asegurar que tenemos los datos actualizados
  setTimeout(() => {
    if (clienteEditandoId) {
      editarCliente(clienteEditandoId);
    }
  }, 300);
}

// ============================
// Inicialización adicional
// ============================
window.addEventListener('load', () => {
  // Limpiar modal al cerrar
  const modal = document.getElementById('modalAgregarCliente');
  if (modal) {
    modal.addEventListener('hidden.bs.modal', () => {
      clienteEditandoId = null;
      const form = document.getElementById('formAgregarCliente');
      if (form) {
        form.reset();
        document.querySelector('#modalAgregarCliente .modal-title')
          .innerHTML = '<i class="fas fa-user-plus me-2"></i>Agregar Cliente';
      }
    });
  }
});