export interface Player {
  id: number;
  name: string;
  team: string;
  role: string;
  nationality: string;
  acquisition: string;
  price: string;
  status: string;
}

export interface Participant {
  id: number;
  name: string;
  budget: number;
}

export interface AuctionPlayer {
  player_id: number;
  status: "available" | "sold" | "unsold";
  sold_to: number | null;
  sold_price: number | null;
}
