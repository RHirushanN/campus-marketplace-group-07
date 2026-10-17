import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ListingCard } from "../components/ListingCard";
import { categories } from "../data";
import { Listing } from "../types";

export function ExplorePage({
  items,
  query,
  category,
  maxPrice,
  savedIds,
  userInitials,
  onQueryChange,
  onCategoryChange,
  onMaxPriceChange,
  onSave,
  onOpen,
  onProfile,
}: {
  items: Listing[];
  query: string;
  category: string;
  maxPrice: number;
  savedIds: string[];
  userInitials?: string;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onMaxPriceChange: (value: number) => void;
  onSave: (id: string) => void;
  onOpen: (item: Listing) => void;
  onProfile: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CAMPUS MARKETPLACE</Text>
          <Text style={styles.heading}>
            Find your next{"\n"}favorite thing.
          </Text>
        </View>
        <Pressable style={styles.avatar} onPress={onProfile}>
          <Text style={styles.avatarText}>{userInitials || "?"}</Text>
        </Pressable>
      </View>
      <View style={styles.search}>
        <Text style={styles.icon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search textbooks, desks, tech..."
          placeholderTextColor="#87918C"
          style={styles.input}
        />
      </View>
      <View style={styles.section}>
        <View>
          <Text style={styles.sectionTitle}>Browse near you</Text>
          <Text style={styles.muted}>Good finds, close by</Text>
        </View>
        <Text style={styles.seeAll}>{items.length} items</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {categories.map((value) => (
          <Pressable
            key={value}
            onPress={() => onCategoryChange(value)}
            style={[
              styles.category,
              category === value && styles.activeCategory,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                category === value && styles.activeText,
              ]}
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.priceFilter}>
        <View>
          <Text style={styles.priceLabel}>Maximum price</Text>
          <Text style={styles.priceHint}>Show items up to ${maxPrice}</Text>
        </View>
        <View style={styles.priceButtons}>
          {[50, 100, 250, 500].map((value) => (
            <Pressable key={value} onPress={() => onMaxPriceChange(value)}
              style={[styles.priceChip, maxPrice === value && styles.priceChipActive]}>
              <Text style={[styles.priceChipText, maxPrice === value && styles.priceChipTextActive]}>${value}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={items}
        scrollEnabled={false}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <Text style={styles.empty}>No items match your search yet.</Text>
        }
        renderItem={({ item }) => (
          <ListingCard
            item={item}
            saved={savedIds.includes(item.id)}
            onSave={() => onSave(item.id)}
            onOpen={() => onOpen(item)}
          />
        )}
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 110 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 28,
    paddingBottom: 24,
  },
  eyebrow: {
    color: "#65766D",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  heading: {
    color: "#173C34",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D6E5D7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#225347", fontWeight: "800" },
  search: {
    height: 52,
    backgroundColor: "#FFF",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E6E9E2",
  },
  icon: { color: "#49635A", fontSize: 28, marginRight: 8 },
  input: { flex: 1, color: "#173C34", fontSize: 14 },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#173C34",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  muted: { color: "#87918C", fontSize: 12 },
  seeAll: { color: "#23775D", fontWeight: "700", fontSize: 12 },
  categories: { gap: 8, paddingBottom: 22 },
  category: {
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#ECEFE9",
  },
  activeCategory: { backgroundColor: "#1F5D4C" },
  categoryText: { color: "#64736C", fontSize: 12, fontWeight: "700" },
  activeText: { color: "#FFF" },
  grid: { gap: 14 },
  columns: { gap: 14 },
  empty: { textAlign: "center", color: "#87918C", padding: 30 },
  priceFilter: { backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#E6E9E2", padding: 14, marginBottom: 18 },
  priceLabel: { color: "#24483D", fontSize: 13, fontWeight: "800" },
  priceHint: { color: "#87918C", fontSize: 11, marginTop: 3 },
  priceButtons: { flexDirection: "row", gap: 7, marginTop: 10 },
  priceChip: { borderWidth: 1, borderColor: "#DDE4DC", borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7 },
  priceChipActive: { backgroundColor: "#1F5D4C", borderColor: "#1F5D4C" },
  priceChipText: { color: "#65766D", fontSize: 11, fontWeight: "700" },
  priceChipTextActive: { color: "#FFF" },
});
