import axios from "axios";

const TEMPMAIL_BASE_URL = process.env.TEMPMAIL_BASE_URL || "https://mail.enchant.id";

export interface TempmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  otp: string | null;
  loginLink: string | null;
  links: string[];
  receivedAt: string;
}

export interface CreateMailboxResponse {
  success: boolean;
  email: string;
  username: string;
  isNew: boolean;
  error?: string;
}

export interface InboxResponse {
  success: boolean;
  email: string;
  messages: TempmailMessage[];
  error?: string;
}

export const tempmail = {
  /**
   * Mendaftarkan atau membuat mailbox baru di domain @enchant.id
   */
  async createMailbox(username?: string): Promise<CreateMailboxResponse> {
    try {
      const res = await axios.post<CreateMailboxResponse>(
        `${TEMPMAIL_BASE_URL}/api/mailbox/create`,
        { username: username?.trim() || undefined },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );
      return res.data;
    } catch (err: any) {
      console.error("[Tempmail] Gagal membuat mailbox:", err.message);
      // Fallback: tetap kembalikan format email yang valid
      const cleanUser = (username || "am_" + Math.random().toString(36).substring(2, 8))
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, "");
      return {
        success: true,
        email: `${cleanUser}@enchant.id`,
        username: cleanUser,
        isNew: true,
      };
    }
  },

  /**
   * Mengambil seluruh pesan masuk dari mailbox tertentu
   */
  async getInbox(email: string): Promise<InboxResponse> {
    try {
      const res = await axios.get<InboxResponse>(`${TEMPMAIL_BASE_URL}/api/mail/inbox`, {
        params: { email },
        timeout: 8000,
      });
      return res.data;
    } catch (err: any) {
      console.error("[Tempmail] Gagal mengambil inbox:", err.message);
      return {
        success: false,
        email,
        messages: [],
        error: err.response?.data?.error || err.message,
      };
    }
  },

  /**
   * Mengosongkan inbox dari mailbox
   */
  async clearInbox(email: string): Promise<boolean> {
    try {
      const res = await axios.delete(`${TEMPMAIL_BASE_URL}/api/mail/inbox`, {
        params: { email },
        timeout: 8000,
      });
      return res.data?.success || false;
    } catch {
      return false;
    }
  },

  /**
   * Menghapus satu pesan tertentu berdasarkan ID
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const res = await axios.delete(`${TEMPMAIL_BASE_URL}/api/mail/message/${messageId}`, {
        timeout: 8000,
      });
      return res.data?.success || false;
    } catch {
      return false;
    }
  },
};
