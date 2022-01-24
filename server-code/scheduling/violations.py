from scheduling.partial_penalty import PartialPenalty


class HardConstraintException(Exception):
    """A hard constraint has been violated."""
    pass


class Violation(PartialPenalty):

    def __str__(self) -> str:
        return f'Violation: {self.desc}. Penalty: {self.penalty}'
