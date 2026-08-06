import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withWorkspace } from "@/lib/workspace";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(withWorkspace(user ? "/dashboard" : "/login"));
}
