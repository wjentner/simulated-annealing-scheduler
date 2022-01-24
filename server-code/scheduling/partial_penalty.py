from pydantic import BaseModel


class PartialPenalty(BaseModel):
    penalty: float
    desc: str

    def __str__(self) -> str:
        return f'{self.desc}. Penalty: {self.penalty}'
