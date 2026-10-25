// PP: exporta o certificado PÚBLICO da chave de envio (upload key) para um arquivo .pem.
// É o arquivo que a Play Console pede para "Solicitar redefinição" da chave de envio.
// Uso, num terminal (ele pede a senha da chave): node tools/exportar-certificado.js
// O .pem só tem a parte pública: pode ser enviado à Google. A chave (.jks) e a senha nunca saem do computador.

const path = require('path');
const { execFileSync } = require('child_process');

const isWindows = process.platform === 'win32';
const env = { ...process.env };
if (!env.JAVA_HOME && isWindows) {
    env.JAVA_HOME = 'C:\\Program Files\\Android\\Android Studio\\jbr';
}

const KEYSTORE = env.PP_KEYSTORE || path.join(env.USERPROFILE || env.HOME, 'PP-chave-assinatura', 'pp-upload.jks');
const OUTPUT = path.join(path.dirname(KEYSTORE), 'upload_certificate.pem');
const keytool = path.join(env.JAVA_HOME, 'bin', isWindows ? 'keytool.exe' : 'keytool');

console.log(`\nExportando o certificado público de ${KEYSTORE}`);
console.log('Quando pedir a senha da chave de envio, digite e aperte Enter (ela não aparece na tela).\n');
execFileSync(keytool, ['-exportcert', '-rfc', '-alias', 'upload', '-keystore', KEYSTORE, '-file', OUTPUT], { stdio: 'inherit', env });
console.log(`\nPronto: ${OUTPUT}`);
