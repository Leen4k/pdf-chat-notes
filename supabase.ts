import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });

const supabaseUrl = "https://euyurgcncmvqsfoueric.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "";
export const supabase = createClient(
  supabaseUrl,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eXVyZ2NuY212cXNmb3VlcmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExNzA4NDcsImV4cCI6MjA0Njc0Njg0N30.GHqLi-TkM0VDxZae-LzgNlHVB4rfu10txFu4E02mTLg"
);
