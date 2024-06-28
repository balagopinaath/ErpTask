import React from 'react';
import { ThemeProvider } from './Context/ThemeContext';
import Navigation from './Navigation/Navigation';

const App = () => {

    return (
        <ThemeProvider>
            <Navigation />
        </ThemeProvider>
    );
};

export default App