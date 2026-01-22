const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'tickets.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
const initDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create tickets table
            db.run(`
                CREATE TABLE IF NOT EXISTS tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id TEXT UNIQUE NOT NULL,
                    nombre TEXT NOT NULL,
                    email TEXT NOT NULL,
                    telefono TEXT NOT NULL,
                    servicio TEXT NOT NULL,
                    prioridad TEXT NOT NULL,
                    descripcion TEXT NOT NULL,
                    estado TEXT DEFAULT 'pendiente',
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating tickets table:', err);
                    reject(err);
                } else {
                    console.log('✓ Tabla de tickets creada/verificada');
                }
            });

            // Create services table for reference
            db.run(`
                CREATE TABLE IF NOT EXISTS servicios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    codigo TEXT UNIQUE NOT NULL,
                    nombre TEXT NOT NULL,
                    descripcion TEXT,
                    activo INTEGER DEFAULT 1
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating services table:', err);
                } else {
                    console.log('✓ Tabla de servicios creada/verificada');
                }
            });

            // Create notes table for internal comments
            db.run(`
                CREATE TABLE IF NOT EXISTS notas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id TEXT NOT NULL,
                    nota TEXT NOT NULL,
                    autor TEXT NOT NULL,
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating notes table:', err);
                } else {
                    console.log('✓ Tabla de notas creada/verificada');
                }
            });

            // Add columns for assignment if they don't exist
            db.run(`ALTER TABLE tickets ADD COLUMN tecnico_asignado TEXT`, (err) => {
                // Ignore error if column already exists
            });

            // Create WhatsApp contacts table
            db.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_contactos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id TEXT NOT NULL,
                    telefono TEXT NOT NULL,
                    mensaje TEXT,
                    enviado_por TEXT NOT NULL,
                    fecha_contacto DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating whatsapp_contactos table:', err);
                } else {
                    console.log('✓ Tabla de contactos WhatsApp creada/verificada');
                }
            });

            // Create users table
            db.run(`
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    nombre_completo TEXT,
                    email TEXT,
                    rol TEXT DEFAULT 'tecnico',
                    activo INTEGER DEFAULT 1,
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ultimo_acceso DATETIME
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating usuarios table:', err);
                } else {
                    console.log('✓ Tabla de usuarios creada/verificada');
                }
            });

            // Insert default services if table is empty
            db.get('SELECT COUNT(*) as count FROM servicios', (err, row) => {
                if (!err && row.count === 0) {
                    const services = [
                        ['reparacion', 'Reparación de Equipos', 'Diagnóstico y reparación de computadoras y dispositivos'],
                        ['redes', 'Montaje de Redes', 'Instalación y configuración de redes'],
                        ['impresoras', 'Soporte de Impresoras', 'Mantenimiento y reparación de impresoras'],
                        ['seguridad', 'Seguridad Informática', 'Protección y seguridad de sistemas'],
                        ['errores', 'Detección de Errores', 'Diagnóstico de problemas de software y hardware'],
                        ['soporte', 'Soporte Técnico General', 'Asistencia técnica general'],
                        ['desarrollo_app', 'Programación de Aplicaciones Personalizadas', 'Desarrollo de software a medida para sus necesidades específicas'],
                        ['desarrollo_web', 'Desarrollo de Entornos Web', 'Creación de páginas web, tiendas online y aplicaciones web']
                    ];

                    const stmt = db.prepare('INSERT INTO servicios (codigo, nombre, descripcion) VALUES (?, ?, ?)');
                    services.forEach(service => {
                        stmt.run(service);
                    });
                    stmt.finalize();
                    console.log('✓ Servicios predeterminados insertados');
                }
            });

            resolve();
        });
    });
};

// Generate unique ticket ID
const generateTicketId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKT-${timestamp}-${random}`;
};

// Create new ticket
const createTicket = (ticketData) => {
    return new Promise((resolve, reject) => {
        const ticketId = generateTicketId();
        const { nombre, email, telefono, servicio, prioridad, descripcion } = ticketData;

        const sql = `
            INSERT INTO tickets (ticket_id, nombre, email, telefono, servicio, prioridad, descripcion)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [ticketId, nombre, email, telefono, servicio, prioridad, descripcion], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    ticketId: ticketId
                });
            }
        });
    });
};

// Get all tickets
const getAllTickets = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM tickets ORDER BY fecha_creacion DESC';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Get ticket by ID
const getTicketById = (ticketId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM tickets WHERE ticket_id = ?';
        db.get(sql, [ticketId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Update ticket status
const updateTicketStatus = (ticketId, estado) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE tickets 
            SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
            WHERE ticket_id = ?
        `;
        db.run(sql, [estado, ticketId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
};

// Get tickets by status
const getTicketsByStatus = (estado) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM tickets WHERE estado = ? ORDER BY fecha_creacion DESC';
        db.all(sql, [estado], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Add note to ticket
const addNoteToTicket = (ticketId, nota, autor) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO notas (ticket_id, nota, autor) VALUES (?, ?, ?)';
        db.run(sql, [ticketId, nota, autor], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
};

// Get notes for ticket
const getTicketNotes = (ticketId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM notas WHERE ticket_id = ? ORDER BY fecha_creacion DESC';
        db.all(sql, [ticketId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Assign technician to ticket
const assignTechnician = (ticketId, tecnico) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE tickets SET tecnico_asignado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE ticket_id = ?';
        db.run(sql, [tecnico, ticketId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
};

// Register WhatsApp contact
const registerWhatsAppContact = (ticketId, telefono, mensaje, enviadoPor) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO whatsapp_contactos (ticket_id, telefono, mensaje, enviado_por) VALUES (?, ?, ?, ?)';
        db.run(sql, [ticketId, telefono, mensaje, enviadoPor], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
};

// Get WhatsApp contacts for ticket
const getWhatsAppContacts = (ticketId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM whatsapp_contactos WHERE ticket_id = ? ORDER BY fecha_contacto DESC';
        db.all(sql, [ticketId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// ==================== USUARIOS ====================

// Get all users
const getAllUsers = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT id, username, nombre_completo, email, rol, activo, fecha_creacion, ultimo_acceso FROM usuarios ORDER BY username';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Get user by username
const getUserByUsername = (username) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM usuarios WHERE username = ?';
        db.get(sql, [username], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Create user
const createUser = (username, passwordHash, nombreCompleto, email, rol = 'tecnico') => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol) VALUES (?, ?, ?, ?, ?)';
        db.run(sql, [username, passwordHash, nombreCompleto, email, rol], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
};

// Update user
const updateUser = (id, data) => {
    return new Promise((resolve, reject) => {
        const fields = [];
        const values = [];
        
        if (data.nombre_completo !== undefined) {
            fields.push('nombre_completo = ?');
            values.push(data.nombre_completo);
        }
        if (data.email !== undefined) {
            fields.push('email = ?');
            values.push(data.email);
        }
        if (data.rol !== undefined) {
            fields.push('rol = ?');
            values.push(data.rol);
        }
        if (data.activo !== undefined) {
            fields.push('activo = ?');
            values.push(data.activo);
        }
        if (data.password_hash !== undefined) {
            fields.push('password_hash = ?');
            values.push(data.password_hash);
        }
        
        if (fields.length === 0) {
            return resolve({ changes: 0 });
        }
        
        values.push(id);
        const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
        
        db.run(sql, values, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
};

// Update last access
const updateUserLastAccess = (username) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE username = ?';
        db.run(sql, [username], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
};

// Delete user
const deleteUser = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM usuarios WHERE id = ?';
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
};

module.exports = {
    db,
    initDatabase,
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicketStatus,
    getTicketsByStatus,
    addNoteToTicket,
    getTicketNotes,
    assignTechnician,
    registerWhatsAppContact,
    getWhatsAppContacts,
    getAllUsers,
    getUserByUsername,
    createUser,
    updateUser,
    updateUserLastAccess,
    deleteUser
};
