import uuid

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# Shared properties for CensusData
class CensusDataBase(SQLModel):
    academic_year: int = Field(index=True)
    aggregation_level: str = Field(index=True)
    county_code: str = Field(index=True)
    district_code: str = Field(index=True)
    school_code: str = Field(index=True)
    county_name: str = Field(max_length=255)
    district_name: str = Field(max_length=255)
    school_name: str = Field(max_length=255)
    charter: str = Field(max_length=255)
    reporting_category: str = Field(max_length=255)
    total_enr: int = Field(default=0)
    gr_tk: int = Field(default=0)
    gr_kn: int = Field(default=0)
    gr_1: int = Field(default=0)
    gr_2: int = Field(default=0)
    gr_3: int = Field(default=0)
    gr_4: int = Field(default=0)
    gr_5: int = Field(default=0)
    gr_6: int = Field(default=0)
    gr_7: int = Field(default=0)
    gr_8: int = Field(default=0)
    gr_9: int = Field(default=0)
    gr_10: int = Field(default=0)
    gr_11: int = Field(default=0)
    gr_12: int = Field(default=0)


# Simple CensusData model following the same pattern as User
class CensusData(CensusDataBase, table=True):
    census_data_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True) #need to add timestamp

    @classmethod
    def get_total_students_in_school(
        cls, session, school_code: str, reporting_category: str
    ) -> dict:
        """
        Return a dictionary with key 'total-students' that is either row.total_enr or None.
        0 is a valid value.
        If no row is found, return {'total-students': None}.
        """
        row = (
            session.query(cls)
            .filter(
                cls.school_code == school_code,
                cls.reporting_category == reporting_category,
            )
            .first()
        )
        if row:
            return {"total-students": row.total_enr}
        else:
            return {"total-students": None}

    @classmethod
    def get_total_students_in_school_by_grade(
        cls, session, school_code: str, reporting_category: str
    ) -> dict:
        """
        Return a dictionary with key 'total_students_by_grade' and value as a list of student counts for grades TK through 12 for this row.
        If no row is found, return {'total_students_by_grade': []}.
        """
        found_row = (
            session.query(cls)
            .filter(
                cls.school_code == school_code,
                cls.reporting_category == reporting_category,
            )
            .first()
        )
        if not found_row:
            return {"total_students_by_grade": []}

        return {
            "total_students_by_grade": [
                found_row.gr_tk,
                found_row.gr_kn,
                found_row.gr_1,
                found_row.gr_2,
                found_row.gr_3,
                found_row.gr_4,
                found_row.gr_5,
                found_row.gr_6,
                found_row.gr_7,
                found_row.gr_8,
                found_row.gr_9,
                found_row.gr_10,
                found_row.gr_11,
                found_row.gr_12,
            ]
        }

    @classmethod
    def get_total_students_in_district(
        cls, session, district_code: str, reporting_category: str
    ) -> dict:
        """
        Return a dictionary with key 'total-students' that is either row.total_enr or None.
        0 is a valid value.
        If no row is found, return {'total-students': None}.
        """
        row = (
            session.query(cls)
            .filter(
                cls.district_code == district_code,
                cls.reporting_category == reporting_category,
            )
            .first()
        )
        if row:
            return {"total-students": row.total_enr}
        else:
            return {"total-students": None}

    @classmethod
    def get_total_students_in_district_by_grade(
        cls, session, district_code: str, reporting_category: str
    ) -> dict:
        """
        Return a dictionary with key 'total_students_by_grade' and value as a list of student counts for grades TK through 12 for this district.
        If no row is found, return {'total_students_by_grade': []}.
        """
        found_row = (
            session.query(cls)
            .filter(
                cls.district_code == district_code,
                cls.reporting_category == reporting_category,
            )
            .first()
        )
        if not found_row:
            return {"total_students_by_grade": []}

        return {
            "total_students_by_grade": [
                found_row.gr_tk,
                found_row.gr_kn,
                found_row.gr_1,
                found_row.gr_2,
                found_row.gr_3,
                found_row.gr_4,
                found_row.gr_5,
                found_row.gr_6,
                found_row.gr_7,
                found_row.gr_8,
                found_row.gr_9,
                found_row.gr_10,
                found_row.gr_11,
                found_row.gr_12,
            ]
        }

    @classmethod
    def get_total_students_in_county(
        cls, session, county_code: str, reporting_category: str
    ) -> dict:
        """
        Return a dictionary with key 'total-students' that is either row.total_enr or None.
        0 is a valid value.
        If no row is found, return {'total-students': None}.
        """
        row = (
            session.query(cls)
            .filter(
                cls.county_code == county_code,
                cls.reporting_category == reporting_category,
            )
            .first()
        )
        if row:
            return {"total-students": row.total_enr}
        else:
            return {"total-students": None}

    @classmethod
    def get_total_students_in_county_by_grade(
        cls, session, county_code: str, reporting_category: str
    ) -> dict:
        """
        Return a dictionary with key 'total_students_by_grade' and value as a list of student counts for grades TK through 12 for this county.
        If no row is found, return {'total_students_by_grade': []}.
        """
        found_row = (
            session.query(cls)
            .filter(
                cls.county_code == county_code,
                cls.reporting_category == reporting_category,
            )
            .first()
        )
        if not found_row:
            return {"total_students_by_grade": []}

        return {
            "total_students_by_grade": [
                found_row.gr_tk,
                found_row.gr_kn,
                found_row.gr_1,
                found_row.gr_2,
                found_row.gr_3,
                found_row.gr_4,
                found_row.gr_5,
                found_row.gr_6,
                found_row.gr_7,
                found_row.gr_8,
                found_row.gr_9,
                found_row.gr_10,
                found_row.gr_11,
                found_row.gr_12,
            ]
        }


# Properties to receive on item creation
class CensusCreate(CensusDataBase):
    pass


# Properties to receive on item update
class CensusUpdate(CensusDataBase):
    pass


# Properties to return via API, id is always required
class CensusDataPublic(CensusDataBase):
    census_data_id: uuid.UUID


class CensusDataPublicList(SQLModel):
    data: list[CensusDataPublic]
    count: int
