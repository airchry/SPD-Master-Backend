import supabase from "./supabase.js"; // your existing supabase client

async function testConnection() {
  try {
    // Try fetching a single row from a small table
    const { data, error } = await supabase
      .from("logindata")   // or any small table
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase error:", error);
    } else {
      console.log("Supabase connected! Sample data:", data);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

testConnection();
