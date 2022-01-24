from abc import abstractmethod

from simulated_annealing.local_search_state import LocalSearchState


class SAObserver:
    """
    An observer class that is notified when a new best solution is found.
    """

    @abstractmethod
    def new_best_solution(self, new_best_solution: LocalSearchState, new_best_fitness: float):
        pass
