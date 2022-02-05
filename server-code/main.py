import csv
import glob
import io
import json
import logging
import os.path
import traceback
from datetime import datetime
from os import path
from typing import Dict, List

from fastapi import BackgroundTasks, FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.requests import Request
from starlette.responses import FileResponse

from scheduling.partial_penalty import PartialPenalty
from scheduling.schedule import Schedule
from scheduling.schedule_constraints import ScheduleConstraints
from scheduling.scheduling_fitness_calculator import \
    SchedulingFitnessCalculator
from scheduling.scheduling_offspring_generator import \
    SchedulingOffspringGenerator
from simulated_annealing.sa_observer import SAObserver
from simulated_annealing.simulated_annealing import SimulatedAnnealing

if not os.path.exists('./data/solutions/tmp'):
    os.makedirs('./data/solutions/tmp')


class SelectablePerson(BaseModel):
    id: str
    name: str


class SolutionStatus(BaseModel):
    name: str
    status: str
    fitness: float | None
    penalties: List[PartialPenalty] | None
    schedule: Dict[str, Dict[str, str]] | None
    error_msg: str | None


class AlgorithmSettings(BaseModel):
    initial_state: str | None
    start_temp: float = 10000
    alpha: float = 0.999
    k: int = 1000
    num_offsprings: int = 1000


class TmpSolWriter(SAObserver):
    sol: str

    def __init__(self, sol: str):
        self.sol = sol

    def new_best_solution(self, new_best_solution: Schedule, new_best_fitness: float):
        if not os.path.isdir(self.get_tmp_folder()):
            os.makedirs(self.get_tmp_folder())
        solfile = f'{self.get_tmp_folder()}/{new_best_fitness}.json'

        solfile2 = f'./data/solutions/{self.sol}.json'

        new_best_solution.write_to_file(solfile)

        new_best_solution.write_to_file(solfile2)

    def get_tmp_folder(self) -> str:
        return f'./data/solutions/tmp/{self.sol}'


def __get_solution_path(name: str) -> str | None:
    sol_file = f'./data/solutions/{name}.json'
    if os.path.exists(sol_file):
        return sol_file
    else:
        tmp_sol_files = glob.glob(f'./data/solutions/tmp/{name}/*.json')
        if len(tmp_sol_files) > 0:
            return tmp_sol_files[0]
        else:
            return None


def __run_algorithm(settings: AlgorithmSettings, sol: str):
    sa = SimulatedAnnealing()
    og = SchedulingOffspringGenerator()
    fc = SchedulingFitnessCalculator()
    constraints = ScheduleConstraints.parse_file('./data/constraints.json')

    initial_state: Schedule
    if settings.initial_state is None:
        initial_state = og.initial_schedule(constraints)
    else:
        sol_file = __get_solution_path(settings.initial_state)
        if sol_file:
            initial_state = Schedule.load_schedule_from_file(sol_file)
        else:
            initial_state = og.initial_schedule(constraints)

    tmp_writer = TmpSolWriter(sol=sol)

    sa.attach(tmp_writer)
    running_status = f'{tmp_writer.get_tmp_folder()}/.running'
    try:
        # create tmp dir
        if not os.path.isdir(tmp_writer.get_tmp_folder()):
            os.makedirs(tmp_writer.get_tmp_folder())

        # create empty .running file
        with open(running_status, mode='w'):
            pass

        schedule = sa.run(
            offspring_generator=og,
            fitness_calculator=fc,
            initial_state=initial_state,
            constraints=constraints,
            num_offsprings=settings.num_offsprings,
            k=settings.k,
            start_temp=settings.start_temp,
            alpha=settings.alpha
        )

        # noinspection PyUnresolvedReferences
        schedule.write_to_file(f'./data/solutions/{sol}.json')

        # remove .running file
        os.remove(running_status)
    except Exception as e:
        # create .error file with error in it
        with open(f'{tmp_writer.get_tmp_folder()}/.error', mode='w') as f:
            f.write(str(e))
            f.write(traceback.format_exc())

        # remove .running file
        os.remove(running_status)

        raise e


def __get_status_of_solution(name: str) -> SolutionStatus:
    tmp_folder = f'./data/solutions/tmp/{name}'
    error_msg: str | None = None
    if os.path.exists(f'{tmp_folder}/.running'):
        status = 'running'
    elif os.path.exists(f'{tmp_folder}/.error'):
        status = 'error'
        with open(f'{tmp_folder}/.error', mode='r') as f:
            error_msg = f.read()
    else:
        status = 'finished'

    return SolutionStatus(
        name=name,
        status=status,
        error_msg=error_msg
    )


class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.getMessage().find("/api/health") == -1


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:4200", "https://diensteinteilung.sfg-singen.de"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

logging.getLogger("uvicorn.access").addFilter(EndpointFilter())


@app.on_event("shutdown")
def shutdown_event():
    # go through all tmp solutions that are running
    sol_paths = glob.glob('./data/solutions/tmp/*')
    for p in sol_paths:
        if os.path.exists(f'{p}/.running'):
            # a running solution found
            os.remove(f'{p}/.running')
            with open(f'{p}/.error', mode='w') as f:
                f.write('app was shutdown - calculation stopped')


@app.get('/api/health')
def health():
    return {'status': 'ok'}


@app.get('/api/tasks')
def tasks_get() -> List[str]:
    if not os.path.exists('./data/tasks.json'):
        return []
    with open('./data/tasks.json', mode='r') as json_data:
        return json.load(json_data)


@app.post('/api/tasks', status_code=201)
def tasks_save(tasks: List[str]):
    with open('./data/tasks.json', mode='w') as f:
        json.dump(obj=tasks, fp=f)
        return tasks


@app.post('/api/persons/importcsv', status_code=201)
async def persons_import_csv(file: UploadFile = File(...)):
    contents = await file.read()
    lines = contents.decode(encoding='cp1252').splitlines()
    reader = csv.DictReader(f=lines, delimiter=';')
    persons = []
    for row in reader:
        persons.append({
            'id': row['MitgliedsNr'],
            'name': row['Name']
        })
    with open('./data/persons.json', mode='w') as file:
        file.write(json.dumps(persons))
    return persons


@app.get('/api/persons')
def persons_get() -> List[SelectablePerson]:
    if not os.path.exists('./data/persons.json'):
        return []
    with open('./data/persons.json', mode='r') as json_data:
        return json.load(json_data)


@app.post('/api/persons', status_code=201)
def persons_save(persons: List[SelectablePerson]):
    json_persons = list(map(lambda x: x.dict(), persons))
    with open('./data/persons.json', mode='w') as f:
        json.dump(obj=json_persons, fp=f)
        return persons


@app.post('/api/constraints', status_code=201)
def constraints_write(constraints: ScheduleConstraints):
    constraints.write_to_file('./data/constraints.json')
    return constraints


@app.get('/api/constraints')
def constraints_get() -> ScheduleConstraints:
    if not os.path.exists('./data/constraints.json'):
        return ScheduleConstraints()
    return ScheduleConstraints.parse_file('./data/constraints.json')


@app.get('/api/solutions')
def solutions_get() -> List[SolutionStatus]:
    sol_paths = glob.glob('./data/solutions/*.json')
    sols = list(map(lambda d: path.basename(d).replace('.json', ''), sol_paths))

    sol_paths2 = glob.glob('./data/solutions/tmp/*')
    sols.extend(list(map(lambda d: path.basename(d), sol_paths2)))
    sols = list(set(sols))
    sols.sort()
    sols_status = list(map(lambda d: solution_get(d), sols))
    return sols_status


@app.get('/api/solutions/{sol}')
def solution_get(sol: str) -> SolutionStatus:
    sol_file = f'./data/solutions/{sol}.json'
    fitness = None
    penalties = None
    actual_schedule = None
    if os.path.exists(sol_file):
        schedule = Schedule.load_schedule_from_file(sol_file)
        actual_schedule = schedule.schedule
        constraints = constraints_get()
        calc = SchedulingFitnessCalculator()
        penalties = calc.get_penalties(constraints=constraints, state=schedule)
        fitness = calc.calculate_fitness(constraints=constraints, state=schedule)

    s = __get_status_of_solution(sol)
    s.fitness = fitness
    s.penalties = penalties
    s.schedule = actual_schedule

    return s


@app.get('/api/solutions/{sol}/csv-vereinsflieger')
async def solution_csv_vereinsflieger(sol: str):
    s = solution_get(sol)
    header = ['Dienstbezeichnung', 'Dienstbeginn', 'Dienstende', 'Max. Personen', 'Person', 'Person2']
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    writer.writerow(header)

    for [date, taskmap] in s.schedule.items():
        d = datetime.fromisoformat(date)
        begin = d.replace(hour=10, minute=0, second=0)
        end = d.replace(hour=18, minute=0, second=0)
        for [task, person] in taskmap.items():
            p = ' '.join(list(map(lambda x: x.strip(), person.split(',')))[::-1])
            writer.writerow([task, begin.isoformat(sep=' '), end.isoformat(sep=' '), 1, p, None])
    output.seek(0)
    return StreamingResponse(output, media_type='text/csv')


@app.post('/api/optimize')
def run_algorithm(settings: AlgorithmSettings, background_tasks: BackgroundTasks) -> SolutionStatus:
    sol = f'sol-{datetime.now().strftime("%Y-%m-%d-%H-%M-%S")}'
    background_tasks.add_task(__run_algorithm, settings, sol)

    s = __get_status_of_solution(sol)
    # overwrite because of race condition
    s.status = 'running'
    return s


app.mount("/static", StaticFiles(directory="static", html=True), name="static")


@app.get("/", response_class=FileResponse)
def read_index():
    static_path = './static/index.html'
    return FileResponse(static_path)


@app.get("/{catchall:path}", response_class=FileResponse)
def read_index(request: Request):
    folder = './static/'
    # check first if requested file exists
    catch_all_path = request.path_params["catchall"]
    file = folder + catch_all_path

    if os.path.exists(file):
        return FileResponse(file)

    # otherwise return index files
    index = './static/index.html'
    return FileResponse(index)
