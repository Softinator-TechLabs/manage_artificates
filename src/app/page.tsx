import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Dashboard from "./dashboard/page";

export default async function Home() {
  const session = await getServerSession();
  
  if (!session) {
    redirect("/login");
  }

  return <Dashboard />;
}