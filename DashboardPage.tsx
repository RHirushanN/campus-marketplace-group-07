import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PageTitle } from "../components/PageTitle";

export function DashboardPage({
  total,
  active,
  sold,
  saved,
  messages,
  onMyListings,
  onMessages,
  onExplore,
}: {
  total: number;
  active: number;
  sold: number;
  saved: number;
  messages: number;
  onMyListings: () => void;
  onMessages: () => void;
  onExplore: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <PageTitle
        title="Dashboard"
        subtitle="A quick view of your marketplace activity"
      />
      <View style={styles.grid}>
        <Card n={total} t="Total listings" onPress={onMyListings} />
        <Card n={active} t="Active listings" onPress={onMyListings} />
        <Card n={sold} t="Sold items" onPress={onMyListings} />
        <Card n={saved} t="Saved items" onPress={onExplore} />
      </View>
      <View style={styles.panel}>
        <Text style={styles.title}>Activity Summary</Text>
        <Text style={styles.line}>
          • {messages} active conversation{messages === 1 ? "" : "s"} in your
          inbox
        </Text>
        <Text style={styles.line}>
          • {active} active item{active === 1 ? "" : "s"} currently visible to
          campus buyers
        </Text>
        <Text style={styles.line}>
          • {sold} item{sold === 1 ? "" : "s"} completed and marked as sold
        </Text>
        <Text style={styles.line}>
          • Use Search + Category + Price filters to find items quickly
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={onMyListings}>
            <Text style={styles.actionText}>Manage my listings</Text>
          </Pressable>
          <Pressable style={styles.actionOutline} onPress={onMessages}>
            <Text style={styles.actionOutlineText}>Open messages</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function Card({
  n,
  t,
  onPress,
}: {
  n: number;
  t: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.number}>{n}</Text>
      <Text style={styles.cardText}>{t}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "47%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECE6",
    padding: 18,
  },
  number: { fontSize: 28, fontWeight: "900", color: "#1F5D4C" },
  cardText: { color: "#87918C", fontSize: 11, marginTop: 4, fontWeight: "700" },
  panel: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECE6",
    padding: 18,
    marginTop: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#173C34",
    marginBottom: 10,
  },
  line: { fontSize: 13, color: "#65766D", lineHeight: 23 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#1F5D4C",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
  actionOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#BCD0C3",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionOutlineText: { color: "#1F5D4C", fontWeight: "800", fontSize: 12 },
});
