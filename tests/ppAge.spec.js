// Copyright (C) 2017-2023 Smart code 203358507

const { maskBirthDate, checkBirthDate, registerUnderage, isAgeBlocked, isAgeConfirmed, confirmAge } = require('../src/common/ppAge');

// 15/10/2026 (mês 9 = outubro)
const TODAY = new Date(2026, 9, 15);

describe('ppAge', () => {
    describe('maskBirthDate', () => {
        it('coloca as barras enquanto a pessoa digita', () => {
            expect(maskBirthDate('1')).toBe('1');
            expect(maskBirthDate('150')).toBe('15/0');
            expect(maskBirthDate('15101')).toBe('15/10/1');
            expect(maskBirthDate('15102008')).toBe('15/10/2008');
        });

        it('ignora letras e passa de 8 números', () => {
            expect(maskBirthDate('15/10/2008x99')).toBe('15/10/2008');
            expect(maskBirthDate('abc')).toBe('');
        });
    });

    describe('checkBirthDate', () => {
        it('aceita quem faz 18 anos hoje', () => {
            expect(checkBirthDate('15/10/2008', TODAY)).toBe('ok');
        });

        it('bloqueia quem faz 18 anos amanhã', () => {
            expect(checkBirthDate('16/10/2008', TODAY)).toBe('underage');
        });

        it('aceita adulto e bloqueia criança', () => {
            expect(checkBirthDate('01/01/1990', TODAY)).toBe('ok');
            expect(checkBirthDate('01/01/2015', TODAY)).toBe('underage');
        });

        it('recusa data que não existe, incompleta ou no futuro', () => {
            expect(checkBirthDate('31/02/1990', TODAY)).toBe('invalid');
            expect(checkBirthDate('00/10/1990', TODAY)).toBe('invalid');
            expect(checkBirthDate('15/13/1990', TODAY)).toBe('invalid');
            expect(checkBirthDate('15/10/19', TODAY)).toBe('invalid');
            expect(checkBirthDate('15/10/1850', TODAY)).toBe('invalid');
            expect(checkBirthDate('15/10/2027', TODAY)).toBe('invalid');
            expect(checkBirthDate('', TODAY)).toBe('invalid');
        });

        it('aceita 29/02 em ano bissexto e recusa em ano comum', () => {
            expect(checkBirthDate('29/02/2000', TODAY)).toBe('ok');
            expect(checkBirthDate('29/02/2001', TODAY)).toBe('invalid');
        });
    });
});

describe('ppAge: bloqueio', () => {
    const HORA = 60 * 60 * 1000;
    const AGORA = 1_000_000;

    beforeEach(() => {
        const dados = {};
        global.localStorage = {
            getItem: (key) => (key in dados ? dados[key] : null),
            setItem: (key, value) => { dados[key] = String(value); },
            removeItem: (key) => { delete dados[key]; }
        };
    });

    afterEach(() => {
        delete global.localStorage;
    });

    it('na 1ª vez só avisa e não bloqueia (a pessoa pode ter errado a data)', () => {
        expect(registerUnderage(AGORA)).toBe('warned');
        expect(isAgeBlocked(AGORA)).toBe(false);
    });

    it('na 2ª vez bloqueia por 24 horas e depois libera', () => {
        registerUnderage(AGORA);
        expect(registerUnderage(AGORA)).toBe('blocked');
        expect(isAgeBlocked(AGORA + 1)).toBe(true);
        expect(isAgeBlocked(AGORA + 24 * HORA - 1)).toBe(true);
        expect(isAgeBlocked(AGORA + 24 * HORA + 1)).toBe(false);
    });

    it('depois de liberar, o aviso volta a valer desde a 1ª vez', () => {
        registerUnderage(AGORA);
        registerUnderage(AGORA);
        expect(registerUnderage(AGORA + 25 * HORA)).toBe('warned');
    });

    it('confirmar a idade vale enquanto não houver bloqueio e zera os avisos', () => {
        expect(isAgeConfirmed(AGORA)).toBe(false);
        registerUnderage(AGORA);
        confirmAge();
        expect(isAgeConfirmed(AGORA)).toBe(true);
        expect(registerUnderage(AGORA)).toBe('warned');
    });

    it('sem localStorage (modo restrito) não quebra', () => {
        delete global.localStorage;
        expect(isAgeBlocked(AGORA)).toBe(false);
        expect(isAgeConfirmed(AGORA)).toBe(false);
    });
});
