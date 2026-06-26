// ==================== SISTEMA DE LOGIN CON BASE DE DATOS ====================
// API URL base
const API_URL = 'http://localhost:3000/api';

// Mostrar alerta de error
function showError(message) {
    const alertDiv = document.getElementById('loginAlert');
    const alertMsg = document.getElementById('alertMessage');
    
    if (alertDiv && alertMsg) {
        alertMsg.innerText = message;
        alertDiv.style.display = 'flex';
        
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 3000);
    }
}

// Mostrar alerta de éxito
function showSuccess(message) {
    const successDiv = document.getElementById('successAlert');
    const successMsg = document.getElementById('successMessage');
    
    if (successDiv && successMsg) {
        successMsg.innerText = message;
        successDiv.style.display = 'flex';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}

// Ocultar alertas
function hideAlerts() {
    const errorAlert = document.getElementById('loginAlert');
    const successAlert = document.getElementById('successAlert');
    if (errorAlert) errorAlert.style.display = 'none';
    if (successAlert) successAlert.style.display = 'none';
}

// Guardar sesión y redirigir
function redirectToHome(userData) {
    console.log('✅ Redirigiendo con datos de usuario:', userData);
    
    sessionStorage.setItem('is_logged_in', 'true');
    sessionStorage.setItem('user_id', userData.id);
    sessionStorage.setItem('user_email', userData.email);
    sessionStorage.setItem('user_name', userData.nombre);
    sessionStorage.setItem('user_role', userData.rol);
    sessionStorage.setItem('login_timestamp', Date.now().toString());
    
    // Redirección corregida a la ruta completa
    window.location.href = '/src/Home.html';
}

// Verificar sesión existente
function checkExistingSession() {
    const isLoggedIn = sessionStorage.getItem('is_logged_in');
    const timestamp = sessionStorage.getItem('login_timestamp');
    
    if (isLoggedIn === 'true' && timestamp) {
        const loginTime = parseInt(timestamp);
        const now = Date.now();
        const eightHours = 8 * 60 * 60 * 1000;
        
        if (now - loginTime < eightHours) {
            console.log('✅ Sesión válida encontrada, redirigiendo al home...');
            window.location.href = '/src/Home.html';
        } else {
            console.log('⚠️ Sesión expirada, limpiando...');
            sessionStorage.clear();
        }
    }
}

// ========== FUNCIONES API ==========

// Login con API
async function loginUser(email, password) {
    try {
        console.log('🔐 Intentando login con:', { email, password: '***' });
        
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        console.log('📡 Respuesta del servidor:', data);
        
        if (!response.ok) {
            return { success: false, message: data.message || 'Error al iniciar sesión' };
        }
        
        if (!data.user || !data.user.id) {
            console.error('❌ Datos de usuario incompletos:', data);
            return { success: false, message: 'Datos de usuario inválidos' };
        }
        
        return { success: true, user: data.user };
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        return { success: false, message: 'Error de conexión con el servidor. ¿El servidor está corriendo en http://localhost:3000?' };
    }
}

// Registrar nuevo usuario con API
async function registerUser(nombre, email, password, rol) {
    try {
        console.log('📝 Registrando usuario:', { nombre, email, rol });
        
        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, email, password, rol })
        });
        
        const data = await response.json();
        console.log('📡 Respuesta del registro:', data);
        
        if (!response.ok) {
            return { success: false, message: data.message || 'Error al registrar usuario' };
        }
        
        return { success: true, message: data.message, user: data.user };
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        return { success: false, message: 'Error de conexión con el servidor' };
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Página de login cargada');
    
    // Verificar sesión activa
    checkExistingSession();
    
    // Obtener elementos
    const loginForm = document.getElementById('loginForm');
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    const confirmRegisterBtn = document.getElementById('confirmRegisterBtn');
    
    let registerModal;
    try {
        registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    } catch (error) {
        console.error('❌ Error inicializando modal:', error);
    }
    
    // Manejar login
    if (loginForm) {
        console.log('✅ Formulario de login encontrado');
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 Formulario de login enviado');
            hideAlerts();
            
            const email = emailField ? emailField.value.trim() : '';
            const password = passwordField ? passwordField.value : '';
            
            console.log('📧 Email ingresado:', email);
            
            if (!email || !password) {
                showError("Por favor ingresa correo y contraseña.");
                return;
            }
            
            if (!email.includes('@')) {
                showError("Por favor ingresa un correo electrónico válido.");
                return;
            }
            
            // Mostrar loading en el botón
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Verificando...';
            submitBtn.disabled = true;
            
            const result = await loginUser(email, password);
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                console.log('✅ Login exitoso, redirigiendo...');
                redirectToHome(result.user);
            } else {
                console.error('❌ Login fallido:', result.message);
                showError(result.message);
                if (passwordField) {
                    passwordField.value = '';
                    passwordField.focus();
                }
            }
        });
    } else {
        console.error('❌ Formulario de login no encontrado');
    }
    
    // Manejar creación de usuario
    if (confirmRegisterBtn) {
        console.log('✅ Botón de registro encontrado');
        
        confirmRegisterBtn.addEventListener('click', async function() {
            console.log('📝 Intentando registrar usuario...');
            
            const nombre = document.getElementById('regFullname').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const rol = document.getElementById('regRole').value;
            
            // Validaciones básicas
            if (!nombre || !email || !password) {
                const errorDiv = document.getElementById('registerError');
                const errorMsg = document.getElementById('registerErrorMessage');
                errorDiv.style.display = 'block';
                errorMsg.innerText = 'Todos los campos son obligatorios';
                setTimeout(() => errorDiv.style.display = 'none', 3000);
                return;
            }
            
            if (!email.includes('@')) {
                const errorDiv = document.getElementById('registerError');
                const errorMsg = document.getElementById('registerErrorMessage');
                errorDiv.style.display = 'block';
                errorMsg.innerText = 'Ingresa un correo electrónico válido';
                setTimeout(() => errorDiv.style.display = 'none', 3000);
                return;
            }
            
            if (password.length < 6) {
                const errorDiv = document.getElementById('registerError');
                const errorMsg = document.getElementById('registerErrorMessage');
                errorDiv.style.display = 'block';
                errorMsg.innerText = 'La contraseña debe tener al menos 6 caracteres';
                setTimeout(() => errorDiv.style.display = 'none', 3000);
                return;
            }
            
            // Mostrar loading en el botón
            const originalText = confirmRegisterBtn.innerHTML;
            confirmRegisterBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Creando...';
            confirmRegisterBtn.disabled = true;
            
            const result = await registerUser(nombre, email, password, rol);
            
            confirmRegisterBtn.innerHTML = originalText;
            confirmRegisterBtn.disabled = false;
            
            const errorDiv = document.getElementById('registerError');
            const errorMsg = document.getElementById('registerErrorMessage');
            
            if (result.success) {
                console.log('✅ Usuario registrado exitosamente');
                if (registerModal) registerModal.hide();
                showSuccess(result.message);
                
                // Limpiar formulario
                document.getElementById('regFullname').value = '';
                document.getElementById('regEmail').value = '';
                document.getElementById('regPassword').value = '';
                document.getElementById('regRole').value = 'vendedor';
                
                // Autocompletar email en login
                if (emailField) {
                    emailField.value = email;
                    if (passwordField) passwordField.focus();
                }
            } else {
                console.error('❌ Error en registro:', result.message);
                errorDiv.style.display = 'block';
                errorMsg.innerText = result.message;
                setTimeout(() => errorDiv.style.display = 'none', 3000);
            }
        });
    } else {
        console.error('❌ Botón de registro no encontrado');
    }
    
    // Limpiar modal al abrirlo
    const openRegisterBtn = document.getElementById('openRegisterBtn');
    if (openRegisterBtn) {
        openRegisterBtn.addEventListener('click', function() {
            console.log('🔓 Abriendo modal de registro');
            document.getElementById('regFullname').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regRole').value = 'vendedor';
            const errorDiv = document.getElementById('registerError');
            if (errorDiv) errorDiv.style.display = 'none';
        });
    }
    
    // Enter en el modal
    const regPassword = document.getElementById('regPassword');
    if (regPassword && confirmRegisterBtn) {
        regPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmRegisterBtn.click();
            }
        });
    }
    
    // Enter en login
    if (passwordField && loginForm) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    console.log('✅ Login.js inicializado correctamente');
});

// Funciones globales
window.RefaccionariaAuth = {
    logout: function() {
        console.log('🚪 Cerrando sesión...');
        sessionStorage.clear();
        window.location.href = '/src/Login/Login.html';
    },
    isLoggedIn: function() {
        return sessionStorage.getItem('is_logged_in') === 'true';
    },
    getUser: function() {
        return {
            id: sessionStorage.getItem('user_id'),
            email: sessionStorage.getItem('user_email'),
            name: sessionStorage.getItem('user_name'),
            role: sessionStorage.getItem('user_role')
        };
    },
    checkSession: function() {
        return checkExistingSession();
    }
};