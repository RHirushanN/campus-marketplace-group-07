import { StatusBar } from "expo-status-bar";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState } from "./components/EmptyState";
import { DashboardPage } from "./pages/DashboardPage";
import { ExplorePage } from "./pages/ExplorePage";
import { MessagesPage } from "./pages/MessagesPage";
import { MyListingsPage } from "./pages/MyListingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SavedPage } from "./pages/SavedPage";
import { seedListings } from "./data";
import { auth, db, firebaseConfigured } from "./firebase";
import { Conversation, Listing, Message, Tab } from "./types";

const LOCAL_USER_KEY = "cm_active_user";
const LOCAL_USERS_DB_KEY = "cm_registered_users";
const LOCAL_LISTINGS_KEY = "cm_custom_listings";
const LOCAL_SAVED_KEY = "cm_saved_ids";
const LOCAL_CONVERSATIONS_KEY = "cm_direct_conversations_v2";

function readStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    }
  } catch {
    // Ignore storage errors
  }
  return fallback;
}

function writeStorage<T>(key: string, value: T | null) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
  }
}

function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Firestore request timed out")),
      ms,
    );
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function mergeListings(remoteOrCustom: Listing[], seeds: Listing[]): Listing[] {
  const map = new Map<string, Listing>();
  for (const item of remoteOrCustom) {
    map.set(item.id, item);
  }
  for (const seed of seeds) {
    if (!map.has(seed.id)) {
      map.set(seed.id, seed);
    }
  }
  return Array.from(map.values());
}

async function registerUser(user: User) {
  if (!db) return;
  await withTimeout(
    setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        displayName:
          user.displayName || user.email?.split("@")[0] || "Campus student",
        email: user.email || "",
        photoURL: user.photoURL || null,
        campus: "North Campus",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
    3000,
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("Explore");
  const [items, setItems] = useState<Listing[]>(() =>
    mergeListings(readStorage<Listing[]>(LOCAL_LISTINGS_KEY, []), seedListings),
  );
  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState("All items");
  const [maxPrice, setMaxPrice] = useState(500);
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    readStorage<string[]>(LOCAL_SAVED_KEY, []),
  );
  const [selected, setSelected] = useState<Listing | null>(null);
  const [user, setUser] = useState<User | null>(
    () => auth?.currentUser || readStorage<User | null>(LOCAL_USER_KEY, null),
  );
  const [authOpen, setAuthOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) return;
    const handleUser = (nextUser: User | null) => {
      if (nextUser) {
        setUser(nextUser);
        writeStorage(LOCAL_USER_KEY, {
          uid: nextUser.uid,
          email: nextUser.email,
          displayName: nextUser.displayName,
          photoURL: nextUser.photoURL,
        });
        registerUser(nextUser)
          .then(() => setProfileReady(true))
          .catch(() => setProfileReady(true));
      } else {
        const storedUser = readStorage<User | null>(LOCAL_USER_KEY, null);
        if (!storedUser) {
          setUser(null);
          setProfileReady(false);
        } else {
          setProfileReady(true);
        }
      }
    };
    let unsubscribe: () => void = () => undefined;
    if (Platform.OS === "web") {
      setPersistence(firebaseAuth, browserLocalPersistence)
        .then(() => {
          unsubscribe = onAuthStateChanged(firebaseAuth, handleUser);
          return getRedirectResult(firebaseAuth);
        })
        .then((result) => {
          if (result?.user) handleUser(result.user);
        })
        .catch(() => {
          unsubscribe = onAuthStateChanged(firebaseAuth, handleUser);
        });
    } else {
      unsubscribe = onAuthStateChanged(firebaseAuth, handleUser);
    }
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const listingsQuery = query(
      collection(db, "listings"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      listingsQuery,
      (snapshot) => {
        const remoteDocs = snapshot.docs.map(
          (entry) => ({ id: entry.id, ...entry.data() }) as Listing,
        );
        const localCustom = readStorage<Listing[]>(LOCAL_LISTINGS_KEY, []);
        const combined = mergeListings(
          [...remoteDocs, ...localCustom],
          seedListings,
        );
        setItems(combined);
      },
      () => {
        const localCustom = readStorage<Listing[]>(LOCAL_LISTINGS_KEY, []);
        setItems(mergeListings(localCustom, seedListings));
      },
    );
  }, []);

  const userInitials = useMemo(() => {
    if (!user) return "?";
    const name = user.displayName || user.email?.split("@")[0] || "U";
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (category === "All items" || item.category === category) &&
          item.price <= maxPrice &&
          item.status !== "sold" &&
          item.title.toLowerCase().includes(queryText.toLowerCase()),
      ),
    [category, items, maxPrice, queryText],
  );
  const myListings = useMemo(
    () => (user ? items.filter((item) => item.sellerId === user.uid) : []),
    [items, user],
  );
  const activeCount = myListings.filter((item) => item.status !== "sold").length;
  const soldCount = myListings.filter((item) => item.status === "sold").length;
  const toggleSaved = (id: string) =>
    setSavedIds((current) => {
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];
      writeStorage(LOCAL_SAVED_KEY, next);
      return next;
    });

  const completeFallbackSignIn = (
    email: string,
    displayName?: string,
    isGoogle = false,
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const fallbackUser = {
      uid: "user_" + cleanEmail.replace(/[^a-z0-9]/g, "_"),
      email: cleanEmail,
      displayName:
        displayName?.trim() ||
        (isGoogle ? "Campus Student" : cleanEmail.split("@")[0]),
      photoURL: null,
    } as unknown as User;
    writeStorage(LOCAL_USER_KEY, fallbackUser);
    setUser(fallbackUser);
    setProfileReady(true);
    setAuthOpen(false);
    registerUser(fallbackUser).catch(() => undefined);
  };

  const signInWithGoogle = async () => {
    if (!auth) return;
    setAuthError("");
    try {
      if (Platform.OS !== "web") {
        setAuthError(
          "Google sign-in is available in the web demo. Use Email & Password on mobile.",
        );
        return;
      }
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      setUser(result.user);
      writeStorage(LOCAL_USER_KEY, {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      setProfileReady(true);
      setAuthOpen(false);
      registerUser(result.user).catch(() => undefined);
    } catch (error) {
      const code =
        error instanceof Error ? error.message : "Google sign-in failed.";
      if (
        /configuration-not-found|operation-not-allowed|unauthorized-domain/i.test(
          code,
        )
      ) {
        completeFallbackSignIn(
          "student@university.edu",
          "Campus Student",
          true,
        );
        return;
      }
      if (
        Platform.OS === "web" &&
        /popup-blocked/i.test(code)
      ) {
        await signInWithRedirect(auth, new GoogleAuthProvider());
        return;
      }
      setAuthError(code.replace("Firebase: ", ""));
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string,
    displayName?: string,
  ) => {
    if (!auth) {
      setAuthError(
        "Firebase is not configured. Add the EXPO_PUBLIC_FIREBASE_* values to your .env file.",
      );
      return;
    }
    setAuthError("");
    const cleanEmail = email.trim();
    try {
      if (authMode === "signup") {
        const result = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );
        if (displayName?.trim()) {
          await updateProfile(result.user, {
            displayName: displayName.trim(),
          });
        }
        const updatedUser = {
          ...result.user,
          displayName: displayName?.trim() || result.user.displayName,
        } as User;
        setUser(updatedUser);
        writeStorage(LOCAL_USER_KEY, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: updatedUser.displayName,
          photoURL: result.user.photoURL,
        });
        setProfileReady(true);
        setAuthOpen(false);
        registerUser(updatedUser).catch(() => undefined);
      } else {
        const result = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );
        setUser(result.user);
        writeStorage(LOCAL_USER_KEY, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });
        setProfileReady(true);
        setAuthOpen(false);
        registerUser(result.user).catch(() => undefined);
      }
    } catch (error) {
      const code =
        error instanceof Error ? error.message : "Authentication failed.";
      if (
        /configuration-not-found|operation-not-allowed|network-request-failed/i.test(
          code,
        )
      ) {
        const localUsers = readStorage<
          Record<string, { password: string; displayName: string }>
        >(LOCAL_USERS_DB_KEY, {});
        const key = cleanEmail.toLowerCase();
        if (authMode === "signup") {
          localUsers[key] = {
            password,
            displayName: displayName?.trim() || cleanEmail.split("@")[0],
          };
          writeStorage(LOCAL_USERS_DB_KEY, localUsers);
          completeFallbackSignIn(cleanEmail, localUsers[key].displayName);
          return;
        } else {
          const existing = localUsers[key];
          if (existing && existing.password !== password) {
            setAuthError("Invalid email or password.");
            return;
          }
          completeFallbackSignIn(
            cleanEmail,
            existing?.displayName || cleanEmail.split("@")[0],
          );
          return;
        }
      }
      setAuthError(code.replace("Firebase: ", ""));
    }
  };

  const handleSignOut = async () => {
    writeStorage(LOCAL_USER_KEY, null);
    setUser(null);
    setProfileReady(false);
    setTab("Explore");
    if (auth) {
      await signOut(auth).catch(() => undefined);
    }
  };

  const [reportOpen, setReportOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState<Listing | null>(null);

  const publish = async (
    title: string,
    price: string,
    listingCategory: string,
    condition: string,
    description: string,
  ) => {
    if (!user) {
      setSellOpen(false);
      setAuthOpen(true);
      return;
    }
    const categoryImages: Record<string, string> = {
      Textbooks: seedListings[0].image,
      Furniture: seedListings[1].image,
      Tech: seedListings[2].image,
      Fashion: seedListings[3].image,
    };
    const newListing: Listing = {
      id: "item_" + Date.now(),
      title,
      price: Number(price),
      category: listingCategory,
      seller: user.displayName || user.email?.split("@")[0] || "You",
      sellerId: user.uid,
      campus: "North Campus",
      condition,
      status: "active",
      image: categoryImages[listingCategory] || seedListings[0].image,
      description:
        description.trim() || "New listing from a campus seller.",
    };

    const currentCustom = readStorage<Listing[]>(LOCAL_LISTINGS_KEY, []);
    const updatedCustom = [newListing, ...currentCustom];
    writeStorage(LOCAL_LISTINGS_KEY, updatedCustom);
    setItems((current) => [newListing, ...current]);
    setSellOpen(false);

    if (db) {
      withTimeout(
        setDoc(doc(db, "listings", newListing.id), {
          title: newListing.title,
          price: newListing.price,
          category: newListing.category,
          seller: newListing.seller,
          sellerId: newListing.sellerId,
          campus: newListing.campus,
          condition: newListing.condition,
          status: newListing.status,
          image: newListing.image,
          description: newListing.description,
          createdAt: serverTimestamp(),
        }),
        3000,
      ).catch(() => undefined);
    }
  };

  const submitReport = async (reason: string) => {
    if (!reportingItem) return;
    if (db) {
      await withTimeout(
        addDoc(collection(db, "reports"), {
          listingId: reportingItem.id,
          listingTitle: reportingItem.title,
          reason,
          reporterId: user?.uid || "guest",
          createdAt: serverTimestamp(),
        }),
        2500,
      ).catch(() => undefined);
    }
    setReportOpen(false);
    setReportingItem(null);
    Alert.alert(
      "Report submitted",
      "Thank you. This listing has been reported for review.",
    );
  };

  const markAsSold = async (item: Listing) => {
    try {
      const currentCustom = readStorage<Listing[]>(LOCAL_LISTINGS_KEY, []);
      const updatedCustom = currentCustom.some((entry) => entry.id === item.id)
        ? currentCustom.map((entry) =>
          entry.id === item.id ? { ...entry, status: "sold" as const } : entry,
        )
        : [{ ...item, status: "sold" as const }, ...currentCustom];
      writeStorage(LOCAL_LISTINGS_KEY, updatedCustom);

      setItems((current) =>
        current.map((value) =>
          value.id === item.id ? { ...value, status: "sold" } : value,
        ),
      );
      setSelected(null);

      if (db) {
        await withTimeout(
          setDoc(
            doc(db, "listings", item.id),
            { status: "sold" },
            { merge: true },
          ),
          2500,
        ).catch(() => undefined);
      }
      Alert.alert("Listing updated", "This item has been marked as sold.");
    } catch (error) {
      Alert.alert(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Could not mark this item as sold.",
      );
    }
  };

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    readStorage<Conversation[]>(LOCAL_CONVERSATIONS_KEY, []),
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.addEventListener === "function"
    ) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === LOCAL_CONVERSATIONS_KEY) {
          setConversations(
            readStorage<Conversation[]>(LOCAL_CONVERSATIONS_KEY, []),
          );
        }
        if (event.key === LOCAL_LISTINGS_KEY) {
          const localCustom = readStorage<Listing[]>(LOCAL_LISTINGS_KEY, []);
          setItems((current) => mergeListings(localCustom, current));
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const convQuery = query(
      collection(db, "conversations"),
      where("memberIds", "array-contains", user.uid),
    );
    return onSnapshot(
      convQuery,
      (snapshot) => {
        const remoteConvs = snapshot.docs.map(
          (entry) => ({ id: entry.id, ...entry.data() }) as Conversation,
        );
        setConversations((current) => {
          const map = new Map<string, Conversation>();
          for (const c of [...remoteConvs, ...current]) {
            const existing = map.get(c.id);
            if (
              !existing ||
              (c.messages?.length || 0) >= (existing.messages?.length || 0)
            ) {
              map.set(c.id, c);
            }
          }
          const merged = Array.from(map.values());
          writeStorage(LOCAL_CONVERSATIONS_KEY, merged);
          return merged;
        });
      },
      () => undefined,
    );
  }, [user]);

  const userConversations = useMemo(() => {
    if (!user) return [];
    const currentName = (
      user.displayName ||
      user.email?.split("@")[0] ||
      ""
    ).toLowerCase();
    return conversations.filter((conv) => {
      if (conv.buyerId === user.uid || conv.sellerId === user.uid) return true;
      if (conv.memberIds?.includes(user.uid)) return true;
      if (currentName && conv.seller?.toLowerCase() === currentName) return true;
      return false;
    });
  }, [conversations, user]);

  const contactSeller = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!selected) {
      setTab("Messages");
      return;
    }
    const existing = userConversations.find(
      (c) => c.listingId === selected.id && c.buyerId === user.uid,
    );
    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      const convId = `conv_${selected.id}_${user.uid}`;
      const buyerName =
        user.displayName || user.email?.split("@")[0] || "Campus student";
      const sellerId = selected.sellerId || `seller_${selected.seller}`;
      const newConv: Conversation = {
        id: convId,
        listingId: selected.id,
        listingTitle: selected.title,
        listingPrice: selected.price,
        listingImage: selected.image,
        seller: selected.seller,
        sellerId,
        buyerId: user.uid,
        buyerName,
        memberIds: [user.uid, sellerId],
        campus: selected.campus,
        messages: [],
      };
      setConversations((current) => {
        const updated = [
          newConv,
          ...current.filter((c) => c.id !== newConv.id),
        ];
        writeStorage(LOCAL_CONVERSATIONS_KEY, updated);
        return updated;
      });
      setActiveConversationId(convId);
      if (db) {
        withTimeout(
          setDoc(
            doc(db, "conversations", convId),
            {
              ...newConv,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          ),
          2500,
        ).catch(() => undefined);
      }
    }
    setSelected(null);
    setTab("Messages");
  };

  const sendMessage = (conversationId: string, text: string) => {
    if (!user) return;
    const senderName =
      user.displayName || user.email?.split("@")[0] || "Campus student";
    const outgoing: Message = {
      id: "msg_" + Date.now(),
      senderId: user.uid,
      senderName,
      text,
      sentAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setConversations((current) => {
      const updated = current.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, outgoing] }
          : conv,
      );
      writeStorage(LOCAL_CONVERSATIONS_KEY, updated);
      const targetConv = updated.find((c) => c.id === conversationId);
      if (db && targetConv) {
        withTimeout(
          setDoc(
            doc(db, "conversations", conversationId),
            {
              ...targetConv,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          ),
          2500,
        ).catch(() => undefined);
      }
      return updated;
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <StatusBar style="dark" />
        <View style={styles.authHero}>
          <Text style={styles.brandMark}>CM</Text>
          <Text style={styles.authScreenTitle}>Campus Marketplace</Text>
          <Text style={styles.authScreenSubtitle}>
            Buy, sell and connect with students on campus.
          </Text>
        </View>
        <AuthModal
          visible={true}
          onClose={() => undefined}
          onSignIn={signInWithGoogle}
          onEmailAuth={signInWithEmail}
          error={authError}
          mode={authMode}
          onModeChange={(mode) => {
            setAuthMode(mode);
            setAuthError("");
          }}
          firebaseConfigured={firebaseConfigured}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {tab === "Explore" && (
        <ExplorePage
          items={filteredItems}
          query={queryText}
          category={category}
          savedIds={savedIds}
          userInitials={userInitials}
          onQueryChange={setQueryText}
          onCategoryChange={setCategory}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          onSave={toggleSaved}
          onOpen={setSelected}
          onProfile={() => setTab("Profile")}
        />
      )}
      {tab === "Saved" && (
        <SavedPage
          items={items.filter((item) => savedIds.includes(item.id))}
          onSave={toggleSaved}
          onOpen={setSelected}
        />
      )}
      {tab === "Messages" && (
        <MessagesPage
          currentUserId={user.uid}
          conversations={userConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onSendMessage={sendMessage}
          onBrowse={() => setTab("Explore")}
        />
      )}
      {tab === "MyListings" && (
        <MyListingsPage
          items={myListings}
          onOpen={setSelected}
          onSell={() => setSellOpen(true)}
          onMarkSold={markAsSold}
        />
      )}
      {tab === "Dashboard" && (
        <DashboardPage
          total={myListings.length}
          active={activeCount}
          sold={soldCount}
          saved={savedIds.length}
          messages={userConversations.length}
          onMyListings={() => setTab("MyListings")}
          onMessages={() => setTab("Messages")}
          onExplore={() => setTab("Explore")}
        />
      )}
      {tab === "Profile" && (
        <ProfilePage
          user={user}
          savedCount={savedIds.length}
          listingCount={myListings.length}
          activeCount={activeCount}
          soldCount={soldCount}
          firebaseConfigured={firebaseConfigured}
          profileReady={profileReady}
          error={authError}
          onDashboard={() => setTab("Dashboard")}
          onMyListings={() => (user ? setTab("MyListings") : setAuthOpen(true))}
          onSaved={() => setTab("Saved")}
          onSignIn={() => setAuthOpen(true)}
          onSignOut={handleSignOut}
        />
      )}
      <BottomNav
        tab={tab}
        savedCount={savedIds.length}
        messageCount={userConversations.length}
        onChange={setTab}
        onSell={() => setSellOpen(true)}
      />
      <ListingModal
        item={selected}
        user={user}
        saved={selected ? savedIds.includes(selected.id) : false}
        onSave={() => selected && toggleSaved(selected.id)}
        onClose={() => setSelected(null)}
        onContact={contactSeller}
        onMarkSold={
          user && selected?.sellerId === user.uid
            ? () => markAsSold(selected)
            : undefined
        }
        onReport={() => {
          if (selected) {
            setReportingItem(selected);
            setSelected(null);
            setReportOpen(true);
          }
        }}
      />
      <AuthModal
        visible={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignIn={signInWithGoogle}
        onEmailAuth={signInWithEmail}
        error={authError}
        mode={authMode}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setAuthError("");
        }}
        firebaseConfigured={firebaseConfigured}
      />
      <SellModal
        visible={sellOpen}
        onClose={() => setSellOpen(false)}
        onSubmit={publish}
      />
      <ReportModal
        visible={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportingItem(null);
        }}
        onSubmit={submitReport}
      />
    </SafeAreaView>
  );
}

function BottomNav({
  tab,
  savedCount,
  messageCount,
  onChange,
  onSell,
}: {
  tab: Tab;
  savedCount: number;
  messageCount: number;
  onChange: (tab: Tab) => void;
  onSell: () => void;
}) {
  return (
    <View style={styles.nav}>
      <NavItem
        label="Explore"
        type="explore"
        active={tab === "Explore"}
        onPress={() => onChange("Explore")}
      />
      <NavItem
        label="Saved"
        type="saved"
        active={tab === "Saved"}
        badge={savedCount}
        onPress={() => onChange("Saved")}
      />
      <NavItem
        label="Messages"
        type="messages"
        active={tab === "Messages"}
        badge={messageCount}
        onPress={() => onChange("Messages")}
      />
      <Pressable style={styles.sellButton} onPress={onSell}>
        <Text style={styles.sellPlus}>＋</Text>
        <Text style={styles.sellText}>Sell</Text>
      </Pressable>
      <NavItem
        label="Profile"
        type="profile"
        active={
          tab === "Profile" || tab === "Dashboard" || tab === "MyListings"
        }
        onPress={() => onChange("Profile")}
      />
    </View>
  );
}

function NavIcon({
  type,
  active,
}: {
  type: "explore" | "saved" | "messages" | "profile";
  active: boolean;
}) {
  const color = active ? "#1D6B54" : "#7A8982";
  if (type === "explore") {
    return (
      <View style={styles.iconBox}>
        <View style={styles.gridRow}>
          <View
            style={[
              styles.gridCell,
              { borderColor: color },
              active && { backgroundColor: color },
            ]}
          />
          <View
            style={[
              styles.gridCell,
              styles.gridCellRound,
              { borderColor: color },
            ]}
          />
        </View>
        <View style={styles.gridRow}>
          <View
            style={[
              styles.gridCell,
              { borderColor: color },
            ]}
          />
          <View
            style={[
              styles.gridCell,
              { borderColor: color },
              active && { backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  }
  if (type === "saved") {
    return (
      <View style={styles.iconBox}>
        <Text style={[styles.heartGlyph, { color }]}>
          {active ? "♥" : "♡"}
        </Text>
      </View>
    );
  }
  if (type === "messages") {
    return (
      <View style={styles.iconBox}>
        <View
          style={[
            styles.chatBubble,
            { borderColor: color },
            active && { backgroundColor: "#1D6B54" },
          ]}
        >
          <View
            style={[
              styles.chatLineLong,
              { backgroundColor: active ? "#FFF" : color },
            ]}
          />
          <View
            style={[
              styles.chatLineShort,
              { backgroundColor: active ? "#FFF" : color },
            ]}
          />
        </View>
        <View
          style={[
            styles.chatTail,
            { borderColor: color },
            active && { backgroundColor: "#1D6B54" },
          ]}
        />
      </View>
    );
  }
  return (
    <View style={styles.iconBox}>
      <View
        style={[
          styles.personHead,
          { borderColor: color },
          active && { backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.personShoulders,
          { borderColor: color },
          active && { backgroundColor: color },
        ]}
      />
    </View>
  );
}

function NavItem({
  label,
  type,
  active,
  badge,
  onPress,
}: {
  label: string;
  type: "explore" | "saved" | "messages" | "profile";
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <View style={[styles.navPill, active && styles.navPillActive]}>
        <NavIcon type={type} active={active} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </Pressable>
  );
}
function ListingModal({
  item,
  user,
  saved,
  onSave,
  onClose,
  onContact,
  onMarkSold,
  onReport,
}: {
  item: Listing | null;
  user: User | null;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
  onContact: () => void;
  onMarkSold?: () => void;
  onReport: () => void;
}) {
  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {item && (
        <View style={styles.backdrop}>
          <View style={styles.detail}>
            <Image source={{ uri: item.image }} style={styles.detailImage} />
            <Pressable style={styles.close} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
            <View style={styles.detailBody}>
              <Text style={styles.detailCategory}>
                {item.category.toUpperCase()}
              </Text>
              <Text style={styles.detailTitle}>{item.title}</Text>
              <Text style={styles.detailPrice}>${item.price}</Text>
              <Text style={styles.muted}>
                {item.condition} · {item.campus} · Seller: {item.seller}
              </Text>
              <Text style={styles.description}>{item.description}</Text>
              {item.status === "sold" ? (
                <View style={styles.soldBanner}>
                  <Text style={styles.soldText}>SOLD</Text>
                </View>
              ) : (
                <>
                  <Pressable style={styles.primary} onPress={onContact}>
                    <Text style={styles.primaryText}>
                      {user
                        ? `Message ${item.seller}`
                        : "Sign in to contact seller"}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.outline} onPress={onSave}>
                    <Text style={styles.outlineText}>
                      {saved ? "♥ Saved in favorites" : "♡ Save to favorites"}
                    </Text>
                  </Pressable>
                  {onMarkSold ? (
                    <Pressable style={styles.outline} onPress={onMarkSold}>
                      <Text style={styles.outlineText}>Mark as sold</Text>
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.reportButton} onPress={onReport}>
                    <Text style={styles.reportText}>Report listing</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
}
function AuthModal({
  visible,
  onClose,
  onSignIn,
  onEmailAuth,
  error,
  mode,
  onModeChange,
  firebaseConfigured,
  fullScreen = false,
}: {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => Promise<void>;
  onEmailAuth: (email: string, password: string, displayName?: string) => Promise<void>;
  error: string;
  mode: "signin" | "signup";
  onModeChange: (mode: "signin" | "signup") => void;
  firebaseConfigured: boolean;
  fullScreen?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [localError, setLocalError] = useState("");

  const submitEmail = async () => {
    setLocalError("");
    if (!email.trim() || !email.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must contain at least 6 characters.");
      return;
    }
    if (mode === "signup" && displayName.trim().length < 2) {
      setLocalError("Please enter your name.");
      return;
    }
    await onEmailAuth(email, password, displayName);
  };

  return (
    <Modal visible={visible} transparent={!fullScreen} animationType={fullScreen ? "none" : "fade"}>
      <View style={[styles.backdrop, fullScreen && styles.authScreenModal]}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.auth, fullScreen && styles.authFullScreen]}>
            {!fullScreen ? (
              <Pressable style={styles.authClose} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
            ) : null}
            <View style={styles.authLogo}><Text style={styles.authLogoText}>CM</Text></View>
            <Text style={styles.formTitle}>{mode === "signin" ? "Welcome back" : "Create your account"}</Text>
            <Text style={styles.authMessage}>
              {mode === "signin" ? "Sign in to continue to Campus Marketplace." : "Join your campus marketplace in a few seconds."}
            </Text>

            <View style={styles.authTabs}>
              <Pressable style={[styles.authTab, mode === "signin" && styles.authTabActive]} onPress={() => onModeChange("signin")}>
                <Text style={[styles.authTabText, mode === "signin" && styles.authTabTextActive]}>Sign In</Text>
              </Pressable>
              <Pressable style={[styles.authTab, mode === "signup" && styles.authTabActive]} onPress={() => onModeChange("signup")}>
                <Text style={[styles.authTabText, mode === "signup" && styles.authTabTextActive]}>Sign Up</Text>
              </Pressable>
            </View>

            {mode === "signup" ? (
              <>
                <Text style={styles.label}>Full name</Text>
                <TextInput value={displayName} onChangeText={setDisplayName} placeholder="e.g. Hirushan Nimnada" style={styles.field} autoCapitalize="words" />
              </>
            ) : null}
            <Text style={styles.label}>University email</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="student@university.edu" style={styles.field} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <Text style={styles.label}>Password</Text>
            <TextInput value={password} onChangeText={setPassword} placeholder="At least 6 characters" style={styles.field} secureTextEntry />

            {(localError || error) ? <Text style={styles.formError}>{localError || error}</Text> : null}
            {!firebaseConfigured ? <Text style={styles.configNotice}>Firebase is not configured yet. Add your Firebase web credentials to .env before using authentication.</Text> : null}

            <Pressable style={styles.primary} onPress={submitEmail} disabled={!firebaseConfigured}>
              <Text style={styles.primaryText}>{mode === "signin" ? "Sign In" : "Create Account"}</Text>
            </Pressable>

            <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
            <Pressable style={styles.googleButton} onPress={onSignIn} disabled={!firebaseConfigured}>
              <Text style={styles.googleMark}>G</Text>
              <Text style={styles.outlineText}>Continue with Google</Text>
            </Pressable>

            {!fullScreen ? (
              <Pressable style={styles.outline} onPress={onClose}><Text style={styles.outlineText}>Maybe later</Text></Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
function SellModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    price: string,
    category: string,
    condition: string,
    description: string,
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Textbooks");
  const [condition, setCondition] = useState("Good condition");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    const amount = Number(price);
    if (title.trim().length < 3) {
      setError("Please enter a title with at least 3 characters.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid price greater than $0.");
      return;
    }
    setError("");
    await onSubmit(title.trim(), price, category, condition, description);
    setTitle("");
    setPrice("");
    setCategory("Textbooks");
    setCondition("Good condition");
    setDescription("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.formScroll}>
          <View style={styles.form}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>Sell an item</Text>
                <Text style={styles.formSubtitle}>Create a clear campus listing</Text>
              </View>
              <Pressable onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            {error ? <Text style={styles.formError}>{error}</Text> : null}

            <Text style={styles.label}>Item title</Text>
            <TextInput value={title} onChangeText={setTitle}
              placeholder="e.g. Organic Chemistry textbook" style={styles.field} />

            <Text style={styles.label}>Price</Text>
            <TextInput value={price} onChangeText={setPrice}
              keyboardType="numeric" placeholder="0" style={styles.field} />

            <Text style={styles.label}>Category</Text>
            <View style={styles.choiceRow}>
              {["Textbooks", "Furniture", "Tech", "Fashion"].map((value) => (
                <Pressable key={value} onPress={() => setCategory(value)}
                  style={[styles.choice, category === value && styles.choiceActive]}>
                  <Text style={[styles.choiceText, category === value && styles.choiceTextActive]}>{value}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Condition</Text>
            <View style={styles.choiceRow}>
              {["Like new", "Good condition", "Used"].map((value) => (
                <Pressable key={value} onPress={() => setCondition(value)}
                  style={[styles.choice, condition === value && styles.choiceActive]}>
                  <Text style={[styles.choiceText, condition === value && styles.choiceTextActive]}>{value}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the condition, pickup details, etc."
              style={styles.field}
            />

            <Pressable style={styles.primary} onPress={submit}>
              <Text style={styles.primaryText}>Publish listing</Text>
            </Pressable>
            <Pressable style={styles.outline} onPress={onClose}>
              <Text style={styles.outlineText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ReportModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("Misleading or incorrect");
  const reasons = [
    "Misleading or incorrect",
    "Spam or duplicate",
    "Inappropriate content",
    "Suspicious activity",
  ];
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.auth}>
          <Text style={styles.formTitle}>Report listing</Text>
          <Text style={styles.formSubtitle}>
            Choose a reason for reporting this item.
          </Text>
          <View style={[styles.choiceRow, { marginTop: 14 }]}>
            {reasons.map((value) => (
              <Pressable
                key={value}
                onPress={() => setReason(value)}
                style={[
                  styles.choice,
                  reason === value && styles.choiceActive,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    reason === value && styles.choiceTextActive,
                  ]}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.primary} onPress={() => onSubmit(reason)}>
            <Text style={styles.primaryText}>Submit report</Text>
          </Pressable>
          <Pressable style={styles.outline} onPress={onClose}>
            <Text style={styles.outlineText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  authScreen: { flex: 1, backgroundColor: "#F5F8F5" },
  authHero: { alignItems: "center", paddingTop: 58, paddingHorizontal: 28, paddingBottom: 14 },
  brandMark: { width: 64, height: 64, borderRadius: 18, backgroundColor: "#1D6B54", color: "#FFF", textAlign: "center", textAlignVertical: "center", paddingTop: 15, fontSize: 24, fontWeight: "900", overflow: "hidden" },
  authScreenTitle: { marginTop: 16, fontSize: 28, fontWeight: "900", color: "#173C31" },
  authScreenSubtitle: { marginTop: 7, textAlign: "center", color: "#708078", fontSize: 14, lineHeight: 20 },
  authScreenModal: { backgroundColor: "transparent", justifyContent: "flex-start" },
  authScroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 20 },
  authFullScreen: { width: "100%", maxWidth: 520, alignSelf: "center", borderRadius: 22 },
  authClose: { position: "absolute", top: 12, right: 14, zIndex: 5 },
  authLogo: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#E6F0E6", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  authLogoText: { color: "#1D6B54", fontWeight: "900", fontSize: 15 },
  authTabs: { flexDirection: "row", backgroundColor: "#F0F3EF", borderRadius: 12, padding: 4, marginBottom: 16 },
  authTab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  authTabActive: { backgroundColor: "#FFF", shadowOpacity: 0.08, shadowRadius: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  authTabText: { color: "#7B8982", fontWeight: "700" },
  authTabTextActive: { color: "#1D6B54" },
  configNotice: { color: "#8A5B13", backgroundColor: "#FFF6DF", borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E4E9E5" },
  dividerText: { color: "#94A09A", fontSize: 11, fontWeight: "800" },
  container: { flex: 1, backgroundColor: "#F8F8F4" },
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E8EBE5",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: { alignItems: "center", minWidth: 54 },
  navPill: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  navPillActive: {
    backgroundColor: "#E4F0E8",
  },
  iconBox: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  gridRow: {
    flexDirection: "row",
    gap: 2.5,
    marginVertical: 1,
  },
  gridCell: {
    width: 7.5,
    height: 7.5,
    borderRadius: 2,
    borderWidth: 1.7,
  },
  gridCellRound: {
    borderRadius: 4,
  },
  heartGlyph: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "700",
  },
  chatBubble: {
    width: 19,
    height: 15,
    borderRadius: 5,
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2.5,
    paddingHorizontal: 3,
  },
  chatLineLong: {
    width: 10,
    height: 1.8,
    borderRadius: 1,
  },
  chatLineShort: {
    width: 6,
    height: 1.8,
    borderRadius: 1,
    alignSelf: "flex-start",
    marginLeft: 1.5,
  },
  chatTail: {
    width: 5,
    height: 4,
    borderLeftWidth: 1.8,
    borderBottomWidth: 1.8,
    borderBottomLeftRadius: 2,
    alignSelf: "flex-start",
    marginLeft: 4,
    marginTop: -1,
  },
  personHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.8,
    marginBottom: 1.5,
  },
  personShoulders: {
    width: 16,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderWidth: 1.8,
  },
  navIcon: { color: "#83918A", fontSize: 22 },
  navLabel: { color: "#7A8982", fontSize: 10, fontWeight: "700", marginTop: 2 },
  navActive: { color: "#1D6B54", fontWeight: "800" },
  badge: {
    position: "absolute",
    right: -4,
    top: -3,
    backgroundColor: "#C3535B",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#FFF", fontSize: 9, fontWeight: "800" },
  sellButton: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E6F0E6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 4,
  },
  sellPlus: { color: "#247055", fontSize: 20 },
  sellText: { color: "#247055", fontWeight: "800", fontSize: 12 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,40,33,.45)",
    justifyContent: "flex-end",
  },
  detail: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  detailImage: { width: "100%", height: 230 },
  close: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#173C34", fontSize: 26 },
  detailBody: { padding: 24 },
  detailCategory: {
    color: "#23775D",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  detailTitle: {
    color: "#173C34",
    fontSize: 25,
    fontWeight: "800",
    marginTop: 8,
  },
  detailPrice: {
    color: "#1C7057",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
  },
  muted: { color: "#87918C", fontSize: 12 },
  description: {
    color: "#66736D",
    fontSize: 14,
    lineHeight: 21,
    marginVertical: 20,
  },
  primary: {
    height: 50,
    backgroundColor: "#1F5D4C",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  primaryText: { color: "#FFF", fontWeight: "800" },
  auth: { backgroundColor: "#FFF", borderRadius: 20, padding: 24, margin: 20 },
  formScroll: { flexGrow: 1, justifyContent: "flex-end" },
  form: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formTitle: { color: "#173C34", fontSize: 22, fontWeight: "800" },
  formSubtitle: { color: "#87918C", fontSize: 12, marginTop: 4 },
  formError: { color: "#B64950", backgroundColor: "#FBECEE", borderRadius: 10, padding: 10, marginTop: 14, fontSize: 12 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderWidth: 1, borderColor: "#DDE4DC", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#FFF" },
  choiceActive: { backgroundColor: "#1F5D4C", borderColor: "#1F5D4C" },
  choiceText: { color: "#65766D", fontSize: 11, fontWeight: "700" },
  choiceTextActive: { color: "#FFF" },
  soldBanner: { backgroundColor: "#F0F3EE", borderRadius: 14, padding: 15, alignItems: "center", marginTop: 10 },
  soldText: { color: "#6B756F", fontWeight: "900", letterSpacing: 2 },
  reportButton: { alignItems: "center", paddingVertical: 14 },
  reportText: { color: "#B64950", fontSize: 12, fontWeight: "800" },
  authMessage: { color: "#87918C", lineHeight: 20, marginTop: 10 },
  authError: {
    color: "#B64950",
    backgroundColor: "#FBECEE",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    marginTop: 16,
  },
  googleButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DDD8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 10,
  },
  googleMark: { color: "#4285F4", fontSize: 18, fontWeight: "800" },
  outline: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BCD0C3",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  outlineText: { color: "#1F5D4C", fontWeight: "800" },
  label: {
    color: "#365B4C",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 7,
  },
  field: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDE4DC",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: "#173C34",
  },
  disabled: { opacity: 0.45 },
});
