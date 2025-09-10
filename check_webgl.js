// Проверка поддержки WebGL в браузере
function checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    
    // Проверяем WebGL
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
        console.log('WebGL поддерживается');
        console.log('Версия WebGL:', gl.getParameter(gl.VERSION));
        console.log('Поставщик:', gl.getParameter(gl.VENDOR));
        console.log('Рендерер:', gl.getParameter(gl.RENDERER));
        
        // Проверяем максимальный размер текстуры
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        console.log('Максимальный размер текстуры:', maxTextureSize);
        
        // Проверяем поддержку float текстур
        const textureFloat = gl.getExtension('OES_texture_float');
        console.log('Поддержка float текстур:', !!textureFloat);
        
        return {
            supported: true,
            version: gl.getParameter(gl.VERSION),
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            maxTextureSize: maxTextureSize,
            floatTextures: !!textureFloat
        };
    } else {
        console.log('WebGL НЕ поддерживается');
        return {
            supported: false
        };
    }
}

// Проверяем поддержку WebGL2
function checkWebGL2Support() {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    
    if (gl2) {
        console.log('WebGL 2 поддерживается');
        console.log('Версия WebGL 2:', gl2.getParameter(gl2.VERSION));
        return {
            supported: true,
            version: gl2.getParameter(gl2.VERSION)
        };
    } else {
        console.log('WebGL 2 НЕ поддерживается');
        return {
            supported: false
        };
    }
}

console.log('=== Проверка WebGL поддержки ===');
const webgl = checkWebGLSupport();
const webgl2 = checkWebGL2Support();

console.log('\n=== Результаты ===');
console.log('WebGL:', webgl.supported ? 'Поддерживается' : 'Не поддерживается');
if (webgl.supported) {
    console.log('  Версия:', webgl.version);
    console.log('  Максимальный размер текстуры:', webgl.maxTextureSize);
}

console.log('WebGL 2:', webgl2.supported ? 'Поддерживается' : 'Не поддерживается');
if (webgl2.supported) {
    console.log('  Версия:', webgl2.version);
}