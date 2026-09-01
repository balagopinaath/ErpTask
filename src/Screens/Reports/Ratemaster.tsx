import {
    StyleSheet,
    Text,
    View,
    SectionList,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from "react-native";
import React from "react";
import { RootStackParamList } from "../../Navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../Context/ThemeContext";
import { storage } from "../../constants/storage";
import AppHeader from "../../Components/AppHeader";
import FilterModal from "../../Components/FilterModal";
import { responsiveHeight, responsiveWidth } from "../../constants/helper";
import { fetchRateMaster, fetchRateMasterStockValue } from "../../Api/reports";

interface RateMasterItem {
    Id: number;
    Rate_Date: string;
    Min_Rate: number;
    Pos_Brand_Id: string;
    Item_Id: string;
    Rate: number;
    Max_Rate: number;
    POS_Brand_Name: string;
    Product_Name: string | null;
    Short_Name: string | null;
    Is_Active_Decative: number;
    Brand_Level: string;
    Item_Level: string;
}

interface StockValueItem {
    Trans_Date: string;
    Product_Id: string;
    CL_Rate: number | null;
}

interface BrandOption {
    id: string;
    name: string;
}

const fmtDateParam = (d: Date) => d.toISOString().split("T")[0];

const displayName = (item: RateMasterItem) =>
    item.Product_Name || item.Short_Name || `Item #${item.Item_Id}`;

const fmtCurrency = (n: number) => `₹${n.toFixed(2)}`;

const Ratemaster = () => {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { colors, typography } = useTheme();
    const styles = getStyles(typography, colors);

    const companyId = storage.getString("companyId") ?? "";

    const [fromDate, setFromDate] = React.useState<Date>(() => new Date());
    const [filterModalVisible, setFilterModalVisible] = React.useState(false);
    const [searchText, setSearchText] = React.useState("");
    const [selectedBrandId, setSelectedBrandId] = React.useState<string | null>(
        null,
    );
    const [showInactive, setShowInactive] = React.useState(false);

    const fromStr = fmtDateParam(fromDate);

    const {
        data: rateMaster = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["rateMaster", fromStr, companyId],
        queryFn: () => fetchRateMaster(fromStr, companyId),
        enabled: !!companyId && !!fromStr,
        staleTime: 1000 * 60 * 2,
        retry: 1,
    });

    const { data: stockValue = [] } = useQuery({
        queryKey: ["rateMasterStockValue", fromStr, companyId],
        queryFn: () => fetchRateMasterStockValue(fromStr, companyId),
        enabled: !!companyId && !!fromStr,
        staleTime: 1000 * 60 * 2,
        retry: 1,
    });

    const clRateByItem = React.useMemo(() => {
        const map = new Map<string, number | null>();
        (stockValue as StockValueItem[]).forEach(sv => {
            map.set(String(sv.Product_Id), sv.CL_Rate);
        });
        return map;
    }, [stockValue]);

    // Only the products matching the current Active/Inactive tab.
    const statusFilteredItems = React.useMemo(() => {
        return (rateMaster as RateMasterItem[]).filter(item =>
            showInactive
                ? Number(item.Is_Active_Decative) === 0
                : Number(item.Is_Active_Decative) === 1,
        );
    }, [rateMaster, showInactive]);

    // Brand chips are scoped to the current tab, so a brand with only
    // inactive products doesn't show up while browsing Active (and vice versa).
    const brandOptions: BrandOption[] = React.useMemo(() => {
        const map = new Map<string, string>();
        statusFilteredItems.forEach(item => {
            if (item.Pos_Brand_Id && item.POS_Brand_Name) {
                map.set(item.Pos_Brand_Id, item.POS_Brand_Name);
            }
        });
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [statusFilteredItems]);

    const filtered = React.useMemo(() => {
        const q = searchText.toLowerCase();
        return statusFilteredItems.filter(item => {
            if (selectedBrandId && item.Pos_Brand_Id !== selectedBrandId)
                return false;
            if (!q) return true;
            const name = displayName(item).toLowerCase();
            const brand = (item.POS_Brand_Name || "").toLowerCase();
            return name.includes(q) || brand.includes(q);
        });
    }, [statusFilteredItems, searchText, selectedBrandId]);

    const handleToggleStatus = (next: boolean) => {
        setShowInactive(next);
        setSelectedBrandId(null);
    };

    const sections = React.useMemo(() => {
        const map = new Map<string, RateMasterItem[]>();
        filtered.forEach(item => {
            const key = item.POS_Brand_Name || "OTHERS";
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(item);
        });
        return Array.from(map.entries())
            .map(([title, data]) => ({
                title,
                data: data.sort((a, b) =>
                    displayName(a).localeCompare(displayName(b)),
                ),
            }))
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [filtered]);

    const formatDisplayDate = (d: Date) =>
        d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const renderProductCard = (item: RateMasterItem, index: number) => {
        const clRate = clRateByItem.get(String(item.Item_Id)) ?? 0;
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.sNo}>{index + 1}</Text>
                    <Text style={styles.itemName} numberOfLines={2}>
                        {displayName(item)}
                    </Text>
                    {Number(item.Is_Active_Decative) === 0 && (
                        <View style={styles.inactiveBadge}>
                            <Text style={styles.inactiveBadgeText}>Inactive</Text>
                        </View>
                    )}
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statCell}>
                        <Text style={styles.statLabel}>Min Rate</Text>
                        <Text style={styles.statValue}>
                            {fmtCurrency(item.Min_Rate)}
                        </Text>
                    </View>
                    <View style={[styles.statCell, styles.borderLeft]}>
                        <Text style={styles.statLabel}>List Rate</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {fmtCurrency(item.Rate)}
                        </Text>
                    </View>
                    <View style={[styles.statCell, styles.borderLeft]}>
                        <Text style={styles.statLabel}>CL Rate</Text>
                        <Text
                            style={[
                                styles.statValue,
                                { color: clRate ? colors.success : colors.textSecondary },
                            ]}>
                            {fmtCurrency(clRate ?? 0)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <AppHeader
                title="Rate Master"
                navigation={navigation}
                showRightIcon
                rightIconLibrary="MaterialIcon"
                rightIconName="tune"
                onRightPress={() => setFilterModalVisible(true)}
            />

            <FilterModal
                visible={filterModalVisible}
                title="Filter Rate Master"
                fromDate={fromDate}
                onFromDateChange={setFromDate}
                onApply={() => setFilterModalVisible(false)}
                onClose={() => setFilterModalVisible(false)}
            />

            <View style={styles.toolbar}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search items, brand..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText("")}>
                            <Icon name="clear" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

            </View>

            <View style={styles.statusToggleRow}>
                <TouchableOpacity
                    style={[
                        styles.statusToggleBtn,
                        !showInactive && styles.statusToggleBtnActive,
                    ]}
                    onPress={() => handleToggleStatus(false)}>
                    <Text
                        style={[
                            styles.statusToggleText,
                            !showInactive && styles.statusToggleTextActive,
                        ]}>
                        Active
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.statusToggleBtn,
                        showInactive && styles.statusToggleBtnActive,
                    ]}
                    onPress={() => handleToggleStatus(true)}>
                    <Text
                        style={[
                            styles.statusToggleText,
                            showInactive && styles.statusToggleTextActive,
                        ]}>
                        Inactive
                    </Text>
                </TouchableOpacity>
            </View>

            {brandOptions.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipScroll}
                    contentContainerStyle={styles.chipScrollContent}>
                    <TouchableOpacity
                        style={[styles.chip, !selectedBrandId && styles.chipActive]}
                        onPress={() => setSelectedBrandId(null)}>
                        <Text
                            style={[
                                styles.chipText,
                                !selectedBrandId && styles.chipTextActive,
                            ]}>
                            All
                        </Text>
                    </TouchableOpacity>
                    {brandOptions.map(brand => (
                        <TouchableOpacity
                            key={brand.id}
                            style={[
                                styles.chip,
                                selectedBrandId === brand.id && styles.chipActive,
                            ]}
                            onPress={() =>
                                setSelectedBrandId(
                                    selectedBrandId === brand.id ? null : brand.id,
                                )
                            }>
                            <Text
                                style={[
                                    styles.chipText,
                                    selectedBrandId === brand.id && styles.chipTextActive,
                                ]}>
                                {brand.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {isLoading && (
                <View style={styles.centeredState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.stateText}>Loading rate master...</Text>
                </View>
            )}

            {!isLoading && isError && (
                <View style={styles.centeredState}>
                    <Icon name="error-outline" size={40} color={colors.accent} />
                    <Text style={styles.stateText}>Failed to load rate master data</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                        <Icon name="refresh" size={18} color={colors.white} />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isLoading && !isError && (
                <SectionList
                    style={styles.list}
                    sections={sections}
                    keyExtractor={item => String(item.Id)}
                    stickySectionHeadersEnabled
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    renderSectionHeader={({ section }) => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionHeaderText}>{section.title}</Text>
                        </View>
                    )}
                    renderItem={({ item, index }) => renderProductCard(item, index)}
                    ListEmptyComponent={
                        <View style={styles.centeredState}>
                            <Icon name="inbox" size={48} color={colors.textSecondary} />
                            <Text style={styles.stateText}>
                                {showInactive
                                    ? "No inactive products found"
                                    : "No active products found"}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default Ratemaster;

const getStyles = (typography: any, colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.primary,
        },
        toolbar: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.white,
            paddingHorizontal: responsiveWidth(4),
            paddingTop: responsiveHeight(1.2),
            paddingBottom: responsiveHeight(1),
            gap: responsiveWidth(2),
        },
        searchBar: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.white,
            paddingHorizontal: responsiveWidth(3),
            paddingVertical: responsiveHeight(1),
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border ?? "#E5E7EB",
            gap: responsiveWidth(2),
        },
        searchInput: {
            flex: 1,
            ...typography.body2,
            color: colors.text,
        },
        statusToggleRow: {
            flexDirection: "row",
            backgroundColor: colors.white,
            paddingHorizontal: responsiveWidth(4),
            paddingBottom: responsiveHeight(1.2),
            gap: responsiveWidth(2),
        },
        statusToggleBtn: {
            paddingHorizontal: responsiveWidth(4),
            paddingVertical: responsiveHeight(0.8),
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        statusToggleBtnActive: {
            backgroundColor: colors.primary,
        },
        statusToggleText: {
            ...typography.caption,
            color: colors.primary,
            fontWeight: "700",
        },
        statusToggleTextActive: {
            color: colors.white,
        },
        chipScroll: {
            height: responsiveHeight(6.5),
            flexGrow: 0,
            flexShrink: 0,
            backgroundColor: colors.white,
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#E5E7EB",
        },
        chipScrollContent: {
            alignItems: "center",
            paddingHorizontal: responsiveWidth(4),
            paddingVertical: responsiveHeight(1.2),
            gap: responsiveWidth(2),
        },
        chip: {
            paddingHorizontal: responsiveWidth(3.5),
            paddingVertical: responsiveHeight(0.7),
            borderRadius: 20,
            backgroundColor: colors.surface ?? "#F3F4F6",
            borderWidth: 1,
            borderColor: colors.border ?? "#E5E7EB",
        },
        chipActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        chipText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.text,
        },
        chipTextActive: {
            color: colors.white,
        },
        centeredState: {
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.white,
            paddingVertical: responsiveHeight(8),
            gap: responsiveHeight(1.5),
        },
        stateText: {
            ...typography.body1,
            color: colors.textSecondary,
            textAlign: "center",
        },
        retryBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.primary,
            paddingHorizontal: responsiveWidth(5),
            paddingVertical: responsiveHeight(1.2),
            borderRadius: 8,
        },
        retryText: {
            ...typography.body2,
            color: colors.white,
            fontWeight: "600",
        },
        list: {
            flex: 1,
            backgroundColor: colors.white,
        },
        listContent: {
            paddingHorizontal: responsiveWidth(4),
            paddingBottom: responsiveHeight(3),
            backgroundColor: colors.white,
        },
        sectionHeader: {
            backgroundColor: colors.primary,
            paddingHorizontal: responsiveWidth(3),
            paddingVertical: responsiveHeight(0.8),
            borderRadius: 8,
            marginTop: responsiveHeight(1.2),
            marginBottom: responsiveHeight(0.8),
        },
        sectionHeaderText: {
            ...typography.body2,
            color: colors.white,
            fontWeight: "700",
            letterSpacing: 0.3,
        },
        card: {
            backgroundColor: colors.white,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border ?? "#E5E7EB",
            marginBottom: responsiveHeight(1),
            overflow: "hidden",
        },
        cardHeader: {
            flexDirection: "row",
            alignItems: "flex-start",
            paddingHorizontal: responsiveWidth(3.5),
            paddingTop: responsiveHeight(1.2),
            paddingBottom: responsiveHeight(1),
            gap: responsiveWidth(2),
        },
        sNo: {
            ...typography.caption,
            color: colors.textSecondary,
            fontWeight: "700",
            marginTop: 2,
        },
        itemName: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
            flex: 1,
        },
        inactiveBadge: {
            backgroundColor: colors.accent + "15",
            borderRadius: 6,
            paddingHorizontal: responsiveWidth(2),
            paddingVertical: 2,
        },
        inactiveBadgeText: {
            fontSize: 10,
            fontWeight: "700",
            color: colors.accent,
        },
        statsRow: {
            flexDirection: "row",
            borderTopWidth: 1,
            borderTopColor: colors.border ?? "#F3F4F6",
            paddingVertical: responsiveHeight(1.2),
        },
        statCell: {
            flex: 1,
            alignItems: "center",
        },
        borderLeft: {
            borderLeftWidth: 1,
            borderLeftColor: colors.border ?? "#F3F4F6",
        },
        statLabel: {
            fontSize: 10,
            color: colors.textSecondary,
            marginBottom: 3,
        },
        statValue: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
        },
    });
