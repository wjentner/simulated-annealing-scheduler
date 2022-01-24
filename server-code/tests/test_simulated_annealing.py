import json
import unittest
from abc import ABC

from scheduling.scheduling_fitness_calculator import SchedulingFitnessCalculator
from scheduling.scheduling_offspring_generator import SchedulingOffspringGenerator
from simulated_annealing.local_search_state import LocalSearchState
from simulated_annealing.sa_observer import SAObserver
from simulated_annealing.simulated_annealing import SimulatedAnnealing
from tests.mocks import get_mock_schedule_and_constraints


class Printer(SAObserver, ABC):
    def new_best_solution(self, new_best_solution: LocalSearchState, new_best_fitness: float):
        print(f'new best solution: {new_best_fitness}')


class TestSimulatedAnnealing(unittest.TestCase):

    def test_simulated_annealing(self):
        schedule, constraints = get_mock_schedule_and_constraints()

        sa = SimulatedAnnealing()

        offspring_generator = SchedulingOffspringGenerator()
        fitness_calculator = SchedulingFitnessCalculator()

        sa.attach(Printer())

        optimized_schedule = sa.run(
            offspring_generator=offspring_generator,
            fitness_calculator=fitness_calculator,
            initial_state=schedule,
            constraints=constraints,
            start_temp=1000,
            k=100,
            num_offsprings=1000,
            alpha=0.1
        )

        penalties = fitness_calculator.get_penalties(optimized_schedule, constraints)

        for p in penalties:
            print(p)

        fitness = fitness_calculator.calculate_fitness(optimized_schedule, constraints)

        print(f'fitness for solution: {fitness}')

        print(json.dumps(optimized_schedule.schedule, sort_keys=True, indent=4))

        self.assertGreater(a=fitness_calculator.calculate_fitness(optimized_schedule, constraints),
                           b=fitness_calculator.calculate_fitness(schedule, constraints))
