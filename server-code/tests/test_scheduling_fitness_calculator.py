from unittest import TestCase

from scheduling.scheduling_fitness_calculator import SchedulingFitnessCalculator
from tests.mocks import get_optimal_schedule, get_mock_schedule_and_constraints


class TestSchedulingFitnessCalculator(TestCase):

    def test_optimal_schedule(self):
        _, constraints = get_mock_schedule_and_constraints()

        calc = SchedulingFitnessCalculator()

        optimal_solution = get_optimal_schedule()

        penalties = calc.get_penalties(optimal_solution, constraints)

        fitness = calc.calculate_fitness(optimal_solution, constraints)

        for p in penalties:
            print(p)

        print(fitness)
