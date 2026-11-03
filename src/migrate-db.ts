import {initializeDatabase} from './db.js';
try {await initializeDatabase();console.log('Base de datos preparada.');} catch {console.error('No se pudo preparar la base de datos. Revisa la conexión, los permisos y la configuración.');process.exitCode=1;}
