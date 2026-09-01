import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-gesture-handler";
import Navigation from "./Navigation/Navigation";
import { baseurl } from "./constants/api";
import { storage } from "./constants/storage";
import { ThemeProvider } from "./Context/ThemeContext";

const queryClient = new QueryClient();

const App = () => {
    useEffect(() => {
        const storedBaseURL = storage.getString("baseURL");
        if (storedBaseURL) {
            baseurl(storedBaseURL);
        }
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <Navigation />
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
};

export default App;
