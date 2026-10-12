import axios from "axios";

const BASE_URL = process.env.AMPRO_API_BASE_URL || "https://ampro.enchant.id/api";

export interface AmproStatusResponse {
  status: "online" | "offline";
  timestamp: string;
}

export interface AmproSendLinkResponse {
  success: boolean;
  email: string;
  message: string;
}

export interface AmproVerifyData {
  displayName: string;
  email: string;
  uid: string;
  status: string;
  membershipStatus: string;
  planName: string;
  subscriptionType: string;
  orderId: string;
  validUntil: string;
  validUntilTimestamp: number;
  idToken: string;
  refreshToken: string;
}

export interface AmproVerifyResponse {
  success: boolean;
  message: string;
  data?: AmproVerifyData;
}

export const ampro = {
  /**
   * Cek status server aktivator
   */
  async getStatus(): Promise<AmproStatusResponse> {
    try {
      const res = await axios.get<AmproStatusResponse>(`${BASE_URL}/status`, { timeout: 8000 });
      return res.data;
    } catch {
      return { status: "offline", timestamp: new Date().toISOString() };
    }
  },

  /**
   * Kirim magic link login Alight Motion ke email tujuan
   */
  async sendLink(email: string): Promise<AmproSendLinkResponse> {
    try {
      const res = await axios.post<AmproSendLinkResponse>(
        `${BASE_URL}/send-link`,
        { email },
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
      );
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal mengirim link ke email";
      throw new Error(msg);
    }
  },

  /**
   * Verifikasi magic link dan aktifkan lisensi Annual VIP
   */
  async verifyLink(email: string, magicLink: string, nickname?: string): Promise<AmproVerifyResponse> {
    try {
      const res = await axios.post<AmproVerifyResponse>(
        `${BASE_URL}/verify-link`,
        {
          email,
          magicLink,
          nickname: nickname || undefined,
        },
        { headers: { "Content-Type": "application/json" }, timeout: 20000 }
      );
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal verifikasi link lisensi";
      throw new Error(msg);
    }
  },

  /**
   * Ambil statistik aktivasi
   */
  async getStats(): Promise<{ total: number; today: number }> {
    try {
      const res = await axios.get(`${BASE_URL}/stats`, { timeout: 8000 });
      return res.data;
    } catch {
      return { total: 0, today: 0 };
    }
  },
};
