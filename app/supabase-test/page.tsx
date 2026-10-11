
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupabaseTestPage() {
  const [result, setResult] = useState("Testing connection...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("team_members")
        .select("id")
        .limit(1);

      if (error) {
        setResult(`Connection test failed: ${error.message}`);
      } else {
        setResult("Supabase connection successful!");
      }
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Supabase Connection Test</h1>
      <p>{result}</p>
    </main>
  );
}
