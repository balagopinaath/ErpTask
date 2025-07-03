import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./Context/ThemeContext";
import Navigation from "./Navigation/Navigation";

const queryClient = new QueryClient();

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <Navigation />
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default App;
