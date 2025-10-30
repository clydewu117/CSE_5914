"use client";

import Link from 'next/link';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/navbar';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const NAVBAR_HEX = '#0c2c3f';
const NAVBAR_DARK = '#0b3952'


export default function App() {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const isAuthenticated = !!username;
    const pathname = usePathname();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                if (!token) {
                    setUsername(null);
                    return;
                }
                const res = await fetch('http://127.0.0.1:8000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    setUsername(null);
                    return;
                }
                const data = await res.json();
                setUsername(data.username || data.email || 'User');
            } catch {
                setUsername(null);
            }
        };
        loadUser();

        const onAuthChanged = () => loadUser();
        try { window.addEventListener('peakform:auth-changed', onAuthChanged); } catch {}
        return () => {
            try { window.removeEventListener('peakform:auth-changed', onAuthChanged); } catch {}
        };
    }, [pathname]);

    return (
        <Navbar style={{ backgroundColor: NAVBAR_HEX, borderBottom: `4px solid ${NAVBAR_DARK}` }} className="px-4 sm:px-8 text-white geologica-font">
            <NavbarContent className="hidden sm:flex gap-6 text-white" justify="center">
                <NavbarItem>
                    <Link href="/" className="font-medium text-white">Home</Link>
                </NavbarItem>
                <NavbarItem>
                    <Link href="/about" className="font-medium text-white">About Us</Link>
                </NavbarItem>
                <NavbarItem>
                    <Link href="/create-plan" className="font-medium text-white">Create a Plan</Link>
                </NavbarItem>
                {isAuthenticated && (
                    <NavbarItem>
                        <Link href="/plans" className="font-medium text-white">View my plans</Link>
                    </NavbarItem>
                )}
            </NavbarContent>
            <NavbarContent justify="end">
                <NavbarItem className="hidden lg:flex">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <span className="font-medium text-white">Welcome, {username}!</span>
                            <button
                                onClick={() => {
                                    try { localStorage.removeItem('access_token'); } catch {}
                                    setUsername(null);
                                    router.push('/');
                                }}
                                className="text-white/90 hover:text-white font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="font-medium text-white">Login</Link>
                    )}
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
}