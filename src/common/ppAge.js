// Copyright (C) 2017-2023 Smart code 203358507

// PP: o PP é só para maiores de 18 anos (a Play Store e a política de privacidade dizem isso).
// A data de nascimento digitada serve só para conferir a idade: não é guardada nem enviada a ninguém.
// O aparelho lembra apenas: que a idade já foi confirmada, quantas vezes a data indicou menos de 18 anos e,
// se isso se repetiu, até quando a entrada fica bloqueada. Quem erra a data sem querer pode corrigir:
// a 1ª vez só avisa, a 2ª bloqueia por 24 horas (e depois pode tentar de novo).

const MIN_AGE = 18;
const CONFIRMED_KEY = 'pp-age-confirmed';
const BLOCKED_KEY = 'pp-age-blocked'; // guarda até quando (em milissegundos)
const STRIKES_KEY = 'pp-age-strikes';
const BLOCK_MS = 24 * 60 * 60 * 1000;

const MIN_YEAR = 1900;

// Deixa só os números e coloca as barras: 01011990 -> 01/01/1990
const maskBirthDate = (text) => {
    const digits = String(text).replace(/\D/g, '').slice(0, 8);
    return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter((part) => part.length > 0).join('/');
};

// 'ok' (tem MIN_AGE anos ou mais), 'underage' (menos que isso) ou 'invalid' (data que não existe ou incompleta)
const checkBirthDate = (text, today = new Date()) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(text));
    if (match === null) {
        return 'invalid';
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    // new Date aceita 31/02 e vira 03/03: só vale se a data voltar igual
    if (year < MIN_YEAR || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return 'invalid';
    }
    if (date.getTime() > today.getTime()) {
        return 'invalid';
    }
    let age = today.getFullYear() - year;
    if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
        age -= 1;
    }
    return age >= MIN_AGE ? 'ok' : 'underage';
};

const read = (key) => {
    try {
        return localStorage.getItem(key);
    } catch (_e) {
        return null;
    }
};

const write = (key, value) => {
    try {
        if (value === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, String(value));
        }
    } catch (e) {
        console.error(e);
    }
};

const readNumber = (key) => {
    const value = Number(read(key));
    return Number.isFinite(value) ? value : 0;
};

const isAgeBlocked = (now = Date.now()) => readNumber(BLOCKED_KEY) > now;
const isAgeConfirmed = (now = Date.now()) => !isAgeBlocked(now) && read(CONFIRMED_KEY) === '1';

const confirmAge = () => {
    write(CONFIRMED_KEY, 1);
    write(STRIKES_KEY, null);
};

// A data indicou menos de MIN_AGE anos. 1ª vez: 'warned' (a pessoa pode ter errado, deixa corrigir).
// 2ª vez: 'blocked' (bloqueia por 24 horas).
const registerUnderage = (now = Date.now()) => {
    const strikes = readNumber(STRIKES_KEY) + 1;
    if (strikes >= 2) {
        write(BLOCKED_KEY, now + BLOCK_MS);
        write(STRIKES_KEY, null);
        return 'blocked';
    }
    write(STRIKES_KEY, strikes);
    return 'warned';
};

module.exports = {
    MIN_AGE,
    maskBirthDate,
    checkBirthDate,
    isAgeBlocked,
    isAgeConfirmed,
    registerUnderage,
    confirmAge
};
