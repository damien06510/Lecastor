import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://awmdqteqwlreifzhjhnu.supabase.co";
const supabaseAnonKey = "sb_publishable_fiB_d_fyxOrA_mBjYlGO0Q_Vfxtlo5v";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
