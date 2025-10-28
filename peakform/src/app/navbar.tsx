"use client";

import Link from 'next/link';
import { Navbar, NavbarContent, NavbarItem } from '@heroui/navbar';
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

const NAVBAR_HEX = '#0c2c3f';
const NAVBAR_DARK = '#0b3952'


export default function App() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const onLogout = () => {
        logout();
        router.push("/");
    };

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
            </NavbarContent>
            <NavbarContent justify="end">
                {user ? (
                    <>
                        <NavbarItem className="hidden lg:flex">
                            <Link href="/profile" className="font-medium text-white">Profile</Link>
                        </NavbarItem>
                        <NavbarItem className="hidden lg:flex">
                            <button onClick={onLogout} className="font-medium text-white">Logout</button>
                        </NavbarItem>
                    </>
                ) : (
                    <NavbarItem className="hidden lg:flex">
                        <Link href="/login" className="font-medium text-white">Login</Link>
                    </NavbarItem>
                )}
            </NavbarContent>
        </Navbar>
    );
}