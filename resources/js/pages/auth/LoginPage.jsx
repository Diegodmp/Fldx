import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Film } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppleIcon, GoogleIcon } from '../../components/BrandIcons';
import usePageTitle from '../../hooks/usePageTitle';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [tab, setTab] = useState(location.pathname === '/register' ? 'register' : 'login');
    const [identifier, setIdentifier] = useState('');
    const [email, setEmail] = useState('');
    const [pwd, setPwd] = useState('');
    const [name, setName] = useState('');
    const [pwd2, setPwd2] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    usePageTitle(tab === 'register' ? 'Crear cuenta' : 'Iniciar sesión');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) navigate('/');
    }, []);

    useEffect(() => {
        setTab(location.pathname === '/register' ? 'register' : 'login');
        setErr('');
    }, [location.pathname]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr('');

        if (tab === 'register') {
            if (!name || !email || !pwd || pwd !== pwd2) {
                setErr(pwd !== pwd2 ? 'Las contraseñas no coinciden' : 'Completa todos los campos');
                return;
            }
        } else if (!identifier || !pwd) {
            setErr('Introduce email y contraseña');
            return;
        }

        setLoading(true);

        try {
            const { data } = tab === 'login'
                ? await axios.post('/login', { identifier, password: pwd })
                : await axios.post('/register', {
                    name,
                    email,
                    password: pwd,
                    password_confirmation: pwd2,
                });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/');
        } catch (error) {
            const response = error.response?.data;

            if (response?.errors) {
                setErr(Object.values(response.errors).flat()[0]);
            } else {
                setErr(response?.message || 'No se pudo conectar con el servidor');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-base">
            <div
                className="gradient-blob"
                style={{
                    width: 520,
                    height: 520,
                    background: 'radial-gradient(circle, #8B1A1A 0%, transparent 70%)',
                    top: '-15%',
                    left: '5%',
                    animationDelay: '0s',
                }}
            />
            <div
                className="gradient-blob"
                style={{
                    width: 440,
                    height: 440,
                    background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)',
                    bottom: '-12%',
                    right: '10%',
                    animationDelay: '-6s',
                    opacity: 0.22,
                }}
            />
            <div
                className="gradient-blob"
                style={{
                    width: 380,
                    height: 380,
                    background: 'radial-gradient(circle, #3a4d8c 0%, transparent 70%)',
                    top: '30%',
                    right: '20%',
                    animationDelay: '-12s',
                    opacity: 0.28,
                }}
            />

            <div className="grain pointer-events-none absolute inset-0" />

            <div className="absolute left-12 top-9 z-[2] flex items-center gap-2.5">
                {/* TODO: replace with Filmdex logo */}
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--color-primary)_0%,#5a0f0f_100%)] shadow-[0_4px_20px_rgba(139,26,26,0.45)]">
                    <Film size={16} color="#fff" />
                </div>
                <div className="font-serif text-[22px] tracking-[-0.01em]">Filmdex</div>
            </div>

            <div className="absolute bottom-10 left-12 z-[2] hidden max-w-[320px] mid:block">
                <div className="mb-3 font-serif text-lg italic leading-[1.4] text-txt">
                    “El cine es un mosaico hecho de tiempo.”
                </div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-txt-dim">
                    — Andréi Tarkovsky
                </div>
            </div>

            <div className="relative z-[5] w-[408px] rounded-xl border border-border-strong bg-[rgba(20,24,38,0.65)] px-9 pb-[30px] pt-[34px] shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl backdrop-saturate-150">
                <div className="mb-6">
                    <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold">
                        Bienvenido de vuelta
                    </div>
                    <h1 className="m-0 font-serif text-[30px] font-normal leading-[1.05] tracking-[-0.01em]">
                        {tab === 'login' ? 'Entra a tu sesión' : 'Crea tu cuenta'}
                    </h1>
                    <div className="mt-2 text-[13px] leading-[1.45] text-txt-dim">
                        {tab === 'login'
                            ? 'Tu watchlist, tus grupos y tus reseñas — donde los dejaste.'
                            : 'Empieza a registrar lo que ves y a votar pelis con tus grupos.'}
                    </div>
                </div>

                <div className="mb-6 flex rounded-lg border border-border-soft bg-white/[0.03] p-[3px]">
                    {['login', 'register'].map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => {
                                navigate(t === 'register' ? '/register' : '/login');
                            }}
                            className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-[12.5px] font-medium transition-all duration-150 ${
                                tab === t
                                    ? 'border border-border-strong bg-white/[0.06] text-txt'
                                    : 'border border-transparent bg-transparent text-txt-dim'
                            }`}
                        >
                            {t === 'login' ? 'Entrar' : 'Registrarse'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    {tab === 'register' && (
                        <div className="float-field">
                            <input
                                id="name"
                                type="text"
                                placeholder=" "
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                            />
                            <label htmlFor="name">Nombre completo</label>
                        </div>
                    )}
                    <div className="float-field">
                        {tab === 'login' ? (
                            <>
                                <input
                                    id="identifier"
                                    type="text"
                                    placeholder=" "
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    autoComplete="username"
                                />
                                <label htmlFor="identifier">Email</label>
                            </>
                        ) : (
                            <>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder=" "
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                                <label htmlFor="email">Email</label>
                            </>
                        )}
                    </div>
                    <div className="float-field">
                        <input
                            id="pwd"
                            type="password"
                            placeholder=" "
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                        />
                        <label htmlFor="pwd">Contraseña</label>
                    </div>
                    {tab === 'register' && (
                        <div className="float-field">
                            <input
                                id="pwd2"
                                type="password"
                                placeholder=" "
                                value={pwd2}
                                onChange={(e) => setPwd2(e.target.value)}
                                autoComplete="new-password"
                            />
                            <label htmlFor="pwd2">Confirma la contraseña</label>
                        </div>
                    )}

                    {tab === 'login' && (
                        <div className="-mt-0.5 flex items-center justify-between text-xs">
                            <label className="inline-flex cursor-pointer items-center gap-[7px] text-txt-dim">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="h-[13px] w-[13px] accent-gold"
                                />
                                Recuérdame
                            </label>
                            <a
                                href="#"
                                onClick={(e) => e.preventDefault()}
                                className="text-xs text-gold no-underline"
                            >
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    )}

                    {err && (
                        <div className="rounded-md border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-[11px] py-2 text-xs text-[#E66B5C]">
                            {err}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-1 cursor-pointer rounded-lg border border-white/10 bg-[linear-gradient(180deg,#A02525_0%,#8B1A1A_100%)] px-3.5 py-3 text-[13.5px] font-semibold tracking-[0.02em] text-white shadow-[0_4px_24px_rgba(192,57,43,0.30),inset_0_1px_0_rgba(255,255,255,0.12)] transition-transform duration-100 disabled:cursor-wait disabled:opacity-70"
                    >
                        {loading ? 'Conectando…' : (tab === 'login' ? 'Entrar con email' : 'Crear cuenta')}
                    </button>
                </form>

                <div className="my-[22px] flex items-center gap-3 text-[10.5px] uppercase tracking-[0.14em] text-txt-faint">
                    <div className="h-px flex-1 bg-border-soft" />
                    o continúa con
                    <div className="h-px flex-1 bg-border-soft" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    {[
                        { name: 'Google', Icon: GoogleIcon },
                        { name: 'Apple', Icon: AppleIcon },
                    ].map(({ name: providerName, Icon }) => (
                        <button
                            key={providerName}
                            type="button"
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-strong bg-white/[0.025] px-3 py-2.5 text-[12.5px] font-medium text-txt transition-[border-color,background] duration-150 hover:bg-white/5"
                        >
                            <Icon size={15} />
                            {providerName}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
