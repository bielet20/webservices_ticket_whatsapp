#!/usr/bin/env node

/**
 * Script para crear usuarios en la base de datos
 * Uso: node create-user.js <username> <password> [nombre_completo] [email] [rol]
 */

const bcrypt = require('bcryptjs');
const { createUser, getUserByUsername, initDatabase } = require('./database');

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('❌ Uso: node create-user.js <username> <password> [nombre_completo] [email] [rol]');
        console.log('');
        console.log('Ejemplos:');
        console.log('  node create-user.js admin Admin123! "Administrador" admin@example.com admin');
        console.log('  node create-user.js tecnico1 Pass123! "Juan Pérez" juan@example.com tecnico');
        console.log('');
        console.log('Roles disponibles: admin, tecnico');
        process.exit(1);
    }
    
    const [username, password, nombreCompleto, email, rol] = args;
    
    try {
        // Inicializar BD
        await initDatabase();
        
        // Verificar si el usuario ya existe
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            console.log(`❌ Error: El usuario '${username}' ya existe`);
            process.exit(1);
        }
        
        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Crear usuario
        const result = await createUser(
            username, 
            passwordHash, 
            nombreCompleto || username, 
            email || '', 
            rol || 'tecnico'
        );
        
        console.log('✅ Usuario creado exitosamente');
        console.log('');
        console.log('Detalles:');
        console.log(`  ID: ${result.id}`);
        console.log(`  Usuario: ${username}`);
        console.log(`  Nombre: ${nombreCompleto || username}`);
        console.log(`  Email: ${email || '(no especificado)'}`);
        console.log(`  Rol: ${rol || 'tecnico'}`);
        console.log('');
        console.log('Ahora puedes iniciar sesión con estas credenciales.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creando usuario:', error.message);
        process.exit(1);
    }
}

main();
