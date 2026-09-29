/**
 * OmniSurv Forensic Engine API Client.
 * Connects frontend UI components to the unified FastAPI forensic backend (port 8000).
 * Handles bit-stream acquisition, carving progress, AI video analytics (Gemini/Groq),
 * chain-of-custody verification, and court-admissible PDF reports.
 */

const API_BASE_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
  ? `http://${window.location.hostname}:8000`
  : "http://localhost:8000";

export interface EvidenceUploadResponse {
  evidence_id: string;
  md5_hash: string;
  sha256_hash: string;
  detected_vendor: string;
  status: string;
  filename: string;
}

export interface EvidenceProgress {
  evidence_id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  bytes_scanned: number;
  total_bytes: number;
  progress_percent: number;
  signatures_found: number;
  clips_recovered: number;
  scan_rate_bytes_per_second: number;
}

export interface RecoveredClip {
  id?: string;
  clip_index: number;
  vendor: string;
  offset_start: number;
  offset_end: number;
  mp4_filename: string;
  mp4_path?: string;
  sha256: string;
  size_bytes?: number;
  detection_signature?: string;
  parsing_status?: string;
  ai_event_log?: string;
  stream_url?: string;
  camera_id?: string;
  created_at?: string;
}

export interface DeviceIdentification {
  identified_vendor: string;
  detected_file_system: string;
  confidence: number;
  matches: Array<{ vendor: string; fs: string; confidence: number }>;
  video_encoding: string;
  audio_encoding: string;
  recommended_carvers: string[];
}

export interface OemComparisonItem {
  oem: string;
  proprietary_fs: string;
  magic_signatures: string[];
  container_format: string;
  timestamp_structure: string;
  recovery_complexity: string;
  omnisurv_support: string;
}

export interface CustodyLogEntry {
  id: number;
  case_id: string;
  evidence_id?: string;
  action: string;
  actor: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface SopItem {
  id: string;
  phase: string;
  title: string;
  standard: string;
  steps: string[];
}

export const api = {
  baseUrl: API_BASE_URL,

  async uploadEvidence(file: File): Promise<EvidenceUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE_URL}/api/evidence/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async getEvidenceList(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/evidence/list`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async getEvidenceStatus(evidenceId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/evidence/${evidenceId}/status`);
    if (!res.ok) throw new Error("Evidence status not found");
    return res.json();
  },

  async getEvidenceProgress(evidenceId: string): Promise<EvidenceProgress> {
    const res = await fetch(`${API_BASE_URL}/api/evidence/${evidenceId}/progress`);
    if (!res.ok) throw new Error("Progress check failed");
    return res.json();
  },

  async getEvidenceClips(evidenceId: string): Promise<RecoveredClip[]> {
    const res = await fetch(`${API_BASE_URL}/api/evidence/${evidenceId}/clips`);
    if (!res.ok) throw new Error("Clips retrieval failed");
    return res.json();
  },

  getReportDownloadUrl(evidenceId: string): string {
    return `${API_BASE_URL}/api/evidence/${evidenceId}/report`;
  },

  async identifyDevice(filePath?: string, evidenceId?: string): Promise<DeviceIdentification> {
    const res = await fetch(`${API_BASE_URL}/api/devices/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_path: filePath, evidence_id: evidenceId }),
    });
    if (!res.ok) throw new Error("Device identification failed");
    return res.json();
  },

  async startAcquisition(data: {
    source_device: string;
    target_filename: string;
    investigator: string;
    case_id?: string;
  }): Promise<{ task_id: string; status: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/acquisition/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Acquisition failed to initiate");
    return res.json();
  },

  async getAcquisitionStatus(taskId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/acquisition/status/${taskId}`);
    if (!res.ok) throw new Error("Acquisition status failed");
    return res.json();
  },

  async getTimelineEvents(evidenceId?: string): Promise<any> {
    const url = evidenceId
      ? `${API_BASE_URL}/api/timeline/events?evidence_id=${evidenceId}`
      : `${API_BASE_URL}/api/timeline/events`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Timeline retrieval failed");
    return res.json();
  },

  async analyzeClipAI(clipPath: string, evidenceId?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/ai/analyze-clip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clip_path: clipPath, evidence_id: evidenceId }),
    });
    if (!res.ok) throw new Error("AI analysis request failed");
    return res.json();
  },

  async queryAI(query: string, caseId?: string): Promise<{ query: string; answer: string; model: string }> {
    const res = await fetch(`${API_BASE_URL}/api/ai/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, case_id: caseId }),
    });
    if (!res.ok) throw new Error("Forensic AI query failed");
    return res.json();
  },

  async getCustodyLogs(evidenceId?: string): Promise<CustodyLogEntry[]> {
    const url = evidenceId
      ? `${API_BASE_URL}/api/custody/logs?evidence_id=${evidenceId}`
      : `${API_BASE_URL}/api/custody/logs`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  async verifyCustodyHash(data: {
    evidence_id?: string;
    file_path?: string;
    expected_sha256?: string;
    expected_md5?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/custody/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Hash verification failed");
    return res.json();
  },

  async getOemComparison(): Promise<OemComparisonItem[]> {
    const res = await fetch(`${API_BASE_URL}/api/oem/comparison`);
    if (!res.ok) throw new Error("OEM comparison fetch failed");
    return res.json();
  },

  async getSopList(): Promise<SopItem[]> {
    const res = await fetch(`${API_BASE_URL}/api/sop/list`);
    if (!res.ok) throw new Error("SOP fetch failed");
    return res.json();
  },
};
