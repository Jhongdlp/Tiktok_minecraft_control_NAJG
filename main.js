const { WebcastPushConnection } = require('tiktok-live-connector');
const readline = require('readline-sync');
const fs = require('fs');
const path = require('path');  // Agregado para que funcione path
// Archivos de configuración
const condicionesPath = './condiciones.json';
const credencialesMinecraftPath = path.join(__dirname, 'credencialesMinecraft.json');

// Variables globales
let tiktokUsername = 'elnixjo_';
let tiktok = null;
let totalLikes = 0;
let likeList = [];
let sharesList = [];
let followersList = [];
let giftsList = [];
let ultimoEvento = Date.now();
let monitorInterval = null;
const INTERVALO_REVISION = 10000; // 10 segundos

if (!fs.existsSync(credencialesMinecraftPath)) {
    fs.writeFileSync(credencialesMinecraftPath, JSON.stringify({
        ip: '',
        puerto: '',
        contrasena: ''
    }, null, 2));
}

function cargarCredencialesMinecraft() {
    return JSON.parse(fs.readFileSync(credencialesMinecraftPath));
}

function guardarCredencialesMinecraft(data) {
    fs.writeFileSync(credencialesMinecraftPath, JSON.stringify(data, null, 2));
} 
// Crear condiciones.json si no existe
if (!fs.existsSync(condicionesPath)) {
    fs.writeFileSync(condicionesPath, JSON.stringify({
        likes: [],
        shares: [],
        follows: [],
        gifts: [],
        username: 'elnixjo_' // Nombre de usuario por defecto
    }, null, 2));
}

function cargarCondiciones() {
    return JSON.parse(fs.readFileSync(condicionesPath));
}

function guardarCondiciones(data) {
    fs.writeFileSync(condicionesPath, JSON.stringify(data, null, 2));
}
// Obtener nombre de usuario desde el archivo JSON
function obtenerUsername() {
    const condiciones = cargarCondiciones();
    return condiciones.username || 'elnixjo_'; // Devuelve el valor por defecto si no está configurado
}
// Menú principal
function showMenu() {
    console.clear();
    console.log('======= Menú de TikTok Scraper =======');
    console.log(`1. Usuario de TikTok actual: (${tiktokUsername})`);
    console.log('2. Cambiar usuario de TikTok');
    console.log('3. Iniciar lectura del live');
    console.log('4. Configurar condiciones de regalos');
    console.log('5. Credenciales servidor Minecraft');
    console.log('6. Salir');
    const option = readline.question('\nSelecciona una opción: ');
    return option;
}

// Ejecutar aplicación
function runApp() {
    tiktokUsername = obtenerUsername();  // Cargar el nombre de usuario al iniciar

    const option = showMenu();
    switch (option) {
        case '1':
            console.log(`👤 Usuario actual: (${tiktokUsername})`);
            readline.question('\nPresiona Enter para continuar...');
            runApp();
            break;
        case '2':
            const newUser = readline.question('🔄 Ingresa nuevo usuario de TikTok: @');
            if (newUser.trim() !== '') {
                tiktokUsername = newUser.trim();
                console.log(`✅ Usuario actualizado a: @${tiktokUsername}`);
                
                // Guardar el nuevo usuario en el archivo JSON
                const condiciones = cargarCondiciones();
                condiciones.username = tiktokUsername;  // Actualizar el nombre de usuario
                guardarCondiciones(condiciones);
            }
            readline.question('\nPresiona Enter para continuar...');
            runApp();
            break;
        case '3':
            startLive();
            break;
        case '4':
            menuCondiciones();
            break;
        case '5':
            menuCredencialesMinecraft();
            break;
        case '6':
            console.log('👋 Hasta luego!');
            process.exit();
            break;
        default:
            console.log('❌ Opción no válida');
            readline.question('\nPresiona Enter para continuar...');
            runApp();
    }
}

async function startLive() {
    console.clear();
    console.log(`⏳ Intentando conectar al live de @${tiktokUsername}...`);

    tiktok = new WebcastPushConnection(tiktokUsername);

    giftsList = [];
    totalLikes = 0;
    ultimoEvento = Date.now(); // 🕒 Marca el inicio
    let monitorInterval = null;
    const INTERVALO_REVISION = 10000; // 10 segundos

    function marcarEvento() {
        ultimoEvento = Date.now();
    }

    // Suscripción a eventos
    tiktok.on('like', data => {
        marcarEvento();
        totalLikes += data.likeCount;
        console.log(`❤️ ${data.uniqueId} dio like (total likes: ${totalLikes})`);
    });

    tiktok.on('share', data => {
        marcarEvento();
        console.log(`📤 ${data.uniqueId} compartió el live`);
    });

    tiktok.on('follow', data => {
        marcarEvento();
        console.log(`👤 ${data.uniqueId} siguió al streamer`);
    });

    tiktok.on('gift', data => {
        marcarEvento();
        console.log(`🎁 ${data.uniqueId} envió un regalo: ${data.giftName}`);
    });

    try {
        await tiktok.connect();
        console.log(`✅ Conectado al live de @${tiktokUsername}`);

        // 🕵️ Monitorear si hay inactividad de eventos
        monitorInterval = setInterval(() => {
            const ahora = Date.now();
            const segundosSinEventos = Math.floor((ahora - ultimoEvento) / 1000);

            if (segundosSinEventos >= 10) {
                console.log(`⚠️ No se han recibido eventos en los últimos ${segundosSinEventos} segundos.`);
                console.log('👉 TikTok podría estar limitando los eventos o no hay interacción visible.');
            }
        }, INTERVALO_REVISION);

        console.log(`\n🛑 Presiona cualquier tecla para detener y volver al menú...\n`);

        await waitForAnyKey();

        await tiktok.disconnect();
        clearInterval(monitorInterval); // 🛑 Detener monitoreo

        runApp();

    } catch (error) {
        console.log('❌ Error al conectar al live:', error);
        runApp();
    }
}


function menuCredencialesMinecraft() {
    console.clear();
    console.log('======= Configurar Credenciales Minecraft =======');
    const credenciales = cargarCredencialesMinecraft();

    // Mostrar credenciales actuales
    console.log(`IP actual: ${credenciales.ip}`);
    console.log(`Puerto actual: ${credenciales.puerto}`);
    console.log(`Contraseña actual: ${credenciales.contrasena}`);

    console.log('\n1. Agregar nuevas credenciales.');
    console.log('2. Volver al menú anterior.');

    const opcion = readline.question('\nSelecciona una opción: ');

    switch (opcion) {
        case '1':
            // Solicitar nuevas credenciales
            const nuevaIp = readline.question('Nueva IP del servidor (deja vacío para mantener la actual): ');
            const nuevoPuerto = readline.question('Nuevo Puerto (deja vacío para mantener el actual): ');
            const nuevaContrasena = readline.question('Nueva Contraseña (deja vacío para mantener la actual): ');

            if (nuevaIp.trim() !== '') {
                credenciales.ip = nuevaIp.trim();
            }
            if (nuevoPuerto.trim() !== '') {
                credenciales.puerto = nuevoPuerto.trim();
            }
            if (nuevaContrasena.trim() !== '') {
                credenciales.contrasena = nuevaContrasena.trim();
            }

            guardarCredencialesMinecraft(credenciales);
            console.log('✅ Credenciales de Minecraft actualizadas.');
            readline.question('\nPresiona Enter para continuar...');
            runApp();
            break;

        case '2':
            // Volver al menú anterior
            runApp();
            break;

        default:
            console.log('❌ Opción no válida');
            readline.question('\nPresiona Enter para continuar...');
            menuCredencialesMinecraft();
    }
}



function menuCondiciones() {
    console.clear();
    console.log('======= Menú de Condiciones de Regalos =======');
    console.log('1. Agregar condición de Likes');
    console.log('2. Agregar condición de Shares');
    console.log('3. Agregar condición de Follows');
    console.log('4. Agregar condición de Gifts');
    console.log('5. Ver condiciones guardadas');
    console.log('6. Eliminar una condición');
    console.log('7. Volver al menú principal');

    const option = readline.question('\nSelecciona una opción: ');
    const condiciones = cargarCondiciones();

    switch (option) {
        case '1': {
            const cantLikes = readline.question('¿Cuántos likes deben recibirse? (Enter para cancelar): ');
            if (cantLikes === '') return menuCondiciones();
            const comandoLikes = readline.question('Comando de Minecraft a ejecutar (Enter para cancelar): ');
            if (comandoLikes === '') return menuCondiciones();
            
            // Mostrar resumen antes de guardar
            console.log('\n📝 Resumen de condición a guardar:');
            console.log(`- Cantidad de likes requeridos: ${cantLikes}`);
            console.log(`- Comando a ejecutar: ${comandoLikes}`);
            const confirmar = readline.question('\n¿Deseas guardar esta condición? (s/n): ');
            
            if (confirmar.toLowerCase() === 's') {
                condiciones.likes.push({ cantidad: parseInt(cantLikes), comando: comandoLikes });
                guardarCondiciones(condiciones);
                console.log('✅ Condición para likes guardada.');
            } else {
                console.log('❌ Condición cancelada.');
            }
            
        }

        case '2': {
            const cantShares = readline.question('¿Cuántos shares deben recibirse? (Enter para cancelar): ');
            if (cantShares === '') return menuCondiciones();
            const comandoShares = readline.question('Comando de Minecraft a ejecutar (Enter para cancelar): ');
            if (comandoShares === '') return menuCondiciones();

            console.log('\n📝 Resumen de condición a guardar:');
            console.log(`- Tipo: Shares`);
            console.log(`- Cantidad requerida: ${cantShares}`);
            console.log(`- Comando: ${comandoShares}`);
            const confirmar = readline.question('\n¿Deseas guardar esta condición? (s/n): ');
            if (confirmar.toLowerCase() === 's') {
                condiciones.shares.push({ cantidad: parseInt(cantShares), comando: comandoShares });
                guardarCondiciones(condiciones);
                console.log('✅ Condición para shares guardada.');
            } else {
                console.log('❌ Condición cancelada.');
            }
            break;
        }

        case '3': {
            const cantFollows = readline.question('¿Cuántos follows deben recibirse? (Enter para cancelar): ');
            if (cantFollows === '') return menuCondiciones();
            const comandoFollows = readline.question('Comando de Minecraft a ejecutar (Enter para cancelar): ');
            if (comandoFollows === '') return menuCondiciones();

            console.log('\n📝 Resumen de condición a guardar:');
            console.log(`- Tipo: Follows`);
            console.log(`- Cantidad requerida: ${cantFollows}`);
            console.log(`- Comando: ${comandoFollows}`);
            const confirmar = readline.question('\n¿Deseas guardar esta condición? (s/n): ');
            if (confirmar.toLowerCase() === 's') {
                condiciones.follows.push({ cantidad: parseInt(cantFollows), comando: comandoFollows });
                guardarCondiciones(condiciones);
                console.log('✅ Condición para follows guardada.');
            } else {
                console.log('❌ Condición cancelada.');
            }
            break;
        }

        case '4': {
            const cantidadGift = readline.question('¿Cada cuántos regalos se ejecuta un comando? (Enter para cancelar): ');
            if (cantidadGift === '') return menuCondiciones();
            const comandoGift = readline.question('Comando de Minecraft a ejecutar (Enter para cancelar): ');
            if (comandoGift === '') return menuCondiciones();

            console.log('\n📝 Resumen de condición a guardar:');
            console.log(`- Tipo: Gifts`);
            console.log(`- Cantidad requerida: ${cantidadGift}`);
            console.log(`- Comando: ${comandoGift}`);
            const confirmar = readline.question('\n¿Deseas guardar esta condición? (s/n): ');
            if (confirmar.toLowerCase() === 's') {
                condiciones.gifts.push({ cantidad: parseInt(cantidadGift), comando: comandoGift });
                guardarCondiciones(condiciones);
                console.log('✅ Condición para gifts guardada.');
            } else {
                console.log('❌ Condición cancelada.');
            }
            break;
        }

        case '5': {
            console.log('\n======= Condiciones Guardadas =======');
            console.log('\n❤️ Likes:');
            condiciones.likes.forEach((item, i) => {
                console.log(` ${i + 1}. ${item.cantidad} likes → "${item.comando}"`);
            });

            console.log('\n🔗 Shares:');
            condiciones.shares.forEach((item, i) => {
                console.log(` ${i + 1}. ${item.cantidad} shares → "${item.comando}"`);
            });

            console.log('\n➕ Follows:');
            condiciones.follows.forEach((item, i) => {
                console.log(` ${i + 1}. ${item.cantidad} follows → "${item.comando}"`);
            });

            console.log('\n🎁 Gifts:');
            condiciones.gifts.forEach((item, i) => {
                console.log(` ${i + 1}. ID ${item.giftId}, cantidad ${item.cantidad} → "${item.comando}"`);
            });

            readline.question('\nPresiona Enter para continuar...');
            return menuCondiciones();
        }

        case '6': {
            console.log('\n======= Eliminar Condición =======');
            console.log('1. Likes');
            console.log('2. Shares');
            console.log('3. Follows');
            console.log('4. Gifts');
            console.log('5. Volver');
        
            const tipo = readline.question('Selecciona el tipo de condición a eliminar: ');
            let tipoCond = '';
            switch (tipo) {
                case '1': tipoCond = 'likes'; break;
                case '2': tipoCond = 'shares'; break;
                case '3': tipoCond = 'follows'; break;
                case '4': tipoCond = 'gifts'; break;
                case '5': return menuCondiciones();
                default:
                    console.log('❌ Tipo inválido.');
                    readline.question('\nPresiona Enter para continuar...');
                    return menuCondiciones();
            }
        
            const lista = condiciones[tipoCond];
            if (!lista.length) {
                console.log(`⚠️ No hay condiciones en ${tipoCond}.`);
                readline.question('\nPresiona Enter para continuar...');
                return menuCondiciones();
            }
        
            console.log(`\n${tipoCond.toUpperCase()} guardados:`);
            lista.forEach((item, i) => {
                if (tipoCond === 'gifts') {
                    console.log(`${i + 1}. ID ${item.giftId}, cantidad ${item.cantidad} → "${item.comando}"`);
                } else {
                    console.log(`${i + 1}. ${item.cantidad} → "${item.comando}"`);
                }
            });
        
            console.log('\nOpciones:');
            console.log('a. Eliminar uno por número');
            console.log('b. Eliminar TODOS');
            const eliminarOpcion = readline.question('Selecciona una opción (a/b): ');
        
            if (eliminarOpcion === 'a') {
                const index = parseInt(readline.question('\nIngresa el número de la condición a eliminar (Enter para cancelar): '));
                if (isNaN(index) || index < 1 || index > lista.length) {
                    console.log('❌ Cancelado o número inválido.');
                } else {
                    lista.splice(index - 1, 1);
                    guardarCondiciones(condiciones);
                    console.log('✅ Condición eliminada.');
                }
            } else if (eliminarOpcion === 'b') {
                const confirmar = readline.question(`⚠️ ¿Estás seguro que quieres eliminar TODAS las condiciones de "${tipoCond}"? (s/n): `);
                if (confirmar.toLowerCase() === 's') {
                    condiciones[tipoCond] = [];
                    guardarCondiciones(condiciones);
                    console.log(`✅ Todas las condiciones de ${tipoCond} han sido eliminadas.`);
                } else {
                    console.log('❌ Cancelado.');
                }
            } else {
                console.log('❌ Opción inválida.');
            }
        
            readline.question('\nPresiona Enter para continuar...');
            return menuCondiciones();
        }

        case '7':
            return runApp();

        default:
            console.log('❌ Opción no válida');
            readline.question('\nPresiona Enter para continuar...');
            return menuCondiciones();
    }
}

function waitForAnyKey() {
    return new Promise(resolve => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve();
        });
    });
}

runApp();
