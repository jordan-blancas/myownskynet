// Debug helper para MyOwnSkynet
console.log('🔍 Debug helper cargado');

// Función para verificar el estado del juego
function debugGame() {
    console.log('=== DEBUG MYOWNSKYNET ===');
    
    // Verificar elementos del DOM
    const elements = {
        canvas: document.getElementById('game'),
        score: document.getElementById('score'),
        credits: document.getElementById('credits'),
        upgradeBtn: document.getElementById('upgradeBtn'),
        panel: document.getElementById('panelUpgrade'),
        btnLeft: document.getElementById('btnLeft'),
        btnShoot: document.getElementById('btnShoot'),
        btnRight: document.getElementById('btnRight'),
        btnRestart: document.getElementById('btnRestart')
    };
    
    console.log('📋 Elementos del DOM:');
    Object.entries(elements).forEach(([name, element]) => {
        console.log(`  ${name}: ${element ? '✅ Encontrado' : '❌ No encontrado'}`);
    });
    
    // Verificar contexto del canvas
    if (elements.canvas) {
        const ctx = elements.canvas.getContext('2d');
        console.log(`🎨 Canvas context: ${ctx ? '✅ Disponible' : '❌ No disponible'}`);
        console.log(`📏 Canvas size: ${elements.canvas.width}x${elements.canvas.height}`);
    }
    
    // Verificar objeto MOS (juego)
    if (window.MOS) {
        console.log('🎮 Objeto MOS encontrado:', window.MOS);
        console.log('📊 Estado del juego:', window.MOS.state);
        console.log('⚡ Mejoras:', window.MOS.upgrades);
    } else {
        console.log('❌ Objeto MOS no encontrado - el juego no se inicializó');
    }
    
    // Verificar localStorage
    const upgrades = localStorage.getItem('mos_upgrades_v2');
    console.log('💾 Mejoras guardadas:', upgrades ? JSON.parse(upgrades) : 'Ninguna');
    
    // Verificar errores en consola
    console.log('🚨 Errores recientes:');
    // Esto se ejecutará después de que el juego se cargue
}

// Ejecutar debug después de que la página cargue
window.addEventListener('load', () => {
    setTimeout(debugGame, 1000);
});

// Función para reiniciar el juego
function resetGame() {
    console.log('🔄 Reiniciando juego...');
    if (window.MOS && window.MOS.resetRound) {
        window.MOS.resetRound();
        console.log('✅ Juego reiniciado');
    } else {
        console.log('❌ No se pudo reiniciar el juego');
    }
}

// Función para aplicar mejoras
function applyUpgrades() {
    console.log('⚡ Aplicando mejoras...');
    if (window.MOS && window.MOS.applyUpgrades) {
        window.MOS.applyUpgrades();
        console.log('✅ Mejoras aplicadas');
    } else {
        console.log('❌ No se pudieron aplicar mejoras');
    }
}

// Exponer funciones de debug globalmente
window.debugSkynet = {
    debug: debugGame,
    reset: resetGame,
    applyUpgrades: applyUpgrades
};

console.log('💡 Usa debugSkynet.debug() para verificar el estado del juego'); 