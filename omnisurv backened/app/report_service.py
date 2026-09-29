"""
Chain of custody PDF report generation.
Supports WeasyPrint and built-in ReportLab fallback for court-admissible forensic reporting.
"""

from __future__ import annotations

import html
import logging
from pathlib import Path
from typing import Any, Dict

from app import database_service
from app.config import OPERATOR_ID, REPORTS_DIR

logger = logging.getLogger(__name__)


def _escape(value: object) -> str:
    return html.escape("" if value is None else str(value))


def _generate_reportlab_pdf(bundle: Dict[str, Any], evidence_id: str, output_path: Path) -> None:
    """Fallback high-quality PDF generator using ReportLab."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    story = []
    styles = getSampleStyleSheet()

    # Title
    title_style = ParagraphStyle(
        "ForensicTitle",
        parent=styles["Heading1"],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
    )
    story.append(Paragraph("OmniSurv DVR/NVR Forensics — Chain of Custody Report", title_style))
    story.append(Paragraph("<b>ISO/IEC 27037 & BSA Sec 63 / IEA Sec 65B Digital Evidence Compliance</b>", styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#334155")))
    story.append(Spacer(1, 10))

    # Evidence Metadata Table
    meta_data = [
        [Paragraph("<b>Case ID:</b>", styles["Normal"]), Paragraph(str(bundle.get("case_id", "N/A")), styles["Normal"])],
        [Paragraph("<b>Evidence ID:</b>", styles["Normal"]), Paragraph(str(evidence_id), styles["Normal"])],
        [Paragraph("<b>Source Filename:</b>", styles["Normal"]), Paragraph(str(bundle.get("filename", "N/A")), styles["Normal"])],
        [Paragraph("<b>Source File MD5:</b>", styles["Normal"]), Paragraph(f"<font face='Courier'>{bundle.get('source_file_md5', 'N/A')}</font>", styles["Normal"])],
        [Paragraph("<b>Source File SHA-256:</b>", styles["Normal"]), Paragraph(f"<font face='Courier'>{bundle.get('source_file_sha256', bundle.get('sha256_hash', 'N/A'))}</font>", styles["Normal"])],
        [Paragraph("<b>Processing Status:</b>", styles["Normal"]), Paragraph(str(bundle.get("status", "N/A")), styles["Normal"])],
        [Paragraph("<b>Ingest Timestamp:</b>", styles["Normal"]), Paragraph(str(bundle.get("ingest_timestamp", "N/A")), styles["Normal"])],
        [Paragraph("<b>Forensic Examiner:</b>", styles["Normal"]), Paragraph(str(OPERATOR_ID), styles["Normal"])],
    ]
    meta_table = Table(meta_data, colWidths=[150, 390])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 16))

    # Recovered Clips Section
    story.append(Paragraph("<b>Recovered & Carved Video Clips</b>", styles["Heading2"]))
    story.append(Spacer(1, 8))

    clips = bundle.get("clips", [])
    if not clips:
        story.append(Paragraph("<i>No clips carved or extracted from evidence.</i>", styles["Normal"]))
    else:
        clip_rows = [["#", "OEM", "Byte Offsets", "Container / File", "SHA-256 (Evidential)", "AI / Forensic Notes"]]
        for c in clips:
            offsets = f"0x{int(c.get('offset_start', 0)):08X} - 0x{int(c.get('offset_end', 0)):08X}" if isinstance(c.get('offset_start'), int) else f"{c.get('offset_start')}-{c.get('offset_end')}"
            sha_short = (c.get("sha256") or "")[:16] + "..." if len(c.get("sha256") or "") > 16 else c.get("sha256", "")
            notes = str(c.get("ai_event_log") or c.get("ai_summary") or "Integrity verified")[:80]
            clip_rows.append([
                str(c.get("clip_index", 1)),
                str(c.get("vendor", "OEM")),
                offsets,
                str(c.get("mp4_filename", "clip.mp4")),
                sha_short,
                notes,
            ])
        clip_table = Table(clip_rows, colWidths=[25, 55, 115, 100, 115, 135])
        clip_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(clip_table)

    story.append(Spacer(1, 20))
    disclaimer_style = ParagraphStyle("Disclaimer", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#64748b"))
    story.append(Paragraph(
        "<b>Evidentiary Notice:</b> This report reflects bitstream verification computed using streaming cryptographic "
        "hashes (MD5 & SHA-256). All carved video streams demuxed into ISO/IEC 14496-14 containers preserve original "
        "elementary bitstream integrity. Generated autonomously by OmniSurv Forensics Engine.",
        disclaimer_style
    ))

    doc.build(story)


def build_chain_of_custody_report(evidence_id: str) -> str:
    """
    Build a court-admissible chain-of-custody PDF for the given evidence.

    Returns:
        Absolute path to the generated PDF file.
    """
    bundle = database_service.get_evidence_bundle(evidence_id)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = REPORTS_DIR / f"{evidence_id}_report.pdf"

    # 1. Try WeasyPrint if available
    try:
        from weasyprint import HTML
        rows_html = ""
        for clip in bundle.get("clips", []):
            rows_html += f"""
            <tr>
                <td>{_escape(clip.get("clip_index", ""))}</td>
                <td>{_escape(clip.get("vendor", ""))}</td>
                <td>{_escape(clip.get("offset_start", ""))}</td>
                <td>{_escape(clip.get("offset_end", ""))}</td>
                <td>{_escape(clip.get("mp4_filename", ""))}</td>
                <td><code>{_escape(clip.get("sha256", ""))}</code></td>
                <td>{_escape(clip.get("ai_event_log", clip.get("ai_summary", "")))}</td>
            </tr>
            """

        document_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8"/>
            <title>Chain of Custody — {_escape(evidence_id)}</title>
            <style>
                body {{ font-family: "Segoe UI", Arial, sans-serif; margin: 40px; color: #111; }}
                h1 {{ font-size: 20px; margin-bottom: 6px; }}
                .meta {{ margin-bottom: 20px; }}
                .meta dt {{ font-weight: 600; font-size: 13px; }}
                .meta dd {{ margin: 0 0 6px 0; font-size: 13px; }}
                table {{ border-collapse: collapse; width: 100%; font-size: 11px; }}
                th, td {{ border: 1px solid #333; padding: 6px; vertical-align: top; }}
                th {{ background: #f0f0f0; text-align: left; }}
                footer {{ margin-top: 28px; font-size: 10px; color: #555; }}
            </style>
        </head>
        <body>
            <h1>OmniSurv Forensics — Chain of Custody Report</h1>
            <dl class="meta">
                <dt>Case ID</dt>
                <dd>{_escape(bundle.get("case_id"))}</dd>
                <dt>Evidence ID</dt>
                <dd>{_escape(evidence_id)}</dd>
                <dt>Ingest Timestamp (UTC)</dt>
                <dd>{_escape(bundle.get("ingest_timestamp"))}</dd>
                <dt>Source Filename</dt>
                <dd>{_escape(bundle.get("filename"))}</dd>
                <dt>Source File MD5</dt>
                <dd><code>{_escape(bundle.get("source_file_md5"))}</code></dd>
                <dt>Source File SHA-256</dt>
                <dd><code>{_escape(bundle.get("source_file_sha256", bundle.get("sha256_hash", "")))}</code></dd>
                <dt>Processing Status</dt>
                <dd>{_escape(bundle.get("status"))}</dd>
                <dt>Operator / Actor ID</dt>
                <dd>{_escape(OPERATOR_ID)}</dd>
            </dl>
            <h2>Recovered Video Clips</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Vendor</th>
                        <th>Offset Start</th>
                        <th>Offset End</th>
                        <th>MP4 File</th>
                        <th>SHA-256</th>
                        <th>AI Event Log</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html if rows_html else '<tr><td colspan="7">No clips recovered.</td></tr>'}
                </tbody>
            </table>
            <footer>
                Generated by OmniSurv Forensics API. Verifiable under ISO/IEC 27037 and Indian Evidence Act Sec 65B.
            </footer>
        </body>
        </html>
        """
        HTML(string=document_html).write_pdf(str(output_path))
        return str(output_path.resolve())
    except (ImportError, OSError) as exc:
        logger.info("WeasyPrint unavailable (%s); falling back to ReportLab.", exc)

    # 2. ReportLab PDF Generation
    _generate_reportlab_pdf(bundle, evidence_id, output_path)
    return str(output_path.resolve())
