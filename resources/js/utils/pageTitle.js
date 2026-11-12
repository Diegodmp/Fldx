export const APP_NAME = 'Filmdex';

export function setPageTitle(pageName) {
    document.title = pageName ? `${APP_NAME} · ${pageName}` : APP_NAME;
}
