#!/usr/bin/env node
/**
 * Script de despliegue para esquemas de BD de PLAYTEST
 * Aplica esquemas de roles y comunicación de forma segura
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

class SchemaDeployer {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    async executeSchemaFile(filePath, description) {
        try {
            console.log(`\n🚀 Ejecutando: ${description}`);
            console.log(`📁 Archivo: ${filePath}`);
            
            const schema = await fs.readFile(filePath, 'utf8');
            
            // Dividir en statements individuales (separados por ';')
            const statements = schema
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
            console.log(`📊 Ejecutando ${statements.length} statements...`);
            
            const client = await this.pool.connect();
            
            try {
                await client.query('BEGIN');
                
                for (let i = 0; i < statements.length; i++) {
                    const stmt = statements[i];
                    if (stmt.length === 0) continue;
                    
                    try {
                        await client.query(stmt + ';');
                        process.stdout.write(`\r✅ Progreso: ${i + 1}/${statements.length} statements ejecutados`);
                    } catch (error) {
                        // Ignorar errores de elementos que ya existen
                        if (error.code === '42P07' || // relation already exists
                            error.code === '42723' || // function already exists  
                            error.code === '42P06' || // schema already exists
                            error.code === '42710') { // object already exists
                            process.stdout.write(`\r⚠️  Progreso: ${i + 1}/${statements.length} statements (${error.code} ignorado)`);
                            continue;
                        }
                        throw error;
                    }
                }
                
                await client.query('COMMIT');
                console.log(`\n✅ ${description} completado exitosamente`);
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error(`\n❌ Error ejecutando ${description}:`);
            console.error(error.message);
            throw error;
        }
    }

    async verifyDeployment() {
        console.log('\n🔍 Verificando despliegue...');
        
        const checks = [
            {
                name: 'Tabla roles',
                query: "SELECT COUNT(*) as count FROM roles"
            },
            {
                name: 'Tabla ticket_categories', 
                query: "SELECT COUNT(*) as count FROM ticket_categories"
            },
            {
                name: 'Vista user_complete_info',
                query: "SELECT COUNT(*) as count FROM user_complete_info LIMIT 1"
            },
            {
                name: 'Vista ticket_complete_info',
                query: "SELECT COUNT(*) as count FROM ticket_complete_info LIMIT 1"
            }
        ];
        
        for (const check of checks) {
            try {
                const result = await this.pool.query(check.query);
                console.log(`✅ ${check.name}: ${result.rows[0].count} registros`);
            } catch (error) {
                console.log(`❌ ${check.name}: Error - ${error.message}`);
            }
        }
    }

    async createDirectories() {
        const directories = [
            path.join(__dirname, 'playtest-backend', 'uploads'),
            path.join(__dirname, 'playtest-backend', 'uploads', 'tickets')
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ Directorio creado: ${dir}`);
            } catch (error) {
                console.log(`⚠️  Directorio ya existe: ${dir}`);
            }
        }
    }

    async run() {
        console.log('🚀 PLAYTEST - Despliegue de Esquemas de Base de Datos');
        console.log('=' .repeat(60));
        
        try {
            // Verificar conexión
            console.log('🔗 Verificando conexión a base de datos...');
            const versionResult = await this.pool.query('SELECT version()');
            console.log(`✅ Conectado a: ${versionResult.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
            
            // Crear directorios necesarios
            console.log('\n📁 Creando directorios necesarios...');
            await this.createDirectories();
            
            // Aplicar esquema de roles
            const rolesSchemaPath = path.join(__dirname, 'database-schema-roles.sql');
            await this.executeSchemaFile(rolesSchemaPath, 'Esquema de Sistema de Roles');
            
            // Aplicar esquema de comunicación
            const commSchemaPath = path.join(__dirname, 'database-schema-communication.sql');
            await this.executeSchemaFile(commSchemaPath, 'Esquema de Sistema de Comunicación');
            
            // Verificar despliegue
            await this.verifyDeployment();
            
            console.log('\n🎉 ¡Despliegue completado exitosamente!');
            console.log('\n📋 Próximos pasos:');
            console.log('   1. Reiniciar el servidor: npm start');
            console.log('   2. Registrar usuario "AdminPrincipal" para rol principal');
            console.log('   3. Incluir navigation-service.js en páginas frontend');
            console.log('   4. Probar funcionalidades desde formulario de soporte');
            
        } catch (error) {
            console.error('\n💥 Error en el despliegue:');
            console.error(error.message);
            process.exit(1);
        } finally {
            await this.pool.end();
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const deployer = new SchemaDeployer();
    deployer.run();
}

module.exports = SchemaDeployer;