"""
Multi-Vendor OEM Carvers Module for SIH2026.

Provides dedicated, vendor-specific forensic carvers for all 8 OEMs:
- Dahua Technology (app.recovery.dahua)
- Hikvision (app.recovery.hikvision)
- CP Plus (app.recovery.cpplus)
- Honeywell Security (app.recovery.honeywell)
- TP-Link VIGI (app.recovery.tplink)
- Godrej Security (app.recovery.godrej)
- Uniview UNV (app.recovery.uniview)
- Matrix Comsec (app.recovery.matrix)

Each vendor implementation performs deep frame header decoding, timestamp extraction,
channel isolation, and exact GOP stream assembly.
"""

from __future__ import annotations

# Re-export dedicated, full forensic carver implementations
from app.recovery.cpplus import CPPlusCarver
from app.recovery.honeywell import HoneywellCarver
from app.recovery.tplink import TPLinkCarver
from app.recovery.godrej import GodrejCarver
from app.recovery.uniview import UniviewCarver
from app.recovery.matrix import MatrixCarver

__all__ = [
    "CPPlusCarver",
    "HoneywellCarver",
    "TPLinkCarver",
    "GodrejCarver",
    "UniviewCarver",
    "MatrixCarver",
]
