import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { WatchlistProvider } from '../contexts/WatchlistContext';
import { setPageTitle } from '../utils/pageTitle';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const ROUTE_TITLES = {
    '/': 'Inicio',
    '/filmdex': 'Buscar',
    '/recomendaciones': 'Recomendaciones',
    '/watchlist': 'Watchlist',
    '/grupos': 'Grupos',
    '/groups': 'Grupos',
    '/profile': 'Perfil',
};

function useLayoutPageTitle() {
    const { pathname } = useLocation();

    useEffect(() => {
        const title = ROUTE_TITLES[pathname];

        if (title) {
            setPageTitle(title);
        }
    }, [pathname]);
}

export default function AppLayout() {
    useLayoutPageTitle();
    return (
        <WatchlistProvider>
            <div className="flex h-screen bg-base text-txt">
                <Sidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                    <Topbar />
                    <main className="flex-1 overflow-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </WatchlistProvider>
    );
}
