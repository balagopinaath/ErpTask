import React, { createContext, useContext, useState } from "react";
import {
    typography as createTypography,
    customColors,
} from "../constants/helper";

type ThemeType = "light" | "dark";

interface ThemeContextProps {
    mode: ThemeType;
    colors: typeof customColors.light;
    typography: ReturnType<typeof createTypography>;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [mode, setMode] = useState<ThemeType>("light");

    const colors = mode === "light" ? customColors.light : customColors.dark;

    const toggleTheme = () => {
        setMode(prevMode => (prevMode === "light" ? "dark" : "light"));
    };

    return (
        <ThemeContext.Provider
            value={{
                mode,
                colors,
                typography: createTypography(colors),
                toggleTheme,
            }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
};
