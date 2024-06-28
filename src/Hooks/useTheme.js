import { useColorScheme } from "react-native";
import { customColors } from "../Constants/helper";

const useTheme = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === "dark";
    const colors = customColors[colorScheme] || customColors.light;

    return { isDarkMode, colors };
};

export default useTheme;