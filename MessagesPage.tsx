import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState } from "../components/EmptyState";
import { PageTitle } from "../components/PageTitle";
import { Conversation } from "../types";

export function MessagesPage({
  currentUserId,
  conversations,
  activeConversationId,
  onSelectConversation,
  onSendMessage,
  onBrowse,
}: {
  currentUserId: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onSendMessage: (conversationId: string, text: string) => void;
  onBrowse: () => void;
}) {
  const [text, setText] = useState("");

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] ||
    null;

  const handleSend = () => {
    const content = text.trim();
    if (!content || !activeConversation) return;
    onSendMessage(activeConversation.id, content);
    setText("");
  };

  const getPartnerLabel = (conv: Conversation) => {
    if (conv.sellerId && conv.sellerId === currentUserId) {
      return `Buyer · ${conv.buyerName}`;
    }
    return `Seller · ${conv.seller}`;
  };

  const getPartnerName = (conv: Conversation) => {
    if (conv.sellerId && conv.sellerId === currentUserId) {
      return conv.buyerName;
    }
    return conv.seller;
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <PageTitle
        title="Messages"
        subtitle="Direct buyer and seller conversations"
      />

      {!activeConversation ? (
        <EmptyState
          title="Your inbox is quiet"
          message="Open any listing and tap 'Message seller' to start a conversation."
          action="Browse listings"
          onAction={onBrowse}
        />
      ) : (
        <>
          {conversations.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.threadTabs}
            >
              {conversations.map((conv) => {
                const isActive = conv.id === activeConversation.id;
                return (
                  <Pressable
                    key={conv.id}
                    onPress={() => onSelectConversation(conv.id)}
                    style={[
                      styles.threadTab,
                      isActive && styles.threadTabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.threadTabSeller,
                        isActive && styles.threadTabTextActive,
                      ]}
                    >
                      {getPartnerName(conv)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.threadTabItem,
                        isActive && styles.threadTabTextActive,
                      ]}
                    >
                      {conv.listingTitle}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.listingCard}>
            <Image
              source={{ uri: activeConversation.listingImage }}
              style={styles.listingImage}
            />
            <View style={styles.listingInfo}>
              <Text style={styles.listingSeller}>
                {getPartnerLabel(activeConversation)}
              </Text>
              <Text style={styles.listingTitle} numberOfLines={1}>
                {activeConversation.listingTitle}
              </Text>
              <Text style={styles.listingMeta}>
                ${activeConversation.listingPrice} · {activeConversation.campus}
              </Text>
            </View>
          </View>

          <View style={styles.thread}>
            {activeConversation.messages.length === 0 ? (
              <View style={styles.emptyThread}>
                <Text style={styles.emptyThreadText}>
                  No messages yet. Write a message below to{" "}
                  {getPartnerName(activeConversation)}.
                </Text>
              </View>
            ) : (
              activeConversation.messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.bubbleWrap,
                      isMine ? styles.bubbleWrapMine : styles.bubbleWrapSeller,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        isMine ? styles.bubbleMine : styles.bubbleSeller,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          isMine && styles.bubbleTextMine,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                    <Text style={styles.timestamp}>
                      {isMine ? "You" : msg.senderName} · {msg.sentAt}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleSend}
              placeholder={`Write a message to ${getPartnerName(activeConversation)}...`}
              placeholderTextColor="#8A958F"
              style={styles.input}
            />
            <Pressable
              style={[
                styles.sendButton,
                !text.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
            >
              <Text style={styles.sendText}>Send</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  threadTabs: { gap: 10, paddingBottom: 14 },
  threadTab: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8E2",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 180,
  },
  threadTabActive: {
    backgroundColor: "#1F5D4C",
    borderColor: "#1F5D4C",
  },
  threadTabSeller: {
    color: "#173C34",
    fontWeight: "800",
    fontSize: 13,
  },
  threadTabItem: {
    color: "#7B8982",
    fontSize: 11,
    marginTop: 2,
  },
  threadTabTextActive: {
    color: "#FFF",
  },
  listingCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E6E9E2",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  listingImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#E8ECE8",
  },
  listingInfo: { flex: 1 },
  listingSeller: {
    color: "#23775D",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  listingTitle: {
    color: "#173C34",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  listingMeta: {
    color: "#87918C",
    fontSize: 12,
    marginTop: 2,
  },
  emptyThread: {
    flex: 1,
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyThreadText: {
    color: "#87918C",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  thread: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8ECE6",
    padding: 16,
    gap: 14,
    minHeight: 240,
  },
  bubbleWrap: {
    maxWidth: "82%",
  },
  bubbleWrapSeller: {
    alignSelf: "flex-start",
  },
  bubbleWrapMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleSeller: {
    backgroundColor: "#EEF3EE",
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: "#1F5D4C",
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    color: "#1F3F35",
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: "#FFF",
  },
  timestamp: {
    color: "#94A09A",
    fontSize: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  composer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#DDE4DC",
    borderRadius: 14,
    paddingHorizontal: 14,
    color: "#173C34",
    backgroundColor: "#FFF",
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: "#1F5D4C",
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },
});
