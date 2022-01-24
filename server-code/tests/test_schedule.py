import unittest

from scheduling.schedule import Schedule
from tests.mocks import get_mock_schedule_and_constraints


class TestSchedule(unittest.TestCase):

    def test_json_load_and_equality(self):
        schedule1 = Schedule.load_schedule_from_file('./schedule.json')
        schedule2, _ = get_mock_schedule_and_constraints()

        self.assertTrue(schedule1.equals(schedule2))
