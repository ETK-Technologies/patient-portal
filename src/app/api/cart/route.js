import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.BASE_URL;

/**
 * GET cart - This also initializes/refreshes the cart nonce
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const encodedCredentials = cookieStore.get("authToken");

        if (!encodedCredentials) {
            console.log("[Cart API] User not authenticated");
            return NextResponse.json(
                {
                    items: [],
                    total_items: 0,
                    total_price: "0.00",
                    is_local_cart: true,
                },
                { status: 401 }
            );
        }

        console.log("[Cart API] Fetching cart to get nonce...");

        const response = await fetch(`${BASE_URL}/wp-json/wc/store/cart`, {
            method: "GET",
            headers: {
                Authorization: `${encodedCredentials.value}`,
            },
        });

        const cartData = await response.json();

        // Get nonce from response headers and store it
        const nonce = response.headers.get("nonce");
        if (nonce) {
            cookieStore.set("cart-nonce", nonce, {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 24 hours
            });
            console.log("[Cart API] Nonce stored:", nonce.substring(0, 8) + "...");
        }

        if (!response.ok) {
            throw new Error(cartData.message || "Failed to fetch cart");
        }

        console.log("[Cart API] Cart fetched successfully");
        return NextResponse.json(cartData);
    } catch (error) {
        console.error("[Cart API] Error:", error.message);
        return NextResponse.json(
            {
                error: "Failed to get cart",
                items: [],
                total_items: 0,
                total_price: "0.00",
            },
            { status: 500 }
        );
    }
}

