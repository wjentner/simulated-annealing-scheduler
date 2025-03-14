import datetime
from abc import ABC
from functools import reduce
from datetime import datetime
from typing import Set, List, Dict

from scheduling.schedule import Schedule
from scheduling.partial_penalty import PartialPenalty
from scheduling.schedule_constraints import ScheduleConstraints
from scheduling.violations import HardConstraintException, Violation
from simulated_annealing.fitness_calculator import FitnessCalculator


class SchedulingFitnessCalculator(FitnessCalculator, ABC):

    def get_penalties(self, state: Schedule, constraints: ScheduleConstraints) -> List[PartialPenalty]:
        partial_penalties: List[PartialPenalty] = []

        partial_penalties.extend(self._empty_tasks(state, constraints))
        partial_penalties.extend(self._min_max_constraints(state, constraints))
        partial_penalties.extend(self._min_max_constraints_general(state, constraints))
        partial_penalties.extend(self._time_constraints(state, constraints))
        partial_penalties.extend(self._adjacent_task_constraints(state, constraints))
        partial_penalties.extend(self._buddy_constraints(state, constraints))
        partial_penalties.extend(self._task_variance_penalties(state, constraints))
        partial_penalties.extend(self._saturday_sunday_inequality_penalty(state, constraints))
        partial_penalties.extend(self._not_uniform_penalty(state, constraints))

        return partial_penalties

    def calculate_fitness(self, state: Schedule, constraints: ScheduleConstraints) -> float:
        """
        Returns a negative fitness whereas the greater the fitness the fewer penalties the current schedule has.
        A fitness of 0 would mean that there are no penalties (almost impossible).
        :param state: the current schedule
        :param constraints: the constraints to calculate penalties
        :return: a negative fitness score
        """
        partial_penalties: List[PartialPenalty] = self.get_penalties(state, constraints)

        return -1 * reduce(lambda psum, p: psum + p.penalty, partial_penalties, 0)

    def is_valid(self, state: Schedule, constraints: ScheduleConstraints) -> bool:
        try:
            self._no_user_twice_at_same_date(state)
            return True
        except HardConstraintException:
            return False

    @staticmethod
    def _empty_tasks(schedule: Schedule, constraints: ScheduleConstraints) -> List[Violation]:
        """
        :param schedule: the schedule to check
        :return: the summed penalties and a list of violations
        """
        violations: List[Violation] = []

        for date in schedule.get_dates():
            for task, user in schedule.get_schedule_for_date(date).items():
                if user is None:
                    violations.append(Violation(desc=f'No one is scheduled for {task} on {date}',
                                                penalty=constraints.empty_task_penalty))

        return violations

    @staticmethod
    def _no_user_twice_at_same_date(schedule: Schedule):
        """
        :param schedule: the schedule to check
        :return:
        """
        for date in schedule.get_dates():
            already_scheduled: Set[str] = set()

            for task, user in schedule.get_schedule_for_date(date).items():
                if user in already_scheduled:
                    raise HardConstraintException(f'{user} is already scheduled for that date ({task}) {date}')

                already_scheduled.add(user)

    @staticmethod
    def _min_max_constraints(schedule: Schedule, constraints: ScheduleConstraints) -> List[Violation]:
        """
        :param schedule: the schedule to check
        :param constraints: the constraints
        :return:
        """
        person_task_counts = schedule.get_counts()
        tasks = constraints.get_tasks()
        violations: List[Violation] = []

        for person in constraints.min_max_constraints.keys():
            for task in tasks:
                actual_count = person_task_counts[person][task] if person in person_task_counts and task in \
                                                                   person_task_counts[person] else 0

                penalty = constraints.get_min_max_penalty(person, task, actual_count)

                if penalty > 0:
                    violations.append(Violation(
                        desc=f'{person} has {actual_count} schedules for task {task}, '
                             f'which violates {constraints.get_min_max_constraint_as_str(person, task)}',
                        penalty=penalty))

        # check all counts, if they do not occur in min-max-constraint assume a 0(100000)-0(1000000) constraint
        for person, task_counts in person_task_counts.items():
            for task, actual_count in task_counts.items():
                if task == 'total':
                    continue

                if person not in constraints.min_max_constraints or task not in constraints.min_max_constraints[person]:
                    violations.append(Violation(
                        desc=f'{person} has {actual_count} schedules for task {task}, '
                             f'which violates 0(100000.0)-0(100000.0)',
                        penalty=actual_count * constraints.default_min_max_constraint_penalty))

        return violations

    @staticmethod
    def _min_max_constraints_general(schedule: Schedule, constraints: ScheduleConstraints) -> List[Violation]:
        """
        :param schedule: the schedule to check
        :param constraints: the constraints
        :return:
        """
        person_task_counts = schedule.get_counts()
        violations: List[Violation] = []

        if constraints.min_max_constraints_general is None:
            return violations

        for person in constraints.min_max_constraints_general.keys():
            actual_count = person_task_counts[person]['total'] if person in person_task_counts and 'total' in \
                                                                  person_task_counts[person] else 0

            penalty = constraints.get_min_max_general_penalty(person, actual_count)

            if penalty > 0:
                violations.append(Violation(
                    desc=f'{person} has {actual_count} schedules in total, '
                         f'which violates {constraints.get_min_max_general_constraint_as_str(person)}',
                    penalty=penalty))

        return violations

    @staticmethod
    def _time_constraints(schedule: Schedule, constraints: ScheduleConstraints) -> List[Violation]:

        violations: List[Violation] = []

        person_date_task = schedule.get_schedule_per_person()

        for tc in constraints.time_constraints:
            tc_min = datetime.strptime(tc['min_date'], '%Y-%m-%d')
            tc_max = datetime.strptime(tc['max_date'], '%Y-%m-%d')

            if tc['negated']:
                # make sure that the person is not scheduled between min-max date
                if tc['person'] not in person_date_task:
                    continue
                for date, task in person_date_task[tc['person']].items():
                    date_parsed = datetime.strptime(date, '%Y-%m-%d')

                    # person is scheduled in range
                    if tc_min <= date_parsed <= tc_max:

                        # violation only if no task specified or tasks match
                        if tc['task'] is None or tc['task'] == task:
                            violations.append(Violation(desc=f'{tc["person"]} is scheduled for {task} on {date} '
                                                             f'but has constraint !{tc["min_date"]} - {tc["max_date"]}',
                                                        penalty=tc["penalty"]))

            else:
                # make sure that the person is scheduled at least once between min-max date
                found = False
                if tc['person'] in person_date_task:
                    for date, task in person_date_task[tc['person']].items():
                        date_parsed = datetime.strptime(date, '%Y-%m-%d')

                        if (tc_min <= date_parsed <= tc_max) and (tc['task'] is None or tc['task'] == task):
                            found = True
                            break

                if not found:
                    violations.append(Violation(desc=f'{tc["person"]} wants to be scheduled for task {tc["task"]} '
                                                     f'between {tc["min_date"]} - {tc["max_date"]} but no date was found',
                                                penalty=tc["penalty"]))
        return violations

    @staticmethod
    def _adjacent_task_constraints(schedule: Schedule, constraints: ScheduleConstraints) -> List[Violation]:

        violations: List[Violation] = []

        person_date_task = schedule.get_schedule_per_person()

        for atc in constraints.adjacent_task_constraints:
            if atc['negated']:
                # since we only look at negative associations we can skip if the person is not scheduled
                if atc['person'] not in person_date_task:
                    continue

                # looking through the schedule of that person
                for date, task in person_date_task[atc['person']].items():
                    # if the constraint has a specific task set and the schedule is not for this task
                    # we can skip it
                    if atc['own_task'] is not None and atc['own_task'] != task:
                        continue

                    # here, either the own task is None or the schedule matches the task
                    # now check whether we violate the rule
                    for other_task, other_person in schedule.get_schedule_for_date(date).items():
                        # we can skip our own schedule
                        if task == other_task and atc['person'] == other_person:
                            continue

                        if atc['adjacent_task'] == other_task and atc['adjacent_person'] is None:
                            violations.append(Violation(desc=f'{atc["person"]} is scheduled for {task} on {date} '
                                                             f'but does not want to be schedule with task {atc["adjacent_task"]}',
                                                        penalty=atc["penalty"]))

                        if atc['adjacent_task'] == other_task and atc['adjacent_person'] == other_person:
                            violations.append(Violation(desc=f'{atc["person"]} is scheduled for {task} on {date} '
                                                             f'but does not want to be schedule with task {atc["adjacent_task"]} and person {atc["adjacent_person"]}',
                                                        penalty=atc["penalty"]))

                        if atc['adjacent_task'] is None and atc['adjacent_person'] == other_person:
                            violations.append(Violation(desc=f'{atc["person"]} is scheduled for {task} on {date} '
                                                             f'but does not want to be schedule with person {atc["adjacent_person"]}',
                                                        penalty=atc["penalty"]))

            else:  # person wants to be scheduled with specific task or person
                # find all schedules for that person
                if atc['person'] not in person_date_task:
                    return violations
                for date, task in person_date_task[atc['person']].items():
                    # we don't need to consider that schedule if the own task doesn't match the specified task
                    if atc['own_task'] is not None and atc['own_task'] != task:
                        continue

                    found = False

                    # check for all other schedules at the same date
                    for other_task, other_person in schedule.get_schedule_for_date(date).items():
                        # if other_person is us skip
                        if other_person == atc['person']:
                            continue

                        # only task but not person
                        if atc['adjacent_task'] is not None and atc['adjacent_person'] is None:
                            if atc['adjacent_task'] == other_task:
                                found = True
                        elif atc['adjacent_task'] is None and atc['adjacent_person'] is not None:
                            if atc['adjacent_person'] == other_person:
                                found = True
                        elif atc['adjacent_task'] is not None and atc['adjacent_person'] is not None:
                            if atc['adjacent_person'] == other_person and atc['adjacent_task'] == other_task:
                                found = True
                        else:
                            raise Exception('Invalid constraint other_task and other_person are null')

                    # for that schedule we couldn't find anything
                    if found is False:
                        violations.append(Violation(desc=f'{atc["person"]} is scheduled on {date} with {task} '
                                                         f'and wants to be scheduled with {atc["adjacent_task"]} and/or {atc["adjacent_person"]} but could not be found.',
                                                    penalty=atc["penalty"]))

        return violations

    @staticmethod
    def _buddy_constraints(schedule: Schedule, constraints: ScheduleConstraints) -> List[Violation]:

        violations: List[Violation] = []

        person_date_task = schedule.get_schedule_per_person()

        for bc in constraints.buddy_constraints:
            if bc['negated']:
                # should not be scheduled together
                for date in person_date_task[bc['person_a']].keys():
                    # all scheduled dates for person_a
                    if date in person_date_task[bc['person_b']]:
                        # they are scheduled together
                        violations.append(
                            Violation(desc=f'{bc["person_a"]} and {bc["person_b"]} do not want to be scheduled '
                                           f'together but are on {date}', penalty=bc['penalty']))

            else:
                # want to be scheduled together. search for dates where they are not
                for date_a in person_date_task[bc['person_a']].keys():
                    if date_a not in person_date_task[bc['person_b']]:
                        violations.append(
                            Violation(desc=f'{bc["person_a"]} and {bc["person_b"]} do want to be scheduled '
                                           f'together but are not scheduled together on {date_a}',
                                      penalty=bc['penalty']))

                for date_b in person_date_task[bc['person_b']].keys():
                    if date_b not in person_date_task[bc['person_a']]:
                        violations.append(
                            Violation(desc=f'{bc["person_a"]} and {bc["person_b"]} do want to be scheduled '
                                           f'together but are not scheduled together on {date_b}',
                                      penalty=bc['penalty']))

        return violations

    @staticmethod
    def _task_variance_penalties(schedule: Schedule, constraints: ScheduleConstraints) -> List[PartialPenalty]:
        penalties: List[PartialPenalty] = []

        actual_counts = schedule.get_counts()
        persons_per_task = constraints.get_persons_per_task()
        dates_per_task = constraints.get_number_of_dates_per_task()

        tasks = list(constraints.get_tasks())
        tasks.sort()
        tasks.append('total')

        for task in tasks:
            avg_workload = dates_per_task[task] / float(len(persons_per_task[task]))

            summed_variance = 0
            for person, task_dict in actual_counts.items():
                count = task_dict[task] if task in task_dict else 0
                variance = pow(count - avg_workload, 2)
                summed_variance += variance

            penalties.append(PartialPenalty(desc=f'Variance penalty for task {task}',
                                            penalty=constraints.task_variance_penalty_factor * summed_variance))

        return penalties

    @staticmethod
    def _saturday_sunday_inequality_penalty(schedule: Schedule, constraints: ScheduleConstraints) -> List[
        PartialPenalty]:
        person_date_task = schedule.get_schedule_per_person()

        inequality_sum = 0

        for person in person_date_task.keys():

            counts: Dict[str, float] = {}

            for date in person_date_task[person].keys():
                if date not in constraints.dates_and_tasks:
                    continue

                date_parsed: datetime.datetime = datetime.strptime(date, '%Y-%m-%d')
                day = date_parsed.strftime('%a').lower()
                if 'holiday' in constraints.dates_and_tasks[date] and constraints.dates_and_tasks[date][
                    'holiday'] is True:
                    day = 'sun'

                if day not in counts:
                    counts[day] = 0

                counts[day] += 1

            sa = counts.get('sat') or 0
            su = counts.get('sun') or 0

            inequality_sum += pow(sa - su, 2)

        return [PartialPenalty(desc=f'Penalty for Sa/Su inequality',
                               penalty=constraints.sat_sun_inequality_factor * (
                                           inequality_sum / float(len(person_date_task))))]

    @staticmethod
    def _not_uniform_penalty(schedule: Schedule, constraints: ScheduleConstraints) -> List[PartialPenalty]:

        person_date_task = schedule.get_schedule_per_person()

        penalty_sum: float = 0

        for person in person_date_task:
            dates = list(person_date_task[person].keys())
            dates.sort()

            for i in range(1, len(dates)):
                last_date = datetime.strptime(dates[i - 1], '%Y-%m-%d')
                this_date = datetime.strptime(dates[i], '%Y-%m-%d')

                delta = this_date - last_date
                penalty_sum += constraints.not_uniform_penalty_min_days / float(delta.days)

        return [PartialPenalty(desc=f'Not-uniform-penalty',
                               penalty=constraints.not_uniform_penalty_factor * (
                                           penalty_sum / float(len(person_date_task)))
                               )]
