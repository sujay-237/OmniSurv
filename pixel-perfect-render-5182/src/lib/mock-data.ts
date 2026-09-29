// DEMO / MOCK DATA ONLY — no backend, no real forensic processing.

export type CaseStatus =
  | "NEW"
  | "ACQUISITION"
  | "ANALYSIS"
  | "REVIEW"
  | "COMPLETED"
  | "ARCHIVED";

export interface ForensicCase {
  id: string;
  name: string;
  incidentType: string;
  investigator: string;
  devices: number;
  evidence: number;
  status: CaseStatus;
  created: string;
  updated: string;
  location: string;
  incidentDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recovered: number;
}

export const cases: ForensicCase[] = [
  {
    id: "CASE-2026-014",
    name: "Unauthorized Access Investigation",
    incidentType: "Unauthorized Access",
    investigator: "INV-001 / A. Raghavan",
    devices: 3,
    evidence: 14,
    status: "ANALYSIS",
    created: "24 SEP 2026",
    updated: "26 SEP 2026 14:42 UTC",
    location: "Sector 21, Warehouse Block C",
    incidentDate: "22 SEP 2026 02:14 UTC",
    priority: "CRITICAL",
    recovered: 198,
  },
  {
    id: "CASE-2026-013",
    name: "Warehouse Theft — Night Shift",
    incidentType: "Theft",
    investigator: "INV-004 / S. Mehta",
    devices: 2,
    evidence: 9,
    status: "ACQUISITION",
    created: "21 SEP 2026",
    updated: "26 SEP 2026 11:08 UTC",
    location: "Industrial Estate, Unit 14",
    incidentDate: "19 SEP 2026 23:41 UTC",
    priority: "HIGH",
    recovered: 62,
  },
  {
    id: "CASE-2026-011",
    name: "Vehicle Hit & Run — Gate 2",
    incidentType: "Hit & Run",
    investigator: "INV-002 / K. Iyer",
    devices: 4,
    evidence: 21,
    status: "REVIEW",
    created: "14 SEP 2026",
    updated: "25 SEP 2026 17:55 UTC",
    location: "Ring Road, Gate 2 Junction",
    incidentDate: "12 SEP 2026 19:06 UTC",
    priority: "HIGH",
    recovered: 143,
  },
  {
    id: "CASE-2026-009",
    name: "Tampering of Surveillance Recorder",
    incidentType: "Evidence Tampering",
    investigator: "INV-003 / D. Fernandes",
    devices: 1,
    evidence: 6,
    status: "COMPLETED",
    created: "02 SEP 2026",
    updated: "18 SEP 2026 09:31 UTC",
    location: "Municipal Office, Annexe 2",
    incidentDate: "31 AUG 2026 04:22 UTC",
    priority: "MEDIUM",
    recovered: 44,
  },
  {
    id: "CASE-2026-007",
    name: "ATM Vestibule Assault",
    incidentType: "Assault",
    investigator: "INV-005 / P. Nair",
    devices: 2,
    evidence: 11,
    status: "NEW",
    created: "28 AUG 2026",
    updated: "29 AUG 2026 10:12 UTC",
    location: "Branch 0421, ATM Vestibule",
    incidentDate: "27 AUG 2026 21:48 UTC",
    priority: "MEDIUM",
    recovered: 0,
  },
  {
    id: "CASE-2026-004",
    name: "Perimeter Breach — Substation",
    incidentType: "Trespass",
    investigator: "INV-002 / K. Iyer",
    devices: 5,
    evidence: 18,
    status: "ARCHIVED",
    created: "11 AUG 2026",
    updated: "02 SEP 2026 16:20 UTC",
    location: "Substation 7, North Perimeter",
    incidentDate: "09 AUG 2026 01:33 UTC",
    priority: "LOW",
    recovered: 87,
  },
];

export const metrics = [
  { label: "ACTIVE CASES", value: "12", note: "+2 THIS WEEK" },
  { label: "EVIDENCE ITEMS", value: "148", note: "14 PENDING INTAKE" },
  { label: "DVR/NVR DEVICES", value: "27", note: "8 OEM VENDORS" },
  { label: "RECOVERED VIDEOS", value: "384", note: "198 THIS CASE" },
  { label: "PENDING ANALYSIS", value: "16", note: "4 PRIORITISED" },
  { label: "VERIFIED EVIDENCE", value: "132", note: "SHA-256 MATCHED" },
  { label: "REPORTS GENERATED", value: "21", note: "3 IN REVIEW" },
];

export const systemActivity = [
  { time: "14:42", action: "Evidence acquired", detail: "EV-00127 · DVR-001", tone: "ink" },
  { time: "14:38", action: "SHA-256 verified", detail: "EV-00127 · MATCH", tone: "verified" },
  { time: "14:31", action: "Video recovery completed", detail: "198 of 214 files", tone: "ink" },
  { time: "14:18", action: "DVR identified", detail: "Hikvision DS-7616NI-K2", tone: "navy" },
  { time: "13:56", action: "Case created", detail: "CASE-2026-014", tone: "ink" },
] as const;

export const oemDistribution = [
  { oem: "Dahua", count: 7 },
  { oem: "Hikvision", count: 6 },
  { oem: "CP Plus", count: 5 },
  { oem: "Uniview", count: 4 },
  { oem: "Matrix", count: 3 },
  { oem: "Godrej", count: 2 },
];

export const processingStages = [
  { stage: "ACQUISITION", pct: 100 },
  { stage: "HASHING", pct: 92 },
  { stage: "FILE SYSTEM PARSE", pct: 74 },
  { stage: "RECOVERY", pct: 61 },
  { stage: "VIDEO ANALYSIS", pct: 38 },
  { stage: "REPORTING", pct: 12 },
];

export type DeviceStatus = "SUPPORTED" | "PARTIAL" | "UNKNOWN";

export interface Device {
  id: string;
  manufacturer: string;
  model: string;
  serial: string;
  firmware: string;
  storage: string;
  channels: number;
  mac: string;
  ip: string;
  fileSystem: string;
  videoFormat: string;
  status: DeviceStatus;
  caseId: string;
}

export const devices: Device[] = [
  {
    id: "DVR-001",
    manufacturer: "Hikvision",
    model: "DS-7616NI-K2",
    serial: "HK-7616-2026-004821",
    firmware: "V4.30.115 build 220315",
    storage: "2 TB",
    channels: 16,
    mac: "44:19:B6:2C:8A:D1",
    ip: "192.168.11.42",
    fileSystem: "Proprietary (HIKVISION FS)",
    videoFormat: "H.264 / H.265",
    status: "SUPPORTED",
    caseId: "CASE-2026-014",
  },
  {
    id: "DVR-002",
    manufacturer: "Dahua",
    model: "XVR5108HS-4KL-X",
    serial: "DH-5108-2025-773106",
    firmware: "V4.001.0000001.2",
    storage: "1 TB",
    channels: 8,
    mac: "3C:EF:8C:11:4B:90",
    ip: "192.168.11.51",
    fileSystem: "Proprietary (DHFS)",
    videoFormat: "H.264",
    status: "SUPPORTED",
    caseId: "CASE-2026-014",
  },
  {
    id: "NVR-003",
    manufacturer: "CP Plus",
    model: "CP-UNR-4K4162-V2",
    serial: "CP-4162-2026-118934",
    firmware: "V3.218.0000002",
    storage: "4 TB",
    channels: 16,
    mac: "A0:BD:CD:77:12:EE",
    ip: "192.168.11.63",
    fileSystem: "EXT4 + Proprietary Index",
    videoFormat: "H.265",
    status: "PARTIAL",
    caseId: "CASE-2026-013",
  },
  {
    id: "NVR-004",
    manufacturer: "Uniview",
    model: "NVR301-08S3",
    serial: "UV-301-2025-559012",
    firmware: "V1.22.6",
    storage: "2 TB",
    channels: 8,
    mac: "48:EA:63:0D:71:2A",
    ip: "192.168.11.70",
    fileSystem: "Proprietary",
    videoFormat: "H.265",
    status: "SUPPORTED",
    caseId: "CASE-2026-011",
  },
  {
    id: "DVR-005",
    manufacturer: "Other / Unknown",
    model: "UNIDENTIFIED OEM BOARD",
    serial: "—",
    firmware: "—",
    storage: "500 GB",
    channels: 4,
    mac: "00:1B:44:11:3A:B7",
    ip: "—",
    fileSystem: "UNKNOWN",
    videoFormat: "UNKNOWN",
    status: "UNKNOWN",
    caseId: "CASE-2026-007",
  },
];

export const oemMatrix: {
  oem: string;
  detection: DeviceStatus;
  fileSystem: DeviceStatus;
  videoFormat: DeviceStatus;
  metadata: DeviceStatus;
  recovery: DeviceStatus;
  status: DeviceStatus;
}[] = [
  { oem: "Hikvision", detection: "SUPPORTED", fileSystem: "SUPPORTED", videoFormat: "SUPPORTED", metadata: "SUPPORTED", recovery: "SUPPORTED", status: "SUPPORTED" },
  { oem: "Dahua", detection: "SUPPORTED", fileSystem: "SUPPORTED", videoFormat: "SUPPORTED", metadata: "PARTIAL", recovery: "SUPPORTED", status: "SUPPORTED" },
  { oem: "CP Plus", detection: "SUPPORTED", fileSystem: "PARTIAL", videoFormat: "SUPPORTED", metadata: "PARTIAL", recovery: "PARTIAL", status: "PARTIAL" },
  { oem: "Uniview", detection: "SUPPORTED", fileSystem: "SUPPORTED", videoFormat: "SUPPORTED", metadata: "PARTIAL", recovery: "SUPPORTED", status: "SUPPORTED" },
  { oem: "Matrix", detection: "SUPPORTED", fileSystem: "PARTIAL", videoFormat: "PARTIAL", metadata: "UNKNOWN", recovery: "PARTIAL", status: "PARTIAL" },
  { oem: "Godrej", detection: "PARTIAL", fileSystem: "PARTIAL", videoFormat: "SUPPORTED", metadata: "UNKNOWN", recovery: "PARTIAL", status: "PARTIAL" },
  { oem: "Honeywell", detection: "SUPPORTED", fileSystem: "PARTIAL", videoFormat: "SUPPORTED", metadata: "PARTIAL", recovery: "PARTIAL", status: "PARTIAL" },
  { oem: "TP-Link", detection: "PARTIAL", fileSystem: "UNKNOWN", videoFormat: "SUPPORTED", metadata: "UNKNOWN", recovery: "UNKNOWN", status: "UNKNOWN" },
  { oem: "Other / Unknown", detection: "UNKNOWN", fileSystem: "UNKNOWN", videoFormat: "UNKNOWN", metadata: "UNKNOWN", recovery: "UNKNOWN", status: "UNKNOWN" },
];

export interface Evidence {
  id: string;
  fileName: string;
  source: string;
  type: string;
  size: string;
  acquired: string;
  hashStatus: "VERIFIED" | "PENDING" | "MISMATCH";
  status: "READY" | "PROCESSING" | "QUARANTINED";
  md5: string;
  sha256: string;
  caseId: string;
}

export const evidence: Evidence[] = [
  {
    id: "EV-00127",
    fileName: "DVR_IMAGE_001.E01",
    source: "DVR-001",
    type: "FORENSIC IMAGE",
    size: "2 TB",
    acquired: "26 SEP 2026 14:25 UTC",
    hashStatus: "VERIFIED",
    status: "READY",
    md5: "9f2a41c7b0e5d8134a6c7e21f0b9d4a3",
    sha256: "3a7f19c4be08d52e7c61a94f0db28e5136cf47a0b9e23d8f16c40a7be95d3172",
    caseId: "CASE-2026-014",
  },
  {
    id: "EV-00128",
    fileName: "CAM03_SEGMENT_1427.h265",
    source: "DVR-001 / CAM-03",
    type: "VIDEO SEGMENT",
    size: "1.42 GB",
    acquired: "26 SEP 2026 14:31 UTC",
    hashStatus: "VERIFIED",
    status: "READY",
    md5: "c41d8e09b7f6a2531e4d0b8c97a6f215",
    sha256: "8d14ce70b2a95f36e0c48d71ab3f92e5170cd36ba84f21e90d75c6b3a02e4817",
    caseId: "CASE-2026-014",
  },
  {
    id: "EV-00129",
    fileName: "DVR_DB_INDEX.bin",
    source: "DVR-001 / DATABASE",
    type: "METADATA INDEX",
    size: "184 MB",
    acquired: "26 SEP 2026 14:33 UTC",
    hashStatus: "PENDING",
    status: "PROCESSING",
    md5: "7b2e05a9c31d84f60ea27b95d1c4083f",
    sha256: "f0b7d21ac954e836b1d70c48ae52931f6d80c47b25ea93f18d6c50ba72e41903",
    caseId: "CASE-2026-014",
  },
  {
    id: "EV-00130",
    fileName: "NVR_IMAGE_003.dd",
    source: "NVR-003",
    type: "FORENSIC IMAGE",
    size: "4 TB",
    acquired: "25 SEP 2026 09:14 UTC",
    hashStatus: "VERIFIED",
    status: "READY",
    md5: "2ad70f19c8b46e530a1c7d92f4b60e8a",
    sha256: "5c93af1206bd74e8130fa62c95d4b7e0183c6ad47f29be501d6a83c0f74e2915",
    caseId: "CASE-2026-013",
  },
  {
    id: "EV-00131",
    fileName: "CAM01_DELETED_BLOCK.raw",
    source: "DVR-002 / CAM-01",
    type: "CARVED FRAGMENT",
    size: "612 MB",
    acquired: "25 SEP 2026 15:47 UTC",
    hashStatus: "MISMATCH",
    status: "QUARANTINED",
    md5: "e91b4270ad3c8f6150729bd4c3ea0851",
    sha256: "b71ed24f0c9538a62e10db84c7a35f9106be2d478c53a91f0e64b7d25a3081fc",
    caseId: "CASE-2026-013",
  },
  {
    id: "EV-00132",
    fileName: "GATE2_CAM04_1906.h264",
    source: "NVR-004 / CAM-04",
    type: "VIDEO SEGMENT",
    size: "2.08 GB",
    acquired: "24 SEP 2026 18:02 UTC",
    hashStatus: "VERIFIED",
    status: "READY",
    md5: "48c1f0b9e27a6d35014b8fc2a90e7d61",
    sha256: "e2470ab19c5d83f6017ba42ce905d3f81b6c07a4d29e5b310fa86c274e0d9153",
    caseId: "CASE-2026-011",
  },
];

export const evidenceTree = [
  { name: "EVIDENCE_DVR_001", depth: 0, files: 0 },
  { name: "SYSTEM", depth: 1, files: 34 },
  { name: "DATABASE", depth: 1, files: 12 },
  { name: "CAMERA_01", depth: 1, files: 412 },
  { name: "CAMERA_02", depth: 1, files: 388 },
  { name: "CAMERA_03", depth: 1, files: 407 },
  { name: "METADATA", depth: 1, files: 19 },
  { name: "RECOVERED", depth: 1, files: 198 },
  { name: "DELETED", depth: 1, files: 326 },
];

export type FileStatus = "NORMAL" | "DELETED" | "CORRUPTED" | "RECOVERED" | "UNKNOWN";

export interface FsFile {
  name: string;
  type: string;
  size: string;
  created: string;
  modified: string;
  camera: string;
  status: FileStatus;
}

export const fsFiles: FsFile[] = [
  { name: "CAM03_20260922_021400.h265", type: "VIDEO", size: "742 MB", created: "22 SEP 2026 02:14", modified: "22 SEP 2026 02:44", camera: "CAM-03", status: "NORMAL" },
  { name: "CAM03_20260922_024400.h265", type: "VIDEO", size: "738 MB", created: "22 SEP 2026 02:44", modified: "22 SEP 2026 03:14", camera: "CAM-03", status: "NORMAL" },
  { name: "CAM03_20260922_031400.h265", type: "VIDEO", size: "0 B", created: "22 SEP 2026 03:14", modified: "22 SEP 2026 03:19", camera: "CAM-03", status: "DELETED" },
  { name: "CAM01_20260922_021100.h264", type: "VIDEO", size: "512 MB", created: "22 SEP 2026 02:11", modified: "22 SEP 2026 02:41", camera: "CAM-01", status: "RECOVERED" },
  { name: "CAM02_20260922_022900.h264", type: "VIDEO", size: "118 MB", created: "22 SEP 2026 02:29", modified: "22 SEP 2026 02:33", camera: "CAM-02", status: "CORRUPTED" },
  { name: "INDEX_MAIN.db", type: "DATABASE", size: "184 MB", created: "14 MAR 2025 09:02", modified: "26 SEP 2026 14:33", camera: "—", status: "NORMAL" },
  { name: "CFG_SYSTEM.cfg", type: "CONFIG", size: "42 KB", created: "14 MAR 2025 09:02", modified: "21 SEP 2026 18:11", camera: "—", status: "NORMAL" },
  { name: "LOG_DEVICE_EVENTS.log", type: "LOG", size: "7.1 MB", created: "14 MAR 2025 09:02", modified: "26 SEP 2026 14:40", camera: "—", status: "NORMAL" },
  { name: "ORPHAN_BLOCK_00412.raw", type: "FRAGMENT", size: "96 MB", created: "—", modified: "—", camera: "UNKNOWN", status: "UNKNOWN" },
  { name: "CAM04_20260922_030200.h265", type: "VIDEO", size: "688 MB", created: "22 SEP 2026 03:02", modified: "22 SEP 2026 03:32", camera: "CAM-04", status: "DELETED" },
];

export const recoverySummary = [
  { label: "RECORDINGS FOUND", value: "1,284" },
  { label: "DELETED", value: "326" },
  { label: "RECOVERABLE", value: "214" },
  { label: "CORRUPTED", value: "37" },
  { label: "RECOVERED", value: "198" },
];

export interface DeletedFile {
  id: string;
  file: string;
  camera: string;
  timestamp: string;
  size: string;
  status: FileStatus;
  recoverability: number;
}

export const deletedFiles: DeletedFile[] = [
  { id: "d1", file: "CAM03_20260922_031400.h265", camera: "CAM-03", timestamp: "22 SEP 2026 03:14:00 UTC", size: "740 MB", status: "DELETED", recoverability: 96 },
  { id: "d2", file: "CAM04_20260922_030200.h265", camera: "CAM-04", timestamp: "22 SEP 2026 03:02:00 UTC", size: "688 MB", status: "DELETED", recoverability: 88 },
  { id: "d3", file: "CAM02_20260922_022900.h264", camera: "CAM-02", timestamp: "22 SEP 2026 02:29:00 UTC", size: "118 MB", status: "CORRUPTED", recoverability: 34 },
  { id: "d4", file: "CAM01_20260922_021100.h264", camera: "CAM-01", timestamp: "22 SEP 2026 02:11:00 UTC", size: "512 MB", status: "RECOVERED", recoverability: 100 },
  { id: "d5", file: "ORPHAN_BLOCK_00412.raw", camera: "UNKNOWN", timestamp: "—", size: "96 MB", status: "UNKNOWN", recoverability: 12 },
  { id: "d6", file: "CAM03_20260922_034400.h265", camera: "CAM-03", timestamp: "22 SEP 2026 03:44:00 UTC", size: "734 MB", status: "DELETED", recoverability: 71 },
  { id: "d7", file: "CAM02_20260922_035900.h264", camera: "CAM-02", timestamp: "22 SEP 2026 03:59:00 UTC", size: "506 MB", status: "DELETED", recoverability: 63 },
];

export const cameras = ["CAM-01", "CAM-02", "CAM-03", "CAM-04"];

export interface TimelineSegment {
  camera: string;
  startHour: number;
  endHour: number;
  kind: "continuous" | "motion" | "incident";
}

export const timelineSegments: TimelineSegment[] = [
  { camera: "CAM-01", startHour: 12, endHour: 15.4, kind: "continuous" },
  { camera: "CAM-01", startHour: 15.4, endHour: 16, kind: "motion" },
  { camera: "CAM-02", startHour: 12.6, endHour: 14.4, kind: "continuous" },
  { camera: "CAM-02", startHour: 14.4, endHour: 14.75, kind: "incident" },
  { camera: "CAM-02", startHour: 14.75, endHour: 16, kind: "continuous" },
  { camera: "CAM-03", startHour: 12, endHour: 14.5, kind: "motion" },
  { camera: "CAM-03", startHour: 14.5, endHour: 14.72, kind: "incident" },
  { camera: "CAM-03", startHour: 14.72, endHour: 15.9, kind: "continuous" },
  { camera: "CAM-04", startHour: 13.2, endHour: 16, kind: "continuous" },
];

export const timelineEvents = [
  { time: "14:32:18", camera: "CAM-03", label: "Motion detected", hour: 14.538 },
  { time: "14:32:22", camera: "CAM-03", label: "Person detected", hour: 14.539 },
  { time: "14:32:31", camera: "CAM-02", label: "Vehicle detected", hour: 14.542 },
  { time: "14:41:07", camera: "CAM-01", label: "Recording gap", hour: 14.685 },
  { time: "15:04:55", camera: "CAM-04", label: "Motion detected", hour: 15.082 },
];

export const aiCounts = [
  { label: "PERSON", value: 42 },
  { label: "VEHICLE", value: 17 },
  { label: "FACE", value: 8 },
  { label: "MOTION EVENTS", value: 64 },
];

export const custodyEntries = [
  { date: "26 SEP 2026", time: "14:20:11", user: "INV-001", action: "Evidence Created", evidenceId: "EV-00127", hash: "—", remarks: "Source sealed, read-only bridge attached" },
  { date: "26 SEP 2026", time: "14:25:38", user: "INV-001", action: "Evidence Acquired", evidenceId: "EV-00127", hash: "3a7f19c4…5d3172", remarks: "E01 image, 2 TB, 145 MB/s" },
  { date: "26 SEP 2026", time: "14:28:42", user: "INV-001", action: "SHA-256 Generated", evidenceId: "EV-00127", hash: "3a7f19c4…5d3172", remarks: "Source and image hash match" },
  { date: "26 SEP 2026", time: "14:40:19", user: "INV-001", action: "Evidence Analyzed", evidenceId: "EV-00127", hash: "3a7f19c4…5d3172", remarks: "File system parsed, 1,284 recordings indexed" },
  { date: "26 SEP 2026", time: "15:05:04", user: "REV-002", action: "Reviewer Accessed Evidence", evidenceId: "EV-00127", hash: "3a7f19c4…5d3172", remarks: "Read-only review session, 22 min" },
  { date: "26 SEP 2026", time: "16:12:47", user: "INV-001", action: "Bookmark Added", evidenceId: "EV-00128", hash: "8d14ce70…ab3f", remarks: "BOOKMARK #004 — CAM-03 14:32:18" },
];

export const auditLog = [
  { time: "14:20:11", user: "INV-001", action: "Created Case", module: "CASE MANAGEMENT", evidence: "CASE-2026-014", status: "SUCCESS" },
  { time: "14:22:03", user: "INV-001", action: "Identified Device", module: "DEVICES", evidence: "DVR-001", status: "SUCCESS" },
  { time: "14:25:38", user: "INV-001", action: "Started Acquisition", module: "ACQUISITION", evidence: "EV-00127", status: "SUCCESS" },
  { time: "14:28:42", user: "INV-001", action: "Generated SHA-256", module: "INTEGRITY", evidence: "EV-00127", status: "SUCCESS" },
  { time: "14:31:55", user: "INV-001", action: "Recovered Deleted Files", module: "RECOVERY", evidence: "EV-00128", status: "SUCCESS" },
  { time: "14:36:10", user: "INV-004", action: "Hash Comparison", module: "INTEGRITY", evidence: "EV-00131", status: "MISMATCH" },
  { time: "15:05:04", user: "REV-002", action: "Accessed Evidence", module: "EVIDENCE", evidence: "EV-00127", status: "SUCCESS" },
  { time: "15:18:26", user: "ADM-000", action: "Updated Role", module: "USERS & ROLES", evidence: "REV-002", status: "SUCCESS" },
  { time: "16:02:44", user: "INV-001", action: "Exported Report Draft", module: "REPORTS", evidence: "CASE-2026-014", status: "SUCCESS" },
];

export const users = [
  { id: "ADM-000", name: "M. Bhattacharya", role: "ADMIN", lastActive: "26 SEP 2026 16:20 UTC", status: "ACTIVE" },
  { id: "INV-001", name: "A. Raghavan", role: "INVESTIGATOR", lastActive: "26 SEP 2026 16:12 UTC", status: "ACTIVE" },
  { id: "INV-002", name: "K. Iyer", role: "INVESTIGATOR", lastActive: "25 SEP 2026 17:55 UTC", status: "ACTIVE" },
  { id: "INV-004", name: "S. Mehta", role: "INVESTIGATOR", lastActive: "26 SEP 2026 11:08 UTC", status: "ACTIVE" },
  { id: "REV-002", name: "D. Fernandes", role: "REVIEWER", lastActive: "26 SEP 2026 15:27 UTC", status: "ACTIVE" },
  { id: "VWR-007", name: "P. Nair", role: "VIEWER", lastActive: "18 SEP 2026 09:31 UTC", status: "DISABLED" },
];

export const notifications = [
  { text: "Evidence acquisition completed.", detail: "EV-00127 · DVR-001", time: "14:25", tone: "ink" },
  { text: "SHA-256 verification successful.", detail: "EV-00127", time: "14:28", tone: "verified" },
  { text: "Deleted footage recovery completed.", detail: "198 of 214 files", time: "14:31", tone: "ink" },
  { text: "Corrupted recording detected.", detail: "CAM02_20260922_022900.h264", time: "14:36", tone: "danger" },
  { text: "Report ready for review.", detail: "CASE-2026-014 · DRAFT 3", time: "16:02", tone: "event" },
] as const;

export const bookmarks = [
  { id: "BOOKMARK #004", time: "14:32:18 UTC", camera: "CAM-03", note: "Person enters the building." },
  { id: "BOOKMARK #005", time: "14:32:31 UTC", camera: "CAM-02", note: "Unregistered vehicle halts at gate." },
  { id: "BOOKMARK #006", time: "14:41:07 UTC", camera: "CAM-01", note: "Recording gap of 00:03:12 observed." },
];

export const detectedEvents = [
  { time: "14:32:18", camera: "CAM-03", type: "MOTION", confidence: "0.94" },
  { time: "14:32:22", camera: "CAM-03", type: "PERSON", confidence: "0.91" },
  { time: "14:32:31", camera: "CAM-02", type: "VEHICLE", confidence: "0.87" },
  { time: "14:33:02", camera: "CAM-03", type: "FACE", confidence: "0.68" },
  { time: "15:04:55", camera: "CAM-04", type: "MOTION", confidence: "0.83" },
];

export const sopSteps = [
  { no: "01", title: "DEVICE IDENTIFICATION", detail: "Determine OEM, model, firmware, channel count and storage layout before any read operation. Record device photographs and serial numbers." },
  { no: "02", title: "EVIDENCE ACQUISITION", detail: "Attach a hardware write-blocker, confirm read-only mode, then image the source to the forensic evidence store with sector-level verification." },
  { no: "03", title: "HASH VERIFICATION", detail: "Generate MD5 and SHA-256 for source and image. Any mismatch quarantines the evidence and halts the workflow." },
  { no: "04", title: "FILE SYSTEM PARSING", detail: "Interpret the proprietary recorder file system, rebuild the index and enumerate normal, deleted and orphaned records." },
  { no: "05", title: "VIDEO RECOVERY", detail: "Carve deleted and fragmented recordings, score recoverability and log every recovered artefact against its source offset." },
  { no: "06", title: "VIDEO ANALYSIS", detail: "Review footage frame-accurately, reconcile system time against recorded time and capture screenshots and markers." },
  { no: "07", title: "TIMELINE CORRELATION", detail: "Align all camera channels on a single UTC timeline, mark incident intervals and correlate multi-camera events." },
  { no: "08", title: "AI ANALYTICS", detail: "Run assistive detection passes for person, vehicle, face and motion. All findings require analyst confirmation." },
  { no: "09", title: "CHAIN OF CUSTODY", detail: "Every access, transfer and operation is appended to an immutable ledger with timestamp, user, action and hash." },
  { no: "10", title: "REPORT GENERATION", detail: "Compose the forensic report from validated sections, attach hashes and export for review and disclosure." },
];

export const reportSections = [
  "Case Information",
  "Device Information",
  "Acquisition Details",
  "Evidence Details",
  "Hash Verification",
  "Recovery Results",
  "Timeline",
  "AI Findings",
  "Chain of Custody",
  "Investigator Notes",
];

export const searchIndex = [
  { kind: "CASE", id: "CASE-2026-014", label: "Unauthorized Access Investigation", to: "/cases/CASE-2026-014", tags: "CAM-03 CAM-01 hikvision analysis" },
  { kind: "CASE", id: "CASE-2026-013", label: "Warehouse Theft — Night Shift", to: "/cases/CASE-2026-013", tags: "cp plus acquisition" },
  { kind: "EVIDENCE", id: "EV-00127", label: "DVR_IMAGE_001.E01", to: "/evidence", tags: "forensic image verified dvr-001" },
  { kind: "EVIDENCE", id: "EV-00128", label: "CAM03_SEGMENT_1427.h265", to: "/evidence", tags: "cam-03 video segment" },
  { kind: "DEVICE", id: "DVR-001", label: "Hikvision DS-7616NI-K2", to: "/devices", tags: "hikvision 16 channel" },
  { kind: "DEVICE", id: "NVR-003", label: "CP Plus CP-UNR-4K4162-V2", to: "/devices", tags: "cp plus partial" },
  { kind: "TIMELINE", id: "CAM-03", label: "Camera 03 Timeline", to: "/timeline", tags: "cam-03 timeline incident" },
  { kind: "FILES", id: "CAM-03", label: "CAM-03 recovered files", to: "/recovery", tags: "cam-03 recovered deleted" },
  { kind: "EVENT", id: "14:32:18", label: "Motion detected — CAM-03", to: "/timeline", tags: "cam-03 motion event" },
  { kind: "REPORT", id: "RPT-0031", label: "CASE-2026-014 Forensic Report (Draft 3)", to: "/reports", tags: "report draft" },
];
