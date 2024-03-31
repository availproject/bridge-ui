// import type {
//   RewardData,
//   ClaimParams,
//   ClaimType,
//   ClaimStatus,
//   ClaimData,
// } from "@/@types/types";
// import { axiosInstance } from "./axios-instance";

// export class ClaimRepository {
//   static async checkRewards(
//     userId: string,
//     type: ClaimType,
//     message?: string,
//     timestamp?: string,
//   ): Promise<{ rewardData: RewardData }> {
//     const response = await axiosInstance
//       .post(`/check-rewards`, {
//         account: userId,
//         type,
//         timestamp,
//         signedMessage: message,
//       })
//       .catch((e) => {
//         return { data: {} };
//       });

//     const rewardData: RewardData = response.data;
//     return { rewardData };
//   }

//   static async claimRewards(
//     account: string,
//     type: ClaimType,
//     signedMessage: string,
//     timestamp: string,
//     claimAddress:  `0x${string}`
//   ): Promise<{ claimData: ClaimData }> {

//     const response = await axiosInstance
//       .post(`/claim-rewards`, {
//         account,
//         type,
//         signedMessage,
//         timestamp,
//         claimAddress,
//       })
//       .catch((e) => {
//         console.log(e);
//         return { data: {} };
//       });

//     const claimData: ClaimData = response.data;
//     return { claimData };
//   }

// }
