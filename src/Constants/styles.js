import { StyleSheet } from "react-native";
import { responsiveWidth, responsiveHeight, typography } from "./helper";

export const globalStyles = (colors) => {

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        button: {
            width: responsiveWidth(80), // 80% of the device width
            height: responsiveHeight(6), // 7% of the device height
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            marginVertical: 10,
        },
        buttonText: {
            ...typography.button(colors),
            fontWeight: "bold",
        },
        input: {
            ...typography.body1(colors),
            width: responsiveWidth(80),
            height: responsiveHeight(6),
            borderRadius: 5,
            borderWidth: 1,
            borderColor: colors.borderColor,
            paddingHorizontal: 15,
            marginVertical: 10,
            backgroundColor: colors.secondary
        },
        datePicker: {
            flex: 3.33,
            height: responsiveHeight(6),
            flexDirection: 'row',
            justifyContent: "space-between",
            alignItems: 'center',
            backgroundColor: colors.secondary,
            borderWidth: 1,
            borderColor: colors.grey,
            borderRadius: 5,
            paddingHorizontal: responsiveWidth(2),
        },
        textInput: {
            textAlign: "center",
            ...typography.body1(colors),
        },
        dropdown: {
            flex: 3.33,
            height: responsiveHeight(6),
            borderColor: colors.grey,
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: responsiveWidth(2),
            backgroundColor: colors.secondary,
        },
        dropdownContainer: {
            backgroundColor: colors.secondary,
            borderColor: colors.textPrimary,
            borderWidth: 0.5,
            borderRadius: 10,
        },
        placeholderStyle: {
            ...typography.body1(colors),
        },
        selectedTextStyle: {
            ...typography.body1(colors),
        },
        iconStyle: {
            width: responsiveWidth(2.5),
            height: responsiveHeight(2.5),
        },
        noDataContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
        },
        noDataText: {
            textAlign: "center",
            ...typography.h6(colors)
        },


        shadow: {
            shadowColor: '#000000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            elevation: 2,
        },
        shadow3: {
            shadowColor: colors.background === colors.black
                ? colors.white
                : colors.black,
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            elevation: 3,
        },
        shadow5: {
            shadowColor: colors.background === colors.black
                ? colors.white
                : colors.black,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },

        card: {
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 15,
            margin: 15,
            ...this.shadow3,
        },
    })
}