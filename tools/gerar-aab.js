// PP: gera o PP.aab assinado, o arquivo que vai para a Play Store.
// Uso, num terminal (ele pede a senha da chave): npx pnpm@11.8.0 run android:aab
// Precisa do Android Studio instalado (Java e SDK do Android).
//
// A chave de envio (upload key) fica FORA do projeto, para nunca ir para o GitHub:
// %USERPROFILE%\PP-chave-assinatura\pp-upload.jks (ou o caminho em PP_KEYSTORE).
// Na primeira vez o script cria a chave e pede uma senha nova. Guarde uma cópia do arquivo da chave e
// a senha num lugar seguro: as atualizações do app na Play Store precisam ser assinadas com ela.

const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

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

const KEYSTORE = env.PP_KEYSTORE || path.join(env.USERPROFILE || env.HOME, 'PP-chave-assinatura', 'pp-upload.jks');
const ALIAS = 'upload';
const javaTool = (name) => path.join(env.JAVA_HOME, 'bin', isWindows ? `${name}.exe` : name);

const run = (command, options = {}) => {
    console.log(`\n> ${command}`);
    // Sem entrada do terminal: alguns comandos ficavam esperando por ela e travavam
    execSync(command, { stdio: ['ignore', 'inherit', 'inherit'], cwd: ROOT, ...options, env: { ...env, ...options.env } });
};
// Comandos que pedem a senha: a pessoa digita direto no terminal
const ask = (file, args) => {
    execFileSync(file, args, { stdio: 'inherit', env });
};

// 1. Versão final do app, sem service worker (os arquivos já vão dentro do app)
run('npx pnpm@11.8.0 run build', { env: { SERVICE_WORKER_DISABLED: 'true', PP_BUILD_WORKERS: '2' } });
// 2. Copia para o projeto Android
run('npx cap sync android');
// 3. Gera o .aab de lançamento (ainda sem assinatura)
run(`"${path.join(ANDROID, isWindows ? 'gradlew.bat' : 'gradlew')}" bundleRelease`, { cwd: ANDROID });

const output = path.join(ROOT, 'PP.aab');
fs.copyFileSync(path.join(ANDROID, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'), output);

// 4. Cria a chave de envio na primeira vez
if (!fs.existsSync(KEYSTORE)) {
    fs.mkdirSync(path.dirname(KEYSTORE), { recursive: true });
    console.log(`\nCriando a chave de envio em ${KEYSTORE}`);
    console.log('Escolha uma senha (pelo menos 6 caracteres) e anote num lugar seguro. Ela não aparece enquanto você digita.\n');
    ask(javaTool('keytool'), [
        '-genkeypair', '-v',
        '-keystore', KEYSTORE,
        '-storetype', 'PKCS12',
        '-alias', ALIAS,
        '-keyalg', 'RSA', '-keysize', '4096',
        '-validity', '10000',
        '-dname', 'CN=raupebr, O=PP, C=BR',
    ]);
}

// 5. Assina o .aab com a chave de envio
console.log('\nAssinando o PP.aab. Digite a senha da chave de envio (ela não aparece enquanto você digita).\n');
ask(javaTool('jarsigner'), [
    '-keystore', KEYSTORE,
    '-sigalg', 'SHA256withRSA',
    '-digestalg', 'SHA-256',
    output,
    ALIAS,
]);
execFileSync(javaTool('jarsigner'), ['-verify', output], { stdio: 'inherit', env });

console.log('\nPronto: PP.aab assinado, na pasta do projeto. É esse arquivo que vai para a Play Store.');
console.log(`Guarde uma cópia da chave (${KEYSTORE}) e da senha.`);
