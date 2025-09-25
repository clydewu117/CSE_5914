import Link from 'next/link';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/navbar';


export default function App() {
  return (
      <Navbar>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
            <NavbarItem>
               <Link href="/" className="font-medium">Home</Link> 
            </NavbarItem>
            <NavbarItem>
                <Link href="/about" className="font-medium">About Us</Link>
            </NavbarItem>
            <NavbarItem>
                <Link href="/create" className="font-medium">Create a Plan</Link>
            </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
            <NavbarItem className="hidden lg:flex">
                <Link href="/login">Login</Link>
            </NavbarItem>
        </NavbarContent>
      </Navbar>
  );
}
<nav className="flex gap-4 items-center px-4 py-3">
          
         
        </nav>