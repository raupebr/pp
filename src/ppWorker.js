// Copyright (C) 2017-2023 Smart code 203358507

// PP: entrada do worker do núcleo do Stremio. Roda antes dele só para não deixar os eventos de uso saírem
// do aparelho (veja common/ppAnalyticsBlock.js). Tudo o mais é o worker original, sem mudança.

const { isAnalyticsRequest, successResponse } = require('./common/ppAnalyticsBlock');

const originalFetch = self.fetch.bind(self);
self.fetch = (input, init) => {
    if (isAnalyticsRequest(input, init)) {
        return Promise.resolve(successResponse());
    }
    return originalFetch(input, init);
};

require('@stremio/stremio-core-web/worker.js');
