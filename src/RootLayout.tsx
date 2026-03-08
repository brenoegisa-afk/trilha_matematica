import { Outlet } from 'react-router-dom';
import HomeButton from './components/HomeButton/HomeButton';

export default function RootLayout() {
    return (
        <>
            <Outlet />
            <HomeButton />
        </>
    );
}
