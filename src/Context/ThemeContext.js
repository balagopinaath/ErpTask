import React, { createContext, useContext, useMemo } from "react";
import useTheme from "../Hooks/useTheme";
import { globalStyles } from "../Constants/styles";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { colors, isDarkMode } = useTheme();
    const customStyles = useMemo(() => globalStyles(colors), [colors]);

    return (
        <ThemeContext.Provider value={{ colors, isDarkMode, customStyles }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeContext = () => {
    return useContext(ThemeContext);
};
