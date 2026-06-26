const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit');

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

// ================================
// ===== API USUARIOS (LOGIN) - MOVIDAS AL INICIO =====
// ================================

// 1. Login de usuario
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Intento de login:', { email, password });
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Correo y contraseña son obligatorios' 
        });
    }
    
    const query = `
        SELECT id_usuario, nombre, email, rol, activo 
        FROM usuario 
        WHERE email = ? AND password = ? AND activo = 1
    `;
    
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('❌ Error en consulta SQL:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al procesar el login'
            });
        }
        
        console.log(`📊 Resultados encontrados: ${results.length}`);
        
        if (results.length === 0) {
            console.log(`❌ Login fallido para: ${email}`);
            return res.status(401).json({ 
                success: false, 
                message: 'Correo o contraseña incorrectos' 
            });
        }
        
        const user = results[0];
        console.log(`✅ Login exitoso: ${user.nombre} (${user.rol})`);
        
        res.json({
            success: true,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });
    });
});

// 2. Registrar nuevo usuario
app.post('/api/usuarios', (req, res) => {
    const { nombre, email, password, rol } = req.body;
    
    console.log('📝 Registrando nuevo usuario:', { nombre, email, rol });
    
    if (!nombre || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nombre, email y contraseña son obligatorios' 
        });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'La contraseña debe tener al menos 6 caracteres' 
        });
    }
    
    const checkQuery = 'SELECT id_usuario FROM usuario WHERE email = ?';
    db.query(checkQuery, [email], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('❌ Error verificando email:', checkErr);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al verificar email' 
            });
        }
        
        if (checkResults.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El correo electrónico ya está registrado' 
            });
        }
        
        const insertQuery = `
            INSERT INTO usuario (nombre, email, password, rol, activo) 
            VALUES (?, ?, ?, ?, 1)
        `;
        
        db.query(insertQuery, [nombre, email, password, rol || 'vendedor'], (insertErr, result) => {
            if (insertErr) {
                console.error('❌ Error insertando usuario:', insertErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error al registrar usuario'
                });
            }
            
            console.log(`✅ Usuario registrado: ${email} (ID: ${result.insertId})`);
            
            res.json({
                success: true,
                message: 'Usuario creado exitosamente',
                user: {
                    id: result.insertId,
                    nombre: nombre,
                    email: email,
                    rol: rol || 'vendedor'
                }
            });
        });
    });
});

// Ruta raíz - redirige al Login
app.get('/', (req, res) => {
    res.redirect('/src/Login/Login.html');
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
// ===== API CLIENTES =============
// ================================

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

app.post('/api/clientes', (req, res) => {
    const { nombre, telefono, email, direccion, ciudad, estado, rfc } = req.body;
    
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

app.put('/api/clientes/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, telefono, email, direccion, ciudad, estado, rfc } = req.body;
    
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
            message: 'Cliente actualizado exitosamente'
        });
    });
});

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

app.delete('/api/clientes/:id', (req, res) => {
    const id = req.params.id;
    
    const checkQuery = 'SELECT COUNT(*) as ventas_count FROM venta WHERE id_cliente = ?';
    
    db.query(checkQuery, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error verificando ventas del cliente:', checkErr);
            return res.status(500).json({ error: checkErr.message });
        }
        
        if (checkResult[0].ventas_count > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el cliente porque tiene ventas asociadas.' 
            });
        }
        
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
                message: 'Cliente eliminado correctamente'
            });
        });
    });
});

// ================================
// ===== API PRODUCTOS ============
// ================================

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

app.post('/api/productos', (req, res) => {
    const { nombre, marca, numero_parte, modelo_producto, precio_compra, precio_venta, stock_actual, stock_minimo, id_categoria, id_proveedor } = req.body;
    
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

app.put('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, marca, numero_parte, modelo_producto, precio_compra, precio_venta, stock_actual, stock_minimo, id_categoria, id_proveedor } = req.body;
    
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
                message: 'Producto actualizado correctamente'
            });
        }
    );
});

app.delete('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    
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
            } else if (result[0].count > 0) {
                hasAssociations = true;
                associationMessage = `No se puede eliminar el producto porque tiene ${check.name} asociadas.`;
            }
            
            checksCompleted++;
            
            if (checksCompleted === checkQueries.length) {
                if (hasAssociations) {
                    return res.status(400).json({ error: associationMessage });
                }
                
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
                        message: 'Producto eliminado correctamente'
                    });
                });
            }
        });
    });
});

// ================================
// ===== API PROVEEDORES ==========
// ================================

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

app.post('/api/proveedores', (req, res) => {
    const { nombre, contacto, telefono, email, direccion } = req.body;
    
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

app.put('/api/proveedores/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, contacto, telefono, email, direccion } = req.body;
    
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
                message: 'Proveedor actualizado correctamente'
            });
        }
    );
});

app.delete('/api/proveedores/:id', (req, res) => {
    const id = req.params.id;
    
    const checkQuery = 'SELECT COUNT(*) as productos_count FROM producto WHERE id_proveedor = ?';
    
    db.query(checkQuery, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error verificando productos del proveedor:', checkErr);
            return res.status(500).json({ error: checkErr.message });
        }
        
        if (checkResult[0].productos_count > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el proveedor porque tiene productos asociados.' 
            });
        }
        
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
                message: 'Proveedor eliminado correctamente'
            });
        });
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

app.get('/api/estadisticas/ventas-semana', (req, res) => {
    const query = `
        SELECT 
            DATE(fecha) as dia,
            DAYNAME(fecha) as nombre_dia,
            COUNT(*) as total_ventas,
            COALESCE(SUM(total), 0) as monto_total
        FROM venta
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(fecha), DAYNAME(fecha)
        ORDER BY DATE(fecha) ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo ventas de la semana:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
// ================================
// ===== RUTAS DE ESTADÍSTICAS ====
// ================================

app.get('/api/estadisticas', (req, res) => {
    const queries = {
        totalClientes: 'SELECT COUNT(*) as total FROM cliente',
        totalProductos: 'SELECT COUNT(*) as total FROM producto',
        totalVentas: 'SELECT COUNT(*) as total FROM venta',
        ventasHoy: 'SELECT COUNT(*) as total FROM venta WHERE DATE(fecha) = CURDATE()'
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

// ================================
// ===== API VENTAS ================
// ================================

// 1. Obtener todas las ventas con cliente y vendedor
app.get('/api/ventas', async (req, res) => {
    try {
        console.log('📊 Obteniendo todas las ventas...');
        
        // Obtener parámetros de filtro
        const { fechaDesde, fechaHasta, cliente, orden, vendedor } = req.query;
        
        let query = `
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                u.nombre as vendedor_nombre,
                u.email as vendedor_email,
                u.rol as vendedor_rol
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
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
        
        if (vendedor) {
            whereConditions.push('v.id_usuario = ?');
            queryParams.push(vendedor);
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
            default:
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

// 2. Obtener venta por ID (con cliente y vendedor)
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
                c.direccion as cliente_direccion,
                c.rfc as cliente_rfc,
                u.nombre as vendedor_nombre,
                u.email as vendedor_email,
                u.id_usuario as vendedor_id
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
            WHERE v.id_venta = ?
        `;
        
        const [results] = await db.promise().query(query, [ventaId]);
        
        if (results.length === 0) {
            console.log(`⚠️ Venta ${ventaId} no encontrada`);
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        console.log(`✅ Venta ${ventaId} encontrada - Vendedor: ${results[0].vendedor_nombre || 'No asignado'}`);
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
                p.id_categoria,
                cat.nombre as categoria_nombre
            FROM detalle_venta dv
            LEFT JOIN producto p ON dv.id_producto = p.id_producto
            LEFT JOIN categoria cat ON p.id_categoria = cat.id_categoria
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

// 4. Crear nueva venta (CON VENDEDOR)
app.post('/api/ventas', async (req, res) => {
    console.log('🔄 Recibiendo solicitud para crear nueva venta...');
    console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { venta, detalles, id_usuario } = req.body;
    
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
    
    // Validar que se tenga el ID del vendedor
    if (!id_usuario) {
        console.error('❌ No se proporcionó ID del vendedor');
        return res.status(400).json({ 
            error: 'Datos de venta incompletos',
            details: 'Se requiere el ID del vendedor (id_usuario)'
        });
    }
    
    try {
        console.log('🔐 Iniciando transacción...');
        
        // Iniciar transacción
        await db.promise().query('START TRANSACTION');
        
        // 1. Verificar que el cliente existe
        console.log(`👤 Verificando cliente ID: ${id_cliente}`);
        const [clienteResult] = await db.promise().query(
            'SELECT id_cliente, nombre FROM cliente WHERE id_cliente = ?',
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
        console.log(`✅ Cliente verificado: ${clienteResult[0].nombre}`);
        
        // 2. Verificar que el vendedor existe y está activo
        console.log(`👤 Verificando vendedor ID: ${id_usuario}`);
        const [vendedorResult] = await db.promise().query(
            'SELECT id_usuario, nombre, rol, activo FROM usuario WHERE id_usuario = ? AND activo = 1',
            [id_usuario]
        );
        
        if (vendedorResult.length === 0) {
            await db.promise().query('ROLLBACK');
            console.error(`❌ Vendedor con ID ${id_usuario} no encontrado o inactivo`);
            return res.status(404).json({ 
                error: 'Vendedor no encontrado',
                details: 'El vendedor no existe o está inactivo'
            });
        }
        console.log(`✅ Vendedor verificado: ${vendedorResult[0].nombre} (${vendedorResult[0].rol})`);
        
        // 3. Verificar stock de todos los productos
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
            console.log(`📊 Producto ${producto.nombre}: Stock = ${producto.stock_actual}, Solicitado = ${detalle.cantidad}`);
            
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
        
        // 4. Insertar venta (CON ID_USUARIO)
        console.log('💾 Insertando venta en la base de datos...');
        const insertVentaQuery = `
            INSERT INTO venta 
            (fecha, hora, total, id_cliente, metodo_pago, pago_con, cambio, notas, id_usuario) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            notas || null,
            parseInt(id_usuario)
        ]);
        
        const nuevaVentaId = ventaResult.insertId;
        console.log(`✅ Venta insertada con ID: ${nuevaVentaId} (Vendedor ID: ${id_usuario})`);
        
        // 5. Insertar detalles y actualizar stock
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
        
        // 6. Confirmar transacción
        await db.promise().query('COMMIT');
        console.log('✅ Transacción completada exitosamente');
        
        // 7. Obtener datos completos de la venta creada
        const [ventaCompleta] = await db.promise().query(`
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                u.nombre as vendedor_nombre,
                u.email as vendedor_email
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
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

// 5. Cancelar venta (con verificación de permisos)
app.delete('/api/ventas/:id', async (req, res) => {
    const ventaId = req.params.id;
    const { id_usuario, rol } = req.body; // Quién está cancelando
    
    console.log(`🗑️ Solicitando cancelación de venta ID: ${ventaId} por usuario: ${id_usuario}`);
    
    if (!id_usuario) {
        return res.status(400).json({ error: 'Se requiere ID del usuario que realiza la cancelación' });
    }
    
    try {
        console.log('🔐 Iniciando transacción de cancelación...');
        await db.promise().query('START TRANSACTION');
        
        // 1. Obtener información de la venta
        const [ventaInfo] = await db.promise().query(`
            SELECT v.*, u.nombre as vendedor_nombre 
            FROM venta v
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
            WHERE v.id_venta = ?
        `, [ventaId]);
        
        if (ventaInfo.length === 0) {
            await db.promise().query('ROLLBACK');
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        const venta = ventaInfo[0];
        console.log(`📊 Venta encontrada - Vendedor original: ${venta.vendedor_nombre || 'N/A'}`);
        
        // 2. Verificar permisos (solo admin o el mismo vendedor pueden cancelar)
        if (rol !== 'admin' && venta.id_usuario !== parseInt(id_usuario)) {
            await db.promise().query('ROLLBACK');
            console.log(`❌ Usuario ${id_usuario} no tiene permiso para cancelar esta venta`);
            return res.status(403).json({ 
                error: 'Permiso denegado',
                details: 'Solo el vendedor que realizó la venta o un administrador pueden cancelarla'
            });
        }
        
        // 3. Obtener detalles de la venta para revertir stock
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
        
        // 4. Revertir stock de productos
        for (const detalle of detalles) {
            const revertStockQuery = `
                UPDATE producto 
                SET stock_actual = stock_actual + ? 
                WHERE id_producto = ?
            `;
            await db.promise().query(revertStockQuery, [detalle.cantidad, detalle.id_producto]);
            console.log(`✅ Stock revertido: Producto ${detalle.id_producto}, +${detalle.cantidad} unidades`);
        }
        
        // 5. Eliminar detalles de venta
        const deleteDetallesQuery = 'DELETE FROM detalle_venta WHERE id_venta = ?';
        await db.promise().query(deleteDetallesQuery, [ventaId]);
        console.log('✅ Detalles de venta eliminados');
        
        // 6. Eliminar venta
        const deleteVentaQuery = 'DELETE FROM venta WHERE id_venta = ?';
        const [result] = await db.promise().query(deleteVentaQuery, [ventaId]);
        
        if (result.affectedRows === 0) {
            await db.promise().query('ROLLBACK');
            console.log(`⚠️ Venta ${ventaId} no encontrada para eliminar`);
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        console.log(`✅ Venta ${ventaId} eliminada por usuario ${id_usuario}`);
        
        // 7. Confirmar transacción
        await db.promise().query('COMMIT');
        console.log('✅ Transacción de cancelación completada');
        
        res.json({
            success: true,
            message: 'Venta cancelada exitosamente y stock revertido',
            ventaId: ventaId,
            cancelada_por: id_usuario,
            fecha_cancelacion: new Date().toISOString()
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

// 6. Generar datos para factura (con datos del vendedor)
app.get('/api/ventas/:id/factura', async (req, res) => {
    try {
        const ventaId = req.params.id;
        console.log(`🧾 Generando factura para venta ID: ${ventaId}`);
        
        // Obtener datos de la venta con cliente y vendedor
        const ventaQuery = `
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                c.direccion as cliente_direccion,
                c.ciudad as cliente_ciudad,
                c.estado as cliente_estado,
                c.rfc as cliente_rfc,
                u.nombre as vendedor_nombre,
                u.email as vendedor_email,
                u.id_usuario as vendedor_id
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
            WHERE v.id_venta = ?
        `;
        
        const [ventaResult] = await db.promise().query(ventaQuery, [ventaId]);
        
        if (ventaResult.length === 0) {
            console.log(`⚠️ Venta ${ventaId} no encontrada para factura`);
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        const venta = ventaResult[0];
        console.log(`📊 Datos de venta obtenidos - Vendedor: ${venta.vendedor_nombre || 'No asignado'}`);
        
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
            },
            vendedor: {
                nombre: venta.vendedor_nombre || 'No asignado',
                email: venta.vendedor_email || 'No registrado',
                id: venta.vendedor_id || null
            }
        };
        
        console.log(`✅ Factura generada para venta ${ventaId} - Vendedor: ${facturaData.vendedor.nombre}`);
        
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
            details: error.message
        });
    }
});

// 7. Obtener estadísticas de ventas (con filtro por vendedor)
app.get('/api/ventas/estadisticas', async (req, res) => {
    try {
        console.log('📈 Calculando estadísticas de ventas...');
        
        const { vendedor_id } = req.query;
        const vendedorFilter = vendedor_id ? `AND id_usuario = ${parseInt(vendedor_id)}` : '';
        
        const queries = {
            ventasHoy: `
                SELECT 
                    COUNT(*) as total, 
                    COALESCE(SUM(total), 0) as monto_total 
                FROM venta 
                WHERE DATE(fecha) = CURDATE()
                ${vendedorFilter}
            `,
            ventasMes: `
                SELECT 
                    COUNT(*) as total, 
                    COALESCE(SUM(total), 0) as monto_total 
                FROM venta 
                WHERE MONTH(fecha) = MONTH(CURDATE()) 
                AND YEAR(fecha) = YEAR(CURDATE())
                ${vendedorFilter}
            `,
            ticketPromedio: `
                SELECT COALESCE(AVG(total), 0) as promedio 
                FROM venta
                WHERE YEAR(fecha) = YEAR(CURDATE())
                ${vendedorFilter}
            `,
            productosVendidos: `
                SELECT COALESCE(SUM(cantidad), 0) as total 
                FROM detalle_venta dv
                JOIN venta v ON dv.id_venta = v.id_venta
                WHERE YEAR(v.fecha) = YEAR(CURDATE())
                ${vendedorFilter}
            `,
            topClientes: `
                SELECT 
                    c.nombre,
                    COUNT(v.id_venta) as ventas_count,
                    COALESCE(SUM(v.total), 0) as monto_total
                FROM cliente c
                LEFT JOIN venta v ON c.id_cliente = v.id_cliente
                WHERE v.id_venta IS NOT NULL
                ${vendedorFilter}
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
                ${vendedorFilter}
                GROUP BY metodo_pago
                ORDER BY monto_total DESC
            `,
            ventasPorVendedor: `
                SELECT 
                    u.id_usuario,
                    u.nombre as vendedor_nombre,
                    COUNT(v.id_venta) as total_ventas,
                    COALESCE(SUM(v.total), 0) as monto_total
                FROM usuario u
                LEFT JOIN venta v ON u.id_usuario = v.id_usuario
                WHERE u.rol = 'vendedor' OR u.rol = 'admin'
                GROUP BY u.id_usuario, u.nombre
                ORDER BY monto_total DESC
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
                    console.log(`✅ ${key}: ${JSON.stringify(data).substring(0, 100)}...`);
                } catch (error) {
                    console.error(`❌ Error en consulta ${key}:`, error.message);
                    results[key] = key.includes('top') || key.includes('Por') || key.includes('Vendedor') ? [] : 0;
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

// 11. Obtener producto por ID
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
        
        console.log(`✅ Producto ${productoId} encontrado: ${results[0].nombre}`);
        res.json(results[0]);
    } catch (err) {
        console.error('❌ Error obteniendo producto:', err.message);
        res.status(500).json({ 
            error: 'Error al obtener producto',
            details: err.message
        });
    }
});

// 12. Obtener ventas con filtros avanzados
app.get('/api/ventas/filtradas', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, clienteId, metodoPago, vendedorId } = req.query;
        console.log('🔍 Filtrando ventas con parámetros:', req.query);
        
        let query = `
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                u.nombre as vendedor_nombre
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
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
        
        if (vendedorId) {
            query += ' AND v.id_usuario = ?';
            params.push(vendedorId);
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
            details: err.message        });
    }
});

// 14. Obtener resumen diario de ventas (con filtro por vendedor)
app.get('/api/ventas/resumen/diario', async (req, res) => {
    try {
        console.log('📅 Generando resumen diario de ventas...');
        
        const { vendedor_id } = req.query;
        const vendedorFilter = vendedor_id ? `AND v.id_usuario = ${parseInt(vendedor_id)}` : '';
        
        const query = `
            SELECT 
                DATE(v.fecha) as fecha,
                COUNT(*) as total_ventas,
                SUM(v.total) as monto_total,
                AVG(v.total) as promedio_venta,
                u.nombre as vendedor_nombre
            FROM venta v
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
            WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ${vendedorFilter}
            GROUP BY DATE(v.fecha), u.id_usuario, u.nombre
            ORDER BY fecha DESC
        `;
        
        const [results] = await db.promise().query(query);
        console.log(`✅ Resumen diario generado: ${results.length} registros`);
        
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
        
        const { vendedor_id } = req.query;
        const vendedorFilter = vendedor_id ? `AND v.id_usuario = ${parseInt(vendedor_id)}` : '';
        
        const query = `
            SELECT 
                p.nombre,
                p.marca,
                p.numero_parte,
                SUM(dv.cantidad) as total_vendido,
                SUM(dv.subtotal) as monto_total,
                COUNT(DISTINCT v.id_venta) as ventas_realizadas
            FROM detalle_venta dv
            JOIN producto p ON dv.id_producto = p.id_producto
            JOIN venta v ON dv.id_venta = v.id_venta
            WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ${vendedorFilter}
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

// 16. Obtener vendedores disponibles
app.get('/api/vendedores', async (req, res) => {
    try {
        console.log('👥 Obteniendo lista de vendedores...');
        
        const query = `
            SELECT id_usuario, nombre, email, rol
            FROM usuario 
            WHERE rol IN ('admin', 'vendedor') AND activo = 1
            ORDER BY nombre ASC
        `;
        
        const [results] = await db.promise().query(query);
        console.log(`✅ ${results.length} vendedores encontrados`);
        
        res.json(results);
    } catch (err) {
        console.error('❌ Error obteniendo vendedores:', err.message);
        res.status(500).json({ 
            error: 'Error al obtener vendedores',
            details: err.message
        });
    }
});

// 17. Obtener estadísticas por vendedor
app.get('/api/estadisticas/vendedores', async (req, res) => {
    try {
        console.log('📊 Generando estadísticas por vendedor...');
        
        const query = `
            SELECT 
                u.id_usuario,
                u.nombre as vendedor_nombre,
                u.email as vendedor_email,
                COUNT(v.id_venta) as total_ventas,
                COALESCE(SUM(v.total), 0) as monto_total,
                COALESCE(AVG(v.total), 0) as promedio_venta,
                MAX(v.fecha) as ultima_venta,
                MIN(v.fecha) as primera_venta
            FROM usuario u
            LEFT JOIN venta v ON u.id_usuario = v.id_usuario
            WHERE u.rol IN ('vendedor', 'admin') AND u.activo = 1
            GROUP BY u.id_usuario, u.nombre, u.email
            ORDER BY monto_total DESC
        `;
        
        const [results] = await db.promise().query(query);
        console.log(`✅ Estadísticas por vendedor generadas: ${results.length} vendedores`);
        
        res.json(results);
    } catch (err) {
        console.error('❌ Error obteniendo estadísticas por vendedor:', err.message);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas por vendedor',
            details: err.message
        });
    }
});

// ================================
// ===== RUTA DE PRUEBA ===========
// ================================

app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API funcionando', 
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/login (POST)',
            '/api/usuarios (POST)',
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
// ===== MANEJO DE ERRORES ========
// ================================

// Manejo de errores 404 (SIEMPRE AL FINAL)
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});
// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error('Error general:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});
// ================================
// ===== INICIAR SERVIDOR =========
// ================================

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔐 Login: POST http://localhost:${PORT}/api/login`);
    console.log(`📝 Registro: POST http://localhost:${PORT}/api/usuarios`);
    console.log(`🔧 API Test: http://localhost:${PORT}/api/test`);
});