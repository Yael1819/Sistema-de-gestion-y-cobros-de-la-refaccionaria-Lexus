// ============================
// Variables globales
// ============================
let categoriasData = [];
let categoriaEditandoId = null;
let categoriaDetalleId = null;

// Variables para paginación - 5 categorías por página
let currentPage = 1;
const itemsPerPage = 5;
let filteredCategorias = [];

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
// Función para seleccionar color
// ============================
function seleccionarColor(color) {
    document.getElementById('colorSeleccionado').value = color;
    // Actualizar estilo visual de los círculos
    document.querySelectorAll('.color-option').forEach(el => {
        el.style.border = el.style.backgroundColor === color ? '2px solid #fff' : '2px solid #ddd';
        el.style.boxShadow = el.style.backgroundColor === color ? '0 0 0 2px #007bff' : 'none';
    });
}

// ============================
// Renderizar controles de paginación centrados
// ============================
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        console.log('No se encontró el contenedor de paginación');
        return;
    }
    
    const totalPages = Math.ceil(filteredCategorias.length / itemsPerPage);
    console.log('Total páginas:', totalPages, 'Total categorías:', filteredCategorias.length);
    
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
    console.log('Paginación renderizada');
}

// ============================
// Cambiar de página
// ============================
function changePage(page) {
    const totalPages = Math.ceil(filteredCategorias.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    currentPage = page;
    mostrarCategorias(filteredCategorias, false);
}

// ============================
// Mostrar categorías con paginación
// ============================
function mostrarCategorias(categorias, resetPage = true) {
    const tbody = document.getElementById('tblCategorias');
    const contador = document.getElementById('contadorCategorias');
    
    if (!tbody) {
        console.error('No se encontró el elemento tblCategorias');
        return;
    }
    
    // Guardar categorías filtradas
    filteredCategorias = categorias;
    
    // Resetear a primera página si es necesario
    if (resetPage) {
        currentPage = 1;
    }
    
    console.log('Mostrando categorías - Total:', filteredCategorias.length, 'Página:', currentPage);
    
    if (filteredCategorias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay categorías registradas
                </td>
            </tr>
        `;
        contador.textContent = '0 categorías';
        renderPagination();
        return;
    }
    
    // Calcular índices para la página actual (5 categorías por página)
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const categoriasPagina = filteredCategorias.slice(startIndex, endIndex);
    
    // Actualizar contador
    const totalMostrados = Math.min(endIndex, filteredCategorias.length);
    contador.textContent = `${filteredCategorias.length} categorías (Mostrando ${startIndex + 1}-${totalMostrados} de ${filteredCategorias.length})`;
    
    tbody.innerHTML = categoriasPagina.map(cat => {
        // Determinar clase de estado basada en cantidad de productos
        let estadoClass = cat.cantidad_productos > 0 ? 'success' : 'warning';
        let estadoText = cat.cantidad_productos > 0 ? 'Activa' : 'Sin productos';
        
        // Formatear valor del stock
        const valorStock = parseFloat(cat.valor_stock || 0);
        const valorFormateado = valorStock.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        return `
            <tr>
                <td class="fw-bold">${cat.id_categoria}</td>
                <td>
                    <span class="category-badge" style="background-color: ${cat.color || '#3498db'}"></span>
                    <strong>${escapeHtml(cat.nombre)}</strong>
                </td>
                <td>${cat.descripcion ? escapeHtml(cat.descripcion) : '<span class="text-muted">Sin descripción</span>'}</td>
                <td>
                    <span class="badge ${cat.cantidad_productos > 0 ? 'bg-success' : 'bg-warning'}">
                        ${cat.cantidad_productos} productos
                    </span>
                </td>
                <td>
                    <span class="badge bg-info">
                        $${valorFormateado}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${estadoClass}">
                        ${estadoText}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info btn-action" 
                            onclick="verDetalles(${cat.id_categoria})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-action" 
                            onclick="editarCategoria(${cat.id_categoria})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-action" 
                            onclick="eliminarCategoria(${cat.id_categoria}, '${escapeHtml(cat.nombre)}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
             </tr>
        `;
    }).join('');
    
    // Renderizar controles de paginación
    renderPagination();
}

// Función para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================
// Cargar categorías
// ============================
async function cargarCategorias() {
    try {
        console.log('Cargando categorías...');
        const response = await fetch('/api/categorias');
        if (!response.ok) throw new Error('Error al cargar categorías');
        
        categoriasData = await response.json();
        console.log('Categorías cargadas:', categoriasData.length);
        
        // Asegurar que cada categoría tenga cantidad_productos y valor_stock
        categoriasData.forEach(cat => {
            if (cat.cantidad_productos === undefined) cat.cantidad_productos = 0;
            if (cat.valor_stock === undefined) cat.valor_stock = 0;
        });
        
        mostrarCategorias(categoriasData);
        actualizarEstadisticas();
    } catch (error) {
        console.error('Error:', error);
        const tbody = document.getElementById('tblCategorias');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-4">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error al cargar las categorías: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// ============================
// Estadísticas
// ============================
function actualizarEstadisticas() {
    const total = categoriasData.length;
    const conProductos = categoriasData.filter(c => c.cantidad_productos > 0).length;
    const sinProductos = categoriasData.filter(c => c.cantidad_productos === 0).length;
    
    const countCategorias = document.getElementById('countCategorias');
    const countConProductos = document.getElementById('countConProductos');
    const countSinProductos = document.getElementById('countSinProductos');
    const countActivas = document.getElementById('countActivas');
    
    if (countCategorias) countCategorias.textContent = total;
    if (countConProductos) countConProductos.textContent = conProductos;
    if (countSinProductos) countSinProductos.textContent = sinProductos;
    if (countActivas) countActivas.textContent = conProductos;
}

// ============================
// Refrescar
// ============================
function refreshCategorias() {
    const tbody = document.getElementById('tblCategorias');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                    Cargando...
                </td>
            </tr>
        `;
    }
    cargarCategorias();
}

// ============================
// Ver detalles
// ============================
function verDetalles(id) {
    const categoria = categoriasData.find(cat => cat.id_categoria === id);
    if (!categoria) return;
    
    categoriaDetalleId = id;

    // Formatear el valor del stock
    const valorStockFormateado = parseFloat(categoria.valor_stock || 0).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    });

    const detallesContenido = document.getElementById('detallesContenido');
    if (detallesContenido) {
        detallesContenido.innerHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <div class="d-flex align-items-center">
                        <span class="category-badge" style="background-color: ${categoria.color || '#3498db'}; width: 20px; height: 20px; margin-right: 10px;"></span>
                        <h5 class="mb-0">${escapeHtml(categoria.nombre)}</h5>
                    </div>
                </div>
                <div class="col-md-6 mb-2">
                    <strong>ID:</strong><br>
                    ${categoria.id_categoria}
                </div>
                <div class="col-md-6 mb-2">
                    <strong>Color:</strong><br>
                    ${categoria.color || '#3498db'}
                </div>
                <div class="col-12 mb-2">
                    <strong>Descripción:</strong><br>
                    ${categoria.descripcion ? escapeHtml(categoria.descripcion) : '<span class="text-muted">Sin descripción</span>'}
                </div>
                <div class="col-md-6 mb-2">
                    <strong>Productos asociados:</strong><br>
                    <span class="badge bg-success">${categoria.cantidad_productos} productos</span>
                </div>
                <div class="col-md-6 mb-2">
                    <strong>Valor del inventario:</strong><br>
                    <span class="badge bg-info">${valorStockFormateado}</span>
                </div>
                <div class="col-12 mt-3">
                    <div class="alert alert-${categoria.cantidad_productos > 0 ? 'success' : 'warning'}">
                        <i class="fas fa-info-circle me-2"></i>
                        ${categoria.cantidad_productos > 0 ? 
                            'Esta categoría tiene productos asociados' : 
                            'Esta categoría no tiene productos asociados'}
                    </div>
                </div>
            </div>
        `;
    }

    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    if (modal) modal.show();
}

function editarCategoriaDesdeDetalles() {
    if (categoriaDetalleId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalles'));
        if (modal) modal.hide();
        editarCategoria(categoriaDetalleId);
    }
}

// ============================
// Editar categoría
// ============================
function editarCategoria(id) {
    const categoria = categoriasData.find(cat => cat.id_categoria === id);
    if (!categoria) return;

    categoriaEditandoId = id;

    const form = document.getElementById('formAgregarCategoria');
    if (form) {
        form.nombre.value = categoria.nombre;
        form.descripcion.value = categoria.descripcion || '';
    }
    
    const colorInput = document.getElementById('colorSeleccionado');
    if (colorInput && categoria.color) {
        colorInput.value = categoria.color;
    }

    const modalTitle = document.querySelector('#modalAgregarCategoria .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Categoría';
    }

    const modal = new bootstrap.Modal(document.getElementById('modalAgregarCategoria'));
    if (modal) modal.show();
}

// ============================
// Guardar (Crear / Editar)
// ============================
const formAgregar = document.getElementById('formAgregarCategoria');
if (formAgregar) {
    formAgregar.addEventListener('submit', async function(e) {
        e.preventDefault();

        const data = {
            nombre: this.nombre.value,
            descripcion: this.descripcion.value,
            color: document.getElementById('colorSeleccionado').value
        };

        try {
            let url = '/api/categorias';
            let method = 'POST';

            if (categoriaEditandoId) {
                url = `/api/categorias/${categoriaEditandoId}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'No se pudo guardar');
            }

            alert('✅ Categoría guardada correctamente');

            categoriaEditandoId = null;
            this.reset();
            const colorInput = document.getElementById('colorSeleccionado');
            if (colorInput) colorInput.value = '#3498db';

            const modalTitle = document.querySelector('#modalAgregarCategoria .modal-title');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-tag me-2"></i>Agregar Categoría';
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarCategoria'));
            if (modal) modal.hide();

            refreshCategorias();

        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    });
}

// ============================
// Eliminar categoría
// ============================
async function eliminarCategoria(id, nombre) {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?\nEsta acción no se puede deshacer.`)) return;

    try {
        const response = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar');
        }

        alert('✅ Categoría eliminada correctamente');
        refreshCategorias();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ============================
// Filtros
// ============================
function aplicarFiltros() {
    const filtro = document.getElementById('filterEstado').value;
    const orden = document.getElementById('ordenarPor').value;

    let data = [...categoriasData];

    if (filtro === 'con_productos') data = data.filter(c => c.cantidad_productos > 0);
    if (filtro === 'sin_productos') data = data.filter(c => c.cantidad_productos === 0);
    if (filtro === 'activas') data = data.filter(c => c.cantidad_productos > 0);
    if (filtro === 'inactivas') data = data.filter(c => c.cantidad_productos === 0);

    if (orden === 'nombre') data.sort((a,b) => a.nombre.localeCompare(b.nombre));
    if (orden === 'productos_desc') data.sort((a,b) => b.cantidad_productos - a.cantidad_productos);
    if (orden === 'productos_asc') data.sort((a,b) => a.cantidad_productos - b.cantidad_productos);
    if (orden === 'id_desc') data.sort((a,b) => b.id_categoria - a.id_categoria);
    if (orden === 'id_asc') data.sort((a,b) => a.id_categoria - b.id_categoria);

    mostrarCategorias(data);
}

// ============================
// Buscador
// ============================
function buscarCategorias() {
    const txt = document.getElementById('globalSearch').value.toLowerCase().trim();
    if (!txt) {
        mostrarCategorias(categoriasData);
        return;
    }

    const resultados = categoriasData.filter(c =>
        c.nombre.toLowerCase().includes(txt) ||
        (c.descripcion || '').toLowerCase().includes(txt)
    );
    
    mostrarCategorias(resultados);
}

// ============================
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando Categorias.js');
    
    // Cargar información del usuario
    cargarUsuario();
    
    // Configurar eventos
    const btnSearch = document.getElementById('btnSearch');
    if (btnSearch) {
        btnSearch.addEventListener('click', buscarCategorias);
    }
    
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') buscarCategorias();
        });
    }
    
    const ordenarPor = document.getElementById('ordenarPor');
    if (ordenarPor) {
        ordenarPor.addEventListener('change', aplicarFiltros);
    }
    
    // Limpiar formulario al cerrar modal
    const modalAgregar = document.getElementById('modalAgregarCategoria');
    if (modalAgregar) {
        modalAgregar.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('formAgregarCategoria');
            if (form) form.reset();
            categoriaEditandoId = null;
            const colorInput = document.getElementById('colorSeleccionado');
            if (colorInput) colorInput.value = '#3498db';
            
            const modalTitle = document.querySelector('#modalAgregarCategoria .modal-title');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-tag me-2"></i>Agregar Categoría';
            }
        });
    }
    
    // Cargar categorías
    cargarCategorias();
});