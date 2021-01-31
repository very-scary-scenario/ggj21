import os
import shutil
import re

import json
import pytest

from build import parse_object, parse_persona, is_valid, get_fields, build_things, build_index


@pytest.mark.parametrize('filename,expect', [
    ('valid', {'Name': 'Test Object 1', 'Exists': True}),
    ('validwithparens', {'Name': 'Test Object 2', 'Exists': True}),
    ('validwithextranewlines', {'Name': 'Test Object 3', 'Exists': False})
])
def test_parse_object(filename, expect):
    with open(f'tests/fixtures/objects/{filename}.txt', 'r') as f:
        assert parse_object(f) == expect


@pytest.mark.parametrize('filename,expect', [
    ('valid', {'Greeting': ['Hi', 'Henlo'], 'ExistsPositive': ['Yes'], 'ExistsNegative': ['No']}),
    ('validwithextranewlines', {'Greeting': ['Hi', 'Henlo'], 'ExistsPositive': ['Yup'], 'ExistsNegative': ['Nope']}),
    ('validwithparens', {'Greeting': ['Hi', 'Henlo'], 'ExistsPositive': ['Aye'], 'ExistsNegative': ['Naw']})
])
def test_parse_persona(filename, expect):
    with open(f'tests/fixtures/personas/{filename}.txt', 'r') as f:
        assert parse_persona(f) == expect


@pytest.mark.parametrize('folder,expect', [
    ('tests/fixtures/objects', {'Name': str, 'Exists': bool}),
    ('tests/fixtures/personas', {'Greeting': list, 'ExistsPositive': list, 'ExistsNegative': list})
])
def test_get_fields_valid(folder, expect):
    assert get_fields(folder) == expect


@pytest.mark.parametrize('filename,expected_error', [
    ('invalidtype', KeyError),
    ('invalidcommas', ValueError)
])
def test_get_fields_invalid(tmp_path, filename, expected_error):
    shutil.copy(f'tests/fixtures/fieldlists/{filename}.list', tmp_path / 'fields.list')
    with pytest.raises(expected_error):
        get_fields(tmp_path)


@pytest.mark.parametrize('folder,parser', [('objects', parse_object), ('personas', parse_persona)])
def test_is_valid(folder, parser):
    full_folder = os.path.join('tests/fixtures', folder)
    fields = get_fields(full_folder)
    for object_file_name in os.listdir(full_folder):
        if object_file_name.startswith('.') or not object_file_name.endswith('.txt'):
            continue
        with open(os.path.join(full_folder, object_file_name)) as object_file:
            thing = parser(object_file)
            if object_file_name.startswith('valid'):
                assert is_valid(thing, fields)
            elif object_file_name.startswith('invalid'):
                assert not is_valid(thing, fields)
            else:
                raise ValueError(f'Fixtures in the {folder} folder should start with "valid" or "invalid".')


def equal_up_to_permutation(list1, list2):
    test_list = list2[:]
    for element in list1:
        # Some elements of list1 not found in list2
        if element not in test_list:
            return False
        test_list.remove(element)
    if len(test_list) > 0:
        # Some elements of list2 not in list1
        return False

    return True


def filter_folder(src_folder, dst_folder, file_re):
    for filename in os.listdir(src_folder):
        if re.match(file_re, filename):
            shutil.copy(os.path.join(src_folder, filename), dst_folder)


@pytest.mark.parametrize('folder,parser', [('objects', parse_object), ('personas', parse_persona)])
def test_build_things_valid(tmp_path, folder, parser):
    file_re = 'valid|fields.list$'
    filter_folder(os.path.join('tests/fixtures', folder), tmp_path, file_re)
    with open(os.path.join('tests/fixtures', folder, 'expected.json')) as f:
        assert equal_up_to_permutation(json.loads(build_things(tmp_path, parser)), json.load(f))


@pytest.mark.parametrize('folder,parser', [('objects', parse_object), ('personas', parse_persona)])
def test_build_things_invalid(tmp_path, folder, parser):
    file_re = 'valid|invalid|fields.list$'
    filter_folder(os.path.join('tests/fixtures', folder), tmp_path, file_re)
    with pytest.raises(ValueError):
        build_things(tmp_path, parser)
