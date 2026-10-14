// PP: gera o APK do Android (projeto em android/, feito com o Capacitor).
// Uso: npx pnpm@11.8.0 run android:apk
// Resultado: PP.apk na pasta do projeto.
// Precisa do Android Studio instalado (Java e SDK do Android).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const isWindows = process.platform === 'win32';

const env = { ...process.env };
// Java e SDK do Android Studio, se não estiverem configurados
if (!env.JAVA_HOME && isWindows) {
    env.JAVA_HOME = 'C:\\Program Files\\Android\\Android Studio\\jbr';
}
if (!env.ANDROID_HOME && isWindows && env.LOCALAPPDATA) {
    env.ANDROID_HOME = path.join(env.LOCALAPPDATA, 'Android', 'Sdk');
}

const run = (command, options = {}) => {
    console.log(`\n> ${command}`);
    // Sem entrada do terminal: alguns comandos ficavam esperando por ela e travavam
    execSync(command, { stdio: ['ignore', 'inherit', 'inherit'], cwd: ROOT, ...options, env: { ...env, ...options.env } });
};

// 1. Versão final do app, sem service worker (os arquivos já vão dentro do APK)
// (com poucos processos de compilação, para caber na memória mesmo com outros programas abertos)
run('npx pnpm@11.8.0 run build', { env: { SERVICE_WORKER_DISABLED: 'true', PP_BUILD_WORKERS: '2' } });
// 2. Copia para o projeto Android
run('npx cap sync android');
// 3. Compila o APK
run(`"${path.join(ANDROID, isWindows ? 'gradlew.bat' : 'gradlew')}" assembleDebug`, { cwd: ANDROID });

const apk = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
fs.copyFileSync(apk, path.join(ROOT, 'PP.apk'));
console.log('\nAPK pronto: PP.apk');
