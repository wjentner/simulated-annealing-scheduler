import math
import random
from typing import List, Optional, TypeVar, Set

from simulated_annealing.constraints import Constraints
from simulated_annealing.fitness_calculator import FitnessCalculator
from simulated_annealing.local_search_state import LocalSearchState
from simulated_annealing.offspring_generator import OffspringGenerator
from simulated_annealing.sa_observer import SAObserver

GenericState = TypeVar('GenericState')


class SimulatedAnnealing:
    _observers: List[SAObserver] = []
    """
    Observers are notified when a new best solution is found.
    """

    def run(self,
            offspring_generator: OffspringGenerator,
            fitness_calculator: FitnessCalculator,
            initial_state: LocalSearchState,
            constraints: Constraints,
            start_temp: float = 100000,
            k: int = 100,
            num_offsprings: int = 100,
            alpha: float = 0.999) -> LocalSearchState:
        cur_temp: float = start_temp
        cur_state: LocalSearchState = initial_state
        best_fitness: Optional[float] = None
        best_state: Optional[LocalSearchState] = None
        update: bool = True

        while update is True and cur_temp > 1E-300:
            # get all offsprings
            offsprings: Set[LocalSearchState] = offspring_generator.generate_offsprings(cur_state, constraints,
                                                                                        num_offsprings)
            # filter for valid offsprings
            offsprings = {x for x in offsprings if fitness_calculator.is_valid(x, constraints)}
            offsprings_count: int = len(offsprings)
            offsprings_with_fitness = []
            # calculate the fitness for every offspring and sort them by the fitness
            for o in offsprings:
                offsprings_with_fitness.append((o, fitness_calculator.calculate_fitness(o, constraints)))
            if random.uniform(0, 1) < 0.9:
                offsprings_with_fitness.sort(key=lambda t: t[1], reverse=True)
            else:
                random.shuffle(offsprings_with_fitness)
            update: bool = False
            cur_fitness = fitness_calculator.calculate_fitness(cur_state, constraints)
            for i in range(0, k):
                a: int = i % offsprings_count
                acceptance_probability: float = self._acceptance_probability(
                    fitness_current=cur_fitness,
                    fitness_offspring=offsprings_with_fitness[a][1],
                    current_temp=cur_temp
                )
                if random.uniform(0, 1) < acceptance_probability:
                    cur_state = offsprings_with_fitness[a][0]
                    cur_fitness = offsprings_with_fitness[a][1]
                    print(f'{cur_fitness} - {acceptance_probability} - {cur_temp}')
                    update = True
                    break

            cur_temp = alpha * cur_temp

            if best_fitness is None or cur_fitness > best_fitness:
                best_state = cur_state
                best_fitness = cur_fitness
                self._notify_new_best_solution(best_state, best_fitness)

        return best_state

    def attach(self, obs: SAObserver):
        self._observers.append(obs)

    def detach(self, obs: SAObserver):
        self._observers.remove(obs)

    @staticmethod
    def _acceptance_probability(fitness_current: float, fitness_offspring: float, current_temp: float) -> float:
        if fitness_offspring > fitness_current:
            return 1
        else:
            return math.exp(-(fitness_current - fitness_offspring) / current_temp)

    def _notify_new_best_solution(self, best_solution: LocalSearchState, best_fitness: float) -> None:
        for obs in self._observers:
            obs.new_best_solution(best_solution, best_fitness)
