import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./Context/ThemeContext";
import Navigation from "./Navigation/Navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

const App = () => {
    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <Navigation />
                </ThemeProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
};

export default App;
