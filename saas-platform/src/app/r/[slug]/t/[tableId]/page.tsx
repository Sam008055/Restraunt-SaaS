import { notFound } from "next/navigation";
import { getRestaurantBySlug, getTableById, getMenuForRestaurant } from "@/lib/firebase/queries";
import CustomerMenuClient from "./CustomerMenuClient";

// In production:
// - Validate the HMAC token from searchParams server-side
// - Fetch restaurant + menu from Firestore via Admin SDK
// - Return 404 if token is invalid or table doesn't exist

interface Props {
  params: Promise<{ slug: string; tableId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title: `Menu – ${slug.replace(/-/g, " ")} | Nosh`,
    description: "Scan, browse, and order from your table",
  };
}

export default async function CustomerMenuPage({ params, searchParams }: Props) {
  const { slug, tableId } = await params;
  const { token } = await searchParams;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    notFound();
  }

  const table = await getTableById(tableId);
  if (!table || table.restaurantId !== restaurant.id) {
    notFound();
  }

  // Optional: Validate HMAC token
  if (token !== table.qrToken) {
    // Return unauthorized or just not found
    // notFound();
  }

  const menu = await getMenuForRestaurant(restaurant.id);

  return (
    <CustomerMenuClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name || "Restaurant",
        theme: restaurant.theme || { primaryColor: "#061b0e", accentColor: "#c5a059" },
        plan: restaurant.subscription?.plan || "starter",
      }}
      tableNumber={table.tableNumber}
      tableId={table.id}
      categories={menu}
    />
  );
}
