<div align="center">

<img src="/assets/images/icon_196x196.png" width="96" alt="Logo do PP">

# PP

Centro de mídia com visual Liquid Glass: você escolhe os addons e o PP organiza filmes, séries e canais
num só lugar, com cores personalizáveis. Dá para entrar com uma conta ou como convidado.

</div>

O PP não hospeda nem fornece conteúdo: tudo o que aparece vem dos addons que cada pessoa instala.

## Rodar no computador

Precisa do [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
npx pnpm@11.8.0 install
npx pnpm@11.8.0 start
```

Abre em `https://localhost:8080`. Para rodar em http (sem certificado), defina `PP_HTTP=1` antes.

| Comando | O que faz |
|---|---|
| `npx pnpm@11.8.0 start` | Servidor de desenvolvimento |
| `npx pnpm@11.8.0 run build` | Versão final, na pasta `build/` |
| `npx pnpm@11.8.0 test` | Testes |
| `npx pnpm@11.8.0 run lint` | Verifica o código |

A pasta `build/` pode ir para qualquer hospedagem de site (Netlify, Vercel, Cloudflare Pages, GitHub
Pages). Quem abrir o link pode instalar o PP como app ("Adicionar à tela de início").

## App Android (APK)

Precisa do [Android Studio](https://developer.android.com/studio) instalado.

```bash
npx pnpm@11.8.0 run android:apk
```

Gera o `PP.apk` na pasta do projeto. Para instalar num aparelho ligado na USB (com a depuração USB ativa):

```bash
adb install -r PP.apk
```

### Versão para a Play Store (AAB)

```bash
npx pnpm@11.8.0 run android:aab
```

Gera o `PP.aab` assinado com a chave de envio, que fica fora do projeto
(`%USERPROFILE%\PP-chave-assinatura\pp-upload.jks`, ou o caminho em `PP_KEYSTORE`). Na primeira vez o
comando cria a chave e pede uma senha; depois só pede a senha. Rode num terminal, porque a senha é digitada
nele. A versão do app (`versionName` e `versionCode`) vem do `version` do `package.json`: aumente-a a cada
envio.

## Ferramentas do PP

| Arquivo | Para que serve |
|---|---|
| `tools/gerar-cores.js` | Gera a paleta de cores personalizáveis (`src/common/pp-colors.less`). Rode de novo se atualizar o `@stremio/stremio-colors`. |
| `src/common/ppLogo.js` | Desenho da logo (SVG), nas cores do tema. |
| `tools/gerar-icones.js` | Gera ícones, favicon e telas de abertura a partir da logo, na cor padrão (azul). Precisa do `sharp`: `npm i --prefix %TEMP%\pp-sharp sharp` e depois `set NODE_PATH=%TEMP%\pp-sharp\node_modules` antes de rodar. |

## Licença

O PP é software livre, distribuído sob a GNU GPL versão 2 ([LICENSE.md](LICENSE.md)), sem nenhuma
garantia. Ele é derivado de um programa sob a mesma licença: Copyright © 2017-2026 Smart Code OOD (os
avisos originais estão nos arquivos). As mudanças do PP estão em [MUDANCAS-PP.md](MUDANCAS-PP.md).

Quem distribuir o PP (site, loja de apps, APK) precisa oferecer o código-fonte completo da versão
distribuída, sob a mesma licença. O link deste repositório aparece no app em Configurações > Código
aberto (`PP_SOURCE_CODE_URL`, em `src/routes/Settings/About/About.tsx`).
