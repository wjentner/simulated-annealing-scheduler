import json
from abc import ABC
from typing import Dict, List

from pydantic import BaseModel

from simulated_annealing.local_search_state import LocalSearchState


class Schedule(LocalSearchState, ABC, BaseModel):
    schedule: Dict[str, Dict[str, str]] = {}
    """
    Contains a dictionary with dates as key which contains another dictionary with keys as tasks for that day and
    values as person ids.
    Example:
        2021-12-30:
            FI: PersonA
            FC: PersonB
        2021-12-31:
            FI: PersonC
            FC: PersonD
    """

    @staticmethod
    def load_schedule_from_file(json_file: str) -> 'Schedule':
        with open(json_file, mode='r') as json_data:
            data = json.load(json_data)
            s = Schedule()
            s.schedule = data
            return s

    def write_to_file(self, json_file: str):
        with open(json_file, mode='w') as f:
            json.dump(obj=self.schedule, fp=f)

    def get_dates(self) -> List[str]:
        """
        :return: A sorted list of dates in the schedule
        """
        l: List[str] = list(self.schedule.keys())
        l.sort()
        return l

    def get_schedule_for_date(self, date: str) -> Dict[str, str]:
        return self.schedule[date]

    def get_schedule_per_person(self) -> Dict[str, Dict[str, str]]:
        """
        person -> date -> task
        :return:
        """

        person_date_task: Dict[str, Dict[str, str]] = {}
        for date, task_person in self.schedule.items():
            for task, person in task_person.items():

                if person not in person_date_task:
                    person_date_task[person] = {}

                person_date_task[person][date] = task

        return person_date_task

    def get_counts(self) -> Dict[str, Dict[str, int]]:
        """
        :return: A dict for person->task->numberOfSchedules, also contains task 'total'
        """
        ret: Dict[str, Dict[str, int]] = {}
        for date in self.get_dates():
            for task, person in self.get_schedule_for_date(date).items():
                if person not in ret:
                    ret[person] = {}

                if task not in ret[person]:
                    ret[person][task] = 0

                if 'total' not in ret[person]:
                    ret[person]['total'] = 0

                ret[person][task] += 1
                ret[person]['total'] += 1

        return ret

    def equals(self, other: 'Schedule'):
        return self.schedule == other.schedule

    def __eq__(self, other):
        if isinstance(other, Schedule):
            return self.schedule == other.schedule

    def __ne__(self, other):
        return not self == other

    def __hash__(self):
        return hash(json.dumps(self.schedule, sort_keys=True))
