import {
  StyleSheet,
  Text,
  View,
  SectionList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
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
import { fetchRateMasterAdmin } from "../../Api/reports";

interface RateMasterAdminItem {
  Product_Id: string;
  Rate: number;
  Min_Rate: number;
  Max_Rate: number;
  COGS: number;
  GP_Percentage_COGS: number;
  Product_Name: string;
  Brand: string;
  Group_ST: string;
  Grade_Item_Group: string;
  POS_Group: string;
  Item_Name_Modified: string;
  POS_Item_Name: string;
}

interface RateMasterAdminResponse {
  Data1: RateMasterAdminItem[];
  Data2: { Product_Id: string }[];
}

type ZeroValueFilter =
  | "ALL"
  | "ALL_MOVEMENT_ZERO"
  | "ANY_MOVEMENT_ZERO"
  | "ALL_COLUMNS_ZERO"
  | "ANY_COLUMN_ZERO";

const ZERO_VALUE_FILTER_OPTIONS: { label: string; value: ZeroValueFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "All Movement List Columns are 0", value: "ALL_MOVEMENT_ZERO" },
  { label: "Any Movement List Column is 0", value: "ANY_MOVEMENT_ZERO" },
  { label: "All Columns are 0", value: "ALL_COLUMNS_ZERO" },
  { label: "Any of the Column is 0", value: "ANY_COLUMN_ZERO" },
];

// "Movement" columns = COGS / GP% (derived from today's movement data).
// "Columns" = the rate-master columns (List Rate / Min Rate / Max Rate).
const matchesZeroValueFilter = (
  item: RateMasterAdminItem,
  filter: ZeroValueFilter,
) => {
  const movementVals = [item.COGS, item.GP_Percentage_COGS];
  const rateVals = [item.Rate, item.Min_Rate, item.Max_Rate];
  switch (filter) {
    case "ALL_MOVEMENT_ZERO":
      return movementVals.every(v => !v);
    case "ANY_MOVEMENT_ZERO":
      return movementVals.some(v => !v);
    case "ALL_COLUMNS_ZERO":
      return rateVals.every(v => !v);
    case "ANY_COLUMN_ZERO":
      return rateVals.some(v => !v);
    default:
      return true;
  }
};

const fmtDateParam = (d: Date) => d.toISOString().split("T")[0];

const displayName = (item: RateMasterAdminItem) =>
  item.Product_Name || item.Item_Name_Modified || `Item #${item.Product_Id}`;

const fmtCurrency = (n: number) => `₹${(n ?? 0).toFixed(2)}`;

const RateMasterAdmin = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, typography } = useTheme();
  const styles = getStyles(typography, colors);

  const companyId = storage.getString("companyId") ?? "";

  const [fromDate, setFromDate] = React.useState<Date>(() => new Date());
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const [selectedBrand, setSelectedBrand] = React.useState<string | null>(null);
  const [zeroValueFilter, setZeroValueFilter] = React.useState<ZeroValueFilter>(
    "ALL",
  );
  const [zeroFilterModalVisible, setZeroFilterModalVisible] = React.useState(
    false,
  );

  const fromStr = fmtDateParam(fromDate);

  const {
    data: rateMasterAdmin,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["rateMasterAdmin", fromStr, companyId],
    queryFn: () => fetchRateMasterAdmin(fromStr, companyId),
    enabled: !!companyId && !!fromStr,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const data1 = (rateMasterAdmin as RateMasterAdminResponse | undefined)
    ?.Data1 ?? [];
  const data2 = (rateMasterAdmin as RateMasterAdminResponse | undefined)
    ?.Data2 ?? [];

  // Only the products referenced in Data2 (mapped by Product_Id onto Data1).
  const adminItems = React.useMemo(() => {
    if (data2.length === 0) return [];
    const itemsById = new Map(data1.map(item => [String(item.Product_Id), item]));
    const seen = new Set<string>();
    const result: RateMasterAdminItem[] = [];
    data2.forEach(entry => {
      const id = String(entry.Product_Id);
      if (seen.has(id)) return;
      const item = itemsById.get(id);
      if (!item) return;
      seen.add(id);
      result.push(item);
    });
    return result;
  }, [data1, data2]);

  // Search applies regardless of brand, so chip counts (and the "All" count)
  // reflect the current search but stay independent of the selected brand.
  const searchScopedItems = React.useMemo(() => {
    const q = searchText.toLowerCase();
    return adminItems.filter(item => {
      if (!matchesZeroValueFilter(item, zeroValueFilter)) return false;
      if (!q) return true;
      const name = displayName(item).toLowerCase();
      const brand = (item.Brand || "").toLowerCase();
      return name.includes(q) || brand.includes(q);
    });
  }, [adminItems, searchText, zeroValueFilter]);

  const brandCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    searchScopedItems.forEach(item => {
      if (!item.Brand) return;
      map.set(item.Brand, (map.get(item.Brand) ?? 0) + 1);
    });
    return map;
  }, [searchScopedItems]);

  const brands = React.useMemo(
    () => Array.from(brandCounts.keys()).sort(),
    [brandCounts],
  );

  const filtered = React.useMemo(() => {
    if (!selectedBrand) return searchScopedItems;
    return searchScopedItems.filter(item => item.Brand === selectedBrand);
  }, [searchScopedItems, selectedBrand]);

  const sections = React.useMemo(() => {
    const map = new Map<string, RateMasterAdminItem[]>();
    filtered.forEach(item => {
      const key = item.Brand || "OTHERS";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries())
      .map(([title, items]) => ({
        title,
        data: items.sort((a, b) =>
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

  const gpColor = (gp: number) => {
    if (gp <= 0) return colors.textDanger;
    if (gp < 15) return colors.accent;
    return colors.success;
  };

  const renderProductCard = (item: RateMasterAdminItem) => (
    <View style={styles.card}>
      <Text style={styles.itemName} numberOfLines={2}>
        {displayName(item)}
      </Text>

      <View style={styles.highlightRow}>
        <View style={styles.highlightCell}>
          <Text style={styles.highlightLabel}>COGS</Text>
          <Text style={styles.highlightValue}>{fmtCurrency(item.COGS)}</Text>
        </View>
        <View
          style={[
            styles.highlightCell,
            styles.borderLeft,
            { backgroundColor: gpColor(item.GP_Percentage_COGS) + "12" },
          ]}>
          <Text style={styles.highlightLabel}>GP %</Text>
          <Text
            style={[
              styles.highlightValue,
              { color: gpColor(item.GP_Percentage_COGS) },
            ]}>
            {(item.GP_Percentage_COGS ?? 0).toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>List Rate</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {fmtCurrency(item.Rate)}
          </Text>
        </View>
        <View style={[styles.statCell, styles.borderLeft]}>
          <Text style={styles.statLabel}>Min Rate</Text>
          <Text style={styles.statValue}>{fmtCurrency(item.Min_Rate)}</Text>
        </View>
        <View style={[styles.statCell, styles.borderLeft]}>
          <Text style={styles.statLabel}>Max Rate</Text>
          <Text style={styles.statValue}>{fmtCurrency(item.Max_Rate)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader
        title="Rate Master Admin"
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

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setZeroFilterModalVisible(true)}>
          <Icon name="filter-list" size={20} color={colors.primary} />
          {zeroValueFilter !== "ALL" && <View style={styles.iconBtnDot} />}
        </TouchableOpacity>

      </View>

      <Modal
        visible={zeroFilterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZeroFilterModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setZeroFilterModalVisible(false)}>
          <View style={styles.filterPanel}>
            <Text style={styles.filterPanelTitle}>Zero Value Filter</Text>
            {ZERO_VALUE_FILTER_OPTIONS.map(opt => {
              const isSelected = zeroValueFilter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.filterOptionRow}
                  onPress={() => {
                    setZeroValueFilter(opt.value);
                    setZeroFilterModalVisible(false);
                  }}>
                  <View
                    style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.filterOptionLabel}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {brands.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipScrollContent}>
          <TouchableOpacity
            style={[styles.chip, !selectedBrand && styles.chipActive]}
            onPress={() => setSelectedBrand(null)}>
            <Text
              style={[
                styles.chipText,
                !selectedBrand && styles.chipTextActive,
              ]}>
              All ({searchScopedItems.length})
            </Text>
          </TouchableOpacity>
          {brands.map(brand => (
            <TouchableOpacity
              key={brand}
              style={[
                styles.chip,
                selectedBrand === brand && styles.chipActive,
              ]}
              onPress={() =>
                setSelectedBrand(selectedBrand === brand ? null : brand)
              }>
              <Text
                style={[
                  styles.chipText,
                  selectedBrand === brand && styles.chipTextActive,
                ]}>
                {brand} ({brandCounts.get(brand) ?? 0})
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
          keyExtractor={item => item.Product_Id}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => renderProductCard(item)}
          ListEmptyComponent={
            <View style={styles.centeredState}>
              <Icon name="inbox" size={48} color={colors.textSecondary} />
              <Text style={styles.stateText}>
                {data2.length === 0
                  ? "No admin rate entries configured"
                  : "No items match your search"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default RateMasterAdmin;

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
      paddingBottom: responsiveHeight(0.6),
      gap: responsiveWidth(2),
    },
    iconBtn: {
      width: responsiveWidth(11),
      height: responsiveWidth(11),
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border ?? "#E5E7EB",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    iconBtnDot: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "flex-start",
      alignItems: "center",
      paddingTop: responsiveHeight(16),
    },
    filterPanel: {
      backgroundColor: colors.white,
      borderRadius: 12,
      paddingVertical: responsiveHeight(1),
      minWidth: responsiveWidth(70),
      elevation: 6,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    filterPanelTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: "700",
      textTransform: "uppercase",
      paddingHorizontal: responsiveWidth(4),
      paddingTop: responsiveHeight(0.6),
      paddingBottom: responsiveHeight(0.4),
    },
    filterOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: responsiveWidth(3),
      paddingHorizontal: responsiveWidth(4),
      paddingVertical: responsiveHeight(1.2),
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border ?? "#CBD5E1",
      alignItems: "center",
      justifyContent: "center",
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    filterOptionLabel: {
      ...typography.body2,
      color: colors.text,
      fontWeight: "600",
      flex: 1,
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
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
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
      padding: responsiveWidth(3.5),
    },
    itemName: {
      ...typography.body2,
      color: colors.text,
      fontWeight: "700",
      marginBottom: responsiveHeight(1),
    },
    highlightRow: {
      flexDirection: "row",
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: colors.surface ?? colors.background,
      marginBottom: responsiveHeight(1),
    },
    highlightCell: {
      flex: 1,
      alignItems: "center",
      paddingVertical: responsiveHeight(1),
    },
    highlightLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: "700",
      marginBottom: 3,
    },
    highlightValue: {
      ...typography.body1,
      color: colors.text,
      fontWeight: "800",
    },
    statsRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border ?? "#F3F4F6",
      paddingTop: responsiveHeight(1),
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
