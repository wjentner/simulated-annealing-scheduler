from abc import abstractmethod
from typing import Any


class LocalSearchState:
    """
    A state representation of a constraint-based optimization problem.
    """

    @abstractmethod
    def equals(self, other: Any):
        """
        Checks if two state representations are equal
        :param other: the other state
        :return: true iff the state representations are equal or identical, false otherwise
        """
        pass
