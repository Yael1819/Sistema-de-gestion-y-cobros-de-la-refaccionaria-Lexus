// ============================
// Variables globales
// ============================
let categoriasData = [];
let categoriaEditandoId = null;

// ============================
// Cargar categorías
// ============================
async function cargarCategorias() {
    try {
        const response = await fetch('/api/categorias');
        if (!response.ok) throw new Error('Error al cargar categorías');
        
        categoriasData = await response.json();
        mostrarCategorias(categoriasData);
        actualizarEstadisticas();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('tblCategorias').innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar las categorías: ${error.message}
                </td>
            </tr>
        `;
    }
}

// ============================
// Mostrar categorías
// ============================
function mostrarCategorias(categorias) {
    const tbody = document.getElementById('tblCategorias');
    const contador = document.getElementById('contadorCategorias');
    
    if (categorias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay categorías registradas
                </td>
            </tr>
        `;
        contador.textContent = '0 categorías';
        return;
    }
    
    contador.textContent = `${categorias.length} categorías`;
    
    tbody.innerHTML = categorias.map(cat => `
        <tr>
            <td class="fw-bold">${cat.id_categoria}</td>
            <td>
                <span class="category-badge" style="background-color: ${cat.color || '#3498db'}"></span>
                <strong>${cat.nombre}</strong>
            </td>
            <td>${cat.descripcion || '<span class="text-muted">Sin descripción</span>'}</td>
            <td>
                <span class="badge ${cat.cantidad_productos > 0 ? 'bg-success' : 'bg-warning'}">
                    ${cat.cantidad_productos} productos
                </span>
            </td>
            <td>
                <span class="badge bg-info">
                    $${parseFloat(cat.valor_stock || 0).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </span>
            </td>
            <td>
                <span class="badge ${cat.cantidad_productos > 0 ? 'bg-success' : 'bg-warning'}">
                    ${cat.cantidad_productos > 0 ? 'Activa' : 'Sin productos'}
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
                        onclick="eliminarCategoria(${cat.id_categoria}, '${cat.nombre}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}
// ============================
// Estadísticas
// ============================
function actualizarEstadisticas() {
    document.getElementById('countCategorias').textContent = categoriasData.length;
    
    const conProductos = categoriasData.filter(c => c.cantidad_productos > 0).length;
    const sinProductos = categoriasData.filter(c => c.cantidad_productos === 0).length;
    
    document.getElementById('countConProductos').textContent = conProductos;
    document.getElementById('countSinProductos').textContent = sinProductos;
    document.getElementById('countActivas').textContent = conProductos;
}

// ============================
// Refrescar
// ============================
function refreshCategorias() {
    document.getElementById('tblCategorias').innerHTML = `
        <tr>
            <td colspan="7" class="text-center">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                Cargando...
            </td>
        </tr>
    `;
    cargarCategorias();
}

// ============================
// Ver detalles
// ============================
function verDetalles(id) {
    const categoria = categoriasData.find(cat => cat.id_categoria === id);
    if (!categoria) return;

    // Formatear el valor del stock
    const valorStockFormateado = parseFloat(categoria.valor_stock || 0).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    });

    document.getElementById('detallesContenido').innerHTML = `
        <p><b>ID:</b> ${categoria.id_categoria}</p>
        <p><b>Nombre:</b> ${categoria.nombre}</p>
        <p><b>Descripción:</b> ${categoria.descripcion || 'Sin descripción'}</p>
        <p><b>Productos:</b> ${categoria.cantidad_productos}</p>
        <p><b>Valor del Stock:</b> <span class="badge bg-info">${valorStockFormateado}</span></p>
        <p><b>Color:</b> 
            <span class="category-badge d-inline-block align-middle" 
                  style="background-color: ${categoria.color || '#3498db'}"></span>
            ${categoria.color || '#3498db'}
        </p>
    `;

    new bootstrap.Modal(document.getElementById('modalDetalles')).show();
}

// ============================
// Editar categoría
// ============================
function editarCategoria(id) {
    const categoria = categoriasData.find(cat => cat.id_categoria === id);
    if (!categoria) return;

    categoriaEditandoId = id;

    const form = document.getElementById('formAgregarCategoria');
    form.nombre.value = categoria.nombre;
    form.descripcion.value = categoria.descripcion || '';

    document.querySelector('#modalAgregarCategoria .modal-title')
        .innerHTML = '<i class="fas fa-edit me-2"></i>Editar Categoría';

    new bootstrap.Modal(document.getElementById('modalAgregarCategoria')).show();
}

// ============================
// Guardar (Crear / Editar)
// ============================
document.getElementById('formAgregarCategoria').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        nombre: this.nombre.value,
        descripcion: this.descripcion.value
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

        if (!response.ok) throw new Error('No se pudo guardar');

        alert('✅ Categoría guardada correctamente');

        categoriaEditandoId = null;
        this.reset();

        document.querySelector('#modalAgregarCategoria .modal-title')
            .innerHTML = '<i class="fas fa-tag me-2"></i>Agregar Categoría';

        bootstrap.Modal.getInstance(
            document.getElementById('modalAgregarCategoria')
        ).hide();

        refreshCategorias();

    } catch (err) {
        alert('❌ Error: ' + err.message);
    }
});

// ============================
// Eliminar categoría
// ============================
async function eliminarCategoria(id, nombre) {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;

    try {
        const response = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar');

        alert('✅ Categoría eliminada');
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
document.getElementById('btnSearch').addEventListener('click', () => {
    const txt = document.getElementById('globalSearch').value.toLowerCase();
    if (!txt) return mostrarCategorias(categoriasData);

    mostrarCategorias(
        categoriasData.filter(c =>
            c.nombre.toLowerCase().includes(txt) ||
            (c.descripcion || '').toLowerCase().includes(txt)
        )
    );
});

// ============================
// Inicializar
// ============================
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
});
