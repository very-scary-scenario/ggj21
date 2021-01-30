import json
import os
from typing import Callable, Dict, List, TextIO

from bs4 import BeautifulSoup


HERE = os.path.dirname(__file__)


def parse_object(obj_file: TextIO) -> Dict[str, str]:
    lines = list(obj_file.readlines())
    obj = {}

    for heading, content in zip(lines[0::2], lines[1::2]):
        name = heading.lstrip('#').split('(')[0].strip()
        value = content.strip()
        obj[name] = value

    return obj


def parse_persona(person_file: TextIO) -> Dict[str, List[str]]:
    lines = [line.strip() for line in person_file.readlines()]
    persona: Dict[str, List[str]] = {}
    category: str

    for line in lines:
        if line.startswith('#'):
            category = line.lstrip('#').split('(')[0].strip()
            persona[category] = []
        else:
            persona[category].append(line)

    return persona


def build_things(folder_name: str, parser: Callable) -> str:
    objects = []

    for object_file_name in os.listdir(os.path.join(HERE, folder_name)):
        if object_file_name.startswith('.') or not object_file_name.endswith('.txt'):
            continue
        with open(os.path.join(HERE, folder_name, object_file_name)) as object_file:
            objects.append(parser(object_file))

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
