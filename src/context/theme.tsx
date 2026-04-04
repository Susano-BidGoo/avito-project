import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'light',
    toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' ? 'dark' : 'light';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.body.style.background = theme === 'dark' ? '#1a1a1a' : '#fff';
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
    {children}
    </ThemeContext.Provider>
);
}

export function useTheme() {
    return useContext(ThemeContext);
}