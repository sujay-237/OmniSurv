"""Factory for vendor carver strategies."""

from __future__ import annotations

from typing import Type

from app.recovery.base import BaseCarver
from app.recovery.dahua import DahuaCarver
from app.recovery.generic_h264 import GenericH264Carver
from app.recovery.hikvision import HikvisionCarver
from app.recovery.vendor_stubs import (
    CPPlusCarver,
    GodrejCarver,
    HoneywellCarver,
    MatrixCarver,
    TPLinkCarver,
    UniviewCarver,
)


class VideoCarverFactory:
    """Select carving strategies by vendor name or run the default scan set."""

    _registry: dict[str, Type[BaseCarver]] = {
        "dahua": DahuaCarver,
        "generic_h264": GenericH264Carver,
        "hikvision": HikvisionCarver,
        "cpplus": CPPlusCarver,
        "cp_plus": CPPlusCarver,
        "honeywell": HoneywellCarver,
        "tp_link": TPLinkCarver,
        "tplink": TPLinkCarver,
        "godrej": GodrejCarver,
        "uniview": UniviewCarver,
        "matrix": MatrixCarver,
    }

    @classmethod
    def get_carver(cls, vendor: str) -> BaseCarver:
        key = vendor.lower().strip().replace("-", "_")
        if key not in cls._registry:
            raise ValueError(f"Unknown vendor carver: {vendor}. Available: {cls.registered_vendors()}")
        return cls._registry[key]()

    @classmethod
    def default_scan_carvers(cls) -> list[BaseCarver]:
        """Carvers used for automatic multi-vendor scanning on ingest."""
        return [
            DahuaCarver(),
            HikvisionCarver(),
            GenericH264Carver(),
            CPPlusCarver(),
            HoneywellCarver(),
            TPLinkCarver(),
            GodrejCarver(),
            UniviewCarver(),
            MatrixCarver(),
        ]

    @classmethod
    def registered_vendors(cls) -> list[str]:
        return sorted(list(set(cls._registry.keys())))
