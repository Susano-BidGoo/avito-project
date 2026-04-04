import { useTheme } from '../context/theme';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Светлая тема' : 'Тёмная тема'}
            style={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 9998,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid #D9D9D9',
                background: isDark ? '#2a2a2a' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
        >
            {isDark ? (
                // Солнце — белое
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="4" stroke="#ffffff" strokeWidth="2"/>
                    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            ) : (
                // Луна — чёрная
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
        </button>
    );
}