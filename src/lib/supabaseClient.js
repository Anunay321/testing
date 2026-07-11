import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yenuflkoworoljgihwgx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbnVmbGtvd29yb2xqZ2lod2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NjQwMjgsImV4cCI6MjA5OTM0MDAyOH0.OntFadW-nqBvdSGkij0VAUhdDbm6t3muhw8hA8VZwjs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
