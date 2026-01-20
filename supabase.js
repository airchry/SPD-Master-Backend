import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config(); // load environment variables

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("SUPABASE_URL is required.");
if (!supabaseKey) throw new Error("SUPABASE_KEY is required.");

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
