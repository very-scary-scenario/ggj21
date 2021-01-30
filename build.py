import json
import os
import logging
from typing import Callable, Dict, List, Set, TextIO, Union

from bs4 import BeautifulSoup


HERE = os.path.dirname(__file__)
STRICT = False


def parse_object(obj_file: TextIO) -> Dict[str, Union[str, bool]]:
    lines = list(obj_file.readlines())
    obj = {}

    for heading, content in zip(lines[0::2], lines[1::2]):
        name = heading.lstrip('#').split('(')[0].strip()
        value = content.strip()
        obj[name] = {
            'Yes': True,
            'No': False,
        }.get(value, value)

    return obj


def parse_persona(person_file: TextIO) -> Dict[str, List[str]]:
    lines = [line.strip() for line in person_file.readlines()]
    persona: Dict[str, List[str]] = {}
    category: str

    for line in lines:
        if line.startswith('#'):
            category = line.lstrip('#').split('(')[0].strip()
            persona[category] = []
        elif line:
            persona[category].append(line)

    return persona


def is_valid(thing: Dict[str, List[str]], fields: Set[str]) -> bool:
    key_set = set(thing.keys())
    if key_set != fields:
        messages = [f'{str(thing)[:50]}...:']
        if fields - key_set != set():
            messages.append(f' - is missing keys {fields - key_set}')
        if key_set - fields != set():
            messages.append(f' - has unrecognised keys {key_set - fields}')
        message = '\n'.join(messages)

        if STRICT:
            raise ValueError(message)
        else:
            logging.warning(message)
            return False

    return True


def build_things(folder_name: str, parser: Callable) -> str:
    objects = []
    fields_filename = os.path.join(folder_name, 'fields.list')
    fields = set([field.strip() for field in open(fields_filename, 'r').readlines() if field.strip()])

    for object_file_name in os.listdir(os.path.join(HERE, folder_name)):
        if object_file_name.startswith('.') or not object_file_name.endswith('.txt'):
            continue
        with open(os.path.join(HERE, folder_name, object_file_name)) as object_file:
            thing = parser(object_file)
            if is_valid(thing, fields):
                objects.append(thing)

    return json.dumps(objects, indent=2)


def build_index() -> None:
    with open(os.path.join(HERE, 'index-src.html')) as src:
        soup = BeautifulSoup(src.read(), features='html.parser')

    soup.find(id='objects').string.replace_with(build_things('objects', parse_object))
    soup.find(id='personas').string.replace_with(build_things('personas', parse_persona))

    with open(os.path.join(HERE, 'index.html'), 'wt') as dest:
        dest.write(str(soup))


if __name__ == '__main__':
    build_index()
