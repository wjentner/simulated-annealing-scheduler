import unittest

from scheduling.scheduling_fitness_calculator import SchedulingFitnessCalculator
from tests.mocks import get_mock_schedule_and_constraints


class TestScheduleConstraints(unittest.TestCase):

    def test_mock_schedule_constraints(self):
        schedule, constraints = get_mock_schedule_and_constraints()

        fitness_calculator = SchedulingFitnessCalculator()

        penalties = fitness_calculator.get_penalties(schedule, constraints)

        for p in penalties:
            print(p)

        self.assertEqual(len(penalties), 12)


if __name__ == '__main__':
    unittest.main()
