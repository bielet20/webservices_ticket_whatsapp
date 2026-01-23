#!/usr/bin/env node

/**
 * Script para actualizar el password del usuario admin
 * Uso: node update-admin-password.js
 */

const bcrypt = require('bcryptjs');
const { 
    initDatabase, 
    getUserByUsername, 
    createUser, 
    updateUser 
} = require('./database');

const NEW_PASSWORD = 'Root_2026';
const ADMIN_USERNAME = 'admin';

async function updateAdminPassword() {
    try {
        console.log('🔄 Inicializando base de datos...');
        await initDatabase();
        
        console.log(`🔍 Buscando usuario "${ADMIN_USERNAME}"...`);
        const existingUser = await getUserByUsername(ADMIN_USERNAME);
        
        // Hash del nuevo password
        const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
        
        if (existingUser) {
            console.log(`✏️ Actualizando password del usuario "${ADMIN_USERNAME}"...`);
            await updateUser(existingUser.id, {
                password_hash: passwordHash,
                nombre_completo: existingUser.nombre_completo,
                email: existingUser.email,
                rol: 'admin',
                activo: 1
            });
            console.log('✅ Password actualizado exitosamente');
        } else {
            console.log(`➕ Creando usuario "${ADMIN_USERNAME}"...`);
            await createUser(
                ADMIN_USERNAME,
                passwordHash,
                'Administrador',
                'admin@servicios.local',
                'admin'
            );
            console.log('✅ Usuario admin creado exitosamente');
        }
        
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('   CREDENCIALES DE ACCESO');
        console.log('═══════════════════════════════════════');
        console.log(`   Usuario:   ${ADMIN_USERNAME}`);
        console.log(`   Password:  ${NEW_PASSWORD}`);
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateAdminPassword();
