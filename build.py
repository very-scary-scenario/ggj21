import json
import os
from typing import Dict, TextIO

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


def build_objects() -> str:
    objects = []

    for object_file_name in os.listdir(os.path.join(HERE, 'objects')):
        if object_file_name.startswith('.') or not object_file_name.endswith('.txt'):
            continue
        with open(os.path.join(HERE, 'objects', object_file_name)) as object_file:
            objects.append(parse_object(object_file))

    return json.dumps(objects, indent=2)


def build_index() -> None:
    with open(os.path.join(HERE, 'index-src.html')) as src:
        soup = BeautifulSoup(src.read(), features='html.parser')

    soup.find(id="objects").string.replace_with(build_objects())

    with open(os.path.join(HERE, 'index.html'), 'wt') as dest:
        dest.write(str(soup))


if __name__ == '__main__':
    build_index()
