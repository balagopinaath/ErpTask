import { Dimensions } from "react-native"
const deviceWidth = Dimensions.get('window').width

export const customFonts = {
    poppinsBlack: "Poppins-Black.ttf",
    poppinsBold: "Poppins-Bold.ttf",
    poppinsExtraBold: "Poppins-ExtraBold.ttf",
    poppinsExtraLight: "Poppins-ExtraLight.ttf",
    poppinsLight: "Poppins-Light.ttf",
    poppinsMedium: "Poppins-Medium.ttf",
    poppinsRegular: "Poppins-Regular.ttf",
    poppinsSemiBold: "Poppins-SemiBold.ttf",
    poppinsThin: "Poppins-Thin.ttf",
}

export const customColors = {
    light: {
        background: "#ffffff",
        primary: "#20cb98",
        secondary: "#f5f5f5",
        accent: "#ff6e42",
        text: "#212121",
        textSecondary: '#757575',
        black: "#000000",
        white: "#ffffff",
    },
    dark: {
        background: "#000000",
        primary: "#34dfac",
        secondary: "#0a0a0a",
        accent: "#bd2c00",
        text: "#dedede",
        textSecondary: '#b0b0b0',
        black: "#000000",
        white: "#ffffff",
    },
}

export const customFontSize = {
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
}

export const responsiveFontSize = (baseSize) => {
    const baseWidth = 375;
    return baseSize * (deviceWidth / baseWidth);
};

export const typography = {
    h1: (colors) => ({
        fontFamily: customFonts.poppinsExtraBold,
        fontSize: responsiveFontSize(32),
        color: colors.text,
    }),
    h2: (colors) => ({
        fontFamily: customFonts.poppinsBold,
        fontSize: responsiveFontSize(28),
        color: colors.text,
    }),
    h3: (colors) => ({
        fontFamily: customFonts.poppinsSemiBold,
        fontSize: responsiveFontSize(24),
        color: colors.text,
    }),
    h4: (colors) => ({
        fontFamily: customFonts.poppinsMedium,
        fontSize: responsiveFontSize(20),
        color: colors.text,
    }),
    h5: (colors) => ({
        fontFamily: customFonts.poppinsMedium,
        fontSize: responsiveFontSize(18),
        color: colors.text,
    }),
    h6: (colors) => ({
        fontFamily: customFonts.poppinsRegular,
        fontSize: responsiveFontSize(16),
        color: colors.text,
    }),
    body1: (colors) => ({
        fontFamily: customFonts.poppinsRegular,
        fontSize: responsiveFontSize(14),
        color: colors.text,
    }),
    body2: (colors) => ({
        fontFamily: customFonts.poppinsRegular,
        fontSize: responsiveFontSize(12),
        color: colors.textSecondary,
    }),
    button: (colors) => ({
        fontFamily: customFonts.poppinsBold,
        fontSize: responsiveFontSize(14),
        color: colors.white,
    }),
    caption: (colors) => ({
        fontFamily: customFonts.poppinsLight,
        fontSize: responsiveFontSize(12),
        color: colors.textSecondary,
    }),
    overline: (colors) => ({
        fontFamily: customFonts.poppinsLight,
        fontSize: responsiveFontSize(10),
        color: colors.textSecondary,
    }),
}