import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Column, JSON
from sqlmodel import SQLModel, Field

from app.utility.utils import get_datetime_utc


class AcademicIndicatorBase(SQLModel):
    """
    Shared properties for AcademicIndicator (California Dashboard data)
    """
    # Identifiers
    cds: str = Field(max_length=14, index=True)  # 14-char CDS code
    rtype: str = Field(max_length=1)  # S/D/X (School/District/State)
    schoolname: str | None = Field(default=None, max_length=255)
    districtname: str | None = Field(default=None, max_length=255)
    countyname: str | None = Field(default=None, max_length=255)

    # Flags (Y or blank)
    charter_flag: str | None = Field(default=None, max_length=1)
    coe_flag: str | None = Field(default=None, max_length=1)
    dass_flag: str | None = Field(default=None, max_length=1)

    # Demographics
    studentgroup: str = Field(index=True, max_length=10)  # ALL, AA, AI, AS, etc.

    # Current metrics
    currdenom: int | None = Field(default=None)
    currstatus: float | None = Field(default=None)

    # Prior metrics
    priordenom: int | None = Field(default=None)
    priorstatus: float | None = Field(default=None)

    # Performance
    change: float | None = Field(default=None)
    statuslevel: int | None = Field(default=None)  # 1-5 or 0
    changelevel: int | None = Field(default=None)  # 1-5 or 0
    color: int | None = Field(default=None)  # 1-5 or 0
    box: int | None = Field(default=None)  # 0-250

    # Accountability
    currnsizemet: str | None = Field(default=None, max_length=10)
    priornsizemet: str | None = Field(default=None, max_length=10)
    accountabilitymet: str | None = Field(default=None, max_length=10)
    hscutpoints: str | None = Field(default=None, max_length=255)
    pairshare_method: str | None = Field(default=None, max_length=255)

    # Participation (current)
    currprate_enrolled: int | None = Field(default=None)
    currprate_tested: int | None = Field(default=None)
    currprate: float | None = Field(default=None)
    currnumprloss: int | None = Field(default=None)
    currdenom_withoutprloss: int | None = Field(default=None)
    currstatus_withoutprloss: float | None = Field(default=None)

    # Participation (prior)
    priorprate_enrolled: int | None = Field(default=None)
    priorprate_tested: int | None = Field(default=None)
    priorprate: float | None = Field(default=None)
    priornumprloss: int | None = Field(default=None)
    priordenom_withoutprloss: int | None = Field(default=None)
    priorstatus_withoutprloss: float | None = Field(default=None)

    # Metadata
    indicator: str = Field(default="ELA", max_length=10)
    reportingyear: str = Field(max_length=10)  # e.g., "2025"

    # === Extended fields for all indicator types ===

    # Common fields (Chronic, Suspension, Graduation, ELPI)
    currnumer: int | None = Field(default=None)
    priornumer: int | None = Field(default=None)
    smalldenom: str | None = Field(default=None, max_length=10)
    certifyflag: str | None = Field(default=None, max_length=10)
    priorcertifyflag: str | None = Field(default=None, max_length=10)
    dataerrorflag: str | None = Field(default=None, max_length=10)

    # Suspension-specific
    school_type: str | None = Field(default=None, max_length=50)  # 'type' column

    # Graduation-specific
    fiveyrnumer: int | None = Field(default=None)

    # ELPI-specific (English Learner Progress)
    currprogressed: int | None = Field(default=None)
    currmaintainpl4: int | None = Field(default=None)
    currmaintainoth: int | None = Field(default=None)
    currdeclined: int | None = Field(default=None)
    currprogressed_alternate: int | None = Field(default=None)
    currmaintainpl3_alternate: int | None = Field(default=None)
    currnotprognotmain_alternate: int | None = Field(default=None)
    curr95: int | None = Field(default=None)
    priorprogressed: int | None = Field(default=None)
    priormaintainpl4: int | None = Field(default=None)
    priormaintainoth: int | None = Field(default=None)
    priordeclined: int | None = Field(default=None)
    priorprogressed_alternate: int | None = Field(default=None)
    priormaintainpl3_alternate: int | None = Field(default=None)
    priornotprognotmain_alternate: int | None = Field(default=None)
    prior95: int | None = Field(default=None)

    # CCI studentgroup percentage
    studentgroup_pct: float | None = Field(default=None)


class AcademicIndicator(AcademicIndicatorBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    # CCI-specific (stored as JSON to avoid 100+ columns)
    cci_details: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class AcademicIndicatorCreate(AcademicIndicatorBase):
    pass


class AcademicIndicatorUpdate(SQLModel):
    cds: str | None = Field(default=None, max_length=14)
    rtype: str | None = Field(default=None, max_length=1)
    schoolname: str | None = Field(default=None, max_length=255)
    districtname: str | None = Field(default=None, max_length=255)
    countyname: str | None = Field(default=None, max_length=255)
    charter_flag: str | None = Field(default=None, max_length=1)
    coe_flag: str | None = Field(default=None, max_length=1)
    dass_flag: str | None = Field(default=None, max_length=1)
    studentgroup: str | None = Field(default=None, max_length=10)
    currdenom: int | None = Field(default=None)
    currstatus: float | None = Field(default=None)
    priordenom: int | None = Field(default=None)
    priorstatus: float | None = Field(default=None)
    change: float | None = Field(default=None)
    statuslevel: int | None = Field(default=None)
    changelevel: int | None = Field(default=None)
    color: int | None = Field(default=None)
    box: int | None = Field(default=None)
    currnsizemet: str | None = Field(default=None, max_length=10)
    priornsizemet: str | None = Field(default=None, max_length=10)
    accountabilitymet: str | None = Field(default=None, max_length=10)
    hscutpoints: str | None = Field(default=None, max_length=255)
    pairshare_method: str | None = Field(default=None, max_length=255)
    currprate_enrolled: int | None = Field(default=None)
    currprate_tested: int | None = Field(default=None)
    currprate: float | None = Field(default=None)
    currnumprloss: int | None = Field(default=None)
    currdenom_withoutprloss: int | None = Field(default=None)
    currstatus_withoutprloss: float | None = Field(default=None)
    priorprate_enrolled: int | None = Field(default=None)
    priorprate_tested: int | None = Field(default=None)
    priorprate: float | None = Field(default=None)
    priornumprloss: int | None = Field(default=None)
    priordenom_withoutprloss: int | None = Field(default=None)
    priorstatus_withoutprloss: float | None = Field(default=None)
    indicator: str | None = Field(default=None, max_length=10)
    reportingyear: str | None = Field(default=None, max_length=10)


class AcademicIndicatorPublic(AcademicIndicatorBase):
    id: uuid.UUID
    created_at: datetime | None = None


class AcademicIndicatorsPublic(SQLModel):
    data: list[AcademicIndicatorPublic]
    count: int
