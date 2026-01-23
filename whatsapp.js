const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.qrCode = null;
        this.messageHandlers = [];
        this.isRetrying = false;
        this.retryAttempt = 0;
        this.maxRetries = 5;
        this.lastError = null;
    }

    // Limpiar archivos de bloqueo de Chromium
    cleanChromiumLocks() {
        try {
            const lockFiles = [
                '.wwebjs_auth/SingletonLock',
                '.wwebjs_auth/SingletonSocket',
                '.wwebjs_auth/SingletonCookie'
            ];
            
            lockFiles.forEach(lockFile => {
                const lockPath = path.join(process.cwd(), lockFile);
                if (fs.existsSync(lockPath)) {
                    try {
                        fs.unlinkSync(lockPath);
                        console.log(`🧹 Limpiado lock file: ${lockFile}`);
                    } catch (err) {
                        // Ignorar errores de limpieza
                    }
                }
            });
            
            // También limpiar locks dentro de session folders
            const authPath = path.join(process.cwd(), '.wwebjs_auth');
            if (fs.existsSync(authPath)) {
                const sessions = fs.readdirSync(authPath);
                sessions.forEach(session => {
                    const sessionPath = path.join(authPath, session);
                    if (fs.statSync(sessionPath).isDirectory()) {
                        const sessionLocks = [
                            path.join(sessionPath, 'SingletonLock'),
                            path.join(sessionPath, 'SingletonSocket'),
                            path.join(sessionPath, 'SingletonCookie')
                        ];
                        sessionLocks.forEach(lockPath => {
                            if (fs.existsSync(lockPath)) {
                                try {
                                    fs.unlinkSync(lockPath);
                                } catch (err) {
                                    // Ignorar errores
                                }
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ No se pudo limpiar locks de Chromium:', error.message);
        }
    }

    initialize(retryCount = 0, maxRetries = 2) {
        this.maxRetries = maxRetries;
        this.retryAttempt = retryCount;
        this.isRetrying = retryCount > 0;
        
        // Delay más largo para dar tiempo a que el contenedor viejo se cierre en rolling updates
        // 1er retry: 15s, 2do: 30s
        const delay = retryCount === 0 ? 0 : 15000 * retryCount;
        
        if (retryCount > 0) {
            console.log(`⏳ Reintentando inicialización de WhatsApp en ${delay/1000}s (intento ${retryCount + 1}/${maxRetries + 1})...`);
            setTimeout(() => this._doInitialize(retryCount, maxRetries), delay);
        } else {
            this._doInitialize(retryCount, maxRetries);
        }
    }

    _doInitialize(retryCount, maxRetries) {
        console.log('🔄 Inicializando cliente de WhatsApp...');
        
        this.lastError = null;
        
        // Limpiar archivos de bloqueo antes de iniciar
        this.cleanChromiumLocks();
        
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: '.wwebjs_auth'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-session-crashed-bubble',
                    '--disable-infobars',
                    '--disable-features=site-per-process',
                    '--disable-web-security',
                    '--disable-blink-features=AutomationControlled'
                ]
            }
        });

        // Evento: QR Code generado
        this.client.on('qr', (qr) => {
            this.qrCode = qr;
            console.log('\n📱 Escanea este código QR con WhatsApp:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n💡 Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo\n');
        });

        // Evento: Cliente listo
        this.client.on('ready', () => {
            this.isReady = true;
            this.qrCode = null;
            console.log('✅ WhatsApp Web está listo y conectado');
        });

        // Evento: Autenticación exitosa
        this.client.on('authenticated', () => {
            console.log('✅ Autenticación exitosa con WhatsApp');
        });

        // Evento: Error de autenticación
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Error de autenticación:', msg);
            this.isReady = false;
        });

        // Evento: Cliente desconectado
        this.client.on('disconnected', (reason) => {
            console.log('⚠️ WhatsApp desconectado:', reason);
            this.isReady = false;
            this.qrCode = null;
        });

        // Evento: Mensaje recibido
        this.client.on('message', async (message) => {
            // Ejecutar handlers registrados
            for (const handler of this.messageHandlers) {
                try {
                    await handler(message);
                } catch (error) {
                    console.error('Error en message handler:', error);
                }
            }
        });

        // Inicializar cliente con manejo de errores
        this.client.initialize().catch((error) => {
            console.error('❌ Error al inicializar WhatsApp:', error.message);
            this.lastError = error.message;
            
            // Si es error de profile lock y no hemos superado el máximo de reintentos
            if (error.message.includes('profile appears to be in use') && retryCount < maxRetries) {
                console.log('🔄 Detectado conflicto de perfil de Chromium, reintentando...');
                this.client = null;
                this.initialize(retryCount + 1, maxRetries);
            } else if (retryCount < maxRetries) {
                // Otros errores también reintentar
                console.log('🔄 Error en inicialización, reintentando...');
                this.client = null;
                this.initialize(retryCount + 1, maxRetries);
            } else {
                console.error('❌ Máximo de reintentos alcanzado. WhatsApp no se pudo inicializar.');
                console.log('⚠️ La aplicación continuará funcionando sin WhatsApp.');
                this.isRetrying = false;
            }
        });
    }

    // Registrar un handler para mensajes entrantes
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    // Enviar mensaje de texto
    async sendMessage(phoneNumber, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp no está conectado. Escanee el código QR primero.');
        }

        try {
            // Formatear número (remover caracteres especiales)
            const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
            const chatId = `${formattedNumber}@c.us`;
            
            await this.client.sendMessage(chatId, message);
            
            return {
                success: true,
                message: 'Mensaje enviado correctamente',
                to: phoneNumber,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            throw new Error(`Error al enviar mensaje: ${error.message}`);
        }
    }

    // Obtener todos los chats
    async getChats() {
        if (!this.isReady) {
            throw new Error('WhatsApp no está conectado');
        }

        try {
            const chats = await this.client.getChats();
            
            return chats.map(chat => ({
                id: chat.id._serialized,
                name: chat.name,
                isGroup: chat.isGroup,
                unreadCount: chat.unreadCount,
                timestamp: chat.timestamp,
                lastMessage: chat.lastMessage ? {
                    body: chat.lastMessage.body,
                    timestamp: chat.lastMessage.timestamp,
                    fromMe: chat.lastMessage.fromMe
                } : null
            }));
        } catch (error) {
            console.error('Error al obtener chats:', error);
            throw new Error(`Error al obtener chats: ${error.message}`);
        }
    }

    // Obtener mensajes de un chat específico
    async getChatMessages(chatId, limit = 50) {
        if (!this.isReady) {
            throw new Error('WhatsApp no está conectado');
        }

        try {
            const chat = await this.client.getChatById(chatId);
            const messages = await chat.fetchMessages({ limit });
            
            return messages.map(msg => ({
                id: msg.id._serialized,
                body: msg.body,
                timestamp: msg.timestamp,
                fromMe: msg.fromMe,
                author: msg.author,
                type: msg.type,
                hasMedia: msg.hasMedia
            }));
        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            throw new Error(`Error al obtener mensajes: ${error.message}`);
        }
    }

    // Obtener información de contacto
    async getContactInfo(phoneNumber) {
        if (!this.isReady) {
            throw new Error('WhatsApp no está conectado');
        }

        try {
            const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
            const contactId = `${formattedNumber}@c.us`;
            const contact = await this.client.getContactById(contactId);
            
            return {
                id: contact.id._serialized,
                name: contact.name || contact.pushname,
                number: contact.number,
                isMyContact: contact.isMyContact,
                isWAContact: contact.isWAContact
            };
        } catch (error) {
            console.error('Error al obtener contacto:', error);
            throw new Error(`Error al obtener contacto: ${error.message}`);
        }
    }

    // Verificar estado de conexión
    getStatus() {
        return {
            isReady: this.isReady,
            hasQR: !!this.qrCode,
            qrCode: this.qrCode,
            state: this.client ? this.client.pupPage ? 'connected' : 'initializing' : 'not-initialized',
            isRetrying: this.isRetrying,
            retryAttempt: this.retryAttempt,
            maxRetries: this.maxRetries,
            lastError: this.lastError
        };
    }

    // Cerrar sesión y reinicializar para nuevo QR
    async logout() {
        try {
            console.log('🔄 Cerrando sesión de WhatsApp...');
            
            // Resetear estado PRIMERO para detener cualquier retry en curso
            this.isReady = false;
            this.qrCode = null;
            this.isRetrying = false;
            this.retryAttempt = 0;
            this.lastError = null;
            
            if (this.client) {
                // Destruir cliente actual
                await this.client.destroy();
                this.client = null;
            }
            
            // Esperar 3 segundos para que Chromium libere todos los archivos
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Limpiar archivos de sesión de forma segura
            const authPath = path.join(process.cwd(), '.wwebjs_auth');
            if (fs.existsSync(authPath)) {
                console.log('🧹 Limpiando archivos de sesión...');
                try {
                    // Intentar eliminar recursivamente con múltiples intentos
                    let attempts = 0;
                    const maxAttempts = 5;
                    
                    while (attempts < maxAttempts) {
                        try {
                            fs.rmSync(authPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
                            console.log('✅ Archivos de sesión eliminados');
                            break;
                        } catch (err) {
                            attempts++;
                            if (attempts >= maxAttempts) {
                                console.warn('⚠️ No se pudieron eliminar todos los archivos, pero la sesión fue cerrada');
                            } else {
                                console.log(`⏳ Reintentando eliminación (${attempts}/${maxAttempts})...`);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        }
                    }
                } catch (err) {
                    console.warn('⚠️ Error al limpiar archivos de sesión:', err.message);
                    // Continuar de todos modos - el destroy ya cerró la sesión
                }
            }
            
            console.log('✅ Sesión cerrada completamente');
            
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            // Resetear estado de todos modos
            this.isReady = false;
            this.qrCode = null;
            this.isRetrying = false;
            this.retryAttempt = 0;
            this.lastError = null;
            this.client = null;
            throw error;
        }
    }

    // Destruir cliente
    async destroy() {
        if (this.client) {
            await this.client.destroy();
            this.isReady = false;
            this.qrCode = null;
        }
    }
}

// Singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
