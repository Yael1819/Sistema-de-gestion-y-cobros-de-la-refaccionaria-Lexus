const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Configuración de MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'yael',
    password: 'Yael123!',
    database: 'Lexus',
    port: 3306
});

// Conectar a MySQL
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err.message);
        return;
    }
    console.log('✅ Conectado a MySQL correctamente');
    console.log('📊 Base de datos: Lexus');
});

// Ruta raíz - redirige a Home
app.get('/', (req, res) => {
    res.redirect('/src/Home.html');
});

// Rutas para páginas HTML
app.get('/clientes', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Clientes/Clientes.html'));
});

app.get('/categorias', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Categorias/Categorias.html'));
});

app.get('/productos', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Productos/Productos.html'));
});

app.get('/proveedores', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Proveedores/Proovedores.html'));
});

app.get('/vehiculos', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Vehiculos/Vehiculos.html'));
});

app.get('/ventas', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Ventas/Ventas.html'));
});

// ================================
// ===== API CATEGORÍAS ===========
// ================================

// API para obtener todas las categorías (ACTUALIZADA CON VALOR_STOCK)
app.get('/api/categorias', (req, res) => {
    const query = `
        SELECT 
            c.*, 
            COUNT(p.id_producto) as cantidad_productos,
            COALESCE(SUM(p.stock_actual * p.precio_venta), 0) as valor_stock
        FROM categoria c
        LEFT JOIN producto p ON c.id_categoria = p.id_categoria
        GROUP BY c.id_categoria
        ORDER BY c.id_categoria DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error en consulta:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// API para agregar nueva categoría
app.post('/api/categorias', (req, res) => {
    const { nombre, descripcion } = req.body;
    const query = 'INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)';
    
    db.query(query, [nombre, descripcion], (err, result) => {
        if (err) {
            console.error('Error insertando categoría:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: result.insertId });
    });
});

// API para actualizar categoría
app.put('/api/categorias/:id', (req, res) => {
    const categoriaId = req.params.id;
    const { nombre, descripcion } = req.body;
    const query = 'UPDATE categoria SET nombre = ?, descripcion = ? WHERE id_categoria = ?';
    
    db.query(query, [nombre, descripcion, categoriaId], (err, result) => {
        if (err) {
            console.error('Error actualizando categoría:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// API para eliminar categoría
app.delete('/api/categorias/:id', (req, res) => {
    const categoriaId = req.params.id;
    const query = 'DELETE FROM categoria WHERE id_categoria = ?';
    
    db.query(query, [categoriaId], (err, result) => {
        if (err) {
            console.error('Error eliminando categoría:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// ================================
//  API CLIENTES 
// ================================

// Obtener todos los clientes
app.get('/api/clientes', (req, res) => {
    const query = `
        SELECT 
            id_cliente,
            nombre,
            telefono,
            email,
            direccion,
            ciudad,
            estado,
            rfc,
            0 as total_compras
        FROM cliente 
        ORDER BY id_cliente DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo clientes:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Crear cliente
app.post('/api/clientes', (req, res) => {
    const { nombre, telefono, email, direccion, ciudad, estado, rfc } = req.body;
    
    // Validaciones básicas
    if (!nombre || !telefono) {
        return res.status(400).json({ error: 'Nombre y teléfono son obligatorios' });
    }
    
    const query = `
        INSERT INTO cliente 
        (nombre, telefono, email, direccion, ciudad, estado, rfc) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [
        nombre, 
        telefono, 
        email || null, 
        direccion || null,
        ciudad || null,
        estado || null,
        rfc || null
    ], (err, result) => {
        if (err) {
            console.error('Error creando cliente:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            success: true, 
            id: result.insertId,
            message: 'Cliente creado exitosamente' 
        });
    });
});

// Actualizar cliente 
app.put('/api/clientes/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, telefono, email, direccion, ciudad, estado, rfc } = req.body;
    
    // Validaciones básicas
    if (!nombre || !telefono) {
        return res.status(400).json({ error: 'Nombre y teléfono son obligatorios' });
    }
    
    const query = `
        UPDATE cliente SET
            nombre = ?, 
            telefono = ?, 
            email = ?, 
            direccion = ?,
            ciudad = ?,
            estado = ?,
            rfc = ?
        WHERE id_cliente = ?
    `;
    
    db.query(query, [
        nombre, 
        telefono, 
        email || null, 
        direccion || null,
        ciudad || null,
        estado || null,
        rfc || null,
        id
    ], (err, result) => {
        if (err) {
            console.error('Error actualizando cliente:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json({ 
            success: true, 
            message: 'Cliente actualizado exitosamente',
            affectedRows: result.affectedRows 
        });
    });
});

// Obtener cliente por ID
app.get('/api/clientes/:id', (req, res) => {
    const id = req.params.id;
    
    const query = `
        SELECT 
            id_cliente,
            nombre,
            telefono,
            email,
            direccion,
            ciudad,
            estado,
            rfc
        FROM cliente 
        WHERE id_cliente = ?
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error obteniendo cliente:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json(results[0]);
    });
});

// Eliminar cliente con verificación
app.delete('/api/clientes/:id', (req, res) => {
    const id = req.params.id;
    
    // Primero verificar si el cliente tiene ventas asociadas
    const checkQuery = 'SELECT COUNT(*) as ventas_count FROM venta WHERE id_cliente = ?';
    
    db.query(checkQuery, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error verificando ventas del cliente:', checkErr);
            return res.status(500).json({ error: checkErr.message });
        }
        
        if (checkResult[0].ventas_count > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el cliente porque tiene ventas asociadas. Primero elimine las ventas.' 
            });
        }
        
        // Si no tiene ventas, proceder a eliminar
        const deleteQuery = 'DELETE FROM cliente WHERE id_cliente = ?';
        
        db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Error eliminando cliente:', deleteErr);
                return res.status(500).json({ error: deleteErr.message });
            }
            
            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            
            res.json({ 
                success: true, 
                message: 'Cliente eliminado correctamente',
                affectedRows: deleteResult.affectedRows 
            });
        });
    });
});
// ================================
// ===== API PRODUCTOS ============
// ================================

// Obtener todos los productos
// API para obtener todos los productos
app.get('/api/productos', (req, res) => {
    const query = `
        SELECT 
            p.*, 
            c.nombre as categoria_nombre,
            pr.nombre as proveedor_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor
        ORDER BY p.id_producto DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo productos:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
// ================================
// ===== API PROVEEDORES ==========
// ================================

// Obtener todos los proveedores
app.get('/api/proveedores', (req, res) => {
    const query = 'SELECT * FROM proveedor ORDER BY id_proveedor DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo proveedores:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// ================================
// ===== API VEHÍCULOS ============
// ================================

// Obtener todos los vehículos
app.get('/api/vehiculos', (req, res) => {
    const query = 'SELECT * FROM vehiculo ORDER BY id_vehiculo DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo vehículos:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});


// ================================
// ===== RUTAS DE ESTADÍSTICAS ====
// ================================

// Estadísticas generales
app.get('/api/estadisticas', (req, res) => {
    const queries = {
        totalClientes: 'SELECT COUNT(*) as total FROM cliente',
        totalProductos: 'SELECT COUNT(*) as total FROM producto',
        totalVentas: 'SELECT COUNT(*) as total FROM venta',
        ventasHoy: 'SELECT COUNT(*) as total FROM venta WHERE DATE(fecha) = CURDATE()'
    };
    
    // Ejecutar todas las consultas
    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.keys(queries).forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) {
                console.error(`Error en consulta ${key}:`, err);
                results[key] = 0;
            } else {
                results[key] = result[0].total;
            }
            
            completed++;
            if (completed === totalQueries) {
                res.json(results);
            }
        });
    });
});

// ================================
// ===== RUTA DE PRUEBA ===========
// ================================

app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API funcionando', 
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/categorias',
            '/api/clientes',
            '/api/productos',
            '/api/proveedores',
            '/api/vehiculos',
            '/api/ventas',
            '/api/estadisticas'
        ]
    });
});

// ================================
// ===== API COMPATIBILIDAD =======
// ================================

// 1. Obtener todas las compatibilidades con datos relacionados
app.get('/api/compatibilidades', (req, res) => {
    const query = `
        SELECT 
            c.*,
            p.nombre as producto_nombre,
            p.marca as producto_marca,
            p.numero_parte,
            p.id_categoria,
            cat.nombre as categoria_nombre,
            v.marca as vehiculo_marca,
            v.modelo as vehiculo_modelo,
            v.año,
            v.motor as vehiculo_motor
        FROM compatibilidad c
        LEFT JOIN producto p ON c.id_producto = p.id_producto
        LEFT JOIN categoria cat ON p.id_categoria = cat.id_categoria
        LEFT JOIN vehiculo v ON c.id_vehiculo = v.id_vehiculo
        ORDER BY c.id_compatibilidad DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo compatibilidades:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 2. Obtener productos para el formulario (simplificado)
app.get('/api/productos/select', (req, res) => {
    const query = `
        SELECT id_producto, nombre, marca, numero_parte 
        FROM producto 
        ORDER BY nombre ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo productos para select:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 3. Obtener vehículos para el formulario 
app.get('/api/vehiculos/select', (req, res) => {
    const query = `
        SELECT id_vehiculo, marca, modelo, año, motor 
        FROM vehiculo 
        ORDER BY marca, modelo ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo vehículos para select:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 4. Agregar nueva compatibilidad
app.post('/api/compatibilidades', (req, res) => {
    const { id_producto, id_vehiculo, notas } = req.body;
    
    // Validar campos requeridos
    if (!id_producto || !id_vehiculo) {
        return res.status(400).json({ error: 'Producto y vehículo son requeridos' });
    }
    
    // Validar que no exista ya la misma compatibilidad
    const checkQuery = 'SELECT id_compatibilidad FROM compatibilidad WHERE id_producto = ? AND id_vehiculo = ?';
    
    db.query(checkQuery, [id_producto, id_vehiculo], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error verificando compatibilidad:', checkErr);
            return res.status(500).json({ error: checkErr.message });
        }
        
        if (checkResult.length > 0) {
            return res.status(400).json({ error: 'Esta compatibilidad ya existe' });
        }
        
        // Insertar nueva compatibilidad
        const insertQuery = 'INSERT INTO compatibilidad (id_producto, id_vehiculo, notas) VALUES (?, ?, ?)';
        
        db.query(insertQuery, [id_producto, id_vehiculo, notas || null], 
            (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Error insertando compatibilidad:', insertErr);
                    return res.status(500).json({ error: insertErr.message });
                }
                res.json({ 
                    success: true, 
                    id: insertResult.insertId,
                    message: 'Compatibilidad agregada correctamente' 
                });
            }
        );
    });
});

// 5. Actualizar compatibilidad
app.put('/api/compatibilidades/:id', (req, res) => {
    const id = req.params.id;
    const { id_producto, id_vehiculo, notas } = req.body;
    
    // Validar campos requeridos
    if (!id_producto || !id_vehiculo) {
        return res.status(400).json({ error: 'Producto y vehículo son requeridos' });
    }
    
    // Verificar si la compatibilidad existe
    const checkQuery = 'SELECT id_compatibilidad FROM compatibilidad WHERE id_compatibilidad = ?';
    
    db.query(checkQuery, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error verificando compatibilidad:', checkErr);
            return res.status(500).json({ error: checkErr.message });
        }
        
        if (checkResult.length === 0) {
            return res.status(404).json({ error: 'Compatibilidad no encontrada' });
        }
        
        // Verificar si ya existe otra compatibilidad con los mismos datos
        const checkDuplicateQuery = 'SELECT id_compatibilidad FROM compatibilidad WHERE id_producto = ? AND id_vehiculo = ? AND id_compatibilidad != ?';
        
        db.query(checkDuplicateQuery, [id_producto, id_vehiculo, id], (dupErr, dupResult) => {
            if (dupErr) {
                console.error('Error verificando duplicado:', dupErr);
                return res.status(500).json({ error: dupErr.message });
            }
            
            if (dupResult.length > 0) {
                return res.status(400).json({ error: 'Ya existe otra compatibilidad con estos datos' });
            }
            
            // Actualizar compatibilidad
            const updateQuery = `
                UPDATE compatibilidad SET
                    id_producto = ?,
                    id_vehiculo = ?,
                    notas = ?
                WHERE id_compatibilidad = ?
            `;
            
            db.query(updateQuery, [id_producto, id_vehiculo, notas || null, id], 
                (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('Error actualizando compatibilidad:', updateErr);
                        return res.status(500).json({ error: updateErr.message });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: 'Compatibilidad actualizada correctamente',
                        affectedRows: updateResult.affectedRows 
                    });
                }
            );
        });
    });
});

// 6. Eliminar compatibilidad
app.delete('/api/compatibilidades/:id', (req, res) => {
    const id = req.params.id;
    
    // Verificar si la compatibilidad existe
    const checkQuery = 'SELECT id_compatibilidad FROM compatibilidad WHERE id_compatibilidad = ?';
    
    db.query(checkQuery, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error verificando compatibilidad:', checkErr);
            return res.status(500).json({ error: checkErr.message });
        }
        
        if (checkResult.length === 0) {
            return res.status(404).json({ error: 'Compatibilidad no encontrada' });
        }
        
        // Eliminar compatibilidad
        const deleteQuery = 'DELETE FROM compatibilidad WHERE id_compatibilidad = ?';
        
        db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Error eliminando compatibilidad:', deleteErr);
                return res.status(500).json({ error: deleteErr.message });
            }
            
            res.json({ 
                success: true, 
                message: 'Compatibilidad eliminada correctamente',
                affectedRows: deleteResult.affectedRows 
            });
        });
    });
});

// 7. Obtener compatibilidades de un producto específico
app.get('/api/compatibilidades/producto/:id', (req, res) => {
    const productoId = req.params.id;
    
    const query = `
        SELECT 
            c.*,
            v.marca,
            v.modelo,
            v.año,
            v.motor,
            p.nombre as producto_nombre,
            p.marca as producto_marca
        FROM compatibilidad c
        LEFT JOIN vehiculo v ON c.id_vehiculo = v.id_vehiculo
        LEFT JOIN producto p ON c.id_producto = p.id_producto
        WHERE c.id_producto = ?
        ORDER BY v.marca, v.modelo
    `;
    
    db.query(query, [productoId], (err, results) => {
        if (err) {
            console.error('Error obteniendo compatibilidades del producto:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 8. Obtener compatibilidades de un vehículo específico
app.get('/api/compatibilidades/vehiculo/:id', (req, res) => {
    const vehiculoId = req.params.id;
    
    const query = `
        SELECT 
            c.*,
            p.nombre as producto_nombre,
            p.marca as producto_marca,
            p.numero_parte,
            cat.nombre as categoria_nombre
        FROM compatibilidad c
        LEFT JOIN producto p ON c.id_producto = p.id_producto
        LEFT JOIN categoria cat ON p.id_categoria = cat.id_categoria
        WHERE c.id_vehiculo = ?
        ORDER BY p.nombre
    `;
    
    db.query(query, [vehiculoId], (err, results) => {
        if (err) {
            console.error('Error obteniendo compatibilidades del vehículo:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 9. Buscar compatibilidades por término
app.get('/api/compatibilidades/buscar/:termino', (req, res) => {
    const termino = `%${req.params.termino}%`;
    
    const query = `
        SELECT 
            c.*,
            p.nombre as producto_nombre,
            p.marca as producto_marca,
            p.numero_parte,
            v.marca as vehiculo_marca,
            v.modelo as vehiculo_modelo,
            v.año,
            v.motor as vehiculo_motor
        FROM compatibilidad c
        LEFT JOIN producto p ON c.id_producto = p.id_producto
        LEFT JOIN vehiculo v ON c.id_vehiculo = v.id_vehiculo
        WHERE 
            p.nombre LIKE ? OR
            p.marca LIKE ? OR
            p.numero_parte LIKE ? OR
            v.marca LIKE ? OR
            v.modelo LIKE ? OR
            c.notas LIKE ?
        ORDER BY c.id_compatibilidad DESC
        LIMIT 50
    `;
    
    db.query(query, [termino, termino, termino, termino, termino, termino], 
        (err, results) => {
            if (err) {
                console.error('Error buscando compatibilidades:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// 10. Estadísticas de compatibilidades
app.get('/api/compatibilidades/estadisticas', (req, res) => {
    const queries = {
        total: 'SELECT COUNT(*) as total FROM compatibilidad',
        productosUnicos: 'SELECT COUNT(DISTINCT id_producto) as total FROM compatibilidad',
        vehiculosUnicos: 'SELECT COUNT(DISTINCT id_vehiculo) as total FROM compatibilidad',
        productosSinCompat: `
            SELECT COUNT(*) as total FROM producto 
            WHERE id_producto NOT IN (SELECT DISTINCT id_producto FROM compatibilidad)
        `,
        vehiculosSinCompat: `
            SELECT COUNT(*) as total FROM vehiculo 
            WHERE id_vehiculo NOT IN (SELECT DISTINCT id_vehiculo FROM compatibilidad)
        `
    };
    
    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.keys(queries).forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) {
                console.error(`Error en consulta ${key}:`, err);
                results[key] = 0;
            } else {
                results[key] = result[0].total;
            }
            
            completed++;
            if (completed === totalQueries) {
                res.json(results);
            }
        });
    });
});

// 11. Verificar si una compatibilidad existe
app.get('/api/compatibilidades/existe/:productoId/:vehiculoId', (req, res) => {
    const productoId = req.params.productoId;
    const vehiculoId = req.params.vehiculoId;
    
    const query = 'SELECT id_compatibilidad FROM compatibilidad WHERE id_producto = ? AND id_vehiculo = ?';
    
    db.query(query, [productoId, vehiculoId], (err, results) => {
        if (err) {
            console.error('Error verificando compatibilidad:', err);
            return res.status(500).json({ error: err.message });
        }
        
        res.json({ 
            existe: results.length > 0,
            compatibilidad: results.length > 0 ? results[0] : null
        });
    });
});

// 12. Obtener producto por ID con detalles extendidos
app.get('/api/productos/:id', (req, res) => {
    const productoId = req.params.id;
    
    const query = `
        SELECT 
            p.*,
            c.nombre as categoria_nombre,
            pr.nombre as proveedor_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor
        WHERE p.id_producto = ?
    `;
    
    db.query(query, [productoId], (err, results) => {
        if (err) {
            console.error('Error obteniendo producto:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(results[0]);
    });
});

// 13. Obtener vehículo por ID con detalles extendidos
app.get('/api/vehiculos/:id', (req, res) => {
    const vehiculoId = req.params.id;
    
    const query = 'SELECT * FROM vehiculo WHERE id_vehiculo = ?';
    
    db.query(query, [vehiculoId], (err, results) => {
        if (err) {
            console.error('Error obteniendo vehículo:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        res.json(results[0]);
    });
});

// ================================
// ===== API PRODUCTOS  ===
// ================================

// Obtener todos los productos
app.get('/api/productos', (req, res) => {
    const query = `
        SELECT p.*, c.nombre as categoria_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        ORDER BY p.id_producto DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo productos:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// API para agregar nuevo producto
app.post('/api/productos', (req, res) => {
    const { nombre, marca, numero_parte, modelo_producto, precio_compra, precio_venta, stock_actual, stock_minimo, id_categoria, id_proveedor } = req.body;
    
    // Validaciones básicas
    if (!nombre || !numero_parte || !precio_venta) {
        return res.status(400).json({ error: 'Nombre, número de parte y precio de venta son obligatorios' });
    }
    
    const query = `
        INSERT INTO producto 
        (nombre, marca, numero_parte, modelo_producto, precio_compra, precio_venta, stock_actual, stock_minimo, id_categoria, id_proveedor) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [nombre, marca || null, numero_parte, modelo_producto || null, precio_compra || 0, precio_venta || 0, stock_actual || 0, stock_minimo || 5, id_categoria || null, id_proveedor || null], 
        (err, result) => {
            if (err) {
                console.error('Error insertando producto:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                success: true, 
                id: result.insertId,
                message: 'Producto agregado correctamente' 
            });
        }
    );
});

// API para actualizar producto
app.put('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, marca, numero_parte, modelo_producto, precio_compra, precio_venta, stock_actual, stock_minimo, id_categoria, id_proveedor } = req.body;
    
    // Validaciones básicas
    if (!nombre || !numero_parte || !precio_venta) {
        return res.status(400).json({ error: 'Nombre, número de parte y precio de venta son obligatorios' });
    }
    
    const query = `
        UPDATE producto SET
            nombre = ?,
            marca = ?,
            numero_parte = ?,
            modelo_producto = ?,
            precio_compra = ?,
            precio_venta = ?,
            stock_actual = ?,
            stock_minimo = ?,
            id_categoria = ?,
            id_proveedor = ?
        WHERE id_producto = ?
    `;
    
    db.query(query, [nombre, marca || null, numero_parte, modelo_producto || null, precio_compra || 0, precio_venta || 0, stock_actual || 0, stock_minimo || 5, id_categoria || null, id_proveedor || null, id], 
        (err, result) => {
            if (err) {
                console.error('Error actualizando producto:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            
            res.json({ 
                success: true, 
                message: 'Producto actualizado correctamente',
                affectedRows: result.affectedRows 
            });
        }
    );
});

// API para eliminar producto
app.delete('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    
    // Primero verificar si el producto tiene ventas o compatibilidades asociadas
    const checkQueries = [
        { name: 'ventas', query: 'SELECT COUNT(*) as count FROM detalle_venta WHERE id_producto = ?' },
        { name: 'compatibilidades', query: 'SELECT COUNT(*) as count FROM compatibilidad WHERE id_producto = ?' }
    ];
    
    let checksCompleted = 0;
    let hasAssociations = false;
    let associationMessage = '';
    
    checkQueries.forEach(check => {
        db.query(check.query, [id], (err, result) => {
            if (err) {
                console.error(`Error verificando ${check.name}:`, err);
                // Continuar con la siguiente verificación
            } else if (result[0].count > 0) {
                hasAssociations = true;
                associationMessage = `No se puede eliminar el producto porque tiene ${check.name} asociadas.`;
            }
            
            checksCompleted++;
            
            if (checksCompleted === checkQueries.length) {
                if (hasAssociations) {
                    return res.status(400).json({ error: associationMessage });
                }
                
                // Si no tiene asociaciones, proceder a eliminar
                const deleteQuery = 'DELETE FROM producto WHERE id_producto = ?';
                
                db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
                    if (deleteErr) {
                        console.error('Error eliminando producto:', deleteErr);
                        return res.status(500).json({ error: deleteErr.message });
                    }
                    
                    if (deleteResult.affectedRows === 0) {
                        return res.status(404).json({ error: 'Producto no encontrado' });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: 'Producto eliminado correctamente',
                        affectedRows: deleteResult.affectedRows 
                    });
                });
            }
        });
    });
});

// API para obtener producto específico
app.get('/api/productos/:id', (req, res) => {
    const productoId = req.params.id;
    
    const query = `
        SELECT p.*, c.nombre as categoria_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = ?
    `;
    
    db.query(query, [productoId], (err, results) => {
        if (err) {
            console.error('Error obteniendo producto:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(results[0]);
    });
});
// ================================
// ===== API PROVEEDORES ===
// ================================

// 1. Obtener todos los proveedores
app.get('/api/proveedores', (req, res) => {
    const query = 'SELECT * FROM proveedor ORDER BY id_proveedor DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo proveedores:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 2. Obtener proveedor por ID
app.get('/api/proveedores/:id', (req, res) => {
    const proveedorId = req.params.id;
    
    const query = 'SELECT * FROM proveedor WHERE id_proveedor = ?';
    
    db.query(query, [proveedorId], (err, results) => {
        if (err) {
            console.error('Error obteniendo proveedor:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        
        res.json(results[0]);
    });
});

// 3. Agregar nuevo proveedor 
app.post('/api/proveedores', (req, res) => {
    const { nombre, contacto, telefono, email, direccion } = req.body;
    
    // Validaciones básicas
    if (!nombre || !contacto || !telefono || !direccion) {
        return res.status(400).json({ error: 'Nombre, contacto, teléfono y dirección son obligatorios' });
    }
    
    const query = `
        INSERT INTO proveedor 
        (nombre, contacto, telefono, email, direccion) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    db.query(query, [nombre, contacto, telefono, email || null, direccion], 
        (err, result) => {
            if (err) {
                console.error('Error insertando proveedor:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                success: true, 
                id: result.insertId,
                message: 'Proveedor agregado correctamente' 
            });
        }
    );
});

// 4. Actualizar proveedor 
app.put('/api/proveedores/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, contacto, telefono, email, direccion } = req.body;
    
    // Validaciones básicas
    if (!nombre || !contacto || !telefono || !direccion) {
        return res.status(400).json({ error: 'Nombre, contacto, teléfono y dirección son obligatorios' });
    }
    
    const query = `
        UPDATE proveedor SET
            nombre = ?,
            contacto = ?,
            telefono = ?,
            email = ?,
            direccion = ?
        WHERE id_proveedor = ?
    `;
    
    db.query(query, [nombre, contacto, telefono, email || null, direccion, id], 
        (err, result) => {
            if (err) {
                console.error('Error actualizando proveedor:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }
            
            res.json({ 
                success: true, 
                message: 'Proveedor actualizado correctamente',
                affectedRows: result.affectedRows 
            });
        }
    );
});

// 5. Eliminar proveedor
app.delete('/api/proveedores/:id', (req, res) => {
    const id = req.params.id;
    
    // Primero verificar si el proveedor tiene productos asociados
    const checkQuery = 'SELECT COUNT(*) as productos_count FROM producto WHERE id_proveedor = ?';
    
    db.query(checkQuery, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error verificando productos del proveedor:', checkErr);
            return res.status(500).json({ error: checkErr.message });
        }
        
        if (checkResult[0].productos_count > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el proveedor porque tiene productos asociados. Primero actualice los productos.' 
            });
        }
        
        // Si no tiene productos, proceder a eliminar
        const deleteQuery = 'DELETE FROM proveedor WHERE id_proveedor = ?';
        
        db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Error eliminando proveedor:', deleteErr);
                return res.status(500).json({ error: deleteErr.message });
            }
            
            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }
            
            res.json({ 
                success: true, 
                message: 'Proveedor eliminado correctamente',
                affectedRows: deleteResult.affectedRows 
            });
        });
    });
});

// 6. Buscar proveedores por término
app.get('/api/proveedores/buscar/:termino', (req, res) => {
    const termino = `%${req.params.termino}%`;
    
    const query = `
        SELECT * FROM proveedor 
        WHERE nombre LIKE ? OR 
              contacto LIKE ? OR 
              telefono LIKE ? OR 
              email LIKE ? OR 
              direccion LIKE ?
        ORDER BY id_proveedor DESC
        LIMIT 50
    `;
    
    db.query(query, [termino, termino, termino, termino, termino], 
        (err, results) => {
            if (err) {
                console.error('Error buscando proveedores:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// 7. Obtener estadísticas de proveedores
app.get('/api/proveedores/estadisticas', (req, res) => {
    const queries = {
        totalProveedores: 'SELECT COUNT(*) as total FROM proveedor',
        proveedoresConEmail: 'SELECT COUNT(*) as total FROM proveedor WHERE email IS NOT NULL',
        proveedoresSinProductos: `
            SELECT COUNT(*) as total FROM proveedor p
            LEFT JOIN producto pr ON p.id_proveedor = pr.id_proveedor
            WHERE pr.id_producto IS NULL
        `,
        productosPorProveedor: `
            SELECT 
                p.id_proveedor,
                p.nombre as proveedor_nombre,
                COUNT(pr.id_producto) as cantidad_productos,
                SUM(pr.stock_actual) as stock_total,
                SUM(pr.stock_actual * pr.precio_venta) as valor_inventario
            FROM proveedor p
            LEFT JOIN producto pr ON p.id_proveedor = pr.id_proveedor
            GROUP BY p.id_proveedor, p.nombre
        `
    };
    
    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.keys(queries).forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) {
                console.error(`Error en consulta ${key}:`, err);
                results[key] = key === 'productosPorProveedor' ? [] : 0;
            } else {
                results[key] = result;
            }
            
            completed++;
            if (completed === totalQueries) {
                res.json(results);
            }
        });
    });
});

// 8. Obtener productos de un proveedor específico
app.get('/api/proveedores/:id/productos', (req, res) => {
    const proveedorId = req.params.id;
    
    const query = `
        SELECT 
            p.*,
            c.nombre as categoria_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        WHERE p.id_proveedor = ?
        ORDER BY p.nombre ASC
    `;
    
    db.query(query, [proveedorId], (err, results) => {
        if (err) {
            console.error('Error obteniendo productos del proveedor:', err);
            return res.status(500).json({ error: err.message });
        }
        
        res.json(results);
    });
});

// 9. Verificar si un proveedor existe por nombre
app.get('/api/proveedores/existe/:nombre', (req, res) => {
    const nombre = req.params.nombre;
    
    const query = 'SELECT id_proveedor FROM proveedor WHERE nombre = ? LIMIT 1';
    
    db.query(query, [nombre], (err, results) => {
        if (err) {
            console.error('Error verificando proveedor:', err);
            return res.status(500).json({ error: err.message });
        }
        
        res.json({ 
            existe: results.length > 0,
            proveedor: results.length > 0 ? results[0] : null
        });
    });
});

// 10. Obtener proveedores con conteo de productos
app.get('/api/proveedores/con-conteo', (req, res) => {
    const query = `
        SELECT 
            p.*,
            COUNT(pr.id_producto) as productos_count,
            SUM(pr.stock_actual) as stock_total
        FROM proveedor p
        LEFT JOIN producto pr ON p.id_proveedor = pr.id_proveedor
        GROUP BY p.id_proveedor
        ORDER BY productos_count DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo proveedores con conteo:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
// ================================
// ===== API VEHÍCULOS  ===
// ================================

// 1. Obtener todos los vehículos
app.get('/api/vehiculos', (req, res) => {
    const query = 'SELECT * FROM vehiculo ORDER BY id_vehiculo DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo vehículos:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 2. Obtener vehículo por ID
app.get('/api/vehiculos/:id', (req, res) => {
    const vehiculoId = req.params.id;
    
    const query = 'SELECT * FROM vehiculo WHERE id_vehiculo = ?';
    
    db.query(query, [vehiculoId], (err, results) => {
        if (err) {
            console.error('Error obteniendo vehículo:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        res.json(results[0]);
    });
});

// 3. Agregar nuevo vehículo
app.post('/api/vehiculos', (req, res) => {
    const { marca, modelo, año, motor, transmision } = req.body;
    
    // Validaciones básicas
    if (!marca || !modelo || !año) {
        return res.status(400).json({ error: 'Marca, modelo y año son obligatorios' });
    }
    
    // Validar año
    const añoActual = new Date().getFullYear();
    if (año < 1900 || año > añoActual + 1) {
        return res.status(400).json({ error: `Año debe estar entre 1900 y ${añoActual + 1}` });
    }
    
    const query = `
        INSERT INTO vehiculo 
        (marca, modelo, año, motor, transmision) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    db.query(query, [marca, modelo, año, motor || null, transmision || null], 
        (err, result) => {
            if (err) {
                console.error('Error insertando vehículo:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                success: true, 
                id: result.insertId,
                message: 'Vehículo agregado correctamente' 
            });
        }
    );
});

// 4. Actualizar vehículo
app.put('/api/vehiculos/:id', (req, res) => {
    const id = req.params.id;
    const { marca, modelo, año, motor, transmision } = req.body;
    
    // Validaciones básicas
    if (!marca || !modelo || !año) {
        return res.status(400).json({ error: 'Marca, modelo y año son obligatorios' });
    }
    
    // Validar año
    const añoActual = new Date().getFullYear();
    if (año < 1900 || año > añoActual + 1) {
        return res.status(400).json({ error: `Año debe estar entre 1900 y ${añoActual + 1}` });
    }
    
    const query = `
        UPDATE vehiculo SET
            marca = ?,
            modelo = ?,
            año = ?,
            motor = ?,
            transmision = ?
        WHERE id_vehiculo = ?
    `;
    
    db.query(query, [marca, modelo, año, motor || null, transmision || null, id], 
        (err, result) => {
            if (err) {
                console.error('Error actualizando vehículo:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Vehículo no encontrado' });
            }
            
            res.json({ 
                success: true, 
                message: 'Vehículo actualizado correctamente',
                affectedRows: result.affectedRows 
            });
        }
    );
});

// 5. Eliminar vehículo
app.delete('/api/vehiculos/:id', (req, res) => {
    const id = req.params.id;
    
    // Primero verificar si el vehículo tiene compatibilidades asociadas
    const checkQuery = 'SELECT COUNT(*) as compatibilidades_count FROM compatibilidad WHERE id_vehiculo = ?';
    
    db.query(checkQuery, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error verificando compatibilidades del vehículo:', checkErr);
            return res.status(500).json({ error: checkErr.message });
        }
        
        if (checkResult[0].compatibilidades_count > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el vehículo porque tiene compatibilidades asociadas. Primero elimine las compatibilidades.' 
            });
        }
        
        // Si no tiene compatibilidades, proceder a eliminar
        const deleteQuery = 'DELETE FROM vehiculo WHERE id_vehiculo = ?';
        
        db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Error eliminando vehículo:', deleteErr);
                return res.status(500).json({ error: deleteErr.message });
            }
            
            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ error: 'Vehículo no encontrado' });
            }
            
            res.json({ 
                success: true, 
                message: 'Vehículo eliminado correctamente',
                affectedRows: deleteResult.affectedRows 
            });
        });
    });
});

// 6. Buscar vehículos por término
app.get('/api/vehiculos/buscar/:termino', (req, res) => {
    const termino = `%${req.params.termino}%`;
    
    const query = `
        SELECT * FROM vehiculo 
        WHERE marca LIKE ? OR 
              modelo LIKE ? OR 
              motor LIKE ? OR 
              año LIKE ? OR 
              transmision LIKE ?
        ORDER BY id_vehiculo DESC
        LIMIT 50
    `;
    
    db.query(query, [termino, termino, termino, termino, termino], 
        (err, results) => {
            if (err) {
                console.error('Error buscando vehículos:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// 7. Obtener estadísticas de vehículos
app.get('/api/vehiculos/estadisticas', (req, res) => {
    const queries = {
        totalVehiculos: 'SELECT COUNT(*) as total FROM vehiculo',
        totalMarcas: 'SELECT COUNT(DISTINCT marca) as total FROM vehiculo',
        totalModelos: 'SELECT COUNT(DISTINCT modelo) as total FROM vehiculo',
        vehiculosPorMarca: `
            SELECT marca, COUNT(*) as cantidad 
            FROM vehiculo 
            GROUP BY marca 
            ORDER BY cantidad DESC
        `,
        añosMasComunes: `
            SELECT año, COUNT(*) as cantidad 
            FROM vehiculo 
            GROUP BY año 
            ORDER BY cantidad DESC 
            LIMIT 10
        `
    };
    
    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.keys(queries).forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) {
                console.error(`Error en consulta ${key}:`, err);
                results[key] = key.includes('Por') || key.includes('Comunes') ? [] : 0;
            } else {
                results[key] = result;
            }
            
            completed++;
            if (completed === totalQueries) {
                res.json(results);
            }
        });
    });
});

// 8. Verificar si un vehículo existe por marca y modelo
app.get('/api/vehiculos/existe/:marca/:modelo', (req, res) => {
    const marca = req.params.marca;
    const modelo = req.params.modelo;
    
    const query = 'SELECT id_vehiculo FROM vehiculo WHERE marca = ? AND modelo = ? LIMIT 1';
    
    db.query(query, [marca, modelo], (err, results) => {
        if (err) {
            console.error('Error verificando vehículo:', err);
            return res.status(500).json({ error: err.message });
        }
        
        res.json({ 
            existe: results.length > 0,
            vehiculo: results.length > 0 ? results[0] : null
        });
    });
});


app.get('/api/estadisticas', async (req, res) => {
  try {
    const queries = {
      totalProductos: 'SELECT COUNT(*) AS total FROM producto',
      totalCategorias: 'SELECT COUNT(*) AS total FROM categoria',
      totalProveedores: 'SELECT COUNT(*) AS total FROM proveedor',
      ventasHoy: 'SELECT COUNT(*) AS total FROM venta WHERE DATE(fecha)=CURDATE()'
    };

    const results = {};

    for (const key in queries) {
      const [rows] = await db.query(queries[key]);
      results[key] = rows[0].total;
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});
// ================================
// ===== API VENTAS  ==
// ================================

// 1. Obtener todas las ventas con cliente
app.get('/api/ventas', async (req, res) => {
    try {
        console.log('📊 Obteniendo todas las ventas...');
        
        // Obtener parámetros de filtro
        const { fechaDesde, fechaHasta, cliente, orden } = req.query;
        
        let query = `
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
        `;
        
        const whereConditions = [];
        const queryParams = [];
        
        // Aplicar filtros
        if (fechaDesde) {
            whereConditions.push('v.fecha >= ?');
            queryParams.push(fechaDesde);
        }
        
        if (fechaHasta) {
            whereConditions.push('v.fecha <= ?');
            queryParams.push(fechaHasta);
        }
        
        if (cliente) {
            whereConditions.push('v.id_cliente = ?');
            queryParams.push(cliente);
        }
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        // Aplicar orden
        switch (orden) {
            case 'fecha_asc':
                query += ' ORDER BY v.fecha ASC, v.hora ASC';
                break;
            case 'total_desc':
                query += ' ORDER BY v.total DESC';
                break;
            case 'total_asc':
                query += ' ORDER BY v.total ASC';
                break;
            default: // fecha_desc
                query += ' ORDER BY v.fecha DESC, v.hora DESC';
        }
        
        console.log('📋 Consulta SQL:', query);
        console.log('🔧 Parámetros:', queryParams);
        
        const [results] = await db.promise().query(query, queryParams);
        console.log(`✅ ${results.length} ventas encontradas`);
        
        res.json(results);
    } catch (err) {
        console.error('❌ Error obteniendo ventas:', err.message);
        res.status(500).json({ 
            error: 'Error al obtener ventas',
            details: err.message 
        });
    }
});

// 7. Estadísticas de ventas (movido antes de /api/ventas/:id)
app.get('/api/ventas/estadisticas', async (req, res) => {
    try {
        console.log('📈 Calculando estadísticas de ventas...');
        
        const queries = {
            ventasHoy: `
                SELECT 
                    COUNT(*) as total, 
                    COALESCE(SUM(total), 0) as monto_total 
                FROM venta 
                WHERE DATE(fecha) = CURDATE()
            `,
            ventasMes: `
                SELECT 
                    COUNT(*) as total, 
                    COALESCE(SUM(total), 0) as monto_total 
                FROM venta 
                WHERE MONTH(fecha) = MONTH(CURDATE()) 
                AND YEAR(fecha) = YEAR(CURDATE())
            `,
            ticketPromedio: `
                SELECT COALESCE(AVG(total), 0) as promedio 
                FROM venta
                WHERE YEAR(fecha) = YEAR(CURDATE())
            `,
            productosVendidos: `
                SELECT COALESCE(SUM(cantidad), 0) as total 
                FROM detalle_venta dv
                JOIN venta v ON dv.id_venta = v.id_venta
                WHERE YEAR(v.fecha) = YEAR(CURDATE())
            `,
            topClientes: `
                SELECT 
                    c.nombre,
                    COUNT(v.id_venta) as ventas_count,
                    COALESCE(SUM(v.total), 0) as monto_total
                FROM cliente c
                LEFT JOIN venta v ON c.id_cliente = v.id_cliente
                WHERE v.id_venta IS NOT NULL
                GROUP BY c.id_cliente, c.nombre
                ORDER BY monto_total DESC
                LIMIT 5
            `,
            ventasPorMetodo: `
                SELECT 
                    metodo_pago,
                    COUNT(*) as cantidad,
                    COALESCE(SUM(total), 0) as monto_total
                FROM venta
                WHERE metodo_pago IS NOT NULL
                GROUP BY metodo_pago
                ORDER BY monto_total DESC
            `,
            ventasPorDia: `
                SELECT 
                    fecha,
                    COUNT(*) as cantidad_ventas,
                    COALESCE(SUM(total), 0) as monto_total
                FROM venta
                WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY fecha
                ORDER BY fecha ASC
            `
        };
        
        const results = {};
        
        // Ejecutar todas las consultas en paralelo
        await Promise.all(
            Object.entries(queries).map(async ([key, query]) => {
                try {
                    console.log(`📊 Ejecutando consulta: ${key}`);
                    const [data] = await db.promise().query(query);
                    results[key] = data;
                    console.log(`✅ ${key}: ${JSON.stringify(data)}`);
                } catch (error) {
                    console.error(`❌ Error en consulta ${key}:`, error.message);
                    results[key] = key.includes('top') || key.includes('Por') ? [] : 0;
                }
            })
        );
        
        console.log('✅ Estadísticas calculadas exitosamente');
        res.json(results);
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error.message);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas',
            details: error.message
        });
    }
});

// 8. Obtener productos con stock para venta 
app.get('/api/productos/stock', async (req, res) => {
    try {
        console.log('📦 Obteniendo productos con stock...');
        
        const query = `
            SELECT 
                id_producto,
                nombre,
                marca,
                numero_parte,
                precio_venta,
                stock_actual,
                stock_minimo
            FROM producto 
            WHERE stock_actual > 0
            ORDER BY nombre ASC
        `;
        
        const [results] = await db.promise().query(query);
        console.log(`✅ ${results.length} productos con stock encontrados`);
        
        res.json(results);
    } catch (err) {
        console.error('❌ Error obteniendo productos con stock:', err.message);
        res.status(500).json({ 
            error: 'Error al obtener productos con stock',
            details: err.message
        });
    }
});

// 9. Buscar productos para venta 
app.get('/api/productos/buscar/:termino', async (req, res) => {
    try {
        const termino = req.params.termino;
        console.log(`🔍 Buscando productos: "${termino}"`);
        
        const searchTerm = `%${termino}%`;
        
        const query = `
            SELECT 
                id_producto,
                nombre,
                marca,
                numero_parte,
                precio_venta,
                stock_actual,
                stock_minimo
            FROM producto 
            WHERE (nombre LIKE ? OR marca LIKE ? OR numero_parte LIKE ?)
                AND stock_actual > 0
            ORDER BY nombre ASC
            LIMIT 20
        `;
        
        const [results] = await db.promise().query(query, [searchTerm, searchTerm, searchTerm]);
        console.log(`✅ ${results.length} productos encontrados para "${termino}"`);
        
        res.json(results);
    } catch (err) {
        console.error('❌ Error buscando productos:', err.message);
        res.status(500).json({ 
            error: 'Error al buscar productos',
            details: err.message
        });
    }
});

// 2. Obtener venta por ID
app.get('/api/ventas/:id', async (req, res) => {
    try {
        const ventaId = req.params.id;
        console.log(`🔍 Buscando venta ID: ${ventaId}`);
        
        const query = `
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                c.direccion as cliente_direccion
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            WHERE v.id_venta = ?
        `;
        
        const [results] = await db.promise().query(query, [ventaId]);
        
        if (results.length === 0) {
            console.log(`⚠️ Venta ${ventaId} no encontrada`);
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        console.log(`✅ Venta ${ventaId} encontrada`);
        res.json(results[0]);
    } catch (err) {
        console.error('❌ Error obteniendo venta:', err.message);
        res.status(500).json({ 
            error: 'Error al obtener venta',
            details: err.message 
        });
    }
});

// 3. Obtener detalles de una venta
app.get('/api/ventas/:id/detalles', async (req, res) => {
    try {
        const ventaId = req.params.id;
        console.log(`🔍 Buscando detalles de venta ID: ${ventaId}`);
        
        const query = `
            SELECT 
                dv.*,
                p.nombre as producto_nombre,
                p.marca as producto_marca,
                p.numero_parte,
                p.id_categoria
            FROM detalle_venta dv
            LEFT JOIN producto p ON dv.id_producto = p.id_producto
            WHERE dv.id_venta = ?
            ORDER BY dv.id_detalle
        `;
        
        const [results] = await db.promise().query(query, [ventaId]);
        console.log(`✅ ${results.length} detalles encontrados para venta ${ventaId}`);
        
        res.json(results);
    } catch (err) {
        console.error('❌ Error obteniendo detalles de venta:', err.message);
        res.status(500).json({ 
            error: 'Error al obtener detalles de venta',
            details: err.message 
        });
    }
});

// 4. Crear nueva venta 
app.post('/api/ventas', async (req, res) => {
    console.log('🔄 Recibiendo solicitud para crear nueva venta...');
    console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { venta, detalles } = req.body;
    
    // Validaciones básicas
    if (!venta || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
        console.error('❌ Datos incompletos:', { venta, detalles });
        return res.status(400).json({ 
            error: 'Datos de venta incompletos',
            details: 'Se requieren venta y detalles'
        });
    }
    
    const { fecha, hora, total, id_cliente, metodo_pago, pago_con, cambio, notas } = venta;
    
    // Validar campos obligatorios
    const camposObligatorios = [
        { campo: fecha, nombre: 'fecha' },
        { campo: hora, nombre: 'hora' },
        { campo: total, nombre: 'total' },
        { campo: id_cliente, nombre: 'id_cliente' },
        { campo: metodo_pago, nombre: 'metodo_pago' }
    ];
    
    const camposFaltantes = camposObligatorios
        .filter(campo => !campo.campo)
        .map(campo => campo.nombre);
    
    if (camposFaltantes.length > 0) {
        console.error(`❌ Campos obligatorios faltantes: ${camposFaltantes.join(', ')}`);
        return res.status(400).json({ 
            error: 'Datos de venta obligatorios faltantes',
            details: `Faltan: ${camposFaltantes.join(', ')}`
        });
    }
    
    try {
        console.log('🔐 Iniciando transacción...');
        
        // Iniciar transacción usando db.promise().query
        await db.promise().query('START TRANSACTION');
        
        // 1. Verificar que el cliente existe
        console.log(`👤 Verificando cliente ID: ${id_cliente}`);
        const [clienteResult] = await db.promise().query(
            'SELECT id_cliente FROM cliente WHERE id_cliente = ?',
            [id_cliente]
        );
        
        if (clienteResult.length === 0) {
            await db.promise().query('ROLLBACK');
            console.error(`❌ Cliente con ID ${id_cliente} no encontrado`);
            return res.status(404).json({ 
                error: 'Cliente no encontrado',
                details: `Cliente con ID ${id_cliente} no existe`
            });
        }
        console.log('✅ Cliente verificado');
        
        // 2. Verificar stock de todos los productos
        console.log('📦 Verificando stock de productos...');
        for (const detalle of detalles) {
            const [stockResult] = await db.promise().query(
                'SELECT id_producto, nombre, stock_actual FROM producto WHERE id_producto = ?',
                [detalle.id_producto]
            );
            
            if (stockResult.length === 0) {
                await db.promise().query('ROLLBACK');
                console.error(`❌ Producto ID ${detalle.id_producto} no encontrado`);
                return res.status(404).json({ 
                    error: 'Producto no encontrado',
                    details: `Producto ID ${detalle.id_producto} no existe`
                });
            }
            
            const producto = stockResult[0];
            console.log(`📊 Producto ${producto.nombre}: Stock actual = ${producto.stock_actual}, Solicitado = ${detalle.cantidad}`);
            
            if (producto.stock_actual < detalle.cantidad) {
                await db.promise().query('ROLLBACK');
                console.error(`❌ Stock insuficiente para ${producto.nombre}`);
                return res.status(400).json({ 
                    error: 'Stock insuficiente',
                    details: `Producto: "${producto.nombre}". Disponible: ${producto.stock_actual}, Solicitado: ${detalle.cantidad}`
                });
            }
        }
        console.log('✅ Stock verificado para todos los productos');
        
        // 3. Insertar venta
        console.log('💾 Insertando venta en la base de datos...');
        const insertVentaQuery = `
            INSERT INTO venta 
            (fecha, hora, total, id_cliente, metodo_pago, pago_con, cambio, notas) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const pagoConValor = pago_con ? parseFloat(pago_con) : parseFloat(total);
        const cambioValor = cambio ? parseFloat(cambio) : 0;
        
        const [ventaResult] = await db.promise().query(insertVentaQuery, [
            fecha,
            hora,
            parseFloat(total),
            parseInt(id_cliente),
            metodo_pago,
            pagoConValor,
            cambioValor,
            notas || null
        ]);
        
        const nuevaVentaId = ventaResult.insertId;
        console.log(`✅ Venta insertada con ID: ${nuevaVentaId}`);
        
        // 4. Insertar detalles y actualizar stock
        console.log('📝 Insertando detalles de venta...');
        for (const detalle of detalles) {
            // Insertar detalle
            const insertDetalleQuery = `
                INSERT INTO detalle_venta 
                (id_venta, id_producto, cantidad, precio_unitario, subtotal) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            await db.promise().query(insertDetalleQuery, [
                nuevaVentaId,
                detalle.id_producto,
                detalle.cantidad,
                parseFloat(detalle.precio_unitario),
                parseFloat(detalle.subtotal)
            ]);
            
            console.log(`✅ Detalle insertado: Producto ${detalle.id_producto}, Cantidad ${detalle.cantidad}`);
            
            // Actualizar stock del producto
            const updateStockQuery = `
                UPDATE producto 
                SET stock_actual = stock_actual - ? 
                WHERE id_producto = ?
            `;
            
            await db.promise().query(updateStockQuery, [
                detalle.cantidad,
                detalle.id_producto
            ]);
            
            console.log(`✅ Stock actualizado para producto ${detalle.id_producto}`);
        }
        
        // 5. Confirmar transacción
        await db.promise().query('COMMIT');
        console.log('✅ Transacción completada exitosamente');
        
        // 6. Obtener datos completos de la venta creada
        const [ventaCompleta] = await db.promise().query(`
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            WHERE v.id_venta = ?
        `, [nuevaVentaId]);
        
        const response = {
            success: true,
            ventaId: nuevaVentaId,
            venta: ventaCompleta[0],
            message: 'Venta registrada exitosamente'
        };
        
        console.log('✅ Respuesta enviada:', response);
        res.json(response);
        
    } catch (error) {
        // Revertir transacción en caso de error
        console.error('❌ Error en transacción de venta:', error.message);
        
        try {
            await db.promise().query('ROLLBACK');
            console.log('🔄 Transacción revertida');
        } catch (rollbackError) {
            console.error('❌ Error al revertir transacción:', rollbackError.message);
        }
        
        res.status(500).json({ 
            error: 'Error al procesar la venta',
            details: error.message
        });
    }
});
// 5. Cancelar venta 
app.delete('/api/ventas/:id', async (req, res) => {
    const ventaId = req.params.id;
    console.log(`🗑️  Solicitando cancelación de venta ID: ${ventaId}`);
    
    try {
        console.log('🔐 Iniciando transacción de cancelación...');
        await db.promise().query('START TRANSACTION');
        
        // 1. Obtener detalles de la venta para revertir stock
        const getDetallesQuery = `
            SELECT dv.id_producto, dv.cantidad, p.nombre 
            FROM detalle_venta dv
            LEFT JOIN producto p ON dv.id_producto = p.id_producto
            WHERE dv.id_venta = ?
        `;
        
        const [detalles] = await db.promise().query(getDetallesQuery, [ventaId]);
        
        if (detalles.length === 0) {
            await db.promise().query('ROLLBACK');
            console.log(`⚠️ No se encontraron detalles para la venta ${ventaId}`);
            return res.status(404).json({ error: 'No se encontraron detalles para esta venta' });
        }
        
        console.log(`📊 Encontrados ${detalles.length} detalles para revertir`);
        
        // 2. Revertir stock de productos
        for (const detalle of detalles) {
            const revertStockQuery = `
                UPDATE producto 
                SET stock_actual = stock_actual + ? 
                WHERE id_producto = ?
            `;
            await db.promise().query(revertStockQuery, [detalle.cantidad, detalle.id_producto]);
            console.log(`✅ Stock revertido: Producto ${detalle.id_producto}, +${detalle.cantidad} unidades`);
        }
        
        // 3. Eliminar detalles de venta
        const deleteDetallesQuery = 'DELETE FROM detalle_venta WHERE id_venta = ?';
        await db.promise().query(deleteDetallesQuery, [ventaId]);
        console.log('✅ Detalles de venta eliminados');
        
        // 4. Eliminar venta
        const deleteVentaQuery = 'DELETE FROM venta WHERE id_venta = ?';
        const [result] = await db.promise().query(deleteVentaQuery, [ventaId]);
        
        if (result.affectedRows === 0) {
            await db.promise().query('ROLLBACK');
            console.log(`⚠️ Venta ${ventaId} no encontrada para eliminar`);
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        console.log(`✅ Venta ${ventaId} eliminada`);
        
        // 5. Confirmar transacción
        await db.promise().query('COMMIT');
        console.log('✅ Transacción de cancelación completada');
        
        res.json({
            success: true,
            message: 'Venta cancelada exitosamente y stock revertido',
            ventaId: ventaId
        });
        
    } catch (error) {
        try {
            await db.promise().query('ROLLBACK');
        } catch (rollbackError) {
            console.error('❌ Error al revertir transacción:', rollbackError.message);
        }
        
        console.error('❌ Error cancelando venta:', error.message);
        res.status(500).json({ 
            error: 'Error al cancelar la venta',
            details: error.message
        });
    }
});

// 6. Generar datos para factura (JSON) 
app.get('/api/ventas/:id/factura', async (req, res) => {
    try {
        const ventaId = req.params.id;
        console.log(`🧾 Generando factura para venta ID: ${ventaId}`);
        
        // Obtener datos de la venta con RFC del cliente
        const ventaQuery = `
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                c.direccion as cliente_direccion,
                c.ciudad as cliente_ciudad,
                c.estado as cliente_estado,
                c.rfc as cliente_rfc
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            WHERE v.id_venta = ?
        `;
        
        const [ventaResult] = await db.promise().query(ventaQuery, [ventaId]);
        
        if (ventaResult.length === 0) {
            console.log(`⚠️ Venta ${ventaId} no encontrada para factura`);
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        const venta = ventaResult[0];
        console.log('📊 Datos de venta obtenidos:', venta);
        
        // Obtener detalles de la venta
        const detallesQuery = `
            SELECT 
                dv.*,
                p.nombre as producto_nombre,
                p.marca as producto_marca,
                p.numero_parte
            FROM detalle_venta dv
            LEFT JOIN producto p ON dv.id_producto = p.id_producto
            WHERE dv.id_venta = ?
            ORDER BY dv.id_detalle
        `;
        
        const [detallesResult] = await db.promise().query(detallesQuery, [ventaId]);
        console.log(`📦 Detalles obtenidos: ${detallesResult.length} productos`);
        
        // Calcular totales
        const subtotal = detallesResult.reduce((sum, detalle) => {
            return sum + parseFloat(detalle.subtotal || 0);
        }, 0);
        
        const iva = subtotal * 0.16;
        const total = subtotal + iva;
        
        console.log(`💰 Totales calculados - Subtotal: ${subtotal}, IVA: ${iva}, Total: ${total}`);
        
        // Datos para la factura
        const facturaData = {
            venta: venta,
            detalles: detallesResult,
            subtotal: subtotal.toFixed(2),
            iva: iva.toFixed(2),
            total: total.toFixed(2),
            fecha_emision: new Date().toLocaleDateString('es-MX'),
            hora_emision: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            empresa: {
                nombre: 'Refaccionaria Lexus',
                direccion: 'Calle Principal #123, Oaxaca, México',
                rfc: 'LEX123456ABC',
                telefono: '951-123-4567',
                email: 'ventas@refaccionarialexus.com'
            }
        };
        
        console.log(`✅ Factura generada para venta ${ventaId}`);
        console.log('📄 Datos de factura:', {
            ventaId: venta.id_venta,
            cliente: venta.cliente_nombre,
            rfc: venta.cliente_rfc || 'No especificado',
            total: facturaData.total
        });
        
        res.json({
            success: true,
            factura: facturaData
        });
        
    } catch (error) {
        console.error('❌ Error generando factura:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false,
            error: 'Error al generar factura',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


// 10. Obtener métodos de pago disponibles
app.get('/api/metodos-pago', (req, res) => {
    console.log('💳 Obteniendo métodos de pago...');
    
    const metodos = [
        { value: 'efectivo', label: 'Efectivo' },
        { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' },
        { value: 'transferencia', label: 'Transferencia' },
        { value: 'cheque', label: 'Cheque' }
    ];
    
    console.log('✅ Métodos de pago obtenidos:', metodos.length);
    res.json(metodos);
});

// 11. Obtener productos por ID (para venta)
app.get('/api/productos/:id', async (req, res) => {
    try {
        const productoId = req.params.id;
        console.log(`🔍 Buscando producto ID: ${productoId}`);
        
        const query = `
            SELECT 
                p.*,
                c.nombre as categoria_nombre,
                pr.nombre as proveedor_nombre
            FROM producto p
            LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
            LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor
            WHERE p.id_producto = ?
        `;
        
        const [results] = await db.promise().query(query, [productoId]);
        
        if (results.length === 0) {
            console.log(`⚠️ Producto ${productoId} no encontrado`);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        console.log(`✅ Producto ${productoId} encontrado`);
        res.json(results[0]);
    } catch (err) {
        console.error('❌ Error obteniendo producto:', err.message);
        res.status(500).json({ 
            error: 'Error al obtener producto',
            details: err.message
        });
    }
});

// 12. Obtener ventas con filtros
app.get('/api/ventas/filtradas', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, clienteId, metodoPago } = req.query;
        console.log('🔍 Filtrando ventas con parámetros:', req.query);
        
        let query = `
            SELECT 
                v.*,
                c.nombre as cliente_nombre
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            WHERE 1=1
        `;
        
        const params = [];
        
        if (fechaInicio) {
            query += ' AND v.fecha >= ?';
            params.push(fechaInicio);
        }
        
        if (fechaFin) {
            query += ' AND v.fecha <= ?';
            params.push(fechaFin);
        }
        
        if (clienteId) {
            query += ' AND v.id_cliente = ?';
            params.push(clienteId);
        }
        
        if (metodoPago) {
            query += ' AND v.metodo_pago = ?';
            params.push(metodoPago);
        }
        
        query += ' ORDER BY v.fecha DESC, v.hora DESC';
        
        const [results] = await db.promise().query(query, params);
        console.log(`✅ ${results.length} ventas encontradas con filtros`);
        
        res.json(results);
    } catch (err) {
        console.error('❌ Error filtrando ventas:', err.message);
        res.status(500).json({ 
            error: 'Error al filtrar ventas',
            details: err.message
        });
    }
});

// 13. Verificar disponibilidad de producto
app.get('/api/productos/:id/disponible/:cantidad', async (req, res) => {
    try {
        const productoId = req.params.id;
        const cantidad = parseInt(req.params.cantidad);
        
        console.log(`📊 Verificando disponibilidad: Producto ${productoId}, Cantidad ${cantidad}`);
        
        const query = 'SELECT stock_actual, nombre FROM producto WHERE id_producto = ?';
        const [results] = await db.promise().query(query, [productoId]);
        
        if (results.length === 0) {
            return res.status(404).json({ 
                disponible: false, 
                error: 'Producto no encontrado' 
            });
        }
        
        const producto = results[0];
        const disponible = producto.stock_actual >= cantidad;
        
        console.log(`✅ Verificación: ${disponible ? 'Disponible' : 'No disponible'} (Stock: ${producto.stock_actual})`);
        
        res.json({
            disponible: disponible,
            stock_actual: producto.stock_actual,
            nombre: producto.nombre,
            mensaje: disponible 
                ? `Stock disponible: ${producto.stock_actual}` 
                : `Stock insuficiente. Disponible: ${producto.stock_actual}`
        });
        
    } catch (err) {
        console.error('❌ Error verificando disponibilidad:', err.message);
        res.status(500).json({ 
            disponible: false,
            error: 'Error al verificar disponibilidad',
            details: err.message
        });
    }
});

// 14. Obtener resumen diario de ventas
app.get('/api/ventas/resumen/diario', async (req, res) => {
    try {
        console.log('📅 Generando resumen diario de ventas...');
        
        const query = `
            SELECT 
                DATE(fecha) as fecha,
                COUNT(*) as total_ventas,
                SUM(total) as monto_total,
                AVG(total) as promedio_venta,
                SUM(
                    SELECT COUNT(*) 
                    FROM detalle_venta dv 
                    WHERE dv.id_venta = v.id_venta
                ) as total_productos
            FROM venta v
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(fecha)
            ORDER BY fecha DESC
        `;
        
        const [results] = await db.promise().query(query);
        console.log(`✅ Resumen diario generado: ${results.length} días`);
        
        res.json(results);
    } catch (err) {
        console.error('❌ Error generando resumen diario:', err.message);
        res.status(500).json({ 
            error: 'Error al generar resumen diario',
            details: err.message
        });
    }
});

// 15. Obtener top productos vendidos
app.get('/api/ventas/top-productos', async (req, res) => {
    try {
        console.log('🏆 Obteniendo top productos vendidos...');
        
        const query = `
            SELECT 
                p.nombre,
                p.marca,
                p.numero_parte,
                SUM(dv.cantidad) as total_vendido,
                SUM(dv.subtotal) as monto_total
            FROM detalle_venta dv
            JOIN producto p ON dv.id_producto = p.id_producto
            JOIN venta v ON dv.id_venta = v.id_venta
            WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY p.id_producto, p.nombre, p.marca, p.numero_parte
            ORDER BY total_vendido DESC
            LIMIT 10
        `;
        
        const [results] = await db.promise().query(query);
        console.log(`✅ Top productos obtenidos: ${results.length} productos`);
        
        res.json(results);
    } catch (err) {
        console.error('❌ Error obteniendo top productos:', err.message);
        res.status(500).json({ 
            error: 'Error al obtener top productos',
            details: err.message
        });
    }
});
// ================================
// ===== GENERACIÓN DE PDF REAL ===
// ================================

const PDFDocument = require('pdfkit');

// Generar PDF de factura real
app.get('/api/ventas/:id/factura/pdf', async (req, res) => {
    const ventaId = req.params.id;
    
    try {
        // Obtener datos de la venta
        const [ventaResult] = await db.promise().query(`
            SELECT v.*, c.* 
            FROM venta v 
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente 
            WHERE v.id_venta = ?
        `, [ventaId]);
        
        if (ventaResult.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        const venta = ventaResult[0];
        
        // Obtener detalles
        const [detallesResult] = await db.promise().query(`
            SELECT dv.*, p.nombre as producto_nombre, p.marca, p.numero_parte
            FROM detalle_venta dv
            LEFT JOIN producto p ON dv.id_producto = p.id_producto
            WHERE dv.id_venta = ?
            ORDER BY dv.id_detalle
        `, [ventaId]);
        
        // Crear documento PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Configurar encabezados de respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="factura-${ventaId}.pdf"`);
        
        doc.pipe(res);
        
        // Encabezado de la factura
        doc.fontSize(20).font('Helvetica-Bold').text('REFACCIONARIA LEXUS', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text('Calle Principal #123, Oaxaca, México', { align: 'center' });
        doc.text('RFC: LEX123456ABC | Tel: 951-123-4567', { align: 'center' });
        doc.text('Email: ventas@refaccionarialexus.com', { align: 'center' });
        
        doc.moveDown(1);
        doc.fontSize(16).font('Helvetica-Bold').text(`FACTURA #${ventaId}`, { align: 'center', underline: true });
        
        // Información de cliente y venta
        doc.moveDown(1);
        doc.fontSize(10);
        
        const startX = 50;
        let y = doc.y;
        
        // Columna izquierda: Datos del cliente
        doc.font('Helvetica-Bold').text('DATOS DEL CLIENTE:', startX, y);
        y += 20;
        doc.font('Helvetica').text(`Nombre: ${venta.nombre || 'Cliente no registrado'}`);
        y += 15;
        doc.text(`Dirección: ${venta.direccion || 'No especificada'}`);
        y += 15;
        doc.text(`Teléfono: ${venta.telefono || 'No registrado'}`);
        y += 15;
        doc.text(`Email: ${venta.email || 'No registrado'}`);
        
        // Columna derecha: Datos de factura
        const rightX = 300;
        y = doc.y - 60;
        doc.font('Helvetica-Bold').text('DATOS DE LA FACTURA:', rightX, y);
        y += 20;
        doc.font('Helvetica').text(`Fecha de venta: ${venta.fecha}`, rightX, y);
        y += 15;
        doc.text(`Hora: ${venta.hora}`, rightX, y);
        y += 15;
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`, rightX, y);
        y += 15;
        doc.text(`Método de pago: ${venta.metodo_pago}`, rightX, y);
        
        // Tabla de productos
        doc.moveDown(2);
        const tableTop = doc.y;
        
        // Encabezados de tabla
        doc.font('Helvetica-Bold');
        doc.text('#', 50, tableTop);
        doc.text('Descripción', 70, tableTop);
        doc.text('Cant.', 350, tableTop);
        doc.text('Precio', 400, tableTop);
        doc.text('Importe', 450, tableTop);
        
        // Línea bajo encabezados
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        let yTable = tableTop + 25;
        doc.font('Helvetica');
        
        let subtotal = 0;
        
        // Filas de productos
        detallesResult.forEach((detalle, index) => {
            doc.text((index + 1).toString(), 50, yTable);
            doc.text(detalle.producto_nombre.substring(0, 40), 70, yTable);
            doc.text(detalle.cantidad.toString(), 350, yTable);
            doc.text(`$${parseFloat(detalle.precio_unitario).toFixed(2)}`, 400, yTable);
            doc.text(`$${parseFloat(detalle.subtotal).toFixed(2)}`, 450, yTable);
            
            subtotal += parseFloat(detalle.subtotal);
            yTable += 20;
        });
        
        // Totales
        const iva = subtotal * 0.16;
        const total = subtotal + iva;
        
        yTable += 10;
        doc.text('Subtotal:', 350, yTable);
        doc.text(`$${subtotal.toFixed(2)}`, 450, yTable);
        
        yTable += 20;
        doc.text('IVA (16%):', 350, yTable);
        doc.text(`$${iva.toFixed(2)}`, 450, yTable);
        
        yTable += 20;
        doc.font('Helvetica-Bold').text('TOTAL:', 350, yTable);
        doc.font('Helvetica-Bold').text(`$${total.toFixed(2)}`, 450, yTable);
        
        // Notas
        if (venta.notas) {
            yTable += 40;
            doc.font('Helvetica').text('Notas:', 50, yTable);
            yTable += 15;
            doc.font('Helvetica').text(venta.notas, 50, yTable, { width: 500 });
        }
        
        // Pie de página
        yTable += 50;
        doc.text('Gracias por su compra!', 50, yTable);
        doc.text('Este documento es una representación digital válida para efectos fiscales.', 50, yTable + 20);
        
        // Finalizar documento
        doc.end();
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ error: error.message });
    }
});
/////
/////
// Ruta de debug para verificar rutas
app.get('/api/debug/routes', (req, res) => {
    const routes = app._router.stack
        .filter(r => r.route)
        .map(r => ({
            path: r.route.path,
            methods: Object.keys(r.route.methods)
        }));
    
    res.json({
        totalRoutes: routes.length,
        routes: routes
    });
});
//////////////////////
//////////////////////
// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});



// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error('Error general:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`👥 Clientes: http://localhost:${PORT}/clientes`);
    console.log(`📁 Categorías: http://localhost:${PORT}/categorias`);
    console.log(`📦 Productos: http://localhost:${PORT}/productos`);
    console.log(`🔧 API Test: http://localhost:${PORT}/api/test`);
});