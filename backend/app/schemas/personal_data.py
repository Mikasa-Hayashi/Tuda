from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

ItemId = Annotated[str, StringConstraints(min_length=1, max_length=256)]
EntryId = Annotated[str, StringConstraints(pattern=r"^[a-zA-Z0-9_-]{1,80}$")]
Count = Annotated[int, Field(ge=0, le=2**53 - 1)]


class PersonalDataModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SavedRoute(PersonalDataModel):
    id: EntryId
    name: str
    monumentIds: list[ItemId]
    summary: str
    time: Literal["couple", "half", "full"]
    age: Literal["kids", "adults", "family"]
    createdAt: Count


class ScanEntry(PersonalDataModel):
    id: EntryId
    monumentId: ItemId
    monumentName: Annotated[str, StringConstraints(max_length=4096)] | None = None
    confidence: Annotated[float, Field(ge=0, le=1)]
    recognized: bool
    at: Count


class AchievementProgress(PersonalDataModel):
    visited: list[ItemId] = Field(default_factory=list)
    scans: Count = 0
    routes: list[ItemId] = Field(default_factory=list)
    quizzes: list[ItemId] = Field(default_factory=list)
    audio: list[ItemId] = Field(default_factory=list)


class QuizResult(PersonalDataModel):
    score: Count
    total: Count
    passed: bool
    attempts: Count


class PersonalData(PersonalDataModel):
    monumentFavorites: list[ItemId] = Field(default_factory=list)
    routeFavorites: list[ItemId] = Field(default_factory=list)
    savedRoutes: list[SavedRoute] = Field(default_factory=list)
    customRoute: list[ItemId] = Field(default_factory=list)
    achievements: AchievementProgress = Field(default_factory=AchievementProgress)
    quizzes: dict[ItemId, QuizResult] = Field(default_factory=dict)
    scans: list[ScanEntry] = Field(default_factory=list, max_length=50)


class PersonalDataWrite(PersonalDataModel):
    deviceId: EntryId
    id: EntryId
    data: PersonalData


class PersonalDataRequest(PersonalDataModel):
    revision: Count
    write: PersonalDataWrite | None = None


class PersonalDataResponse(PersonalDataModel):
    revision: Count
    data: PersonalData | None
    applied: bool
