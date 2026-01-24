const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { 
    initDatabase, 
    createTicket, 
    getAllTickets,
    getArchivedTickets,
    getTicketById,
    updateTicketStatus,
    updateTicket,
    archiveTicket,
    restoreTicket,
    deleteTicket,
    getTicketsByStatus,
    addNoteToTicket,
    archiveNote,
    restoreNote,
    deleteNote,
    getTicketNotes,
    assignTechnician,
    registerWhatsAppContact,
    getWhatsAppContacts,
    getAllServices,
    createService,
    updateService,
    deleteService,
    getAllUsers,
    getUserByUsername,
    createUser,
    updateUser,
    updateUserLastAccess,
    deleteUser
} = require('./database');

const { 
    sendTicketConfirmation, 
    sendNotificationToSupport 
} = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'mi_secreto_temporal',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize database
initDatabase()
    .then(() => {
        console.log('✓ Base de datos inicializada correctamente');
    })
    .catch(err => {
        console.error('Error al inicializar la base de datos:', err);
    });

// WhatsApp simplificado: solo enlaces directos a web.whatsapp.com
// Sin servidor de WhatsApp Web embebido para evitar problemas de Chromium en Docker

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        return next();
    }
    
    // Si es una petición API, devolver error JSON
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ 
            error: 'No autorizado. Inicie sesión para acceder a esta información.',
            requiresAuth: true 
        });
    }
    
    // Si es una página, redirigir al login
    res.redirect('/login');
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.authenticated && req.session.rol === 'admin') {
        return next();
    }
    
    return res.status(403).json({ 
        error: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
    });
};

// API Routes

// Login routes
app.get('/login', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Intentar autenticación con base de datos primero
        const user = await getUserByUsername(username);
        
        if (user && user.activo) {
            // Verificar contraseña hasheada
            const match = await bcrypt.compare(password, user.password_hash);
            
            if (match) {
                req.session.authenticated = true;
                req.session.username = username;
                req.session.userId = user.id;
                req.session.rol = user.rol;
                
                // Actualizar último acceso
                await updateUserLastAccess(username);
                
                return res.json({ 
                    success: true, 
                    message: `✓ Bienvenido ${user.nombre_completo || username}`,
                    user: {
                        username: user.username,
                        nombre: user.nombre_completo,
                        rol: user.rol
                    }
                });
            }
        }
        
        // Fallback a variables de entorno (para compatibilidad)
        const validUsername = process.env.ADMIN_USERNAME || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const isProduction = process.env.NODE_ENV === 'production';
        
        if (username === validUsername && password === validPassword) {
            req.session.authenticated = true;
            req.session.username = username;
            req.session.rol = 'admin';
            
            return res.json({ 
                success: true, 
                message: isProduction ? '✓ Acceso autorizado - Entorno de Producción' : '✓ Login exitoso - Entorno de Desarrollo',
                environment: isProduction ? 'production' : 'development'
            });
        }
        
        // Credenciales incorrectas
        res.status(401).json({ 
            success: false, 
            message: 'Usuario o contraseña incorrectos'
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor' 
        });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.json({ success: true, message: 'Sesión cerrada' });
    });
});

// Create new ticket
app.post('/api/tickets', async (req, res) => {
    try {
        const { nombre, email, telefono, servicio, prioridad, descripcion } = req.body;

        // Validate required fields
        if (!nombre || !email || !telefono || !servicio || !descripcion) {
            return res.status(400).json({ 
                error: 'Todos los campos obligatorios deben ser completados' 
            });
        }

        // Create ticket in database
        const result = await createTicket({
            nombre,
            email,
            telefono,
            servicio,
            prioridad: prioridad || 'media',
            descripcion
        });

        const ticketData = {
            ticketId: result.ticketId,
            nombre,
            email,
            telefono,
            servicio,
            prioridad: prioridad || 'media',
            descripcion
        };

        // Send emails (don't wait for them to complete)
        Promise.all([
            sendTicketConfirmation(ticketData),
            sendNotificationToSupport(ticketData)
        ]).then(() => {
            console.log(`✓ Emails enviados para ticket ${result.ticketId}`);
        }).catch(err => {
            console.error('Error al enviar emails:', err);
            // Don't fail the request if email fails
        });

        res.status(201).json({
            success: true,
            ticketId: result.ticketId,
            message: 'Ticket creado exitosamente',
            whatsappUrl: `https://wa.me/34${process.env.COMPANY_PHONE || '624620893'}?text=Hola,%20tengo%20el%20ticket%20${result.ticketId}%20y%20necesito%20información`,
            telefono: process.env.COMPANY_PHONE || '624620893'
        });

    } catch (error) {
        console.error('Error al crear ticket:', error);
        res.status(500).json({ 
            error: 'Error al procesar la solicitud. Por favor, inténtelo de nuevo.' 
        });
    }
});

// Get all tickets
app.get('/api/tickets', requireAuth, async (req, res) => {
    try {
        const tickets = await getAllTickets();
        res.json(tickets);
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        res.status(500).json({ error: 'Error al obtener tickets' });
    }
});

// Get ticket by ID
app.get('/api/tickets/:ticketId', requireAuth, async (req, res) => {
    try {
        const ticket = await getTicketById(req.params.ticketId);
        if (ticket) {
            res.json(ticket);
        } else {
            res.status(404).json({ error: 'Ticket no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ticket:', error);
        res.status(500).json({ error: 'Error al obtener ticket' });
    }
});

// Update ticket status
app.patch('/api/tickets/:ticketId/status', requireAuth, async (req, res) => {
    try {
        const { estado } = req.body;
        const validStates = ['pendiente', 'en_proceso', 'resuelto', 'cerrado'];
        
        if (!validStates.includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        const result = await updateTicketStatus(req.params.ticketId, estado);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Estado actualizado' });
        } else {
            res.status(404).json({ error: 'Ticket no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// Get tickets by status
app.get('/api/tickets/status/:estado', requireAuth, async (req, res) => {
    try {
        const tickets = await getTicketsByStatus(req.params.estado);
        res.json(tickets);
    } catch (error) {
        console.error('Error al obtener tickets por estado:', error);
        res.status(500).json({ error: 'Error al obtener tickets' });
    }
});

// Add note to ticket
app.post('/api/tickets/:ticketId/notes', requireAuth, async (req, res) => {
    try {
        const { nota, autor } = req.body;
        if (!nota || !autor) {
            return res.status(400).json({ error: 'Nota y autor son requeridos' });
        }
        const result = await addNoteToTicket(req.params.ticketId, nota, autor);
        res.status(201).json({ success: true, id: result.id });
    } catch (error) {
        console.error('Error al añadir nota:', error);
        res.status(500).json({ error: 'Error al añadir nota' });
    }
});

// Get notes for ticket
app.get('/api/tickets/:ticketId/notes', requireAuth, async (req, res) => {
    try {
        const notes = await getTicketNotes(req.params.ticketId);
        res.json(notes);
    } catch (error) {
        console.error('Error al obtener notas:', error);
        res.status(500).json({ error: 'Error al obtener notas' });
    }
});

// Assign technician to ticket
app.patch('/api/tickets/:ticketId/assign', requireAuth, async (req, res) => {
    try {
        const { tecnico } = req.body;
        if (!tecnico) {
            return res.status(400).json({ error: 'Técnico es requerido' });
        }
        const result = await assignTechnician(req.params.ticketId, tecnico);
        if (result.changes > 0) {
            res.json({ success: true, message: 'Técnico asignado' });
        } else {
            res.status(404).json({ error: 'Ticket no encontrado' });
        }
    } catch (error) {
        console.error('Error al asignar técnico:', error);
        res.status(500).json({ error: 'Error al asignar técnico' });
    }
});

// Update complete ticket (admin edit)
app.put('/api/tickets/:ticketId', requireAuth, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticketData = req.body;
        
        const result = await updateTicket(ticketId, ticketData);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Ticket actualizado exitosamente' });
        } else {
            res.status(404).json({ error: 'Ticket no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar ticket:', error);
        res.status(500).json({ error: 'Error al actualizar ticket' });
    }
});

// Delete ticket (admin only)
// Archive ticket (soft delete - admin only)
app.delete('/api/tickets/:ticketId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const usuario = req.session.username;
        const result = await archiveTicket(ticketId, usuario);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Ticket archivado exitosamente' });
        } else {
            res.status(404).json({ error: 'Ticket no encontrado' });
        }
    } catch (error) {
        console.error('Error al archivar ticket:', error);
        res.status(500).json({ error: 'Error al archivar ticket' });
    }
});

// Restore archived ticket (admin only)
app.post('/api/tickets/:ticketId/restore', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const result = await restoreTicket(ticketId);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Ticket restaurado exitosamente' });
        } else {
            res.status(404).json({ error: 'Ticket no encontrado' });
        }
    } catch (error) {
        console.error('Error al restaurar ticket:', error);
        res.status(500).json({ error: 'Error al restaurar ticket' });
    }
});

// Get archived tickets
app.get('/api/tickets/archived/list', requireAuth, requireAdmin, async (req, res) => {
    try {
        const tickets = await getArchivedTickets();
        res.json(tickets);
    } catch (error) {
        console.error('Error al obtener tickets archivados:', error);
        res.status(500).json({ error: 'Error al obtener tickets archivados' });
    }
});

// Archive note (soft delete - admin only)
app.delete('/api/notes/:noteId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { noteId } = req.params;
        const usuario = req.session.username;
        const result = await archiveNote(noteId, usuario);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Nota archivada exitosamente' });
        } else {
            res.status(404).json({ error: 'Nota no encontrada' });
        }
    } catch (error) {
        console.error('Error al archivar nota:', error);
        res.status(500).json({ error: 'Error al archivar nota' });
    }
});

// Restore archived note
app.post('/api/notes/:noteId/restore', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { noteId } = req.params;
        const result = await restoreNote(noteId);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Nota restaurada exitosamente' });
        } else {
            res.status(404).json({ error: 'Nota no encontrada' });
        }
    } catch (error) {
        console.error('Error al restaurar nota:', error);
        res.status(500).json({ error: 'Error al restaurar nota' });
    }
});

// Register WhatsApp contact
app.post('/api/tickets/:ticketId/whatsapp', requireAuth, async (req, res) => {
    try {
        const { telefono, mensaje, enviado_por } = req.body;
        if (!telefono || !enviado_por) {
            return res.status(400).json({ error: 'Teléfono y técnico son requeridos' });
        }
        const result = await registerWhatsAppContact(req.params.ticketId, telefono, mensaje, enviado_por);
        res.status(201).json({ success: true, id: result.id });
    } catch (error) {
        console.error('Error al registrar contacto WhatsApp:', error);
        res.status(500).json({ error: 'Error al registrar contacto' });
    }
});

// Get WhatsApp contacts for ticket
app.get('/api/tickets/:ticketId/whatsapp', requireAuth, async (req, res) => {
    try {
        const contacts = await getWhatsAppContacts(req.params.ticketId);
        res.json(contacts);
    } catch (error) {
        console.error('Error al obtener contactos WhatsApp:', error);
        res.status(500).json({ error: 'Error al obtener contactos' });
    }
});

// Admin panel route (simple HTML page for managing tickets)
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ==================== API SERVICIOS ====================

// Get all services
app.get('/api/servicios', requireAuth, async (req, res) => {
    try {
        const servicios = await getAllServices();
        res.json(servicios);
    } catch (error) {
        console.error('Error obteniendo servicios:', error);
        res.status(500).json({ error: 'Error obteniendo servicios' });
    }
});

// Create service
app.post('/api/servicios', requireAuth, async (req, res) => {
    try {
        const { codigo, nombre, descripcion } = req.body;
        
        if (!codigo || !nombre) {
            return res.status(400).json({ error: 'Código y nombre son requeridos' });
        }
        
        const result = await createService(codigo, nombre, descripcion || '');
        res.json({ success: true, message: 'Servicio creado exitosamente', id: result.id });
    } catch (error) {
        console.error('Error creando servicio:', error);
        res.status(500).json({ error: 'Error creando servicio' });
    }
});

// Update service
app.put('/api/servicios/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, nombre, descripcion, activo } = req.body;
        
        if (!codigo || !nombre) {
            return res.status(400).json({ error: 'Código y nombre son requeridos' });
        }
        
        const result = await updateService(id, codigo, nombre, descripcion || '', activo !== undefined ? activo : 1);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Servicio actualizado exitosamente' });
        } else {
            res.status(404).json({ error: 'Servicio no encontrado' });
        }
    } catch (error) {
        console.error('Error actualizando servicio:', error);
        res.status(500).json({ error: 'Error actualizando servicio' });
    }
});

// Delete service
app.delete('/api/servicios/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteService(id);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Servicio eliminado exitosamente' });
        } else {
            res.status(404).json({ error: 'Servicio no encontrado' });
        }
    } catch (error) {
        console.error('Error eliminando servicio:', error);
        res.status(500).json({ error: 'Error eliminando servicio' });
    }
});

// ==================== API USUARIOS ====================

// Get all users
app.get('/api/usuarios', requireAuth, async (req, res) => {
    try {
        const usuarios = await getAllUsers();
        res.json(usuarios);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
});

// Create new user
app.post('/api/usuarios', requireAuth, async (req, res) => {
    try {
        const { username, password, nombre_completo, email, rol } = req.body;
        
        // Validar datos requeridos
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
        }
        
        // Verificar que el usuario no exista
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }
        
        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Crear usuario
        const result = await createUser(username, passwordHash, nombre_completo, email, rol || 'tecnico');
        
        res.json({ 
            success: true, 
            message: 'Usuario creado exitosamente',
            id: result.id 
        });
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({ error: 'Error creando usuario' });
    }
});

// Update user
app.put('/api/usuarios/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_completo, email, rol, activo, password } = req.body;
        
        const updateData = { nombre_completo, email, rol, activo };
        
        // Si se proporciona nueva contraseña, hashearla
        if (password) {
            const saltRounds = 10;
            updateData.password_hash = await bcrypt.hash(password, saltRounds);
        }
        
        const result = await updateUser(id, updateData);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Usuario actualizado exitosamente' });
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ error: 'Error actualizando usuario' });
    }
});

// Delete user
app.delete('/api/usuarios/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // No permitir eliminar al propio usuario
        if (req.session.userId == id) {
            return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
        }
        
        const result = await deleteUser(id);
        
        if (result.changes > 0) {
            res.json({ success: true, message: 'Usuario eliminado exitosamente' });
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    // No inicializar WhatsApp automáticamente - esperar a que el usuario lo solicite
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint (solo para verificar configuración)
app.get('/api/config-check', (req, res) => {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const hasPassword = !!(process.env.ADMIN_PASSWORD);
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.json({
        environment: process.env.NODE_ENV || 'development',
        usernameConfigured: username,
        passwordConfigured: hasPassword,
        isProduction: isProduction,
        defaultBlocked: isProduction && username === 'admin'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 Servidor de Servicios Informáticos iniciado');
    console.log('='.repeat(50));
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📊 Panel Admin: http://localhost:${PORT}/admin`);
    console.log(`📧 Email configurado: ${process.env.EMAIL_USER || 'No configurado'}`);
    console.log('='.repeat(50) + '\n');
});

module.exports = app;
