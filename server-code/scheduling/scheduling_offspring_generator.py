import random
from abc import ABC
from copy import deepcopy
from typing import Dict, Optional, Set

from scheduling.schedule import Schedule
from scheduling.schedule_constraints import ScheduleConstraints
from simulated_annealing.offspring_generator import OffspringGenerator


class SchedulingOffspringGenerator(OffspringGenerator, ABC):

    @staticmethod
    def initial_schedule(constraints: ScheduleConstraints) -> Schedule:
        """
        Uses round robin to create a valid schedule
        :return: a valid schedule
        """
        persons_for_task = constraints.get_persons_per_task()

        schedule_data: Dict[str, Dict[str, str]] = {}
        """
            Contains a dictionary with dates as key which contains another dictionary with keys as tasks for that
            day and values as person ids.
            Example:
                2021-12-30:
                    FI: 28
                    FC: 10
                2021-12-31:
                    FI: 10
                    FC: 28
        """

        for date, taskmap in constraints.dates_and_tasks.items():

            persons_already_scheduled: set[str] = set()

            for task in taskmap.keys():
                if task != 'holiday' and taskmap[task] is True:
                    # valid task
                    random_person: Optional[str] = None
                    tries = 0
                    while random_person is None and tries < 100:
                        random_person = random.sample(persons_for_task[task], 1)[0]
                        if random_person in persons_already_scheduled:
                            random_person = None
                        tries += 1

                    if random_person is None:
                        raise f'Could not find a person for task {task} and date {date}'

                    if date not in schedule_data:
                        schedule_data[date] = {}

                    schedule_data[date][task] = random_person
                    persons_already_scheduled.add(random_person)

        s = Schedule()
        s.schedule = schedule_data
        return s

    def generate_offspring(self, parent: Schedule, constraints: ScheduleConstraints) -> Schedule:
        r = random.randint(1, 2)
        if r == 1:
            return SchedulingOffspringGenerator.get_random_schedule_by_point_mutation(parent, constraints)
        else:
            return SchedulingOffspringGenerator.get_random_schedule_by_switching(parent, constraints)

    def generate_offsprings(self, parent: Schedule, constraints: ScheduleConstraints, number: int) -> Set[Schedule]:
        ret: Set[Schedule] = set()
        for i in range(0, int(number/5)):
            tmp_offspring = parent
            for j in range(0, 5):
                tmp_offspring = self.generate_offspring(tmp_offspring, constraints)
                ret.add(tmp_offspring)
        return ret

    @staticmethod
    def get_random_date(constraints: ScheduleConstraints) -> str:
        return random.choice(tuple(constraints.dates_and_tasks.keys()))

    @staticmethod
    def get_random_task_for_date(constraints: ScheduleConstraints, date: str) -> str:
        if date not in constraints.dates_and_tasks:
            raise f'{date} is not in constraints.dates_and_tasks'

        tasks = constraints.dates_and_tasks[date]
        filtered_tasks = []

        for (t, task_bool) in tasks.items():
            if task_bool and t != 'holiday':
                filtered_tasks.append(t)

        return random.choice(tuple(filtered_tasks))

    @staticmethod
    def get_random_person_for_task(constraints: ScheduleConstraints, task: str) -> str:
        persons = constraints.get_persons_per_task()[task]
        return random.choice(tuple(persons))

    @staticmethod
    def get_random_schedule_by_point_mutation(parent: Schedule, constraints: ScheduleConstraints) -> Schedule:
        schedule_copy = deepcopy(parent.schedule)

        random_date = SchedulingOffspringGenerator.get_random_date(constraints)
        random_task = SchedulingOffspringGenerator.get_random_task_for_date(constraints, random_date)
        random_person = SchedulingOffspringGenerator.get_random_person_for_task(constraints, random_task)

        if random_date not in schedule_copy:
            schedule_copy[random_date] = {}

        # print(f'exchange {schedule_copy[random_date][random_task]} with {random_person} on {random_date} for {random_task}')
        schedule_copy[random_date][random_task] = random_person

        s = Schedule()
        s.schedule = schedule_copy
        return s

    @staticmethod
    def get_random_schedule_by_switching(parent: Schedule, constraints: ScheduleConstraints) -> Schedule:
        schedule_copy = deepcopy(parent.schedule)

        random_date1: str | None = None
        random_date2: str | None = None
        random_task1: str | None = None
        random_task2: str | None = None
        current_person1: str | None = None
        current_person2: str | None = None

        while current_person1 is None and current_person2 is None:
            random_date1 = SchedulingOffspringGenerator.get_random_date(constraints)
            random_date2 = SchedulingOffspringGenerator.get_random_date(constraints)
            random_task1 = SchedulingOffspringGenerator.get_random_task_for_date(constraints, random_date1)
            random_task2 = SchedulingOffspringGenerator.get_random_task_for_date(constraints, random_date2)
            d1 = schedule_copy.get(random_date1)
            d2 = schedule_copy.get(random_date2)
            if d1 is None or d2 is None:
                continue
            current_person1 = d1.get(random_task1)
            current_person2 = d2.get(random_task2)

        # switch persons
        schedule_copy[random_date1][random_task1] = current_person2
        schedule_copy[random_date2][random_task2] = current_person1

        s = Schedule()
        s.schedule = schedule_copy
        return s
