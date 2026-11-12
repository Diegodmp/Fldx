import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/app/HomePage';
import ProfilePage from './pages/app/ProfilePage';
import Search from './pages/Search';
import MovieDetail from './pages/MovieDetail';
import WatchlistPage from './pages/app/WatchlistPage';
import GroupsPage from './pages/app/GroupsPage';
import GroupDetailPage from './pages/app/GroupDetailPage';
import RecommendationsPage from './pages/app/RecommendationsPage';

axios.defaults.baseURL = '/api';
axios.defaults.headers.common['Accept'] = 'application/json';

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route
                element={
                    <PrivateRoute>
                        <AppLayout />
                    </PrivateRoute>
                }
            >
                <Route path="/" element={<HomePage />} />
                <Route path="/recomendaciones" element={<RecommendationsPage />} />
                <Route path="/filmdex" element={<Search />} />
                <Route path="/movies/:id" element={<MovieDetail />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/grupos" element={<GroupsPage />} />
                <Route path="/grupos/:id" element={<GroupDetailPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Route>
        </Routes>
    </BrowserRouter>
);

const root = createRoot(document.getElementById('app'));
root.render(<App />);
