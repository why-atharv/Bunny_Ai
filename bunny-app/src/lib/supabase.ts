import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, ChatSession } from "../types";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  const url = (import.meta as any).env?.VITE_SUPABASE_URL;
  const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project")) return null;
  _client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _client;
}

export async function createSession(userLabel: string): Promise<ChatSession | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("chat_sessions")
    .insert({ user_label: userLabel })
    .select()
    .single();
  if (error) {
    console.warn("createSession", error);
    return null;
  }
  return data as ChatSession;
}

export async function listSessions(): Promise<ChatSession[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("chat_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.warn("listSessions", error);
    return [];
  }
  return (data || []) as ChatSession[];
}

export async function listMessages(sessionId: string): Promise<ChatMessage[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("listMessages", error);
    return [];
  }
  return (data || []) as ChatMessage[];
}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  language = "en"
): Promise<void> {
  const sb = getSupabase();
  if (!sb || !content.trim()) return;
  await sb.from("chat_messages").insert({
    session_id: sessionId,
    role,
    content,
    language,
  });
}

export async function countMemories(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  const { count } = await sb
    .from("chat_messages")
    .select("*", { count: "exact", head: true });
  return count || 0;
}