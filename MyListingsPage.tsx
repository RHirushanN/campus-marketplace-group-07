import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../components/EmptyState";
import { ListingCard } from "../components/ListingCard";
import { PageTitle } from "../components/PageTitle";
import { Listing } from "../types";
export function MyListingsPage({
  items,
  onOpen,
  onSell,
  onMarkSold,
}: {
  items: Listing[];
  onOpen: (item: Listing) => void;
  onSell: () => void;
  onMarkSold: (item: Listing) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <PageTitle
        title="My listings"
        subtitle="Items you have posted to campus marketplace"
      />
      <FlatList
        data={items}
        scrollEnabled={false}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <EmptyState
            title="No listings yet"
            message="Publish an item and it will appear here."
            action="Sell an item"
            onAction={onSell}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <ListingCard
              item={item}
              saved={false}
              onSave={() => undefined}
              onOpen={() => onOpen(item)}
            />
            {item.status !== "sold" ? (
              <Pressable style={styles.soldButton} onPress={() => onMarkSold(item)}>
                <Text style={styles.soldButtonText}>Mark as sold</Text>
              </Pressable>
            ) : (
              <Text style={styles.soldLabel}>SOLD</Text>
            )}
          </View>
        )}
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 110 },
  columns: { gap: 14 },
  grid: { gap: 14 },
  itemWrap: { flex: 1, gap: 7 },
  soldButton: { borderRadius: 10, borderWidth: 1, borderColor: "#BCD0C3", paddingVertical: 9, alignItems: "center" },
  soldButtonText: { color: "#1F5D4C", fontSize: 11, fontWeight: "800" },
  soldLabel: { textAlign: "center", color: "#87918C", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
});
