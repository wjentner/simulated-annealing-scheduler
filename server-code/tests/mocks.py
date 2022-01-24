from scheduling.schedule import Schedule
from scheduling.schedule_constraints import ScheduleConstraints


def get_mock_schedule_and_constraints() -> (Schedule, ScheduleConstraints):
    schedule = Schedule.load_schedule_from_file('./schedule.json')

    constraints = ScheduleConstraints.load_constraints_from_file('./constraints.json')

    print(constraints.time_constraints)

    return schedule, constraints


def get_optimal_schedule() -> Schedule:
    schedule = Schedule(schedule={
        "2022-01-01": {
            "TaskA": "PersonD",
            "TaskB": "PersonB",
            "TaskC": "PersonC"
        },
        "2022-01-02": {
            "TaskA": "PersonC",
            "TaskB": "PersonD",
            "TaskC": "PersonA"
        },
        "2022-01-06": {
            "TaskA": "PersonA",
            "TaskB": "PersonB"
        },
        "2022-01-08": {
            "TaskA": "PersonD",
            "TaskB": "PersonC",
            "TaskC": "PersonA"
        },
        "2022-01-09": {
            "TaskA": "PersonB",
            "TaskB": "PersonA",
            "TaskC": "PersonD"
        }
    })
    return schedule
