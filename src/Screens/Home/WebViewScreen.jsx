import { WebView } from 'react-native-webview';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const WebViewScreen = ({ route }) => {
    const { url } = route.params;

    const htmlContent = `
        <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Document</title>
                <style>
                    iframe {
                        border: none;
                        width: 100%;
                        height: 100%;
                    }
                    body, html {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                    }
                </style>
            </head>
            <body>
                <iframe
                    src="${url}"
                    frameborder="0"
                    allowfullscreen
                ></iframe>
            </body>
        </html> 
    `;

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: htmlContent }}
                style={styles.webView}
                javaScriptEnabled={true}
            />
        </View>
    );
};

export default WebViewScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webView: {
        flex: 1,
    },
});
