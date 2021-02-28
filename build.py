#!/usr/bin/env python

import json
import logging
import os
import re
import subprocess
from typing import Callable, Dict, List, TextIO, Union

from PIL import Image, ImageOps

from bs4 import BeautifulSoup


HERE = os.path.dirname(__file__)
STRICT = True
POSITIVE = 'Positive'
NEGATIVE = 'Negative'
ART_SCALE = 6


def parse_object(file_name: str, obj_file: TextIO) -> Dict[str, Union[str, bool]]:
    lines = [line.strip() for line in obj_file.readlines() if line.strip()]
    obj = {}

    for heading, content in zip(lines[0::2], lines[1::2]):
        name = heading.lstrip('#').split('(')[0].strip()
        value = content.strip()
        obj[name] = {
            'Yes': True,
            'No': False,
        }.get(value, value)

    return obj


def parse_persona(file_name: str, person_file: TextIO):
    lines = [line.strip() for line in person_file.readlines()]
    persona: Dict[str, Union[List[str], str]] = {}
    category: str

    for line in lines:
        if line.startswith('#'):
            category = line.lstrip('#').split('(')[0].strip()
            persona[category] = []
        elif line:
            cat = persona[category]
            assert isinstance(cat, list)
            cat.append(line)

    name = os.path.splitext(file_name)[0]
    persona["_name"] = name
    persona["_art_url"] = f"scaled_art/{name}.png"
    return persona


def is_valid(thing: Dict[str, List[str]], fields: Dict[str, type]) -> bool:
    key_set = set(thing.keys())
    messages = [f'{str(thing)[:50]}...:']

    for field_name, field_type in fields.items():
        if field_name not in thing:
            messages.append(f' - is missing the {field_name} key')
        elif not isinstance(thing[field_name], field_type):
            messages.append(
                f' - has the wrong type for {field_name} ({type(thing[field_name])} instead of {field_type})'
            )

    fields_set = set(fields.keys())
    if key_set - fields_set != set():
        messages.append(f' - has unrecognised keys {key_set - fields_set}')

    if len(messages) > 1:
        logging.warning('\n'.join(messages))
        return False

    return True


def get_fields(folder_name: str) -> Dict[str, type]:
    fields_filename = os.path.join(folder_name, 'fields.list')
    field_types: Dict[str, Union[type, str]] = {'boolean': bool, 'list': list, 'plusminus': 'plusminus', 'str': str}
    fields: Dict[str, type] = {}
    for field_line in open(fields_filename, 'r').readlines():
        field = field_line.strip()
        if not field:
            continue
        if ',' in field:
            field_name, field_type_desc = map(str.strip, field.split(','))
            field_type: Union[type, str] = field_types[field_type_desc]
        else:
            field_name = field
            field_type = str

        if field_type == 'plusminus':
            match = re.match('([^0-9]+)([0-9]*)', field_name)
            assert match
            field_prefix, field_number = match.groups()
            fields[f'{field_prefix}{POSITIVE}{field_number}'] = list
            fields[f'{field_prefix}{NEGATIVE}{field_number}'] = list
        elif isinstance(field_type, type):
            fields[field_name] = field_type
        else:
            raise ValueError(f'Unexpected type {field_type} encountered.')

    return fields


def build_things(folder_name: str, parser: Callable[[str, TextIO], Dict]) -> str:
    objects = []
    fields = get_fields(folder_name)

    problems = []
    for object_file_name in sorted(os.listdir(os.path.join(HERE, folder_name))):
        if object_file_name.startswith('.') or not object_file_name.endswith('.txt'):
            continue
        with open(os.path.join(HERE, folder_name, object_file_name)) as object_file:
            thing = parser(object_file_name, object_file)
            if is_valid(thing, fields):
                objects.append(thing)
            else:
                problems.append((thing, fields))

    if STRICT and problems:
        raise ValueError(f"Invalid data were found: {problems}")

    return json.dumps(objects, indent=2)


def build_index() -> None:
    with open(os.path.join(HERE, 'index-src.html')) as src:
        soup = BeautifulSoup(src.read(), features='html.parser')

    object_fields = get_fields('objects')
    unqueriable_object_fields = ["Object", "FlavourText", "Colour"]  # we need to do some harder stuff for colour
    queriable_object_fields = {k: v for k, v in object_fields.items() if k not in unqueriable_object_fields}
    expected_persona_fields: List[str] = []
    for name, kind in queriable_object_fields.items():
        if kind is bool:
            expected_persona_fields.append(f'{name}{NEGATIVE}')
            expected_persona_fields.append(f'{name}{POSITIVE}')
        else:
            expected_persona_fields.append(name)

    persona_fields = get_fields('personas')
    missing_object_fields = [
        field for field in expected_persona_fields if field not in persona_fields
    ]

    if STRICT and missing_object_fields:
        raise ValueError(
            "There are fields specified against objects that don't have responses written for them: "
            f"{missing_object_fields}"
        )

    soup.find(id='objects').string.replace_with(build_things('objects', parse_object))
    soup.find(id='queriable-object-properties').string.replace_with(json.dumps(
        list(queriable_object_fields.keys()), indent=2))
    soup.find(id='personas').string.replace_with(build_things('personas', parse_persona))
    soup.find(id='loops').string.replace_with(json.dumps(os.listdir(os.path.join(HERE, 'audio'))))

    with open(os.path.join(HERE, 'index.html'), 'wt') as dest:
        dest.write(str(soup))


def scale_art():
    art_dir = os.path.join(HERE, 'art')
    scaled_art_dir = os.path.join(HERE, 'scaled_art')

    if not os.path.isdir(scaled_art_dir):
        os.mkdir(scaled_art_dir)

    for image_file_name in sorted(os.listdir(art_dir)):
        if image_file_name.startswith('.') or (not image_file_name.endswith('.png')):
            continue

        scaled_file_name = os.path.join(scaled_art_dir, image_file_name)
        if os.path.isfile(scaled_file_name):
            continue

        with Image.open(os.path.join(os.path.join(art_dir, image_file_name))) as original:
            scaled = ImageOps.scale(original, ART_SCALE, Image.NEAREST)
            scaled.save(scaled_file_name)

        subprocess.run(['optipng', scaled_file_name])


if __name__ == '__main__':
    scale_art()
    build_index()
