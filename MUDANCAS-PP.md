# Mudanças do PP em relação ao Stremio Web

O PP é uma versão modificada do [Stremio Web](https://github.com/Stremio/stremio-web)
(versão `v5.0.0-beta.42`), © 2017-2026 Smart Code OOD, distribuído sob a licença GNU GPL versão 2
(arquivo [LICENSE.md](LICENSE.md)). O PP continua sob a mesma licença.

Como pede a seção 2(a) da GPL, este arquivo registra o que foi alterado e quando.
Nos arquivos de código, os trechos alterados estão marcados com comentários `PP:`.

## 12/10/2026: primeira versão do PP

### Nome e marca
- O app se chama PP: título, manifesto, `package.json` e textos da interface
  (`src/index.js` troca "Stremio" por "PP" nas traduções). Continuam com o nome Stremio o que é
  do Stremio de verdade: o servidor de streaming (Stremio Service) e os addons oficiais deles.
- Logo nova (duas letras P de vidro com um botão de play), desenhada em `src/common/ppLogo.js`.
  Dentro do app (`src/components/PPLogo`) e no ícone da aba do navegador ela muda de cor junto com o
  tema; `tools/gerar-icones.js` gera ícones, favicon, `assets/images/pp_symbol.png` e telas de
  abertura na cor padrão (azul).
- Removidas as imagens de marca do Stremio (`stremio_symbol.png`, `logo.png`, capturas de tela do
  manifesto) e as janelas de novidades e promoções do Stremio na tela inicial.
- Removido o aviso "O servidor de Streaming não está disponível" da tela inicial
  (`src/routes/Board/StreamingServerWarning`).

### Login (conta Stremio)
- Como no Stremio: sem conta, o app abre na tela de entrar até a pessoa entrar (e-mail, Facebook ou
  Apple) ou escolher "Entrar como convidado"; ao sair da conta volta para essa tela
  (`src/router/Routes.tsx`, `src/common/ppGuest.ts`). A conta é do Stremio e sincroniza addons e biblioteca.
- Tela de entrar com a logo do PP, aviso de que a conta e os dados ficam no Stremio e visual de vidro
  (`src/routes/Intro`). Os textos de termos, privacidade e marketing continuam citando o Stremio.
- 13/10/2026: tela de entrar redesenhada e animada. Fundo com luzes, uma parede de cartazes desenhados
  em CSS (sem imagens de filmes) deslizando e partículas de luz (`src/routes/Intro/IntroBackground`);
  logo com brilho e reflexo, título com brilho passando, itens entrando em sequência; abas "Entrar" /
  "Criar conta" com pílula deslizante (sem a animação de troca de tela); campos com ícone, nome que sobe
  ao digitar e botão de mostrar a senha; Facebook e Apple lado a lado; "Entrar como convidado" nas duas
  abas (na aba "Entrar" leva para "Criar conta", onde ficam os termos). No celular e no tablet o teclado
  não abre sozinho. Quem pede menos movimento no aparelho vê a tela sem animações.
- Menu ⋯ e Configurações > Geral com a conta (entrar/sair, Trakt, exportar dados, assinar calendário,
  trocar senha, excluir conta). Saíram a ajuda e o link de código-fonte do Stremio (o código-fonte e a
  licença ficam em "Sobre o PP").
- Biblioteca e Calendário também funcionam como convidado, com os dados salvos no aparelho.
- No primeiro uso o app abre no idioma do aparelho (`src/App/App.js`).

### Visual Liquid Glass
- Estilo de vidro reaproveitável: `src/common/glass.less`.
- Barra lateral flutuante (computador e TV) e barra de abas flutuante (celular), barra de cima,
  busca, menus, janelas, notificações, cartões de addons, configurações, painel de detalhes e
  menus do reprodutor em vidro.
- Fundo "Aurora" com luzes na cor escolhida.
- Destaque grande no topo da tela inicial (`src/routes/Board/Hero`): troca sozinho, dá para arrastar
  com o dedo ou o mouse para um lado e para o outro (a imagem acompanha o dedo) e tem setas junto dos pontinhos.
- Cartazes sobem com contorno e brilho na cor de destaque ao passar o mouse ou focar.

### Cores personalizáveis
- Configurações > Aparência: cor de destaque (8 cores ou qualquer outra; a padrão é o azul
  `#2563eb`), fundo (Aurora, Escuro, Preto) e efeito vidro (liga/desliga). Código:
  `src/common/ppTheme.ts` e `src/routes/Settings/Appearance`.
- `tools/gerar-cores.js` gera `src/common/pp-colors.less` (a paleta do Stremio com o tom vindo da
  cor escolhida) e troca as cores roxas fixas dos arquivos `.less`.

### Sobre o PP
- Configurações > Sobre o PP: créditos ao Stremio Web, licença GPL-2.0, aviso de marca,
  aviso de que o PP não hospeda conteúdo e versões (`src/routes/Settings/About`).

### Reprodutor de vídeo
- O vídeo sempre começa tocando: o Android deixa o vídeo começar sem toque
  (`android/app/src/main/java/com/pp/novo/MainActivity.java`), e o reprodutor tenta de novo nos
  primeiros segundos se o início for bloqueado (`src/routes/Player/Player.js`).
- Toques no vídeo: 1 toque mostra os controles; 2 toques no meio pausam/continuam; 2 toques na
  esquerda/direita voltam/adiantam 10 segundos (toques seguidos somam mais 10), com um balão de vidro.
- Barra de controles (`src/routes/Player/ControlBar`): botões de voltar e adiantar 10 segundos ao lado
  do play, botão de ligar/desligar legenda (volta para a última legenda usada; função em
  `useSubtitles.ts`) e botão "Esconder informações", que tira título e controles da tela até o próximo toque.

### App Android
- Pasta `android/` (Capacitor 8, `capacitor.config.json`, id `com.pp.novo`): o mesmo app web dentro
  de um APK, sem service worker. Ícones e tela de abertura do PP gerados por `tools/gerar-icones.js`.
- `tools/gerar-apk.js` (`npx pnpm@11.8.0 run android:apk`) gera o `PP.apk`.
- Botão/gesto de voltar do Android volta para a tela anterior do PP; na tela inicial fecha o app
  (`src/App/useAndroidBackButton.ts`, plugin `@capacitor/app`).
- O ícone do app na tela inicial muda com a cor escolhida: um ícone por cor pronta
  (`src/common/ppPresets.js`, gerados por `tools/gerar-icones.js`), um atalho (`activity-alias`) por
  ícone no `AndroidManifest.xml` e o plugin `PPIconPlugin.java`, que liga o atalho da cor escolhida
  quando a pessoa sai do app. Cor personalizada usa o ícone da cor pronta mais parecida.

### Outros
- `webpack.config.js`: usa a paleta do PP, aceita `PP_HTTP=1` para rodar o servidor de
  desenvolvimento em http e não gera o mapa do service worker (ele gravava o caminho da pasta
  do computador de quem fez o build).
- `src/router/Routes.tsx`: animação de troca de tela interrompida não gera mais erro.
- `webpack.config.js`: `PP_BUILD_WORKERS` limita os processos de compilação (o `gerar-apk.js` usa 2,
  para o build caber na memória com outros programas abertos).

## 13/10/2026: app sem citar o Stremio e código aberto publicado

- Os textos do app não citam mais o Stremio (`src/index.js` troca o nome em todas as traduções). A única
  exceção é a tela de entrar, porque a conta é do Stremio: uma linha pequena no cartão avisa que o
  e-mail, a senha e os dados da conta ficam com o Stremio, e os termos, a privacidade e o aviso de
  marketing aceitos ao criar conta dizem de quem são (`src/routes/Intro`).
- Configurações > "Sobre o PP" virou "Código aberto": o PP é software livre sob a GNU GPL versão 2,
  sem garantia, com links para o código-fonte do PP e para a licença, o aviso de que o PP não hospeda
  conteúdo e as versões (`src/routes/Settings/About`).
- Links externos (IMDb, links dos títulos e outros) abrem direto, sem passar pela página de aviso do
  site do Stremio (`src/common/Platform/Platform.tsx`, `src/components/MetaPreview/MetaPreview.js`).
- Saiu o link "Painel do usuário" do menu ⋯. Em Configurações > Geral, os termos e a privacidade da conta
  só aparecem para quem entrou.
- Versão do app: 1.0.0 (`package.json`).
- Saíram do repositório os arquivos do projeto original que não valem para o PP: fluxos e modelos do
  GitHub (`.github`), associação de app da Apple (`.well-known`), código de conduta e guia de
  contribuição. `Dockerfile` com o nome do PP.

## 14/10/2026: versão para a Play Store

- `tools/gerar-aab.js` (`npx pnpm@11.8.0 run android:aab`) gera o `PP.aab` de lançamento e o assina com a
  chave de envio, guardada fora do projeto; na primeira vez cria a chave. A senha é digitada no terminal.
- `android/app/build.gradle`: a versão do app Android vem do `package.json` (1.0.0 → versionCode 10000).
- `.gitignore`: o `PP.aab` e arquivos de chave (`*.jks`, `*.keystore`) nunca vão para o repositório.
