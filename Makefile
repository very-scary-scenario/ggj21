.PHONY : test

index.html : build.py objects/*.txt objects/fields.list personas/*.txt personas/fields.list art/*.png
	python3 $<

test : build.py tests
	mypy .
	flake8 .
	python3 -m pytest
