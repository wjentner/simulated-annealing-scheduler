import json
from typing import Dict, List, Set, Optional

from pydantic import BaseModel
from typing_extensions import TypedDict

from simulated_annealing.constraints import Constraints


class TimeConstraint(TypedDict):
    negated: bool
    person: str
    task: Optional[str]
    """
    If task is not set then the constraint applies to all tasks for the time range
    """

    min_date: str
    """
    Format: yyyy-mm-dd
    """

    max_date: str
    """
    Format: yyyy-mm-dd
    """

    penalty: float


class BuddyConstraint(TypedDict):
    negated: bool
    person_a: str
    person_b: str
    penalty: float


class MinMaxConstraint(TypedDict):
    min: int
    max: int
    min_penalty: float
    max_penalty: float


class ScheduleConstraints(Constraints, BaseModel):
    empty_task_penalty: float = 1000000
    """
    If a task is not filled with a person, apply this penalty.
    """

    default_min_max_constraint_penalty: float = 1000000
    """
    If no min-max-constraint is set for a person and task but the person _is_ scheduled for this task, apply
    this penalty.
    """

    task_variance_penalty_factor: float = 1
    """
    Apply this factor to the task variance penalties. 0 turns off these penalties.
    """

    sat_sun_inequality_factor: float = 1
    """
    Apply this factor to the saturday/sunday inequality penalty. 0 turns off this penalty.
    """

    not_uniform_penalty_min_days: int = 10
    """
    These are the minimum days two schedules of a person should be apart.
    Example: If a person is scheduled on 2021-01-01 and again on 2021-01-03 the penalty is higher than if the person is
    scheduled on 2021-01-01 and then again on 2021-01-10.
    """

    not_uniform_penalty_factor: float = 1
    """
    Apply this factor to the not-uniform-penalty. 0 turns off this penalty.
    """

    min_max_constraints: Dict[str, Dict[str, MinMaxConstraint]] = {}
    """
    Example:
        28:
            FI:
                min: 1
                min_penalty: 100000
                max: 5
                max_penalty: 100000
    """

    dates_and_tasks: Dict[str, Dict[str, bool]] = {}
    """
    Example:
        2021-12-30:
            FI: True
            WC: True
            holiday: False
    """

    time_constraints: List[TimeConstraint] = []

    buddy_constraints: List[BuddyConstraint] = []

    @staticmethod
    def load_constraints_from_file(json_file: str) -> 'ScheduleConstraints':
        with open(json_file, mode='r') as json_data:
            return ScheduleConstraints.load_constraints_from_json(json_data.read())

    @staticmethod
    def load_constraints_from_json(json_data: str) -> 'ScheduleConstraints':
        data = json.loads(json_data)
        sc = ScheduleConstraints()
        sc.min_max_constraints = data['min_max_constraints'] if 'min_max_constraints' in data else {}
        sc.dates_and_tasks = data['dates_and_tasks'] if 'dates_and_tasks' in data else {}
        sc.time_constraints = data['time_constraints'] if 'time_constraints' in data else []
        sc.buddy_constraints = data['buddy_constraints'] if 'buddy_constraints' in data else []

        return sc

    def to_json(self) -> str:
        return json.dumps(self)

    def write_to_file(self, json_file: str):
        with open(json_file, mode='w') as f:
            json.dump(obj=self.dict(), fp=f)

    def get_tasks(self) -> Set[str]:
        tasks: Set[str] = set()

        for date, taskmap in self.dates_and_tasks.items():
            for task in taskmap.keys():
                if task == 'holiday':
                    continue
                tasks.add(task)

        return tasks

    def get_min_max_penalty(self, person: str, task: str, actual_count: int) -> float:
        if person not in self.min_max_constraints or task not in self.min_max_constraints[person]:
            return 0

        lower_bound = self.min_max_constraints[person][task]['min']
        lower_bound_penalty = self.min_max_constraints[person][task]['min_penalty']
        upper_bound = self.min_max_constraints[person][task]['max']
        upper_bound_penalty = self.min_max_constraints[person][task]['max_penalty']

        if actual_count < lower_bound:
            return abs(actual_count - lower_bound) * lower_bound_penalty

        if actual_count > upper_bound:
            return abs(actual_count - upper_bound) * upper_bound_penalty

        return 0

    def get_min_max_constraint_as_str(self, person: str, task: str) -> Optional[str]:
        if person not in self.min_max_constraints or task not in self.min_max_constraints[person]:
            return None

        lower_bound = self.min_max_constraints[person][task]['min']
        lower_bound_penalty = self.min_max_constraints[person][task]['min_penalty']
        upper_bound = self.min_max_constraints[person][task]['max']
        upper_bound_penalty = self.min_max_constraints[person][task]['max_penalty']

        return f'{lower_bound}({lower_bound_penalty})-{upper_bound}({upper_bound_penalty})'

    def get_number_of_dates_per_task(self) -> Dict[str, int]:
        """
        Calculates the number of dates for each task and all tasks (total).
        :return: A dictionary with tasks as keys (plus 'total') and an integer number representing the number of dates.
        """
        sum_dates: Dict[str, int] = {'total': 0}
        for date, tasks_dict in self.dates_and_tasks.items():
            for task, task_bool in tasks_dict.items():
                if task == 'holiday':
                    continue

                if task not in sum_dates:
                    sum_dates[task] = 0

                if task_bool is True:
                    sum_dates[task] += 1

            sum_dates['total'] += 1

        return sum_dates

    def is_holiday(self, date: str) -> Optional[bool]:
        if date not in self.dates_and_tasks:
            return None

        return self.dates_and_tasks[date]['holiday'] is True

    def is_wish_date(self, date: str, person: str, task: Optional[str] = None) -> bool:
        """
        :param date:
        :param person:
        :param task: (optional)
        :return: True if the date is a wish date specified by the user.
        """
        filtered = list(filter(lambda d:
                               d.min_date == date
                               and d.max_date == date
                               and d.person == person
                               and ((task is not None and d.task == task) or d.task == 'general'),
                               self.time_constraints
                               ))
        return len(filtered) > 0

    def get_persons_per_task(self) -> Dict[str, Set[str]]:
        """
        :return: a dictionary of tasks referring to all persons available for that task (task -> persons)
        """
        ret: Dict[str, Set[str]] = {'total': set()}

        for person, taskmap in self.min_max_constraints.items():
            for task in taskmap.keys():
                if taskmap[task]['min'] > 0:
                    # minimum constraint for that task is 1 or greater
                    if task not in ret:
                        ret[task] = set()

                    ret[task].add(person)
                    ret['total'].add(person)
        return ret
