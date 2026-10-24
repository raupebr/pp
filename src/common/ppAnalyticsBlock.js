// Copyright (C) 2017-2023 Smart code 203358507

// PP: quando há conta, o núcleo do Stremio manda "eventos de uso" (login, addons, biblioteca, reprodução)
// para POST https://api.strem.io/api/events. O PP não envia isso: o pedido é reconhecido aqui e respondido
// com "ok" sem sair do aparelho. Qualquer outro pedido (addons, catálogos, conta, biblioteca) passa direto.

const STREMIO_HOSTS = /(^|\.)(strem\.io|stremio\.com)$/;
const EVENTS_PATH = /\/api\/events\/?$/;

const isAnalyticsRequest = (input, init) => {
    try {
        const url = typeof input === 'string' ? input : (input && input.url) || String(input);
        const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
        const { hostname, pathname } = new URL(url, 'https://invalido.invalid');
        return method === 'POST' && STREMIO_HOSTS.test(hostname) && EVENTS_PATH.test(pathname);
    } catch (_e) {
        return false;
    }
};

// A resposta que o núcleo espera de um pedido bem-sucedido: { "result": { "success": true } }
const successResponse = () => new Response(JSON.stringify({ result: { success: true } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
});

module.exports = {
    isAnalyticsRequest,
    successResponse
};
