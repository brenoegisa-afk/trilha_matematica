import { Outlet } from 'react-router-dom';
import HomeButton from './components/HomeButton/HomeButton';
import SideNavigation from './components/SideNavigation/SideNavigation';

export default function RootLayout() {
    return (
        <div style={{ display: 'flex' }}>
            <SideNavigation />
            <main style={{ 
                flex: 1, 
                marginLeft: '240px', // Matches SideNavigation width
                minHeight: '100vh',
                backgroundColor: '#f9f9f9'
            }}>
                <Outlet />
            </main>
            <HomeButton />
        </div>
    );
}
