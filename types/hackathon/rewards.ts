// Rewards and Escrow Types

export interface AssignRanksRequest {
  ranks: Array<{
    participantId: string;
    rank: number;
  }>;
}

export interface AssignRanksResponse {
  success: true;
  data: {
    updated: number;
    participants: Array<{
      id: string;
      rank: number;
      projectName: string;
    }>;
  };
  message: string;
}
