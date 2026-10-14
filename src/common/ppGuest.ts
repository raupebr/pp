// PP: lembra se a pessoa escolheu "Entrar como convidado" na tela de entrar.
// Sem conta e sem essa escolha, o app abre na tela de entrar (como o Stremio).

const GUEST_KEY = 'pp-guest';

export const isGuest = () => {
    try {
        return localStorage.getItem(GUEST_KEY) === '1';
    } catch (_e) {
        return false;
    }
};

export const setGuest = (guest: boolean) => {
    try {
        if (guest) {
            localStorage.setItem(GUEST_KEY, '1');
        } else {
            localStorage.removeItem(GUEST_KEY);
        }
    } catch (e) {
        console.error(e);
    }
};
