from abc import abstractmethod
from typing import Set

from simulated_annealing.constraints import Constraints
from simulated_annealing.local_search_state import LocalSearchState


class OffspringGenerator:
    """
    This class is provided to the algorithm and calculates offsprings (mutations) for a given state.
    """

    @abstractmethod
    def generate_offspring(self, parent: LocalSearchState, constraints: Constraints) -> LocalSearchState:
        """
        This method _must_ return a new LocalSearchState and _must not_ modify the existing LocalSearchState
        :param parent: the parent state which is the base of the offspring
        :param constraints: the constraints for this optimization problem. May be used for the mutation.
        :return: returns a _new_ LocalSearchState which is based on a mutation of the parent state
        """
        pass

    def generate_offsprings(self, parent: LocalSearchState, constraints: Constraints, number: int) -> Set[LocalSearchState]:
        """
        Returns a list of offsprings.
        Important: This method does not check for duplicate offsprings.
        :param parent: the parent state which is the base of the offsprings
        :param constraints: the constraints for this optimization problem. May be used for the mutation.
        :param number: the number of offsprings to generate
        :return: a list of offsprings
        """
        ret: Set[LocalSearchState] = set()
        for i in range(0, number):
            ret.add(self.generate_offspring(parent, constraints))
        return ret
