import json
import os
from typing import Dict, TextIO


HERE = os.path.dirname(__file__)


def parse_object(obj_file: TextIO) -> Dict[str, str]:
    lines = list(obj_file.readlines())
    obj = {}

    for heading, content in zip(lines[0::2], lines[1::2]):
        name = heading.lstrip('#').split('(')[0].strip()
        value = content.strip()
        obj[name] = value

    return obj


def build_objects() -> None:
    objects = []

    for object_file_name in os.listdir(os.path.join(HERE, 'objects')):
        if object_file_name.startswith('.') or not object_file_name.endswith('.txt'):
            continue
        with open(os.path.join(HERE, 'objects', object_file_name)) as object_file:
            objects.append(parse_object(object_file))

    with open('objects.json', 'wt') as oj:
        oj.write(json.dumps(objects, indent=2))


if __name__ == '__main__':
    build_objects()
