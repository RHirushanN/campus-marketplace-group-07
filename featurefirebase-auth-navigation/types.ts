export type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  seller: string;
  sellerId?: string;
  campus: string;
  condition: string;
  image: string;
  description?: string;
  status?: "active" | "sold";
};

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAt: string;
};

export type Conversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage: string;
  seller: string;
  sellerId?: string;
  buyerId: string;
  buyerName: string;
  memberIds: string[];
  campus: string;
  messages: Message[];
};

export type Tab =
  | "Explore"
  | "Saved"
  | "Messages"
  | "Profile"
  | "MyListings"
  | "Dashboard";
