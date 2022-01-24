from abc import abstractmethod

from simulated_annealing.constraints import Constraints
from simulated_annealing.local_search_state import LocalSearchState


class FitnessCalculator:
    """
    This class is provided to the algorithm to calculate a fitness score for a given state and given constraints.
    """

    @abstractmethod
    def calculate_fitness(self, state: LocalSearchState, constraints: Constraints) -> float:
        """
        Calculate the fitness of a given state based on given constraints.
        The greater the fitness, the better is the current state.
        :param state: the state to calculate the fitness for
        :param constraints: the constraints that determine the fitness
        :return: a fitness score
        """
        pass

    @abstractmethod
    def is_valid(self, state: LocalSearchState, constraints: Constraints) -> bool:
        """
        Determines whether a given state based on given constraints is valid.
        A valid state does not violate any hard constraints.
        :param state: the state to check for validity
        :param constraints: the constraints that determine the validity
        :return: true iff the state is valid, false otherwise
        """
        pass
