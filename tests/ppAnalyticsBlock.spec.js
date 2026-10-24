// Copyright (C) 2017-2023 Smart code 203358507

const { isAnalyticsRequest, successResponse } = require('../src/common/ppAnalyticsBlock');

describe('ppAnalyticsBlock', () => {
    describe('isAnalyticsRequest', () => {
        it('reconhece o pedido de eventos do núcleo (Request e texto)', () => {
            const request = new Request('https://api.strem.io/api/events', { method: 'POST', body: '{}' });
            expect(isAnalyticsRequest(request)).toBe(true);
            expect(isAnalyticsRequest('https://api.strem.io/api/events', { method: 'post' })).toBe(true);
            expect(isAnalyticsRequest('https://api.strem.io/api/events/', { method: 'POST' })).toBe(true);
        });

        it('não mexe em pedidos de conta, biblioteca, addons ou catálogos', () => {
            expect(isAnalyticsRequest('https://api.strem.io/api/login', { method: 'POST' })).toBe(false);
            expect(isAnalyticsRequest('https://api.strem.io/api/datastorePut', { method: 'POST' })).toBe(false);
            expect(isAnalyticsRequest('https://v3-cinemeta.strem.io/manifest.json')).toBe(false);
            expect(isAnalyticsRequest('https://v3-cinemeta.strem.io/catalog/movie/top.json')).toBe(false);
        });

        it('só bloqueia POST e só nos domínios do Stremio', () => {
            expect(isAnalyticsRequest('https://api.strem.io/api/events')).toBe(false);
            expect(isAnalyticsRequest('https://api.strem.io/api/events', { method: 'GET' })).toBe(false);
            expect(isAnalyticsRequest('https://meu-addon.exemplo.com/api/events', { method: 'POST' })).toBe(false);
            expect(isAnalyticsRequest('https://strem.io.exemplo.com/api/events', { method: 'POST' })).toBe(false);
        });

        it('não quebra com entrada estranha', () => {
            expect(isAnalyticsRequest(undefined)).toBe(false);
            expect(isAnalyticsRequest(null, { method: 'POST' })).toBe(false);
            expect(isAnalyticsRequest('::::')).toBe(false);
        });
    });

    describe('successResponse', () => {
        it('responde o que o núcleo espera de um pedido bem-sucedido', async () => {
            const response = successResponse();
            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ result: { success: true } });
        });
    });
});
