const bcryptjs = require('bcryptjs');
const { db, getAllUsers, getUserByUsername, updateUser, createUser } = require('./database');

async function setupProduction() {
    try {
        console.log('🔒 Iniciando configuración de producción...\n');

        // 1. Cambiar contraseña del admin a Root_2026
        console.log('1️⃣ Actualizando contraseña del usuario admin...');
        const adminPassword = 'Root_2026';
        const adminHash = await bcryptjs.hash(adminPassword, 10);
        
        const adminUser = await getUserByUsername('admin');
        if (adminUser) {
            await updateUser(adminUser.id, { password_hash: adminHash });
            console.log('   ✅ Contraseña del admin actualizada a: Root_2026');
        } else {
            console.log('   ⚠️ Usuario admin no encontrado');
        }

        // 2. Crear usuario Root con contraseña Root_Root2026
        console.log('\n2️⃣ Creando usuario Root...');
        const rootPassword = 'Root_Root2026';
        const rootHash = await bcryptjs.hash(rootPassword, 10);
        
        const existingRoot = await getUserByUsername('Root');
        if (existingRoot) {
            console.log('   ⚠️ Usuario Root ya existe. Actualizando contraseña...');
            await updateUser(existingRoot.id, { password_hash: rootHash });
            console.log('   ✅ Contraseña del usuario Root actualizada');
        } else {
            const newRoot = await createUser(
                'Root',
                rootHash,
                'Root Administrator',
                'root@admin.local',
                'admin'
            );
            console.log('   ✅ Usuario Root creado exitosamente');
            console.log(`   ID: ${newRoot.id}`);
        }

        console.log('\n🔐 Credenciales de producción:');
        console.log('   Usuario: admin');
        console.log('   Contraseña: Root_2026');
        console.log('');
        console.log('   Usuario: Root');
        console.log('   Contraseña: Root_Root2026');
        console.log('\n✅ Configuración de producción completada');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la configuración:', error);
        process.exit(1);
    }
}

setupProduction();
