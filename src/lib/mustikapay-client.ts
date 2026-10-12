/**
 * Client-Side MustikaPay Helper
 * Dijalankan langsung dari browser pengguna di Indonesia untuk menghindari
 * blokir Cloudflare WAF 403 pada serverless IP luar negeri (Vercel/AWS).
 */

const MUSTIKAPAY_API_KEY = "MP-Em7HZVcFmajqkMO8rhk-JPtJeBK6G4Pz";

export interface ClientQrisResult {
  gatewayRefId: string;
  qrString: string;
  qrImageUrl?: string;
  paymentUrl?: string;
}

export async function createClientQris(amount: number): Promise<ClientQrisResult | null> {
  try {
    const params = new URLSearchParams();
    params.append("amount", String(amount));

    const res = await fetch("https://mustikapayment.com/api/v1/create/qris", {
      method: "POST",
      headers: {
        "X-Api-Key": MUSTIKAPAY_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      console.warn("Client MustikaPay HTTP error:", res.status);
      return null;
    }

    const data = await res.json();
    if (data && (data.status?.toLowerCase() === "success" || data.qr_url)) {
      let qrString = data.qr_string || "";
      if (!qrString && data.qr_url) {
        try {
          const parsed = new URL(data.qr_url);
          qrString = parsed.searchParams.get("data") || data.qr_url;
        } catch {
          qrString = data.qr_url;
        }
      }

      return {
        gatewayRefId: data.ref_no,
        qrString: qrString || data.qr_url,
        qrImageUrl: data.qr_url,
        paymentUrl: data.payment_link,
      };
    }

    return null;
  } catch (err) {
    console.warn("Client MustikaPay error:", err);
    return null;
  }
}
