import { supabase } from "./supabase";
import type { ArticleBiasReport } from "./types";

export interface SavedReport {
  id: string;
  created_at: string;
  page_url: string;
  page_title: string;
  report: ArticleBiasReport;
}

export async function saveReport(
  pageUrl: string,
  pageTitle: string,
  report: ArticleBiasReport
): Promise<SavedReport> {
  const { data, error } = await supabase
    .from("bias_reports")
    .insert({ page_url: pageUrl, page_title: pageTitle, report })
    .select()
    .single();

  if (error) throw new Error(`Failed to save report: ${error.message}`);
  return data as SavedReport;
}

export async function getReports(limit = 20): Promise<SavedReport[]> {
  const { data, error } = await supabase
    .from("bias_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load reports: ${error.message}`);
  return (data ?? []) as SavedReport[];
}
