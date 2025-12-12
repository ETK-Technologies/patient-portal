import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.BASE_URL;

/**
 * API endpoint to add a single item to the WooCommerce cart
 * Supports both simple and variable products with quantity
 */
export async function POST(req) {
    try {
        const {
            productId,
            variationId,
            quantity = 1,
            size,
            color,
            meta_data = [],
        } = await req.json();

        const cookieStore = await cookies();
        const encodedCredentials = cookieStore.get("authToken");

        if (!encodedCredentials) {
            return NextResponse.json(
                {
                    error: "User not authenticated",
                },
                { status: 401 }
            );
        }

        // Validate required fields
        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        // Ensure quantity is a positive integer
        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            return NextResponse.json(
                { error: "Invalid quantity. Must be a positive integer." },
                { status: 400 }
            );
        }

        // Prepare cart data
        // For variable products, use the variation ID as the product ID
        const cartData = {
            id: variationId || productId,
            quantity: parsedQuantity,
        };

        // Add variation ID separately if provided (for variable products)
        if (variationId) {
            cartData.variation_id = variationId;
        }

        // Add size/color attributes if provided (for variable products)
        if (size || color) {
            const attributes = [];
            if (size) {
                attributes.push({
                    attribute: "pa_size",
                    value: size.toLowerCase(),
                });
            }
            if (color) {
                attributes.push({
                    attribute: "pa_color",
                    value: color.toLowerCase(),
                });
            }
            cartData.item_data = { attributes };
        }

        // Add any custom meta data
        if (meta_data && meta_data.length > 0) {
            cartData.meta_data = meta_data;
        }

        console.log("[Add to Cart API] Request data:", {
            productId,
            variationId,
            quantity: parsedQuantity,
            size,
            color,
        });

        // Get cart nonce from cookies, or fetch cart to get a fresh nonce
        let cartNonce = cookieStore.get("cart-nonce")?.value;

        if (!cartNonce) {
            console.log("[Add to Cart API] No nonce found, fetching cart to get nonce...");

            // Fetch cart to get a fresh nonce
            const cartResponse = await fetch(`${BASE_URL}/wp-json/wc/store/cart`, {
                method: "GET",
                headers: {
                    Authorization: `${encodedCredentials.value}`,
                },
            });

            // Get nonce from response headers
            const freshNonce = cartResponse.headers.get("nonce");
            if (freshNonce) {
                cartNonce = freshNonce;
                cookieStore.set("cart-nonce", freshNonce, {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 60 * 60 * 24, // 24 hours
                });
                console.log("[Add to Cart API] Fresh nonce obtained:", freshNonce.substring(0, 8) + "...");
            } else {
                console.warn("[Add to Cart API] Failed to obtain nonce from cart endpoint");
            }
        }

        // Prepare headers for WooCommerce Store API
        const headers = {
            Authorization: `${encodedCredentials.value}`,
            "Content-Type": "application/json",
        };

        // Add nonce if available
        if (cartNonce) {
            headers["Nonce"] = cartNonce;
            headers["X-WC-Store-API-Nonce"] = cartNonce;
        } else {
            console.warn("[Add to Cart API] Proceeding without nonce - this may fail");
        }

        // Add item to cart using WooCommerce Store API
        const response = await fetch(
            `${BASE_URL}/wp-json/wc/store/cart/add-item`,
            {
                method: "POST",
                headers,
                body: JSON.stringify(cartData),
            }
        );

        const responseData = await response.json();

        // Store updated cart nonce for future requests
        const responseNonce = response.headers.get("nonce");
        if (responseNonce) {
            cookieStore.set("cart-nonce", responseNonce, {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 24 hours
            });
            console.log("[Add to Cart API] Updated nonce from response");
        }

        if (!response.ok) {
            console.error("[Add to Cart API] Error response:", responseData);
            return NextResponse.json(
                {
                    error: responseData?.message || "Failed to add item to cart",
                    details: responseData,
                },
                { status: response.status }
            );
        }

        console.log("[Add to Cart API] Success:", {
            items_count: responseData.items_count || responseData.items?.length || 0,
            total_price: responseData.totals?.total_price || 0,
        });

        return NextResponse.json({
            success: true,
            message: "Item added to cart successfully",
            cart: responseData,
        });
    } catch (error) {
        console.error("[Add to Cart API] Error:", error.message);

        return NextResponse.json(
            {
                error: "Failed to add item to cart",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

